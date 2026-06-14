import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env variables (assuming standard setup)
import dotenv from 'dotenv';
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

// Import models
import '../models/User.js';
import Supplier from '../models/Supplier.js';
import SupplierAccount from '../models/SupplierAccount.js';
import Connection from '../models/Connection.js';
import Bill from '../models/Bill.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const migrate = async () => {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');

  if (isDryRun) {
    console.log('=== DRY RUN MODE: No changes will be written to DB ===');
  } else {
    console.log('=== STARTING MIGRATION ===');
  }

  await connectDB();

  const session = await mongoose.startSession();
  
  if (!isDryRun) {
    session.startTransaction();
  }

  const mapping = {};
  const passwordResets = [];
  let migratedSuppliersCount = 0;
  let connectionsCreatedCount = 0;
  let billsUpdatedCount = 0;

  try {
    const suppliers = await Supplier.find({}).session(isDryRun ? null : session);
    console.log(`Found ${suppliers.length} old suppliers to process.`);

    for (const oldSupplier of suppliers) {
      const emailToUse = (oldSupplier.portalEmail || oldSupplier.email || `supplier_${oldSupplier._id}@placeholder.com`).toLowerCase();
      
      // Idempotency check
      const existingAccount = await SupplierAccount.findOne({ email: emailToUse }).session(isDryRun ? null : session);
      let supplierAccountId;

      if (existingAccount) {
        console.log(`Skipped SupplierAccount creation (already migrated or email exists): ${emailToUse}`);
        supplierAccountId = existingAccount._id;
      } else {
        const rawPassword = crypto.randomBytes(12).toString('hex');
        passwordResets.push(`Email: ${emailToUse} | Raw Password: ${rawPassword}`);
        
        // Actually generate salt and hash here instead of relying on pre-save (which might not trigger in some insertMany/create scenarios or to be safe)
        // Wait, SupplierAccount.create triggers pre-save, but since we are generating passwords, let's just let the schema handle it
        
        const newAccountData = {
          businessName: oldSupplier.name || 'Unknown Business',
          ownerName: oldSupplier.name || 'Unknown Owner',
          email: emailToUse,
          password: rawPassword,
          phone: oldSupplier.phone || '0000000000',
          category: 'Other',
          location: { city: '', state: '', pincode: '' },
          gstin: oldSupplier.gstin || undefined,
          isActive: oldSupplier.portalEnabled !== false,
          profileComplete: false
        };

        if (isDryRun) {
          console.log(`Would create SupplierAccount for ${emailToUse}`);
          supplierAccountId = new mongoose.Types.ObjectId();
        } else {
          const newAccount = new SupplierAccount(newAccountData);
          await newAccount.save({ session });
          supplierAccountId = newAccount._id;
        }
        migratedSuppliersCount++;
      }

      // Create connection
      let connectionId;
      const status = oldSupplier.inviteStatus === 'active' ? 'connected' : 'pending';
      const connectedAt = status === 'connected' ? oldSupplier.updatedAt : null;
      
      if (isDryRun) {
        console.log(`Would create Connection: Shop ${oldSupplier.userId} <-> SupplierAccount ${supplierAccountId} (Status: ${status})`);
        connectionId = new mongoose.Types.ObjectId();
      } else {
        const connection = new Connection({
          shopOwnerId: oldSupplier.userId,
          supplierAccountId: supplierAccountId,
          status: status,
          initiatedBy: 'shop',
          connectedAt: connectedAt
        });
        await connection.save({ session });
        connectionId = connection._id;
      }
      connectionsCreatedCount++;

      // Update Bills
      if (isDryRun) {
        const billsCount = await Bill.countDocuments({ supplierId: oldSupplier._id });
        console.log(`Would update ${billsCount} bills for old supplier ${oldSupplier._id}`);
        billsUpdatedCount += billsCount;
      } else {
        const result = await Bill.updateMany(
          { supplierId: oldSupplier._id },
          { $set: { connectionId: connectionId } },
          { session }
        );
        billsUpdatedCount += result.modifiedCount;
      }

      mapping[oldSupplier._id.toString()] = {
        supplierAccountId: supplierAccountId.toString(),
        connectionId: connectionId.toString()
      };
    }

    if (!isDryRun) {
      await session.commitTransaction();
      console.log('Transaction committed successfully.');

      // Write password resets
      fs.writeFileSync(
        path.join(__dirname, 'migration-password-resets.txt'),
        passwordResets.join('\n')
      );

      // Write mapping
      fs.writeFileSync(
        path.join(__dirname, 'migration-mapping.json'),
        JSON.stringify(mapping, null, 2)
      );
      
      console.log('Generated mapping files.');
    }

    console.log('\n=== MIGRATION SUMMARY ===');
    console.log(`Migrated ${migratedSuppliersCount} suppliers -> SupplierAccounts`);
    console.log(`${connectionsCreatedCount} connections created`);
    console.log(`${billsUpdatedCount} bills updated`);
    console.log('=========================\n');

  } catch (error) {
    console.error('Migration failed:', error);
    if (!isDryRun) {
      console.log('Rolling back transaction...');
      await session.abortTransaction();
    }
  } finally {
    session.endSession();
    mongoose.disconnect();
  }
};

migrate();
