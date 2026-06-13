import mongoose from 'mongoose';

const reminderLogSchema = new mongoose.Schema(
  {
    billId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bill',
      required: [true, 'Bill ID is required']
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    sentAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    channel: {
      type: String,
      required: [true, 'Channel is required'],
      enum: ['email', 'whatsapp']
    },
    status: {
      type: String,
      enum: {
        values: ['sent', 'failed'],
        message: 'Status must be sent or failed'
      },
      required: true
    },
    errorMessage: {
      type: String,
      trim: true
    },
    daysBefore: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast queries
reminderLogSchema.index({ userId: 1, sentAt: -1 });
reminderLogSchema.index({ billId: 1, daysBefore: 1, channel: 1 });

const ReminderLog = mongoose.model('ReminderLog', reminderLogSchema);

export default ReminderLog;
