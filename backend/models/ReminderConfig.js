import mongoose from 'mongoose';

const reminderConfigSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true
    },
    channel: {
      type: String,
      enum: {
        values: ['email', 'whatsapp', 'both'],
        message: 'Channel must be email, whatsapp, or both'
      },
      default: 'email'
    },
    emailAddress: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    whatsappNumber: {
      type: String,
      trim: true,
      match: [/^\+[1-9]\d{6,14}$/, 'Please provide a valid E.164 phone number (e.g. +919876543210)']
    },
    reminderDaysBefore: {
      type: [Number],
      default: [3, 1],
      validate: {
        validator: function (arr) {
          return arr.length > 0 && arr.every(n => Number.isInteger(n) && n >= 0 && n <= 30);
        },
        message: 'reminderDaysBefore must be an array of integers between 0 and 30'
      }
    },
    enabled: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Index for quick lookups by userId (already indexed by unique: true)
// removed duplicate: reminderConfigSchema.index({ userId: 1 });

// Validate that appropriate contact info is provided for the selected channel
reminderConfigSchema.pre('validate', function (next) {
  if ((this.channel === 'email' || this.channel === 'both') && !this.emailAddress) {
    this.invalidate('emailAddress', 'Email address is required when channel is email or both');
  }
  if ((this.channel === 'whatsapp' || this.channel === 'both') && !this.whatsappNumber) {
    this.invalidate('whatsappNumber', 'WhatsApp number is required when channel is whatsapp or both');
  }
  next();
});

const ReminderConfig = mongoose.model('ReminderConfig', reminderConfigSchema);

export default ReminderConfig;
