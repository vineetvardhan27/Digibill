import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import SupplierAccount from '../models/SupplierAccount.js';
import supplierAccountAuth from '../middleware/supplierAccountAuth.js';
import { globalLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign(
    { id, role: 'supplier_account' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// @route   POST /api/supplier-account/register
router.post('/register', globalLimiter, async (req, res, next) => {
  try {
    const { businessName, ownerName, email, password, phone, category, location } = req.body;

    if (!businessName || !ownerName || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    const existingAccount = await SupplierAccount.findOne({ email: email.toLowerCase() });
    if (existingAccount) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    const supplierAccount = new SupplierAccount({
      businessName,
      ownerName,
      email,
      password,
      phone,
      category,
      location
    });

    await supplierAccount.save();

    const token = generateToken(supplierAccount._id);

    res.status(201).json({
      success: true,
      token,
      supplierAccount: {
        id: supplierAccount._id,
        businessName: supplierAccount.businessName,
        email: supplierAccount.email,
        category: supplierAccount.category,
        profileComplete: supplierAccount.profileComplete
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/supplier-account/login
router.post('/login', globalLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const supplierAccount = await SupplierAccount.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!supplierAccount) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await supplierAccount.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!supplierAccount.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account deactivated'
      });
    }

    supplierAccount.lastLogin = new Date();
    await supplierAccount.save();

    const token = generateToken(supplierAccount._id);

    res.status(200).json({
      success: true,
      token,
      supplierAccount: {
        id: supplierAccount._id,
        businessName: supplierAccount.businessName,
        email: supplierAccount.email,
        category: supplierAccount.category,
        profileComplete: supplierAccount.profileComplete
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/supplier-account/me
router.get('/me', supplierAccountAuth, async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: req.supplierAccount
    });
  } catch (error) {
    next(error);
  }
});

// @route   PATCH /api/supplier-account/me
router.patch('/me', supplierAccountAuth, async (req, res, next) => {
  try {
    const { businessName, ownerName, phone, category, location, gstin, description } = req.body;
    
    const supplierAccount = req.supplierAccount;

    if (businessName !== undefined) supplierAccount.businessName = businessName;
    if (ownerName !== undefined) supplierAccount.ownerName = ownerName;
    if (phone !== undefined) supplierAccount.phone = phone;
    if (category !== undefined) supplierAccount.category = category;
    
    if (location !== undefined) {
      supplierAccount.location = {
        ...supplierAccount.location,
        ...location
      };
    }

    if (gstin !== undefined) supplierAccount.gstin = gstin;
    if (description !== undefined) supplierAccount.description = description;

    // Recompute profileComplete
    const hasBusinessName = !!supplierAccount.businessName;
    const hasCategory = !!supplierAccount.category;
    const hasCity = !!(supplierAccount.location && supplierAccount.location.city);

    supplierAccount.profileComplete = hasBusinessName && hasCategory && hasCity;

    await supplierAccount.save();

    res.status(200).json({
      success: true,
      data: supplierAccount
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/supplier-account/forgot-password
router.post('/forgot-password', globalLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address'
      });
    }

    const supplierAccount = await SupplierAccount.findOne({ email: email.toLowerCase() });

    if (supplierAccount) {
      const resetToken = crypto.randomBytes(20).toString('hex');
      supplierAccount.resetToken = resetToken;
      supplierAccount.resetTokenExpiry = Date.now() + 3600000; // 1 hour

      await supplierAccount.save();

      // Send email
      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const resetUrl = `${clientUrl}/supplier/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: supplierAccount.email,
        subject: 'Supplier Portal Password Reset',
        text: `You requested a password reset. Please click the following link to reset your password: ${resetUrl}\n\nIf you did not request this, please ignore this email. The link is valid for 1 hour.`
      };

      try {
        await transporter.sendMail(mailOptions);
      } catch (emailError) {
        console.error('Failed to send reset email:', emailError);
        supplierAccount.resetToken = undefined;
        supplierAccount.resetTokenExpiry = undefined;
        await supplierAccount.save();
        // Still return 200 below for security reasons
      }
    }

    // Always return 200 regardless of whether email exists
    res.status(200).json({
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent'
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/supplier-account/reset-password
router.post('/reset-password', globalLimiter, async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide token and new password'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    const supplierAccount = await SupplierAccount.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!supplierAccount) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token'
      });
    }

    supplierAccount.password = password;
    supplierAccount.resetToken = undefined;
    supplierAccount.resetTokenExpiry = undefined;

    await supplierAccount.save();

    res.status(200).json({
      success: true,
      message: 'Password has been successfully reset'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
