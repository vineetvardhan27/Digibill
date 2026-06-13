import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { body, validationResult } from 'express-validator';
import Supplier from '../models/Supplier.js';
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

// @route   POST /api/supplier-auth/accept-invite
// @desc    Accept invitation and set password
// @access  Public
router.post('/accept-invite', [
  body('token', 'Token is required').notEmpty(),
  body('password', 'Please enter a password with 8 or more characters').isLength({ min: 8 }),
  body('confirmPassword', 'Confirm password is required').notEmpty()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array(), message: errors.array()[0].msg });
    }

    const { token, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const supplier = await Supplier.findOne({
      inviteToken: token,
      inviteTokenExpiry: { $gt: Date.now() },
      inviteStatus: 'invited'
    });

    if (!supplier) {
      return res.status(400).json({ success: false, message: 'Invite link is invalid or has expired' });
    }

    // Set new password (pre-save hook will hash it)
    supplier.portalPassword = password;
    supplier.inviteToken = null;
    supplier.inviteTokenExpiry = null;
    supplier.inviteStatus = 'active';

    await supplier.save();

    res.status(200).json({ success: true, message: 'Account activated. Please log in.' });
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

    // Find active supplier by portalEmail, explicitly selecting portalPassword
    const supplier = await Supplier.findOne({ 
      portalEmail: email.toLowerCase(),
      inviteStatus: 'active'
    }).select('+portalPassword');

    if (!supplier) {
      return res.status(400).json({ success: false, message: 'Invalid credentials or account inactive' });
    }

    const isMatch = await supplier.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate JWT
    const payload = {
      id: supplier._id,
      role: 'supplier',
      ownerId: supplier.createdBy // The user who created this supplier
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    });

    // Update last login
    supplier.lastLogin = new Date();
    await supplier.save();

    res.status(200).json({
      success: true,
      token,
      supplier: {
        id: supplier._id,
        name: supplier.name,
        portalEmail: supplier.portalEmail,
        inviteStatus: supplier.inviteStatus
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

    const supplier = await Supplier.findOne({ 
      portalEmail: email.toLowerCase(),
      inviteStatus: 'active'
    });

    if (supplier) {
      // Generate reset token (using inviteToken field since it's meant for auth tokens)
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      supplier.inviteToken = resetToken;
      supplier.inviteTokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
      await supplier.save();

      // Send email
      await sendResetEmail(supplier.portalEmail, resetToken);
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

    const supplier = await Supplier.findOne({
      inviteToken: token,
      inviteTokenExpiry: { $gt: Date.now() },
      inviteStatus: 'active'
    });

    if (!supplier) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    supplier.portalPassword = password;
    supplier.inviteToken = null;
    supplier.inviteTokenExpiry = null;
    await supplier.save();

    res.status(200).json({ success: true, message: 'Password has been successfully reset' });
  } catch (error) {
    next(error);
  }
});

export default router;
