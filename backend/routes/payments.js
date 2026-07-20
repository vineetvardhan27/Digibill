import express from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireEmailVerified } from '../middleware/verifyEmailMiddleware.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';
import Bill from '../models/Bill.js';
import Supplier from '../models/Supplier.js';
import { notificationQueue } from '../jobs/queues/notificationQueue.js';
import { invalidateCache } from '../lib/cache.js';

const router = express.Router();

let razorpayInstance = null;
function getRazorpay() {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret'
    });
  }
  return razorpayInstance;
}

// @route   POST /api/payments/orders
// @desc    Create a Razorpay order for a bill
// @access  Private
router.post('/orders', authMiddleware, requireEmailVerified, idempotencyMiddleware, async (req, res) => {
  try {
    const { billId } = req.body;
    
    if (!billId) {
      return res.status(400).json({ success: false, message: 'billId is required' });
    }

    const bill = await Bill.findOne({ _id: billId, createdBy: req.user._id });
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }
    
    if (bill.isPaid) {
      return res.status(400).json({ success: false, message: 'Bill is already paid' });
    }

    // Razorpay amount is in paise (smallest currency unit), so multiply INR by 100
    const amountInPaise = Math.round(bill.amount * 100);

    const rzp = getRazorpay();
    const order = await rzp.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${bill._id}`,
      notes: {
        billId: bill._id.toString(),
        userId: req.user._id.toString()
      }
    });

    // Save the razorpayOrderId to the bill
    bill.razorpayOrderId = order.id;
    await bill.save();

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    console.error('Create Razorpay order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order'
    });
  }
});

// @route   POST /api/payments/webhook
// @desc    Handle Razorpay payment confirmation webhook
// @access  Public (protected by webhook signature)
router.post('/webhook', idempotencyMiddleware, async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'dummy_webhook_secret';

    if (!signature) {
      return res.status(400).json({ success: false, message: 'Missing signature' });
    }

    // Verify signature using the raw body we captured in server.js
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.rawBody || '')
      .digest('hex');

    if (expectedSignature !== signature) {
      console.warn('⚠️ [Webhook] Invalid signature detected');
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const payload = req.body;
    
    // We only care about successful payments
    if (payload.event === 'payment.captured' || payload.event === 'order.paid') {
      const paymentEntity = payload.event === 'payment.captured' ? payload.payload.payment.entity : payload.payload.order.entity;
      
      const orderId = paymentEntity.order_id || paymentEntity.id;
      const paymentId = paymentEntity.id; // For order.paid, this might be the order id, but standard is payment.captured
      
      // Find the bill by razorpayOrderId
      const bill = await Bill.findOne({ razorpayOrderId: orderId }).populate('supplierId');
      
      if (bill && !bill.isPaid) {
        bill.isPaid = true;
        bill.paidDate = new Date();
        bill.razorpayPaymentId = payload.event === 'payment.captured' ? paymentId : undefined;
        await bill.save();

        // Update supplier stats
        if (bill.supplierId) {
          const supplier = await Supplier.findById(bill.supplierId._id);
          if (supplier) {
            supplier.pendingAmount = Math.max(0, supplier.pendingAmount - bill.amount);
            await supplier.save();
          }
          
          // Invalidate cache
          await invalidateCache(
            `supplier:${bill.supplierId._id}`,
            `supplier:${bill.supplierId._id}:health`,
            `forecast:${bill.createdBy}`
          );
        } else {
          await invalidateCache(`forecast:${bill.createdBy}`);
        }

        // Enqueue the receipt notification
        const User = (await import('../models/User.js')).default;
        const owner = await User.findById(bill.createdBy);
        
        if (owner && owner.email) {
          await notificationQueue.add('send-receipt', {
            type: 'payment-receipt',
            payload: {
              to: owner.email,
              supplierName: bill.supplierId ? bill.supplierId.name : 'Unknown Supplier',
              amount: bill.amount,
              billId: bill._id
            }
          });
        }
        
        console.log(`✅ [Webhook] Payment confirmed and receipt queued for bill ${bill._id}`);
      }
    }

    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    // Return 200 even on error to prevent Razorpay from endlessly retrying if it's our bug,
    // wait, actually, if it's a 500, Razorpay retries, which is what we want so idempotency catches it later when fixed.
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
});

export default router;
