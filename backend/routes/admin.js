import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { reminderQueue } from '../jobs/queues/reminderQueue.js';
import FailedReminder from '../models/FailedReminder.js';

const router = express.Router();

// @route   GET /api/admin/queue-status
// @desc    Get BullMQ queue status and dead letter counts
// @access  Private
router.get('/queue-status', authMiddleware, async (req, res) => {
  try {
    const jobCounts = await reminderQueue.getJobCounts();
    const failedReminderCount = await FailedReminder.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        queue: {
          name: reminderQueue.name,
          counts: jobCounts
        },
        deadLetterLog: {
          count: failedReminderCount
        }
      }
    });
  } catch (error) {
    console.error('Queue status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching queue status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
