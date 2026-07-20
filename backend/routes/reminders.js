import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';
import ReminderConfig from '../models/ReminderConfig.js';
import ReminderLog from '../models/ReminderLog.js';
import reminderService from '../services/reminderService.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// ─── GET /api/reminders/config ──────────────────────────────────────────────
// Get the current user's reminder configuration
router.get('/config', async (req, res) => {
  try {
    const config = await ReminderConfig.findOne({ userId: req.user._id });

    if (!config) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No reminder configuration found. Create one to get started.'
      });
    }

    res.status(200).json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error fetching reminder config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reminder configuration'
    });
  }
});

// ─── POST /api/reminders/config ─────────────────────────────────────────────
// Create or update the current user's reminder configuration (upsert)
router.post('/config', async (req, res) => {
  try {
    const { channel, emailAddress, whatsappNumber, reminderDaysBefore, enabled } = req.body;

    const updateData = {};
    if (channel !== undefined) updateData.channel = channel;
    if (emailAddress !== undefined) updateData.emailAddress = emailAddress;
    if (whatsappNumber !== undefined) updateData.whatsappNumber = whatsappNumber;
    if (reminderDaysBefore !== undefined) updateData.reminderDaysBefore = reminderDaysBefore;
    if (enabled !== undefined) updateData.enabled = enabled;

    const config = await ReminderConfig.findOneAndUpdate(
      { userId: req.user._id },
      { ...updateData, userId: req.user._id },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    res.status(200).json({
      success: true,
      data: config,
      message: 'Reminder configuration saved successfully'
    });
  } catch (error) {
    console.error('Error saving reminder config:', error);

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to save reminder configuration'
    });
  }
});

// ─── GET /api/reminders/logs ────────────────────────────────────────────────
// Get the last 50 reminder logs for the current user
router.get('/logs', async (req, res) => {
  try {
    const logs = await ReminderLog.find({ userId: req.user._id })
      .sort({ sentAt: -1 })
      .limit(50)
      .populate({
        path: 'billId',
        select: 'amount dueDate description',
        populate: {
          path: 'supplierId',
          select: 'name'
        }
      })
      .lean();

    res.status(200).json({
      success: true,
      data: logs,
      count: logs.length
    });
  } catch (error) {
    console.error('Error fetching reminder logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reminder logs'
    });
  }
});

// ─── POST /api/reminders/test ───────────────────────────────────────────────
// Send a test reminder to verify the user's config (not logged)
router.post('/test', authMiddleware, idempotencyMiddleware, async (req, res) => {
  try {
    const result = await reminderService.sendTestReminder(req.user._id);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error sending test reminder:', error);

    // Distinguish config errors from send failures
    const statusCode = error.message.includes('No reminder configuration') ||
                       error.message.includes('disabled')
      ? 400
      : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to send test reminder'
    });
  }
});

export default router;
