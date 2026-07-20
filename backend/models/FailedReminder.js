import mongoose from 'mongoose';

const failedReminderSchema = new mongoose.Schema({
  jobId: {
    type: String,
    required: true,
    index: true
  },
  payload: {
    type: Object,
    required: true
  },
  errorMessage: {
    type: String,
    required: true
  },
  attemptCount: {
    type: Number,
    required: true
  },
  failedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

const FailedReminder = mongoose.model('FailedReminder', failedReminderSchema);
export default FailedReminder;
