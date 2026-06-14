import mongoose from 'mongoose';

const supplierInvoiceSchema = new mongoose.Schema(
  {
    billId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bill'
      // Optional: supplier may upload without linking
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
    fileUrl: {
      type: String,
      required: [true, 'File URL is required']
    },
    fileName: {
      type: String,
      required: [true, 'File name is required']
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true
    }
  },
  { 
    timestamps: true 
  }
);

supplierInvoiceSchema.index({ supplierId: 1, createdAt: -1 });
supplierInvoiceSchema.index({ billId: 1 });

const SupplierInvoice = mongoose.model('SupplierInvoice', supplierInvoiceSchema);

export default SupplierInvoice;
