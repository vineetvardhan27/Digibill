import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import mongoose from 'mongoose';
import Bill from '../models/Bill.js';
import BillDispute from '../models/BillDispute.js';
import SupplierInvoice from '../models/SupplierInvoice.js';
import User from '../models/User.js';
import supplierAuth from '../middleware/supplierAuth.js';

const router = express.Router();

// Apply middleware to all routes
router.use(supplierAuth);

// Helper function to map Bill document to expected frontend format
const mapBillToFrontend = async (billDoc) => {
  const bill = billDoc.toObject ? billDoc.toObject() : billDoc;
  
  // Find active dispute if any
  const dispute = await BillDispute.findOne({ billId: bill._id }).sort({ createdAt: -1 });
  
  let status = bill.isPaid ? 'paid' : 'pending';
  if (dispute && dispute.status !== 'resolved') {
    status = 'disputed';
  }

  // Find linked invoices
  const invoices = await SupplierInvoice.find({ billId: bill._id });

  return {
    _id: bill._id,
    amount: bill.amount,
    description: bill.description,
    dueDate: bill.dueDate,
    createdAt: bill.createdAt,
    status,
    lineItems: bill.items ? bill.items.map(i => ({
      description: i.name,
      quantity: i.quantity,
      unitPrice: i.price,
      total: i.quantity * i.price
    })) : [],
    acknowledgedAt: bill.acknowledgedAt,
    dispute: dispute || undefined,
    invoices: invoices.length > 0 ? invoices : undefined
  };
};

// @route   GET /api/supplier-portal/dashboard
// @desc    Get dashboard summary
router.get('/dashboard', async (req, res, next) => {
  try {
    const supplierId = req.supplier._id;
    const ownerId = req.supplier.createdBy;

    const owner = await User.findById(ownerId).select('name shopName');
    const shopName = owner?.shopName || owner?.name || 'Digibill Shop';

    const bills = await Bill.find({ supplierId });
    const disputes = await BillDispute.find({ supplierId });

    let pendingAmount = 0;
    let paidAmount = 0;
    let disputedAmount = 0;
    let pendingCount = 0;
    let paidCount = 0;
    let disputedCount = 0;

    for (const bill of bills) {
      const isDisputed = disputes.some(d => d.billId.toString() === bill._id.toString() && d.status !== 'resolved');
      
      if (isDisputed) {
        disputedCount++;
        disputedAmount += bill.amount;
      } else if (bill.isPaid) {
        paidCount++;
        paidAmount += bill.amount;
      } else {
        pendingCount++;
        pendingAmount += bill.amount;
      }
    }

    const rawRecentBills = await Bill.find({ supplierId }).sort({ createdAt: -1 }).limit(5);
    const recentBills = await Promise.all(rawRecentBills.map(mapBillToFrontend));

    res.status(200).json({
      success: true,
      data: {
        supplier: {
          name: req.supplier.name,
          portalEmail: req.supplier.portalEmail
        },
        shopName,
        stats: {
          totalBills: bills.length,
          pendingBills: pendingCount,
          paidBills: paidCount,
          disputedBills: disputedCount,
          totalAmountOwed: pendingAmount + disputedAmount,
          totalAmountPaid: paidAmount,
          disputedAmount
        },
        recentBills
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/supplier-portal/bills
// @desc    Get paginated bills
router.get('/bills', async (req, res, next) => {
  try {
    const supplierId = req.supplier._id;
    const { status, page = 1, limit = 10 } = req.query;

    let matchQuery = { supplierId };
    
    // We fetch all bills and disputes first to correctly filter by dynamic status if needed
    // In a massive scale app, this would be an aggregation pipeline.
    
    let rawBills = await Bill.find(matchQuery).sort({ createdAt: -1 });
    let mappedBills = await Promise.all(rawBills.map(mapBillToFrontend));

    if (status && status !== 'all') {
      mappedBills = mappedBills.filter(b => b.status === status);
    }

    const totalCount = mappedBills.length;
    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;
    
    const paginatedBills = mappedBills.slice(skip, skip + Number(limit));

    res.status(200).json({
      success: true,
      data: {
        bills: paginatedBills,
        totalCount,
        page: Number(page),
        totalPages
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/supplier-portal/bills/:billId/dispute
// @desc    Raise a dispute on a bill
router.post('/bills/:billId/dispute', async (req, res, next) => {
  try {
    const { billId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Reason is required' });
    }

    const bill = await Bill.findOne({ _id: billId, supplierId: req.supplier._id });
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    const existingDispute = await BillDispute.findOne({ billId, status: { $in: ['open'] } });
    if (existingDispute) {
      return res.status(400).json({ success: false, message: 'An open dispute already exists for this bill' });
    }

    const dispute = await BillDispute.create({
      billId,
      supplierId: req.supplier._id,
      ownerId: bill.createdBy,
      reason: reason.substring(0, 500),
      supplierNote: reason.substring(0, 500)
    });

    res.status(201).json({ success: true, data: dispute });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/supplier-portal/bills/:billId/dispute
// @desc    Get dispute for a bill
router.get('/bills/:billId/dispute', async (req, res, next) => {
  try {
    const dispute = await BillDispute.findOne({ 
      billId: req.params.billId,
      supplierId: req.supplier._id
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: dispute || null });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/supplier-portal/bills/:billId/acknowledge
// @desc    Acknowledge a bill
router.post('/bills/:billId/acknowledge', async (req, res, next) => {
  try {
    const bill = await Bill.findOneAndUpdate(
      { _id: req.params.billId, supplierId: req.supplier._id },
      { 
        acknowledgedBySupplier: true,
        acknowledgedAt: new Date()
      },
      { new: true }
    );

    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    res.status(200).json({ success: true, data: await mapBillToFrontend(bill) });
  } catch (error) {
    next(error);
  }
});

// Configure Multer and Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
// Fallback to CLOUDINARY_URL if standard env vars not present
if (!process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_URL) {
  // It automatically picks up CLOUDINARY_URL
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// @route   POST /api/supplier-portal/invoices/upload
// @desc    Upload supplier invoice
router.post('/invoices/upload', upload.single('invoice'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const { billId, notes } = req.body;

    // Upload to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'digibill_supplier_invoices' },
      async (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ success: false, message: 'Upload failed' });
        }

        const invoice = await SupplierInvoice.create({
          billId: billId && billId !== 'none' ? billId : undefined,
          supplierId: req.supplier._id,
          ownerId: req.supplier.createdBy,
          fileUrl: result.secure_url,
          fileName: req.file.originalname,
          notes
        });

        res.status(201).json({ 
          success: true, 
          data: {
            invoiceId: invoice._id,
            fileUrl: invoice.fileUrl,
            fileName: invoice.fileName
          }
        });
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/supplier-portal/invoices
// @desc    Get all uploaded invoices
router.get('/invoices', async (req, res, next) => {
  try {
    const invoices = await SupplierInvoice.find({ supplierId: req.supplier._id })
      .sort({ uploadedAt: -1 })
      .populate('billId', 'amount description dueDate');

    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/supplier-portal/activity
// @desc    Get activity feed
router.get('/activity', async (req, res, next) => {
  try {
    const supplierId = req.supplier._id;
    const activities = [];

    // 1. Bill creations & payments
    const bills = await Bill.find({ supplierId }).lean();
    for (const bill of bills) {
      activities.push({
        id: `created_${bill._id}`,
        type: 'bill_created',
        createdAt: bill.createdAt,
        text: `New bill of ₹${bill.amount} added: '${bill.description}'`
      });

      if (bill.isPaid && bill.paidDate) {
        activities.push({
          id: `paid_${bill._id}`,
          type: 'bill_paid',
          createdAt: bill.paidDate || bill.updatedAt,
          text: `Payment of ₹${bill.amount} marked as received`
        });
      }
    }

    // 2. Disputes
    const disputes = await BillDispute.find({ supplierId }).populate('billId', 'amount description').lean();
    for (const dispute of disputes) {
      activities.push({
        id: `dispute_open_${dispute._id}`,
        type: 'dispute_opened',
        createdAt: dispute.createdAt,
        text: `You disputed bill: '${dispute.billId?.description}'`
      });

      if (dispute.status === 'resolved') {
        activities.push({
          id: `dispute_res_${dispute._id}`,
          type: 'dispute_resolved',
          createdAt: dispute.updatedAt,
          text: `Dispute resolved for bill: '${dispute.billId?.description}'`
        });
      }
    }

    // 3. Invoices
    const invoices = await SupplierInvoice.find({ supplierId }).lean();
    for (const invoice of invoices) {
      activities.push({
        id: `inv_up_${invoice._id}`,
        type: 'invoice_uploaded',
        createdAt: invoice.uploadedAt || invoice.createdAt,
        text: `You uploaded invoice: '${invoice.fileName}'`
      });
    }

    // Sort combined feed
    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ success: true, data: activities.slice(0, 20) });
  } catch (error) {
    next(error);
  }
});

export default router;
