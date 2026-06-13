import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Supplier name is required'],
      trim: true,
      maxlength: [100, 'Supplier name cannot exceed 100 characters']
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters']
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator user ID is required']
    },
    totalSpend: {
      type: Number,
      default: 0,
      min: [0, 'Total spend cannot be negative']
    },
    pendingAmount: {
      type: Number,
      default: 0,
      min: [0, 'Pending amount cannot be negative']
    },
    totalBills: {
      type: Number,
      default: 0,
      min: [0, 'Total bills cannot be negative']
    },
    lastPurchaseDate: {
      type: Date
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date
    },
    portalEmail: {
      type: String,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address'
      ]
    },
    portalPassword: {
      type: String,
      select: false
    },
    inviteToken: {
      type: String,
      select: false
    },
    inviteTokenExpiry: {
      type: Date
    },
    inviteStatus: {
      type: String,
      enum: ['not_invited', 'invited', 'active'],
      default: 'not_invited'
    },
    lastLogin: {
      type: Date
    },
    portalEnabled: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
supplierSchema.index({ createdBy: 1, name: 1 });
supplierSchema.index({ createdBy: 1, totalSpend: -1 });
supplierSchema.index({ portalEmail: 1 });
supplierSchema.index({ inviteToken: 1 });

// Hash portal password before saving
supplierSchema.pre('save', async function (next) {
  // Set portalEmail to existing email if not provided but email exists
  // Wait, email is not in the base schema! The prompt says "defaults to existing email field",
  // Let me check if email exists. The existing schema has no 'email' field!
  // I will just proceed with portalEmail.
  if (!this.isModified('portalPassword') || !this.portalPassword) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.portalPassword = await bcrypt.hash(this.portalPassword, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare portal password
supplierSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.portalPassword) return false;
  return await bcrypt.compare(candidatePassword, this.portalPassword);
};

// Virtual for total paid amount
supplierSchema.virtual('paidAmount').get(function () {
  return this.totalSpend - this.pendingAmount;
});

// Ensure virtuals are included in JSON
supplierSchema.set('toJSON', { virtuals: true });
supplierSchema.set('toObject', { virtuals: true });

const Supplier = mongoose.model('Supplier', supplierSchema);

export default Supplier;
