import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Import User model
  const User = (await import('../models/User.js')).default;
  const SupplierAccount = (await import('../models/SupplierAccount.js')).default;

  // Try inserting a single test user
  const passwordHash = await bcrypt.hash('Digibill@123', 10);
  console.log('Generated hash:', passwordHash);

  try {
    const result = await User.insertMany([{
      _id: new mongoose.Types.ObjectId(),
      name: 'Test User',
      email: 'test.user@digibill.test',
      phone: '9876543210',
      shopName: 'Test Shop',
      shopAddress: '123, Test Road, Delhi - 110001',
      passwordHash: passwordHash,
      supplierPortalEnabled: false,
      location: { city: 'Delhi', state: 'Delhi' },
      categoriesOfInterest: ['Groceries & FMCG'],
      createdAt: new Date(),
      updatedAt: new Date(),
    }]);
    console.log('User insertMany result:', result.length, 'docs inserted');
    console.log('Inserted user _id:', result[0]._id);
  } catch (err) {
    console.error('User insertMany FAILED:', err.message);
    if (err.writeErrors) {
      err.writeErrors.forEach(e => console.error('  Write error:', e.errmsg));
    }
  }

  // Verify user was actually inserted
  const count = await User.countDocuments();
  console.log('User count after insert:', count);

  // Check raw collection
  const rawCount = await mongoose.connection.db.collection('users').countDocuments();
  console.log('Raw users collection count:', rawCount);

  // Try reading it back
  const user = await mongoose.connection.db.collection('users').findOne({ email: 'test.user@digibill.test' });
  console.log('Found user:', user ? user.email : 'NOT FOUND');

  // Clean up
  await mongoose.connection.db.collection('users').deleteMany({ email: 'test.user@digibill.test' });
  
  await mongoose.disconnect();
}

test().catch(console.error);
