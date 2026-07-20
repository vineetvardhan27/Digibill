import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { body, validationResult } from 'express-validator';
import Supplier from '../models/Supplier.js';
import SupplierAccount from '../models/SupplierAccount.js';
import supplierAuth from '../middleware/supplierAuth.js';

const router = express.Router();

// Helper for sending reset email
const sendResetEmail = async (email, resetToken) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetLink = `${clientUrl}/supplier/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Digibill" <noreply@digibill.app>',
    to: email,
    subject: 'Password Reset Request',
    text: `You requested a password reset. Please use the following link to reset your password:\n${resetLink}\n\nThis link expires in 1 hour.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Password Reset Request</h2>
        <p>You requested a password reset for your Digibill Supplier account.</p>
        <p>Please click the button below to reset your password:</p>
        <div style="margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a>
        </div>
        <p>This link expires in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// @route   GET /api/supplier-auth/validate-token
// @desc    Validate invite token and return shop name
// @access  Public
router.get('/validate-token', async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token is required' });
    }

    const supplier = await Supplier.findOne({
      inviteToken: token,
      inviteTokenExpiry: { $gt: Date.now() },
      inviteStatus: 'invited'
    }).populate('createdBy', 'shopName name');

    if (!supplier) {
      return res.status(400).json({ success: false, message: 'Invite link is invalid or has expired' });
    }

    const shopOwner = supplier.createdBy;
    const shopName = shopOwner?.shopName || shopOwner?.name || 'Digibill Shop';

    res.status(200).json({
      success: true,
      data: { shopName, supplierName: supplier.name }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/supplier-auth/register
// @desc    Register a new supplier account
// @access  Public
router.post('/register', [
  body('businessName', 'Business name is required').notEmpty(),
  body('ownerName', 'Owner name is required').notEmpty(),
  body('email', 'Please include a valid email').isEmail(),
  body('password', 'Please enter a password with 8 or more characters').isLength({ min: 8 }),
  body('phone', 'Phone number is required').notEmpty()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array(), message: errors.array()[0].msg });
    }

    const { businessName, ownerName, email, password, phone, category } = req.body;

    let supplierAccount = await SupplierAccount.findOne({ email: email.toLowerCase() });
    if (supplierAccount) {
      return res.status(400).json({ success: false, message: 'Supplier with this email already exists' });
    }

    supplierAccount = new SupplierAccount({
      businessName,
      ownerName,
      email,
      password,
      phone,
      category
    });

    await supplierAccount.save();

    // Generate JWT
    const payload = {
      id: supplierAccount._id,
      role: 'supplier'
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    });

    res.status(201).json({
      success: true,
      token,
      supplier: {
        id: supplierAccount._id,
        businessName: supplierAccount.businessName,
        ownerName: supplierAccount.ownerName,
        email: supplierAccount.email,
        profileComplete: supplierAccount.profileComplete
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/supplier-auth/login
// @desc    Authenticate supplier & get token
// @access  Public
router.post('/login', [
  body('email', 'Please include a valid email').isEmail(),
  body('password', 'Password is required').exists()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array(), message: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    // Find active supplierAccount by email
    const supplierAccount = await SupplierAccount.findOne({ 
      email: email.toLowerCase(),
      isActive: true
    }).select('+password');

    if (!supplierAccount) {
      return res.status(400).json({ success: false, message: 'Invalid credentials or account inactive' });
    }

    const isMatch = await supplierAccount.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate JWT
    const payload = {
      id: supplierAccount._id,
      role: 'supplier'
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    });

    // Update last login
    supplierAccount.lastLogin = new Date();
    await supplierAccount.save();

    res.status(200).json({
      success: true,
      token,
      supplier: {
        id: supplierAccount._id,
        businessName: supplierAccount.businessName,
        ownerName: supplierAccount.ownerName,
        email: supplierAccount.email,
        profileComplete: supplierAccount.profileComplete
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/supplier-auth/me
// @desc    Get current supplier profile
// @access  Private (Supplier)
router.get('/me', supplierAuth, async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: req.supplier
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/supplier-auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', [
  body('email', 'Please include a valid email').isEmail()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array(), message: errors.array()[0].msg });
    }

    const { email } = req.body;

    const supplierAccount = await SupplierAccount.findOne({ 
      email: email.toLowerCase(),
      isActive: true
    });

    if (supplierAccount) {
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      supplierAccount.resetToken = resetToken;
      supplierAccount.resetTokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
      await supplierAccount.save();

      // Send email
      await sendResetEmail(supplierAccount.email, resetToken);
    }

    // Always return 200
    res.status(200).json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/supplier-auth/reset-password
// @desc    Reset password
// @access  Public
router.post('/reset-password', [
  body('token', 'Token is required').notEmpty(),
  body('password', 'Please enter a password with 8 or more characters').isLength({ min: 8 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array(), message: errors.array()[0].msg });
    }

    const { token, password } = req.body;

    const supplierAccount = await SupplierAccount.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
      isActive: true
    });

    if (!supplierAccount) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    supplierAccount.password = password;
    supplierAccount.resetToken = undefined;
    supplierAccount.resetTokenExpiry = undefined;
    await supplierAccount.save();

    res.status(200).json({ success: true, message: 'Password has been successfully reset' });
  } catch (error) {
    next(error);
  }
});

export default router;
