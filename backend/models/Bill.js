import mongoose from 'mongoose';

const billItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Item quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  price: {
    type: Number,
    required: [true, 'Item price is required'],
    min: [0, 'Price cannot be negative']
  },
  unit: {
    type: String,
    trim: true,
    default: 'unit'
  }
}, { _id: true });

const billSchema = new mongoose.Schema(
  {
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier ID is required']
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
    imageUrl: {
      type: String,
      trim: true
    },
    paidDate: {
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
