import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const supplierAccountSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true
    },
    ownerName: {
      type: String,
      required: [true, 'Owner name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address'
      ]
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    category: {
      type: String,
      enum: [
        'Vegetables & Produce',
        'Groceries & FMCG',
        'Packaging',
        'Electronics',
        'Stationery',
        'Furniture',
        'Textiles',
        'Hardware',
        'Food & Beverages',
        'Other'
      ]
    },
    location: {
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true }
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
      match: [
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1}$/,
        'Please provide a valid GSTIN format'
      ]
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    profileComplete: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date
    },
    resetToken: {
      type: String,
      select: false
    },
    resetTokenExpiry: {
      type: Date,
      select: false
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
supplierAccountSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
supplierAccountSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive data from JSON response
supplierAccountSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetToken;
  delete obj.resetTokenExpiry;
  return obj;
};

const SupplierAccount = mongoose.model('SupplierAccount', supplierAccountSchema);

export default SupplierAccount;
