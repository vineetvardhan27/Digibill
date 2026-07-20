/**
 * test-phase6.js
 * 
 * Verifies Razorpay order creation and webhook idempotency.
 */
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import crypto from 'crypto';
import User from '../models/User.js';
import Bill from '../models/Bill.js';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/digibill';
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'your_webhook_secret';

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║       Digibill Phase 6 Verification          ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  await mongoose.connect(MONGODB_URI);
  
  // Setup Test User
  const user = new User({
    name: 'Razorpay Test User',
    email: 'rzp-test@example.com',
    emailVerified: true
  });
  await user.save();
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  // Setup Test Bill
  const bill = new Bill({
    amount: 1500,
    createdBy: user._id,
    description: 'Phase 6 Integration Test',
    isPaid: false
  });
  await bill.save();

  console.log(`Created Bill: ${bill._id} | Amount: 1500 | Paid: false`);

  // 1. Test Order Creation
  console.log('\n── 1. Create Razorpay Order ──');
  const orderRes = await fetch(`${BASE_URL}/api/payments/orders`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ billId: bill._id })
  });
  
  const orderData = await orderRes.json();
  console.log(`Status: ${orderRes.status}`);
  if (!orderData.success) {
    console.error('Failed to create order:', orderData);
    process.exit(1);
  }
  const orderId = orderData.data.orderId;
  console.log(`✅ Order Created: ${orderId} (Amount: ${orderData.data.amount} paise)`);

  // 2. Mock Webhook Payload
  const eventId = `ev_${crypto.randomBytes(8).toString('hex')}`;
  const webhookPayload = JSON.stringify({
    entity: "event",
    account_id: "acc_test",
    event: "payment.captured",
    contains: ["payment"],
    payload: {
      payment: {
        entity: {
          id: `pay_${crypto.randomBytes(8).toString('hex')}`,
          entity: "payment",
          amount: 150000,
          currency: "INR",
          status: "captured",
          order_id: orderId
        }
      }
    },
    created_at: Math.floor(Date.now() / 1000)
  });

  const signature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(webhookPayload).digest('hex');

  // 3. Fire Webhook (First Time)
  console.log('\n── 2. Triggering Webhook (First Attempt) ──');
  const whRes1 = await fetch(`${BASE_URL}/api/payments/webhook`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-razorpay-signature': signature,
      'x-razorpay-event-id': eventId
    },
    body: webhookPayload
  });
  
  console.log(`Status: ${whRes1.status}`);
  const isIdempotent1 = whRes1.headers.has('x-idempotent-response');
  console.log(`Cached Response: ${isIdempotent1 ? '✅ YES' : '❌ NO'}`);

  // Check Bill Status
  const updatedBill = await Bill.findById(bill._id);
  console.log(`Bill isPaid: ${updatedBill.isPaid}`);

  // 4. Fire Webhook (Second Time - Exact same payload & event ID)
  console.log('\n── 3. Triggering Webhook (Second Attempt - Idempotent) ──');
  const whRes2 = await fetch(`${BASE_URL}/api/payments/webhook`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-razorpay-signature': signature,
      'x-razorpay-event-id': eventId
    },
    body: webhookPayload
  });
  
  console.log(`Status: ${whRes2.status}`);
  const isIdempotent2 = whRes2.headers.has('x-idempotent-response');
  console.log(`Cached Response: ${isIdempotent2 ? '✅ YES' : '❌ NO'}`);

  console.log('\n══════════════════════════════════════════════');
  if (updatedBill.isPaid && isIdempotent2 && !isIdempotent1) {
    console.log('✅ TEST PASSED');
    console.log('   The bill was successfully paid by the first webhook.');
    console.log('   The second webhook was intercepted by the idempotency middleware (X-Idempotent-Response).');
  } else {
    console.log('❌ TEST FAILED');
  }
  console.log('══════════════════════════════════════════════\n');

  // Cleanup
  await User.findByIdAndDelete(user._id);
  await Bill.findByIdAndDelete(bill._id);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
