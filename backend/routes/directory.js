import express from 'express';
import SupplierAccount from '../models/SupplierAccount.js';
import Connection from '../models/Connection.js';
import Bill from '../models/Bill.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { calculateHealthScore } from '../utils/healthScore.js';

const router = express.Router();

router.use(authMiddleware);

// @route   GET /api/directory/suppliers
// @desc    Get directory of suppliers for shop owners
router.get('/suppliers', async (req, res, next) => {
  try {
    const { category, city, search, page = 1, limit = 12 } = req.query;
    const shopOwnerId = req.user._id;

    const query = {
      isActive: true
    };

    // Filters
    if (category) {
      query.category = category;
    }
    if (city) {
      query['location.city'] = city;
    }
    if (search) {
      query.businessName = { $regex: search, $options: 'i' };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get matching suppliers
    const suppliers = await SupplierAccount.find(query)
      .select('-password -resetToken -resetTokenExpiry')
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalCount = await SupplierAccount.countDocuments(query);
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    // Get all connections for this shop owner to quickly map connection status
    const shopConnections = await Connection.find({ shopOwnerId }).lean();
    const connectionMap = {}; // supplierAccountId -> connection object
    shopConnections.forEach(c => {
      connectionMap[c.supplierAccountId.toString()] = c;
    });

    // Enhance suppliers with connectionStatus and aggregateHealthScore
    const enhancedSuppliers = await Promise.all(
      suppliers.map(async (supplier) => {
        // 1. Connection Status
        let connectionStatus = 'none';
        const conn = connectionMap[supplier._id.toString()];
        if (conn) {
          if (conn.status === 'connected') connectionStatus = 'connected';
          else if (conn.status === 'rejected') connectionStatus = 'rejected';
          else if (conn.status === 'pending') {
            connectionStatus = conn.initiatedBy === 'shop' ? 'pending_sent' : 'pending_received';
          }
        }

        // 2. Aggregate Health Score (fetch all bills across ALL shop owners for this supplier)
        // Find all active connections for this supplier
        const activeConns = await Connection.find({ supplierAccountId: supplier._id, status: 'connected' }).lean();
        const connectionIds = activeConns.map(c => c._id);
        const totalConnectedShops = connectionIds.length;

        // Fetch bills linked to any of these connections
        const allBills = await Bill.find({ connectionId: { $in: connectionIds } }).lean();
        const healthScore = calculateHealthScore(allBills);

        return {
          ...supplier,
          connectionStatus,
          aggregateHealthScore: healthScore,
          totalConnectedShops
        };
      })
    );

    // Get unique categories and cities for filters
    const [categories, cities] = await Promise.all([
      SupplierAccount.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      SupplierAccount.aggregate([
        { $match: { isActive: true, 'location.city': { $ne: null } } },
        { $group: { _id: '$location.city', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        suppliers: enhancedSuppliers,
        totalCount,
        page: parseInt(page),
        totalPages,
        filters: {
          categories: categories.map(c => ({ name: c._id, count: c.count })).filter(c => c.name),
          cities: cities.map(c => ({ name: c._id, count: c.count })).filter(c => c.name)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/directory/suppliers/:id
// @desc    Get detailed public profile of a single supplier
router.get('/suppliers/:id', async (req, res, next) => {
  try {
    const supplier = await SupplierAccount.findOne({
      _id: req.params.id,
      isActive: true
    }).select('-password -resetToken -resetTokenExpiry').lean();

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const shopOwnerId = req.user._id;
    const conn = await Connection.findOne({ shopOwnerId, supplierAccountId: supplier._id }).lean();
    
    let connectionStatus = 'none';
    if (conn) {
      if (conn.status === 'connected') connectionStatus = 'connected';
      else if (conn.status === 'rejected') connectionStatus = 'rejected';
      else if (conn.status === 'pending') {
        connectionStatus = conn.initiatedBy === 'shop' ? 'pending_sent' : 'pending_received';
      }
    }

    // Health Score
    const activeConns = await Connection.find({ supplierAccountId: supplier._id, status: 'connected' }).lean();
    const connectionIds = activeConns.map(c => c._id);
    const totalConnectedShops = connectionIds.length;

    const allBills = await Bill.find({ connectionId: { $in: connectionIds } }).lean();
    const healthScore = calculateHealthScore(allBills);

    // Strip sensitive fields if not connected
    if (connectionStatus !== 'connected') {
      delete supplier.gstin;
      delete supplier.email;
      delete supplier.phone;
    }

    res.status(200).json({
      success: true,
      data: {
        ...supplier,
        connectionStatus,
        aggregateHealthScore: healthScore,
        totalConnectedShops
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
