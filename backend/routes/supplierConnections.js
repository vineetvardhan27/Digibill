import express from 'express';
import Connection from '../models/Connection.js';
import User from '../models/User.js';
import supplierAccountAuth from '../middleware/supplierAccountAuth.js';
import { resolveConnectionRequest } from '../utils/connectionResolver.js';
import SupplierAccount from '../models/SupplierAccount.js';
import Bill from '../models/Bill.js';
const router = express.Router();

// Apply supplier account auth middleware to all routes
router.use(supplierAccountAuth);

// GET /api/supplier-connections/profile
router.get('/profile', async (req, res, next) => {
  try {
    const supplierAccount = await SupplierAccount.findById(req.supplierAccount._id).select('-password');
    res.status(200).json({ success: true, data: supplierAccount });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/supplier-connections/profile
router.patch('/profile', async (req, res, next) => {
  try {
    const { businessName, ownerName, category, phone, description, gstin, location } = req.body;
    
    const supplierAccount = await SupplierAccount.findById(req.supplierAccount._id);
    
    if (businessName) supplierAccount.businessName = businessName;
    if (ownerName) supplierAccount.ownerName = ownerName;
    if (category) supplierAccount.category = category;
    if (phone) supplierAccount.phone = phone;
    if (description !== undefined) supplierAccount.description = description;
    if (gstin !== undefined) supplierAccount.gstin = gstin;
    if (location) supplierAccount.location = location;

    // Check if profile is complete
    supplierAccount.profileComplete = Boolean(
      supplierAccount.businessName && 
      supplierAccount.ownerName && 
      supplierAccount.category && 
      supplierAccount.phone && 
      supplierAccount.location?.city && 
      supplierAccount.location?.state
    );

    await supplierAccount.save();

    const updated = await SupplierAccount.findById(req.supplierAccount._id).select('-password');
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// POST /api/supplier-connections/request
router.post('/request', async (req, res, next) => {
  try {
    const { shopOwnerId, requestNote } = req.body;
    const supplierAccountId = req.supplierAccount._id;

    if (!shopOwnerId) {
      return res.status(400).json({ success: false, message: 'shopOwnerId is required' });
    }

    const shopOwner = await User.findById(shopOwnerId);
    if (!shopOwner) {
      return res.status(400).json({ success: false, message: 'Shop owner not found' });
    }

    let connection = await Connection.findOne({ shopOwnerId, supplierAccountId });
    
    const resolution = resolveConnectionRequest(connection, 'supplier');

    if (resolution.action === 'error') {
      return res.status(400).json({ success: false, message: resolution.message });
    }

    if (resolution.action === 'auto-accept') {
      connection.status = 'connected';
      connection.connectedAt = new Date();
      connection.respondedAt = new Date();
      if (requestNote) connection.requestNote = requestNote;
      await connection.save();
      
      const connObj = connection.toObject();
      delete connObj.shopNotes; // Strip private notes
      
      return res.status(200).json({ success: true, data: connObj, message: 'Mutual interest - auto connected' });
    }

    if (resolution.action === 'reset') {
      connection.status = 'pending';
      connection.initiatedBy = 'supplier';
      connection.requestNote = requestNote;
      connection.connectedAt = undefined;
      connection.respondedAt = undefined;
      await connection.save();

      const connObj = connection.toObject();
      delete connObj.shopNotes; // Strip private notes

      return res.status(200).json({ success: true, data: connObj, message: 'Connection request sent' });
    }

    // action === 'create'
    connection = new Connection({
      shopOwnerId,
      supplierAccountId,
      status: 'pending',
      initiatedBy: 'supplier',
      requestNote
    });
    await connection.save();

    const connObj = connection.toObject();
    delete connObj.shopNotes; // Strip private notes

    res.status(201).json({ success: true, data: connObj, message: 'Connection request sent' });
  } catch (error) {
    next(error);
  }
});

// GET /api/supplier-connections
router.get('/', async (req, res, next) => {
  try {
    const supplierAccountId = req.supplierAccount._id;
    const status = req.query.status || 'connected';

    const connections = await Connection.find({ supplierAccountId, status })
      .select('-shopNotes') // Strip private shopNotes
      .populate('shopOwnerId', 'shopName name');

    res.status(200).json({ success: true, data: connections });
  } catch (error) {
    next(error);
  }
});

// GET /api/supplier-connections/pending
router.get('/pending', async (req, res, next) => {
  try {
    const supplierAccountId = req.supplierAccount._id;
    const connections = await Connection.find({
      supplierAccountId,
      status: 'pending',
      initiatedBy: 'shop'
    })
    .select('-shopNotes') // Strip private shopNotes
    .populate('shopOwnerId', 'shopName name');

    res.status(200).json({ success: true, data: connections });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/supplier-connections/:id/respond
router.patch('/:id/respond', async (req, res, next) => {
  try {
    const { action } = req.body;
    const connectionId = req.params.id;
    const supplierAccountId = req.supplierAccount._id;

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: "Action must be 'accept' or 'reject'" });
    }

    const connection = await Connection.findOne({
      _id: connectionId,
      supplierAccountId,
      status: 'pending',
      initiatedBy: 'shop'
    });

    if (!connection) {
      return res.status(404).json({ success: false, message: 'Pending connection request not found' });
    }

    if (action === 'accept') {
      connection.status = 'connected';
      connection.connectedAt = new Date();
    } else {
      connection.status = 'rejected';
      connection.respondedAt = new Date();
    }

    await connection.save();

    const connObj = connection.toObject();
    delete connObj.shopNotes; // Strip private notes

    res.status(200).json({ success: true, data: connObj });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/supplier-connections/:id/disconnect
router.patch('/:id/disconnect', async (req, res, next) => {
  try {
    const connectionId = req.params.id;
    const supplierAccountId = req.supplierAccount._id;

    const connection = await Connection.findOne({
      _id: connectionId,
      supplierAccountId,
      status: 'connected'
    });

    if (!connection) {
      return res.status(404).json({ success: false, message: 'Active connection not found' });
    }

    connection.status = 'disconnected';
    await connection.save();

    res.status(200).json({ success: true, message: 'Successfully disconnected' });
  } catch (error) {
    next(error);
  }
});

// GET /api/supplier-connections/bills
router.get('/bills', async (req, res, next) => {
  try {
    const supplierAccountId = req.supplierAccount._id;
    const { status, page = 1, limit = 10 } = req.query;

    const connections = await Connection.find({
      supplierAccountId,
      status: 'connected'
    });

    const connectionIds = connections.map(c => c._id);

    const { default: Bill } = await import('../models/Bill.js');
    const { default: BillDispute } = await import('../models/BillDispute.js');

    let query = { connectionId: { $in: connectionIds } };
    if (status === 'paid') query.isPaid = true;
    if (status === 'pending') query.isPaid = false;

    // Handle 'disputed' status
    if (status === 'disputed') {
      const disputes = await BillDispute.find({ status: { $ne: 'resolved' } }).select('billId');
      query._id = { $in: disputes.map(d => d.billId) };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const bills = await Bill.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate({ path: 'connectionId', select: 'shopOwnerId', populate: { path: 'shopOwnerId', select: 'shopName name' } })
      .lean();
      
    const total = await Bill.countDocuments(query);

    // Map bills to format with dispute info
    const disputes = await BillDispute.find({ billId: { $in: bills.map(b => b._id) } });

    const mappedBills = bills.map((bill) => {
      const dispute = disputes.find(d => d.billId.toString() === bill._id.toString() && d.status !== 'resolved');
      let billStatus = bill.isPaid ? 'paid' : 'pending';
      if (dispute) billStatus = 'disputed';

      const conn = bill.connectionId;
      const shopName = conn?.shopOwnerId?.shopName || conn?.shopOwnerId?.name || 'Unknown Shop';

      return {
        _id: bill._id,
        amount: bill.amount,
        description: `${bill.description} (${shopName})`,
        dueDate: bill.dueDate,
        createdAt: bill.createdAt,
        status: billStatus,
        acknowledgedAt: bill.acknowledgedBySupplier ? bill.updatedAt : undefined,
        dispute
      };
    });

    res.status(200).json({
      success: true,
      data: {
        bills: mappedBills,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/supplier-connections/:id/bills
router.get('/:id/bills', async (req, res, next) => {
  try {
    const connectionId = req.params.id;
    const supplierAccountId = req.supplierAccount._id;
    const { status, page = 1, limit = 10 } = req.query;

    const connection = await Connection.findOne({
      _id: connectionId,
      supplierAccountId,
      status: 'connected'
    });

    if (!connection) {
      return res.status(404).json({ success: false, message: 'Connection not found' });
    }

    const { default: Bill } = await import('../models/Bill.js');
    const { default: BillDispute } = await import('../models/BillDispute.js');

    let query = { connectionId };
    if (status === 'paid') query.isPaid = true;
    if (status === 'pending') query.isPaid = false;

    // Handle 'disputed' status
    if (status === 'disputed') {
      const disputes = await BillDispute.find({ status: { $ne: 'resolved' } }).select('billId');
      query._id = { $in: disputes.map(d => d.billId) };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const bills = await Bill.find(query).sort({ date: -1 }).skip(skip).limit(Number(limit)).lean();
    const total = await Bill.countDocuments(query);

    // Map bills to format with dispute info
    const disputes = await BillDispute.find({ billId: { $in: bills.map(b => b._id) } });

    const mappedBills = bills.map((bill) => {
      const dispute = disputes.find(d => d.billId.toString() === bill._id.toString() && d.status !== 'resolved');
      let billStatus = bill.isPaid ? 'paid' : 'pending';
      if (dispute) billStatus = 'disputed';

      return {
        _id: bill._id,
        amount: bill.amount,
        description: bill.description,
        dueDate: bill.dueDate,
        createdAt: bill.createdAt,
        status: billStatus,
        acknowledgedAt: bill.acknowledgedBySupplier ? bill.updatedAt : undefined, // Assuming updatedAt or acknowledgedAt
        dispute
      };
    });

    res.status(200).json({
      success: true,
      data: {
        bills: mappedBills,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/supplier-connections/dashboard
router.get('/dashboard', async (req, res, next) => {
  try {
    const supplierAccountId = req.supplierAccount._id;

    // 1. Get total connected shops count
    const connectedShopsCount = await Connection.countDocuments({
      supplierAccountId,
      status: 'connected'
    });

    // 2. Fetch all connections to filter bills
    const connections = await Connection.find({
      supplierAccountId,
      status: 'connected'
    }).select('_id shopOwnerId').populate('shopOwnerId', 'shopName name');
    
    const connectionIds = connections.map(c => c._id);
    
    // 3. Aggregate Bills
    // We import Bill dynamically or at the top. Wait, Bill is not imported.
    const { default: Bill } = await import('../models/Bill.js');
    
    const bills = await Bill.find({ connectionId: { $in: connectionIds } })
      .sort({ date: -1 })
      .populate('connectionId');

    let totalBills = 0;
    let totalOwedToYou = 0;
    let totalReceived = 0;

    bills.forEach(bill => {
      totalBills += 1;
      if (bill.isPaid) {
        totalReceived += bill.amount;
      } else {
        totalOwedToYou += bill.amount;
      }
    });

    // Format recent activity (last 10 bills)
    const recentActivity = bills.slice(0, 10).map(bill => {
      const conn = connections.find(c => c._id.toString() === bill.connectionId._id.toString());
      return {
        id: bill._id,
        amount: bill.amount,
        date: bill.date,
        isPaid: bill.isPaid,
        description: bill.description,
        shopName: conn?.shopOwnerId?.shopName || conn?.shopOwnerId?.name || 'Unknown Shop'
      };
    });

    res.status(200).json({
      success: true,
      data: {
        connectedShopsCount,
        totalBills,
        totalOwedToYou,
        totalReceived,
        recentActivity
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/supplier-connections/:billId/acknowledge
router.post('/:billId/acknowledge', async (req, res, next) => {
  try {
    const { billId } = req.params;
    const supplierAccountId = req.supplierAccount._id;

    // Verify bill belongs to a valid connection
    const { default: Bill } = await import('../models/Bill.js');
    const bill = await Bill.findById(billId).populate('connectionId');

    if (!bill || !bill.connectionId || bill.connectionId.supplierAccountId.toString() !== supplierAccountId.toString()) {
      return res.status(404).json({ success: false, message: 'Bill not found or access denied' });
    }

    bill.acknowledgedBySupplier = true;
    await bill.save();

    res.status(200).json({ success: true, message: 'Bill acknowledged successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/supplier-connections/:billId/dispute
router.post('/:billId/dispute', async (req, res, next) => {
  try {
    const { billId } = req.params;
    const { reason } = req.body;
    const supplierAccountId = req.supplierAccount._id;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Reason is required' });
    }

    const { default: Bill } = await import('../models/Bill.js');
    const { default: BillDispute } = await import('../models/BillDispute.js');

    const bill = await Bill.findById(billId).populate('connectionId');

    if (!bill || !bill.connectionId || bill.connectionId.supplierAccountId.toString() !== supplierAccountId.toString()) {
      return res.status(404).json({ success: false, message: 'Bill not found or access denied' });
    }

    const existingDispute = await BillDispute.findOne({ billId, status: { $in: ['open'] } });
    if (existingDispute) {
      return res.status(400).json({ success: false, message: 'An open dispute already exists for this bill' });
    }

    const dispute = await BillDispute.create({
      billId,
      supplierId: supplierAccountId, // Note: using supplierAccountId even if field is named supplierId for legacy compatibility
      ownerId: bill.connectionId.shopOwnerId,
      reason: reason.substring(0, 500),
      supplierNote: reason.substring(0, 500),
      connectionId: bill.connectionId._id
    });

    res.status(201).json({ success: true, data: dispute });
  } catch (error) {
    next(error);
  }
});

// Configure Multer and Cloudinary
const multer = await import('multer');
const { v2: cloudinary } = await import('cloudinary');
const streamifier = await import('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer.default({
  storage: multer.default.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// POST /api/supplier-connections/invoices/upload
router.post('/invoices/upload', upload.single('invoice'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const { billId, notes } = req.body;
    const supplierAccountId = req.supplierAccount._id;

    // Verify bill to find connectionId
    let targetConnectionId;
    if (billId && billId !== 'none') {
      const { default: Bill } = await import('../models/Bill.js');
      const bill = await Bill.findById(billId).populate('connectionId');
      if (!bill || !bill.connectionId || bill.connectionId.supplierAccountId.toString() !== supplierAccountId.toString()) {
        return res.status(404).json({ success: false, message: 'Bill not found or access denied' });
      }
      targetConnectionId = bill.connectionId._id;
    } else {
      return res.status(400).json({ success: false, message: 'Must link invoice to an existing bill for independent accounts' });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'digibill_supplier_invoices' },
      async (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ success: false, message: 'Upload failed' });
        }

        const { default: SupplierInvoice } = await import('../models/SupplierInvoice.js');

        const invoice = await SupplierInvoice.create({
          billId: billId && billId !== 'none' ? billId : undefined,
          connectionId: targetConnectionId,
          supplierId: supplierAccountId, // legacy compatibility
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

    streamifier.default.createReadStream(req.file.buffer).pipe(uploadStream);

  } catch (error) {
    next(error);
  }
});

// GET /api/supplier-connections/invoices
router.get('/invoices', async (req, res, next) => {
  try {
    const supplierAccountId = req.supplierAccount._id;

    const connections = await Connection.find({ supplierAccountId, status: 'connected' });
    const connectionIds = connections.map(c => c._id);

    const { default: SupplierInvoice } = await import('../models/SupplierInvoice.js');

    const invoices = await SupplierInvoice.find({ connectionId: { $in: connectionIds } })
      .sort({ uploadedAt: -1 })
      .populate('billId', 'amount description dueDate');

    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    next(error);
  }
});

// GET /api/supplier-connections/activity
router.get('/activity', async (req, res, next) => {
  try {
    const supplierAccountId = req.supplierAccount._id;
    const activities = [];

    const connections = await Connection.find({ supplierAccountId, status: 'connected' });
    const connectionIds = connections.map(c => c._id);

    const { default: Bill } = await import('../models/Bill.js');
    const { default: BillDispute } = await import('../models/BillDispute.js');
    const { default: SupplierInvoice } = await import('../models/SupplierInvoice.js');

    // 1. Bill creations & payments
    const bills = await Bill.find({ connectionId: { $in: connectionIds } }).lean();
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
    const disputes = await BillDispute.find({ connectionId: { $in: connectionIds } }).populate('billId', 'amount description').lean();
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
    const invoices = await SupplierInvoice.find({ connectionId: { $in: connectionIds } }).lean();
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
