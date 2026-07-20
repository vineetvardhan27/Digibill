import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);

  // List all users
  const users = await mongoose.connection.db.collection('users')
    .find({}, { projection: { email: 1, name: 1, passwordHash: 1 } })
    .toArray();
  
  console.log(`=== USERS (${users.length} found) ===`);
  for (const u of users) {
    const matchDigibill = await bcrypt.compare('Digibill@123', u.passwordHash || '');
    console.log(`  ${u.email} | name: ${u.name} | pw matches Digibill@123: ${matchDigibill}`);
  }

  // List all supplier accounts
  const suppliers = await mongoose.connection.db.collection('supplieraccounts')
    .find({}, { projection: { email: 1, businessName: 1, password: 1 } })
    .toArray();
  
  console.log(`\n=== SUPPLIER ACCOUNTS (${suppliers.length} found) ===`);
  for (const s of suppliers) {
    const matchSupplier = s.password ? await bcrypt.compare('Supplier@123', s.password) : false;
    console.log(`  ${s.email} | biz: ${s.businessName} | pw matches Supplier@123: ${matchSupplier}`);
  }

  // Check all collection counts
  console.log('\n=== COLLECTION COUNTS ===');
  const colls = ['users', 'supplieraccounts', 'suppliers', 'connections', 'bills', 'reminderconfigs', 'reminderlogs', 'billdisputes', 'supplierinvoices'];
  for (const c of colls) {
    try {
      const count = await mongoose.connection.db.collection(c).countDocuments();
      console.log(`  ${c}: ${count}`);
    } catch (e) {
      console.log(`  ${c}: (not found)`);
    }
  }

  await mongoose.disconnect();
}

check().catch(console.error);
