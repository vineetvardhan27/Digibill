import mongoose from 'mongoose';

const billDisputeSchema = new mongoose.Schema(
  {
    billId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bill',
      required: [true, 'Bill ID is required']
    },
    connectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Connection',
      required: [true, 'Connection ID is required']
    },
    // DEPRECATED: use connectionId.populate('supplierAccountId')
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: false
    },
    // DEPRECATED: use connectionId.populate('shopOwnerId')
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
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
