import jwt from 'jsonwebtoken';
import Supplier from '../models/Supplier.js';

const supplierAuth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authorization denied.'
      });
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format. Authorization denied.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check role
      if (decoded.role !== 'supplier') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Supplier permissions required.'
        });
      }

      // Get supplier from database (excluding password and tokens)
      const supplier = await Supplier.findById(decoded.id).select('-portalPassword -inviteToken');
      
      if (!supplier || supplier.inviteStatus !== 'active') {
        return res.status(401).json({
          success: false,
          message: 'Supplier not found or not active. Authorization denied.'
        });
      }

      // Check if the owner has the supplier portal enabled
      const User = (await import('../models/User.js')).default;
      const owner = await User.findById(supplier.createdBy);
      if (!owner || !owner.supplierPortalEnabled) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. The shop owner has disabled the supplier portal.'
        });
      }

      // Attach supplier to request object
      req.supplier = supplier;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please login again.'
        });
      }
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Authorization denied.'
        });
      }

      throw error;
    }
  } catch (error) {
    console.error('Supplier Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

export default supplierAuth;
