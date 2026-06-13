import mongoose from 'mongoose';

const billDisputeSchema = new mongoose.Schema(
  {
    billId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bill',
      required: [true, 'Bill ID is required']
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier ID is required']
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner ID is required']
    },
    reason: {
      type: String,
      required: [true, 'Reason for dispute is required'],
      maxlength: [500, 'Reason cannot exceed 500 characters'],
      trim: true
    },
    status: {
      type: String,
      enum: ['open', 'resolved', 'rejected'],
      default: 'open'
    },
    supplierNote: {
      type: String,
      trim: true
    },
    ownerNote: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

// Prevent multiple open disputes for the same bill
billDisputeSchema.index({ billId: 1, status: 1 });
billDisputeSchema.index({ ownerId: 1, status: 1 });

const BillDispute = mongoose.model('BillDispute', billDisputeSchema);

export default BillDispute;
