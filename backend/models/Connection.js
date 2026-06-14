import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema(
  {
    shopOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    supplierAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupplierAccount',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'connected', 'rejected', 'disconnected'],
      default: 'pending'
    },
    initiatedBy: {
      type: String,
      enum: ['shop', 'supplier'],
      required: true
    },
    requestNote: {
      type: String,
      maxlength: 300
    },
    shopNotes: {
      type: String,
      maxlength: 1000
    },
    connectedAt: {
      type: Date
    },
    respondedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index on { shopOwnerId, supplierAccountId }
connectionSchema.index({ shopOwnerId: 1, supplierAccountId: 1 }, { unique: true });

const Connection = mongoose.model('Connection', connectionSchema);

export default Connection;
