import jwt from 'jsonwebtoken';
import SupplierAccount from '../models/SupplierAccount.js';

const supplierAccountAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authorization denied.'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format. Authorization denied.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if role is correct
    if (decoded.role !== 'supplier_account' && decoded.role !== 'supplier') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Supplier account required.'
      });
    }
    
    // Get supplier account from database
    const supplierAccount = await SupplierAccount.findById(decoded.id);
    
    if (!supplierAccount) {
      return res.status(401).json({
        success: false,
        message: 'Account not found. Authorization denied.'
      });
    }

    if (!supplierAccount.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account deactivated'
      });
    }

    // Attach account to request object
    req.supplierAccount = supplierAccount;
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

    console.error('Supplier account auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

export default supplierAccountAuth;
