import express from 'express';
import { body, validationResult } from 'express-validator';
import Supplier from '../models/Supplier.js';
import Bill from '../models/Bill.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireEmailVerified } from '../middleware/verifyEmailMiddleware.js';
import { getOrSetCache, invalidateCache } from '../lib/cache.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// ==================== SUPPLIER ROUTES ====================

// @route   POST /api/suppliers
// @desc    Create a new supplier
// @access  Private
router.post(
  '/suppliers',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Supplier name is required')
      .isLength({ max: 100 })
      .withMessage('Supplier name cannot exceed 100 characters'),
    body('phone')
      .optional()
      .trim()
      .matches(/^[0-9]{10}$/)
      .withMessage('Phone must be a valid 10-digit number'),
    body('address')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Address cannot exceed 200 characters')
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { name, phone, address } = req.body;

      // Check if supplier with same name already exists for this user (excluding deleted ones)
      const existingSupplier = await Supplier.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        createdBy: req.user._id,
        isDeleted: { $ne: true }
      });

      if (existingSupplier) {
        return res.status(400).json({
          success: false,
          message: 'A supplier with this name already exists'
        });
      }

      // Create new supplier
      const supplier = new Supplier({
        name,
        phone,
        address,
        createdBy: req.user._id
      });

      await supplier.save();

      res.status(201).json({
        success: true,
        message: 'Supplier created successfully',
        data: { supplier }
      });
    } catch (error) {
      console.error('Create supplier error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating supplier',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   GET /api/suppliers
// @desc    Get all suppliers for the logged-in user
// @access  Private
router.get('/suppliers', async (req, res) => {
  try {
    const { search, sortBy = 'name', order = 'asc', page = 1, limit = 50 } = req.query;

    // Build query
    const query = { createdBy: req.user._id, isDeleted: { $ne: true } };

    // Add search if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj = { [sortBy]: sortOrder };

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get suppliers with pagination
    const suppliers = await Supplier.find(query)
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Get total count for pagination
    const total = await Supplier.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        suppliers,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching suppliers',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/suppliers/health-summary
// @desc    Get health scores for ALL suppliers of current user, sorted worst-first
// @access  Private
router.get('/suppliers/health-summary', async (req, res) => {
  try {
    const { calculateHealthScore } = await import('../utils/healthScore.js');

    const suppliers = await Supplier.find({
      createdBy: req.user._id,
      isDeleted: { $ne: true }
    }).lean();

    const summary = [];

    for (const supplier of suppliers) {
      const bills = await Bill.find({ supplierId: supplier._id }).lean();
      const { score, grade } = calculateHealthScore(bills);
      summary.push({
        supplierId: supplier._id,
        supplierName: supplier.name,
        score,
        grade
      });
    }

    // Sort by score ascending (worst first)
    summary.sort((a, b) => a.score - b.score);

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Health summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while computing health summary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/suppliers/:id
// @desc    Get a single supplier by ID
// @access  Private
router.get('/suppliers/:id', async (req, res) => {
  try {
    const cacheKey = `supplier:${req.params.id}`;
    const supplier = await getOrSetCache(cacheKey, 300, async () => {
      return Supplier.findOne({
        _id: req.params.id,
        createdBy: req.user._id,
        isDeleted: { $ne: true }
      }).lean();
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { supplier }
    });
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching supplier',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/suppliers/:id/invite
// @desc    Send an invitation to a supplier
// @access  Private
router.post('/suppliers/:id/invite', async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
      isDeleted: { $ne: true }
    });

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    if (!supplier.portalEmail) {
      return res.status(400).json({ success: false, message: 'Supplier has no portal email configured' });
    }

    if (supplier.inviteStatus === 'active') {
      return res.status(400).json({ success: false, message: 'Supplier already has an active account' });
    }

    if (supplier.inviteStatus === 'invited' && supplier.inviteTokenExpiry > Date.now()) {
      return res.status(400).json({ success: false, message: 'Invite already sent and still valid' });
    }

    const { sendSupplierInvite } = await import('../services/inviteService.js');
    await sendSupplierInvite(supplier, req.user);

    res.status(200).json({
      success: true,
      message: `Invitation sent to ${supplier.portalEmail}`
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/suppliers/:id
// @desc    Update a supplier
// @access  Private
router.put(
  '/suppliers/:id',
  [
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Supplier name cannot be empty')
      .isLength({ max: 100 })
      .withMessage('Supplier name cannot exceed 100 characters'),
    body('phone')
      .optional()
      .trim()
      .matches(/^[0-9]{10}$/)
      .withMessage('Phone must be a valid 10-digit number'),
    body('address')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Address cannot exceed 200 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { name, phone, address } = req.body;

      // Find supplier
      const supplier = await Supplier.findOne({
        _id: req.params.id,
        createdBy: req.user._id,
        isDeleted: { $ne: true }
      });

      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found'
        });
      }

      // Check if new name conflicts with existing supplier
      if (name && name !== supplier.name) {
        const existingSupplier = await Supplier.findOne({
          name: { $regex: new RegExp(`^${name}$`, 'i') },
          createdBy: req.user._id,
          _id: { $ne: req.params.id },
          isDeleted: { $ne: true }
        });

        if (existingSupplier) {
          return res.status(400).json({
            success: false,
            message: 'A supplier with this name already exists'
          });
        }
      }

      // Update fields
      if (name) supplier.name = name;
      if (phone !== undefined) supplier.phone = phone;
      if (address !== undefined) supplier.address = address;

      await supplier.save();

      // Invalidate cached supplier profile
      await invalidateCache(`supplier:${req.params.id}`);

      res.status(200).json({
        success: true,
        message: 'Supplier updated successfully',
        data: { supplier }
      });
    } catch (error) {
      console.error('Update supplier error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating supplier',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   DELETE /api/suppliers/:id
// @desc    Delete a supplier (soft delete)
// @access  Private
router.delete('/suppliers/:id', async (req, res) => {
  try {
    // Validate supplier ID format
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log(`[DELETE SUPPLIER] Invalid supplier ID format: ${req.params.id}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier ID format'
      });
    }

    // Find supplier (excluding already deleted ones)
    const supplier = await Supplier.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
      isDeleted: { $ne: true }
    });

    if (!supplier) {
      console.log(`[DELETE SUPPLIER] Supplier not found: ${req.params.id} for user: ${req.user._id}`);
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Check if supplier has associated bills
    const billCount = await Bill.countDocuments({ supplierId: req.params.id });
    
    if (billCount > 0) {
      console.log(`[DELETE SUPPLIER] Supplier ${req.params.id} has ${billCount} associated bills`);
      
      // Allow soft delete but warn about associated bills
      supplier.isDeleted = true;
      supplier.deletedAt = new Date();
      await supplier.save();

      // Invalidate cached supplier profile and health score
      await invalidateCache(
        `supplier:${req.params.id}`,
        `supplier:${req.params.id}:health`
      );
      
      console.log(`[DELETE SUPPLIER] Soft deleted supplier: ${supplier.name} (ID: ${supplier._id}) by user: ${req.user._id}. Has ${billCount} associated bills.`);
      
      return res.status(200).json({
        success: true,
        message: `Supplier deleted successfully. Note: ${billCount} associated bill(s) remain intact.`,
        data: {
          supplierId: supplier._id,
          supplierName: supplier.name,
          associatedBills: billCount,
          deletedAt: supplier.deletedAt
        }
      });
    }

    // No bills - perform soft delete
    supplier.isDeleted = true;
    supplier.deletedAt = new Date();
    await supplier.save();

    // Invalidate cached supplier profile and health score
    await invalidateCache(
      `supplier:${req.params.id}`,
      `supplier:${req.params.id}:health`
    );

    console.log(`[DELETE SUPPLIER] Successfully soft deleted supplier: ${supplier.name} (ID: ${supplier._id}) by user: ${req.user._id}`);

    res.status(200).json({
      success: true,
      message: 'Supplier deleted successfully',
      data: {
        supplierId: supplier._id,
        supplierName: supplier.name,
        deletedAt: supplier.deletedAt
      }
    });
  } catch (error) {
    console.error('[DELETE SUPPLIER] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting supplier',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== SUPPLIER HEALTH SCORE ROUTES ====================


// @route   GET /api/suppliers/:id/health
// @desc    Get detailed health score for a single supplier
// @access  Private
router.get('/suppliers/:id/health', async (req, res) => {
  try {
    const cacheKey = `supplier:${req.params.id}:health`;
    const healthData = await getOrSetCache(cacheKey, 600, async () => {
      const { calculateHealthScore } = await import('../utils/healthScore.js');

      const supplier = await Supplier.findOne({
        _id: req.params.id,
        createdBy: req.user._id,
        isDeleted: { $ne: true }
      }).lean();

      if (!supplier) return null;

      const bills = await Bill.find({ supplierId: supplier._id }).lean();
      const healthScore = calculateHealthScore(bills);

      return {
        supplierId: supplier._id,
        supplierName: supplier.name,
        ...healthScore
      };
    });

    if (!healthData) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    res.status(200).json({
      success: true,
      data: healthData
    });
  } catch (error) {
    console.error('Health score error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while computing health score',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== BILL ROUTES ====================

// @route   POST /api/bills/check-duplicate
// @desc    Check for potential duplicate bills
// @access  Private
router.post('/bills/check-duplicate', async (req, res) => {
  try {
    const { supplierId, amount, billDate } = req.body;
    
    // Lazy import utility to avoid circular deps or startup delays if not needed
    const { checkForDuplicates } = await import('../utils/duplicateCheck.js');
    
    const matches = await checkForDuplicates(req.user._id, { supplierId, amount, billDate });

    res.status(200).json({
      success: true,
      isDuplicate: matches.length > 0,
      data: { matches }
    });
  } catch (error) {
    console.error('Duplicate check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking for duplicates'
    });
  }
});

// @route   POST /api/bills
// @desc    Create a new bill and update supplier stats
// @access  Private
router.post(
  '/bills',
  authMiddleware,
  requireEmailVerified,
  [
    body('supplierId')
      .optional()
      .isMongoId()
      .withMessage('Invalid supplier ID'),
    body('connectionId')
      .optional()
      .isMongoId()
      .withMessage('Invalid connection ID'),
    body('amount')
      .isFloat({ min: 0 })
      .withMessage('Amount must be a positive number'),
    body('date')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    body('isPaid')
      .optional()
      .isBoolean()
      .withMessage('isPaid must be a boolean'),
    body('dueDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid due date format'),
    body('items')
      .optional()
      .isArray()
      .withMessage('Items must be an array'),
    body('items.*.name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Item name is required'),
    body('items.*.quantity')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Item quantity must be positive'),
    body('items.*.price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Item price must be positive')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { supplierId, connectionId, amount, date, description, isPaid = false, dueDate, items, imageUrl } = req.body;

      if (!supplierId && !connectionId) {
        return res.status(400).json({
          success: false,
          message: 'Either supplierId or connectionId is required'
        });
      }

      if (supplierId) {
        // Verify supplier exists and belongs to user
        const supplier = await Supplier.findOne({
          _id: supplierId,
          createdBy: req.user._id
        });

        if (!supplier) {
          return res.status(404).json({
            success: false,
            message: 'Supplier not found'
          });
        }
      }

      if (connectionId) {
        // Dynamic import to avoid circular dependency
        const Connection = (await import('../models/Connection.js')).default;
        const connection = await Connection.findOne({
          _id: connectionId,
          shopOwnerId: req.user._id,
          status: 'connected'
        });

        if (!connection) {
          return res.status(404).json({
            success: false,
            message: 'Active connection not found'
          });
        }
      }

      // Create bill
      const bill = new Bill({
        supplierId: supplierId || undefined,
        connectionId: connectionId || undefined,
        amount,
        date: date || new Date(),
        description,
        isPaid,
        dueDate,
        createdBy: req.user._id,
        items: items || [],
        imageUrl,
        paidDate: isPaid ? new Date() : undefined
      });

      await bill.save();

      // Update supplier stats if supplierId is provided
      if (supplierId) {
        const supplier = await Supplier.findById(supplierId);
        if (supplier) {
          supplier.totalSpend += amount;
          if (!isPaid) {
            supplier.pendingAmount += amount;
          }
          supplier.totalBills += 1;
          if (!supplier.lastPurchaseDate || new Date(date || Date.now()) > supplier.lastPurchaseDate) {
            supplier.lastPurchaseDate = date || new Date();
          }
          await supplier.save();
        }

        // Invalidate caches tied to this supplier and user's forecast
        await invalidateCache(
          `supplier:${supplierId}`,
          `supplier:${supplierId}:health`,
          `forecast:${req.user._id}`
        );
      } else {
        // Still invalidate the forecast for connection-based bills
        await invalidateCache(`forecast:${req.user._id}`);
      }

      // Populate bill with supplier/connection info and transform for frontend
      let populatedBill = await Bill.findById(bill._id)
        .populate('supplierId', 'name phone address')
        .populate({
          path: 'connectionId',
          populate: { path: 'supplierAccountId', select: 'businessName ownerName phone location' }
        })
        .lean();
      
      // Transform for frontend compatibility - add supplier field
      if (populatedBill) {
        if (populatedBill.supplierId) {
          populatedBill.supplier = populatedBill.supplierId;
        } else if (populatedBill.connectionId && populatedBill.connectionId.supplierAccountId) {
          populatedBill.supplier = {
            _id: populatedBill.connectionId._id,
            name: populatedBill.connectionId.supplierAccountId.businessName || populatedBill.connectionId.supplierAccountId.ownerName,
            phone: populatedBill.connectionId.supplierAccountId.phone,
            address: populatedBill.connectionId.supplierAccountId.location?.city 
          };
        }
      }

      res.status(201).json({
        success: true,
        message: 'Bill created successfully',
        data: { bill: populatedBill }
      });
    } catch (error) {
      console.error('Create bill error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating bill',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   GET /api/bills
// @desc    Get all bills for the logged-in user (sorted by date desc)
// @access  Private
router.get('/bills', async (req, res) => {
  try {
    const { 
      search, 
      supplierId, 
      isPaid, 
      startDate, 
      endDate, 
      sortBy = 'date', 
      order = 'desc', 
      page = 1, 
      limit = 50 
    } = req.query;

    // Build query
    const query = { createdBy: req.user._id };

    // Filter by supplier
    if (supplierId) {
      query.supplierId = supplierId;
    }

    // Filter by payment status
    if (isPaid !== undefined) {
      query.isPaid = isPaid === 'true';
    }

    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Add search if provided
    if (search) {
      query.description = { $regex: search, $options: 'i' };
    }

    // Build sort object
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj = { [sortBy]: sortOrder };

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get bills with pagination and populate supplier and connection
    const bills = await Bill.find(query)
      .populate('supplierId', 'name phone address')
      .populate({
        path: 'connectionId',
        populate: { path: 'supplierAccountId', select: 'businessName ownerName phone location' }
      })
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip(skip)
      .lean();
    
    // Transform bills for frontend compatibility - add supplier field
    const transformedBills = bills.map(bill => {
      let supplierData = bill.supplierId;
      if (!supplierData && bill.connectionId && bill.connectionId.supplierAccountId) {
        supplierData = {
          _id: bill.connectionId._id,
          name: bill.connectionId.supplierAccountId.businessName || bill.connectionId.supplierAccountId.ownerName,
          phone: bill.connectionId.supplierAccountId.phone,
          address: bill.connectionId.supplierAccountId.location?.city
        };
      }
      return {
        ...bill,
        supplier: supplierData
      };
    });

    // Get total count
    const total = await Bill.countDocuments(query);

    // Calculate summary stats
    const stats = await Bill.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          paidAmount: {
            $sum: {
              $cond: ['$isPaid', '$amount', 0]
            }
          },
          pendingAmount: {
            $sum: {
              $cond: ['$isPaid', 0, '$amount']
            }
          },
          totalBills: { $sum: 1 },
          paidBills: {
            $sum: {
              $cond: ['$isPaid', 1, 0]
            }
          },
          unpaidBills: {
            $sum: {
              $cond: ['$isPaid', 0, 1]
            }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        bills: transformedBills,
        stats: stats[0] || {
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          totalBills: 0,
          paidBills: 0,
          unpaidBills: 0
        },
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bills',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/bills/disputes
// @desc    Get all disputes for the owner's bills
// @access  Private
router.get('/bills/disputes', async (req, res) => {
  try {
    const { status = 'open', connectionId } = req.query;
    
    // Lazy load the model to avoid circular/early imports if any
    const BillDispute = (await import('../models/BillDispute.js')).default;
    
    let query = { ownerId: req.user._id, status };
    
    if (connectionId) {
      const Bill = (await import('../models/Bill.js')).default;
      const bills = await Bill.find({ connectionId }).select('_id');
      query.billId = { $in: bills.map(b => b._id) };
    }

    const disputes = await BillDispute.find(query)
      .populate('billId', 'amount description')
      .populate('supplierId', 'name portalEmail')
      .populate({
        path: 'connectionId',
        populate: {
          path: 'supplierAccountId',
          select: 'businessName ownerName email'
        }
      })
      .sort({ createdAt: -1 })
      .lean();

    const formattedDisputes = disputes.map(d => {
      let supplierInfo = d.supplierId;
      if (!supplierInfo && d.connectionId && d.connectionId.supplierAccountId) {
        supplierInfo = {
          _id: d.connectionId.supplierAccountId._id,
          name: d.connectionId.supplierAccountId.businessName || d.connectionId.supplierAccountId.ownerName,
          portalEmail: d.connectionId.supplierAccountId.email
        };
      }
      
      const billInfo = d.billId || { _id: 'unknown', amount: 0, description: 'Deleted Bill' };

      return {
        ...d,
        billId: billInfo,
        supplierId: supplierInfo || { _id: 'unknown', name: 'Unknown Supplier' }
      };
    });

    res.status(200).json({ success: true, data: formattedDisputes });
  } catch (error) {
    console.error('Get disputes error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching disputes' });
  }
});

// @route   PATCH /api/bills/disputes/:disputeId
// @desc    Respond to a dispute
// @access  Private
router.patch('/bills/disputes/:disputeId', async (req, res) => {
  try {
    const { status, ownerNote } = req.body;
    
    if (!['resolved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const BillDispute = (await import('../models/BillDispute.js')).default;

    const dispute = await BillDispute.findOneAndUpdate(
      { _id: req.params.disputeId, ownerId: req.user._id },
      { status, ownerNote: ownerNote ? ownerNote.substring(0, 500) : undefined },
      { new: true }
    );

    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Dispute not found' });
    }

    res.status(200).json({ success: true, data: dispute });
  } catch (error) {
    console.error('Update dispute error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating dispute' });
  }
});

// @route   GET /api/bills/:id
// @desc    Get a single bill by ID
// @access  Private
router.get('/bills/:id', async (req, res) => {
  try {
    const bill = await Bill.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    }).populate('supplierId', 'name phone address');

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { bill }
    });
  } catch (error) {
    console.error('Get bill error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bill',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/bills/:id/pay
// @desc    Mark a bill as paid and update supplier's pendingAmount
// @access  Private
router.put('/bills/:id/pay', async (req, res) => {
  try {
    // Find bill
    const bill = await Bill.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Check if already paid
    if (bill.isPaid) {
      return res.status(400).json({
        success: false,
        message: 'Bill is already marked as paid'
      });
    }

    let supplierData = null;

    if (bill.supplierId) {
      // Find supplier
      const supplier = await Supplier.findById(bill.supplierId);

      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: 'Associated supplier not found'
        });
      }

      // Decrease supplier's pending amount
      supplier.pendingAmount = Math.max(0, supplier.pendingAmount - bill.amount);
      await supplier.save();
      
      supplierData = {
        id: supplier._id,
        name: supplier.name,
        pendingAmount: supplier.pendingAmount
      };
    }

    // Update bill
    bill.isPaid = true;
    bill.paidDate = new Date();
    await bill.save();

    // Invalidate caches: supplier profile, health score, and forecast
    if (bill.supplierId) {
      await invalidateCache(
        `supplier:${bill.supplierId}`,
        `supplier:${bill.supplierId}:health`,
        `forecast:${req.user._id}`
      );
    } else {
      await invalidateCache(`forecast:${req.user._id}`);
    }

    // Populate bill with supplier/connection info and transform for frontend
    const populatedBill = await Bill.findById(bill._id)
      .populate('supplierId', 'name phone address')
      .populate({
        path: 'connectionId',
        populate: { path: 'supplierAccountId', select: 'businessName ownerName phone location' }
      })
      .lean();
    
    // Add supplier field for frontend compatibility
    if (populatedBill) {
      if (populatedBill.supplierId) {
        populatedBill.supplier = populatedBill.supplierId;
      } else if (populatedBill.connectionId && populatedBill.connectionId.supplierAccountId) {
        populatedBill.supplier = {
          _id: populatedBill.connectionId._id,
          name: populatedBill.connectionId.supplierAccountId.businessName || populatedBill.connectionId.supplierAccountId.ownerName,
          phone: populatedBill.connectionId.supplierAccountId.phone,
          address: populatedBill.connectionId.supplierAccountId.location?.city 
        };
      }
    }

    res.status(200).json({
      success: true,
      message: 'Bill marked as paid successfully',
      data: { 
        bill: populatedBill,
        supplier: supplierData
      }
    });
  } catch (error) {
    console.error('Mark bill as paid error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking bill as paid',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/bills/:id
// @desc    Update a bill
// @access  Private
router.put(
  '/bills/:id',
  [
    body('amount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Amount must be a positive number'),
    body('date')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    body('dueDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid due date format')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { amount, date, description, dueDate, items, imageUrl } = req.body;

      // Find bill
      const bill = await Bill.findOne({
        _id: req.params.id,
        createdBy: req.user._id
      });

      if (!bill) {
        return res.status(404).json({
          success: false,
          message: 'Bill not found'
        });
      }

      // If bill is paid, prevent amount changes
      if (bill.isPaid && amount !== undefined && amount !== bill.amount) {
        return res.status(400).json({
          success: false,
          message: 'Cannot change amount of a paid bill'
        });
      }

      // Store old amount for supplier update
      const oldAmount = bill.amount;

      // Update fields
      if (amount !== undefined) bill.amount = amount;
      if (date) bill.date = date;
      if (description !== undefined) bill.description = description;
      if (dueDate !== undefined) bill.dueDate = dueDate;
      if (items) bill.items = items;
      if (imageUrl !== undefined) bill.imageUrl = imageUrl;

      await bill.save();

      // If amount changed, update supplier stats
      if (amount !== undefined && amount !== oldAmount) {
        const supplier = await Supplier.findById(bill.supplierId);
        if (supplier) {
          const difference = amount - oldAmount;
          supplier.totalSpend += difference;
          
          if (!bill.isPaid) {
            supplier.pendingAmount += difference;
          }
          
          await supplier.save();
        }
      }

      // Invalidate caches tied to this supplier and forecast
      if (bill.supplierId) {
        await invalidateCache(
          `supplier:${bill.supplierId}`,
          `supplier:${bill.supplierId}:health`,
          `forecast:${req.user._id}`
        );
      } else {
        await invalidateCache(`forecast:${req.user._id}`);
      }

      const populatedBill = await Bill.findById(bill._id)
        .populate('supplierId', 'name phone address');

      res.status(200).json({
        success: true,
        message: 'Bill updated successfully',
        data: { bill: populatedBill }
      });
    } catch (error) {
      console.error('Update bill error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating bill',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   DELETE /api/bills/:id
// @desc    Delete a bill and update supplier stats
// @access  Private
router.delete('/bills/:id', async (req, res) => {
  try {
    const bill = await Bill.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Get supplier to update stats
    const supplier = await Supplier.findById(bill.supplierId);

    if (supplier) {
      // Decrease total spend
      supplier.totalSpend = Math.max(0, supplier.totalSpend - bill.amount);
      
      // If bill was unpaid, decrease pending amount
      if (!bill.isPaid) {
        supplier.pendingAmount = Math.max(0, supplier.pendingAmount - bill.amount);
      }

      // Decrease bill count
      supplier.totalBills = Math.max(0, supplier.totalBills - 1);

      // Recalculate last purchase date if needed
      if (supplier.lastPurchaseDate && 
          bill.date.getTime() === supplier.lastPurchaseDate.getTime()) {
        const latestBill = await Bill.findOne({
          supplierId: supplier._id,
          _id: { $ne: bill._id }
        }).sort({ date: -1 });
        
        supplier.lastPurchaseDate = latestBill ? latestBill.date : null;
      }

      await supplier.save();
    }

    await Bill.findByIdAndDelete(req.params.id);

    // Invalidate caches tied to this supplier and forecast
    if (bill.supplierId) {
      await invalidateCache(
        `supplier:${bill.supplierId}`,
        `supplier:${bill.supplierId}:health`,
        `forecast:${req.user._id}`
      );
    } else {
      await invalidateCache(`forecast:${req.user._id}`);
    }

    res.status(200).json({
      success: true,
      message: 'Bill deleted successfully'
    });
  } catch (error) {
    console.error('Delete bill error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting bill',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});



export default router;
