import mongoose from 'mongoose';

const billItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Item description is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Item quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Item unit price is required'],
    min: [0, 'Price cannot be negative']
  },
  hsnCode: {
    type: String,
    trim: true,
    maxlength: 8
  },
  gstRate: {
    type: Number,
    enum: [0, 5, 12, 18, 28],
    default: 0
  },
  gstType: {
    type: String,
    enum: ['IGST', 'CGST_SGST'],
    default: 'CGST_SGST'
  },
  // Computed fields (stored)
  taxableAmount: { type: Number, default: 0 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 }
}, { _id: true });

const billSchema = new mongoose.Schema(
  {
    connectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Connection'
    },
    supplierId: {
      // DEPRECATED: use connectionId.populate('supplierAccountId') instead. Kept for migration rollback safety.
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: false
    },
    amount: {
      type: Number,
      required: [true, 'Bill amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    date: {
      type: Date,
      default: Date.now,
      required: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    dueDate: {
      type: Date
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator user ID is required']
    },
    items: {
      type: [billItemSchema],
      default: []
    },
    // Bill-level computed fields
    subtotal: { type: Number, default: 0 },
    totalCGST: { type: Number, default: 0 },
    totalSGST: { type: Number, default: 0 },
    totalIGST: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    imageUrl: {
      type: String,
      trim: true
    },
    paidDate: {
      type: Date
    },
    acknowledgedBySupplier: {
      type: Boolean,
      default: false
    },
    acknowledgedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Indexes for faster queries
billSchema.index({ createdBy: 1, date: -1 });
billSchema.index({ supplierId: 1, isPaid: 1 });
billSchema.index({ createdBy: 1, isPaid: 1 });
billSchema.index({ dueDate: 1, isPaid: 1 });

// Virtual for checking if bill is overdue
billSchema.virtual('isOverdue').get(function () {
  if (this.isPaid || !this.dueDate) {
    return false;
  }
  return new Date() > this.dueDate;
});

// Virtual for days until due
billSchema.virtual('daysUntilDue').get(function () {
  if (this.isPaid || !this.dueDate) {
    return null;
  }
  const diffTime = this.dueDate - new Date();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Ensure virtuals are included in JSON
billSchema.set('toJSON', { virtuals: true });
billSchema.set('toObject', { virtuals: true });

// Middleware to calculate GST line item and bill totals before saving
billSchema.pre('save', function(next) {
  let subtotal = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;

  if (this.items && this.items.length > 0) {
    this.items.forEach(item => {
      // Calculate taxable amount
      item.taxableAmount = Number((item.quantity * item.unitPrice).toFixed(2));
      
      // Calculate taxes
      if (item.gstType === 'CGST_SGST') {
        const halfRate = item.gstRate / 2;
        item.cgst = Number((item.taxableAmount * (halfRate / 100)).toFixed(2));
        item.sgst = Number((item.taxableAmount * (halfRate / 100)).toFixed(2));
        item.igst = 0;
      } else if (item.gstType === 'IGST') {
        item.cgst = 0;
        item.sgst = 0;
        item.igst = Number((item.taxableAmount * (item.gstRate / 100)).toFixed(2));
      }

      // Calculate line item total
      item.totalAmount = Number((item.taxableAmount + item.cgst + item.sgst + item.igst).toFixed(2));

      // Add to bill totals
      subtotal += item.taxableAmount;
      totalCGST += item.cgst;
      totalSGST += item.sgst;
      totalIGST += item.igst;
    });
  }

  this.subtotal = Number(subtotal.toFixed(2));
  this.totalCGST = Number(totalCGST.toFixed(2));
  this.totalSGST = Number(totalSGST.toFixed(2));
  this.totalIGST = Number(totalIGST.toFixed(2));
  this.grandTotal = Number((subtotal + totalCGST + totalSGST + totalIGST).toFixed(2));

  // Also sync legacy `amount` field to grandTotal to preserve backward compatibility in other parts of the app
  this.amount = this.grandTotal;

  next();
});

// Middleware to update supplier stats when bill is saved
billSchema.post('save', async function (doc) {
  try {
    const Supplier = mongoose.model('Supplier');
    const Bill = mongoose.model('Bill');
    
    // Get all bills for this supplier
    const bills = await Bill.find({ supplierId: doc.supplierId });
    
    // Calculate totals
    const totalSpend = bills.reduce((sum, bill) => sum + bill.amount, 0);
    const pendingAmount = bills
      .filter(bill => !bill.isPaid)
      .reduce((sum, bill) => sum + bill.amount, 0);
    const totalBills = bills.length;
    const lastPurchaseDate = bills.length > 0 
      ? bills.sort((a, b) => b.date - a.date)[0].date 
      : null;
    
    // Update supplier
    await Supplier.findByIdAndUpdate(doc.supplierId, {
      totalSpend,
      pendingAmount,
      totalBills,
      lastPurchaseDate
    });
  } catch (error) {
    console.error('Error updating supplier stats:', error);
  }
});

// Middleware to update supplier stats when bill is deleted
billSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    try {
      const Supplier = mongoose.model('Supplier');
      const Bill = mongoose.model('Bill');
      
      const bills = await Bill.find({ supplierId: doc.supplierId });
      
      const totalSpend = bills.reduce((sum, bill) => sum + bill.amount, 0);
      const pendingAmount = bills
        .filter(bill => !bill.isPaid)
        .reduce((sum, bill) => sum + bill.amount, 0);
      const totalBills = bills.length;
      const lastPurchaseDate = bills.length > 0 
        ? bills.sort((a, b) => b.date - a.date)[0].date 
        : null;
      
      await Supplier.findByIdAndUpdate(doc.supplierId, {
        totalSpend,
        pendingAmount,
        totalBills,
        lastPurchaseDate
      });
    } catch (error) {
      console.error('Error updating supplier stats:', error);
    }
  }
});

const Bill = mongoose.model('Bill', billSchema);

export default Bill;
