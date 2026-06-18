import express from 'express';
import Connection from '../models/Connection.js';
import SupplierAccount from '../models/SupplierAccount.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { resolveConnectionRequest } from '../utils/connectionResolver.js';

const router = express.Router();

// Apply shop owner auth middleware to all routes
router.use(authMiddleware);

// POST /api/connections/request
router.post('/request', async (req, res, next) => {
  try {
    const { supplierAccountId, requestNote } = req.body;
    const shopOwnerId = req.user._id;

    if (!supplierAccountId) {
      return res.status(400).json({ success: false, message: 'supplierAccountId is required' });
    }

    const supplier = await SupplierAccount.findById(supplierAccountId);
    if (!supplier || !supplier.isActive) {
      return res.status(400).json({ success: false, message: 'Supplier account not found or inactive' });
    }

    let connection = await Connection.findOne({ shopOwnerId, supplierAccountId });
    
    const resolution = resolveConnectionRequest(connection, 'shop');

    if (resolution.action === 'error') {
      return res.status(400).json({ success: false, message: resolution.message });
    }

    if (resolution.action === 'auto-accept') {
      connection.status = 'connected';
      connection.connectedAt = new Date();
      connection.respondedAt = new Date();
      if (requestNote) connection.requestNote = requestNote;
      await connection.save();
      return res.status(200).json({ success: true, data: connection, message: 'Mutual interest - auto connected' });
    }

    if (resolution.action === 'reset') {
      connection.status = 'pending';
      connection.initiatedBy = 'shop';
      connection.requestNote = requestNote;
      connection.connectedAt = undefined;
      connection.respondedAt = undefined;
      await connection.save();
      return res.status(200).json({ success: true, data: connection, message: 'Connection request sent' });
    }

    // action === 'create'
    connection = new Connection({
      shopOwnerId,
      supplierAccountId,
      status: 'pending',
      initiatedBy: 'shop',
      requestNote
    });
    await connection.save();

    res.status(201).json({ success: true, data: connection, message: 'Connection request sent' });
  } catch (error) {
    next(error);
  }
});

// GET /api/connections
router.get('/', async (req, res, next) => {
  try {
    const shopOwnerId = req.user._id;
    const status = req.query.status || 'connected';

    const query = { shopOwnerId };
    if (status !== 'all') {
      query.status = status;
    }

    const connections = await Connection.find(query).populate({
      path: 'supplierAccountId',
      select: (status === 'connected' || status === 'all')
        ? 'businessName ownerName category location description gstin phone email' 
        : 'businessName ownerName category location description gstin'
    }).lean();

    const { default: Bill } = await import('../models/Bill.js');
    const { calculateHealthScore } = await import('../utils/healthScore.js');

    const enhancedConnections = await Promise.all(connections.map(async (conn) => {
      const bills = await Bill.find({ connectionId: conn._id }).lean();
      
      let totalBills = 0;
      let totalSpend = 0;
      let pendingAmount = 0;

      bills.forEach(bill => {
        totalBills += 1;
        totalSpend += bill.amount;
        if (!bill.isPaid) {
          pendingAmount += bill.amount;
        }
      });

      const { score, grade } = calculateHealthScore(bills);

      return {
        ...conn,
        stats: {
          totalBills,
          totalSpend,
          pendingAmount,
          healthScore: { score, grade }
        }
      };
    }));

    res.status(200).json({ success: true, data: enhancedConnections });
  } catch (error) {
    next(error);
  }
});

// GET /api/connections/pending
router.get('/pending', async (req, res, next) => {
  try {
    const shopOwnerId = req.user._id;
    const connections = await Connection.find({
      shopOwnerId,
      status: 'pending',
      initiatedBy: 'supplier'
    }).populate('supplierAccountId', 'businessName ownerName category location description');

    res.status(200).json({ success: true, data: connections });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/connections/:id/respond
router.patch('/:id/respond', async (req, res, next) => {
  try {
    const { action } = req.body;
    const connectionId = req.params.id;
    const shopOwnerId = req.user._id;

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: "Action must be 'accept' or 'reject'" });
    }

    const connection = await Connection.findOne({
      _id: connectionId,
      shopOwnerId,
      status: 'pending',
      initiatedBy: 'supplier'
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

    res.status(200).json({ success: true, data: connection });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/connections/:id/disconnect
router.patch('/:id/disconnect', async (req, res, next) => {
  try {
    const connectionId = req.params.id;
    const shopOwnerId = req.user._id;

    const connection = await Connection.findOne({
      _id: connectionId,
      shopOwnerId,
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

// PATCH /api/connections/:id/notes
router.patch('/:id/notes', async (req, res, next) => {
  try {
    const connectionId = req.params.id;
    const shopOwnerId = req.user._id;
    const { shopNotes } = req.body;

    const connection = await Connection.findOne({ _id: connectionId, shopOwnerId });

    if (!connection) {
      return res.status(404).json({ success: false, message: 'Connection not found' });
    }

    connection.shopNotes = shopNotes;
    await connection.save();

    res.status(200).json({ success: true, data: connection });
  } catch (error) {
    next(error);
  }
});

export default router;
