import express from 'express';
import User from '../models/User.js';
import Connection from '../models/Connection.js';
import supplierAccountAuth from '../middleware/supplierAccountAuth.js';

const router = express.Router();

router.use(supplierAccountAuth);

// @route   GET /api/supplier-directory/shops
// @desc    Get directory of shops for suppliers
router.get('/shops', async (req, res, next) => {
  try {
    const { city, category, search, page = 1, limit = 12 } = req.query;
    const supplierAccountId = req.supplierAccount._id;

    // Base query: Return all users
    const query = {};

    if (city) {
      query['location.city'] = city;
    }
    if (category) {
      query.categoriesOfInterest = category;
    }
    if (search) {
      query.shopName = { $regex: search, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Only expose safe fields
    const shops = await User.find(query)
      .select('name shopName location categoriesOfInterest createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalCount = await User.countDocuments(query);
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    // Get connections to compute connectionStatus
    const supplierConnections = await Connection.find({ supplierAccountId }).lean();
    const connectionMap = {}; // shopOwnerId -> connection
    supplierConnections.forEach(c => {
      connectionMap[c.shopOwnerId.toString()] = c;
    });

    const enhancedShops = await Promise.all(
      shops.map(async (shop) => {
        let connectionStatus = 'none';
        const conn = connectionMap[shop._id.toString()];
        
        if (conn) {
          if (conn.status === 'connected') connectionStatus = 'connected';
          else if (conn.status === 'rejected') connectionStatus = 'rejected';
          else if (conn.status === 'pending') {
            connectionStatus = conn.initiatedBy === 'supplier' ? 'pending_sent' : 'pending_received';
          }
        }

        // Count active suppliers connected to this shop
        const totalConnectedSuppliers = await Connection.countDocuments({
          shopOwnerId: shop._id,
          status: 'connected'
        });

        return {
          ...shop,
          connectionStatus,
          totalConnectedSuppliers
        };
      })
    );

    // Get unique cities and categories for filters
    const [cities, categories] = await Promise.all([
      User.aggregate([
        { $match: { 'location.city': { $ne: null } } },
        { $group: { _id: '$location.city', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      User.aggregate([
        { $match: { categoriesOfInterest: { $ne: null, $not: {$size: 0} } } },
        { $unwind: '$categoriesOfInterest' },
        { $group: { _id: '$categoriesOfInterest', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        shops: enhancedShops,
        totalCount,
        page: parseInt(page),
        totalPages,
        filters: {
          cities: cities.map(c => ({ name: c._id, count: c.count })).filter(c => c.name),
          categories: categories.map(c => ({ name: c._id, count: c.count })).filter(c => c.name)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/supplier-directory/shops/:id
// @desc    Get public profile of a single shop
router.get('/shops/:id', async (req, res, next) => {
  try {
    const shop = await User.findOne({
      _id: req.params.id
    }).select('name shopName location categoriesOfInterest createdAt').lean();

    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    const supplierAccountId = req.supplierAccount._id;
    const conn = await Connection.findOne({ shopOwnerId: shop._id, supplierAccountId }).lean();
    
    let connectionStatus = 'none';
    if (conn) {
      if (conn.status === 'connected') connectionStatus = 'connected';
      else if (conn.status === 'rejected') connectionStatus = 'rejected';
      else if (conn.status === 'pending') {
        connectionStatus = conn.initiatedBy === 'supplier' ? 'pending_sent' : 'pending_received';
      }
    }

    const totalConnectedSuppliers = await Connection.countDocuments({
      shopOwnerId: shop._id,
      status: 'connected'
    });

    res.status(200).json({
      success: true,
      data: {
        ...shop,
        connectionStatus,
        totalConnectedSuppliers
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
