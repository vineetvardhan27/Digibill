import mongoose from 'mongoose';

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
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
supplierSchema.index({ createdBy: 1, name: 1 });
supplierSchema.index({ createdBy: 1, totalSpend: -1 });

// Virtual for total paid amount
supplierSchema.virtual('paidAmount').get(function () {
  return this.totalSpend - this.pendingAmount;
});

// Ensure virtuals are included in JSON
supplierSchema.set('toJSON', { virtuals: true });
supplierSchema.set('toObject', { virtuals: true });

const Supplier = mongoose.model('Supplier', supplierSchema);

export default Supplier;
