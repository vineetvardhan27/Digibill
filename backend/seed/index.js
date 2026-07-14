/**
 * DigiBill Database Seeder — Main Entry Point
 *
 * Connects to MongoDB, clears existing data, generates realistic
 * Indian business data, and inserts everything in dependency order.
 *
 * Usage:   npm run seed
 * Config:  Reads MONGODB_URI from .env
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env from backend root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// ─── Import Generators ───────────────────────────────────────────────────────
import { generateUsers } from './generators/users.js';
import { generateSupplierAccounts } from './generators/supplierAccounts.js';
import { generateSuppliers } from './generators/suppliers.js';
import { generateConnections } from './generators/connections.js';
import { generateBills, computeSupplierStats } from './generators/bills.js';
import { generateReminderConfigs, generateReminderLogs } from './generators/reminders.js';
import { generateDisputes } from './generators/disputes.js';
import { generateSupplierInvoices } from './generators/supplierInvoices.js';
import { estimateStorage } from './estimateStorage.js';

// ─── Configuration ───────────────────────────────────────────────────────────
const BATCH_SIZE = 500; // Documents per insertMany() call

/**
 * Inserts documents in batches to avoid memory spikes.
 * @param {mongoose.Model} Model — Mongoose model
 * @param {Array} docs — Array of plain objects
 * @param {string} label — Collection label for logging
 */
async function batchInsert(Model, docs, label) {
  if (!docs || docs.length === 0) {
    console.log(`  ⏭️  Skipping ${label} (0 documents)`);
    return;
  }

  const totalBatches = Math.ceil(docs.length / BATCH_SIZE);
  let inserted = 0;

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = docs.slice(i, i + BATCH_SIZE);
    try {
      await Model.insertMany(batch, { ordered: false });
      inserted += batch.length;
    } catch (err) {
      // With ordered:false, some docs may succeed even if others fail
      if (err.insertedDocs) {
        inserted += err.insertedDocs.length;
      }
      console.error(`  ⚠️  ${label} batch error: ${err.message}`);
      if (err.writeErrors) {
        err.writeErrors.slice(0, 3).forEach((e) =>
          console.error(`     → ${e.errmsg || e.err?.errmsg || 'Unknown error'}`)
        );
      }
    }
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    if (totalBatches > 1) {
      console.log(`    📦 ${label}: batch ${batchNum}/${totalBatches} (${inserted}/${docs.length})`);
    }
  }

  console.log(`  ✅ Inserted ${inserted} ${label}`);
}

/**
 * Clears all seeded collections.
 */
async function clearCollections() {
  console.log('\n🧹 Clearing existing collections...');

  const collections = [
    'users', 'supplieraccounts', 'suppliers', 'connections',
    'bills', 'reminderconfigs', 'reminderlogs',
    'billdisputes', 'supplierinvoices',
  ];

  for (const name of collections) {
    try {
      await mongoose.connection.db.collection(name).deleteMany({});
      console.log(`  🗑️  Cleared ${name}`);
    } catch (err) {
      // Collection might not exist yet — that's fine
      console.log(`  ⏭️  ${name} (not found or already empty)`);
    }
  }
}

/**
 * Main seeding function.
 */
async function seed() {
  const startTime = Date.now();

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║           🌱 DigiBill Database Seeder                    ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  // ─── Connect to MongoDB ──────────────────────────────────────────────────
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env file');
    process.exit(1);
  }

  console.log('\n🔌 Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log(`✅ Connected to: ${mongoose.connection.host}`);

  // ─── Import Models (after connection) ────────────────────────────────────
  const User = (await import('../models/User.js')).default;
  const SupplierAccount = (await import('../models/SupplierAccount.js')).default;
  const Supplier = (await import('../models/Supplier.js')).default;
  const Connection = (await import('../models/Connection.js')).default;
  const Bill = (await import('../models/Bill.js')).default;
  const ReminderConfig = (await import('../models/ReminderConfig.js')).default;
  const ReminderLog = (await import('../models/ReminderLog.js')).default;
  const BillDispute = (await import('../models/BillDispute.js')).default;
  const SupplierInvoice = (await import('../models/SupplierInvoice.js')).default;

  try {
    // ─── Step 1: Generate All Data ───────────────────────────────────────
    console.log('\n📝 PHASE 1: Generating data...\n');

    const users = await generateUsers(10);
    const supplierAccounts = await generateSupplierAccounts(20);
    const suppliers = generateSuppliers(users, 130);
    const connections = generateConnections(users, supplierAccounts, 40);
    const { bills, billsBySupplier } = generateBills(suppliers, connections, 2800);
    const reminderConfigs = generateReminderConfigs(users);
    const reminderLogs = generateReminderLogs(bills, users, 150);
    const disputes = generateDisputes(bills, connections, 30);
    const supplierInvoices = generateSupplierInvoices(bills, connections, 50);

    // ─── Step 2: Estimate Storage ────────────────────────────────────────
    console.log('\n📊 PHASE 2: Estimating storage...');

    const { shouldAbort, totalMB } = estimateStorage({
      Users: users,
      SupplierAccounts: supplierAccounts,
      Suppliers: suppliers,
      Connections: connections,
      Bills: bills,
      ReminderConfigs: reminderConfigs,
      ReminderLogs: reminderLogs,
      BillDisputes: disputes,
      SupplierInvoices: supplierInvoices,
    });

    if (shouldAbort) {
      console.error('⛔ Storage estimate exceeds 300 MB. Aborting to protect Atlas Free Tier.');
      process.exit(1);
    }

    // ─── Step 3: Clear Existing Data ─────────────────────────────────────
    await clearCollections();

    // ─── Step 4: Insert in Dependency Order ──────────────────────────────
    console.log('\n📥 PHASE 3: Inserting data...\n');

    // 4a. Users (no dependencies)
    await batchInsert(User, users, 'Users');

    // 4b. SupplierAccounts (no dependencies)
    await batchInsert(SupplierAccount, supplierAccounts, 'SupplierAccounts');

    // 4c. Suppliers (depends on Users)
    await batchInsert(Supplier, suppliers, 'Suppliers');

    // 4d. Connections (depends on Users + SupplierAccounts)
    await batchInsert(Connection, connections, 'Connections');

    // 4e. Bills (depends on Suppliers + Users)
    await batchInsert(Bill, bills, 'Bills');

    // 4f. Back-fill supplier financial stats from bills
    console.log('\n  🔄 Back-filling supplier stats from bills...');
    let statsUpdated = 0;
    for (const supplier of suppliers) {
      const supplierBills = billsBySupplier.get(supplier._id.toString()) || [];
      const stats = computeSupplierStats(supplierBills);
      await Supplier.updateOne({ _id: supplier._id }, { $set: stats });
      statsUpdated++;
    }
    console.log(`  ✅ Updated stats for ${statsUpdated} suppliers`);

    // 4g. ReminderConfigs (depends on Users)
    await batchInsert(ReminderConfig, reminderConfigs, 'ReminderConfigs');

    // 4h. ReminderLogs (depends on Bills + Users)
    await batchInsert(ReminderLog, reminderLogs, 'ReminderLogs');

    // 4i. BillDisputes (depends on Bills + Connections)
    await batchInsert(BillDispute, disputes, 'BillDisputes');

    // 4j. SupplierInvoices (depends on Bills + Connections)
    await batchInsert(SupplierInvoice, supplierInvoices, 'SupplierInvoices');

    // ─── Step 5: Final Statistics ────────────────────────────────────────
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const totalItems = bills.reduce((sum, b) => sum + b.items.length, 0);

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║           📊 SEEDING COMPLETE — FINAL STATS              ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log(`║  Users:              ${String(users.length).padStart(7)}                            ║`);
    console.log(`║  Supplier Accounts:  ${String(supplierAccounts.length).padStart(7)}                            ║`);
    console.log(`║  Suppliers:          ${String(suppliers.length).padStart(7)}                            ║`);
    console.log(`║  Connections:        ${String(connections.length).padStart(7)}                            ║`);
    console.log(`║  Bills:              ${String(bills.length).padStart(7)}                            ║`);
    console.log(`║  Bill Items (embed): ${String(totalItems).padStart(7)}                            ║`);
    console.log(`║  Reminder Configs:   ${String(reminderConfigs.length).padStart(7)}                            ║`);
    console.log(`║  Reminder Logs:      ${String(reminderLogs.length).padStart(7)}                            ║`);
    console.log(`║  Bill Disputes:      ${String(disputes.length).padStart(7)}                            ║`);
    console.log(`║  Supplier Invoices:  ${String(supplierInvoices.length).padStart(7)}                            ║`);
    console.log('║                                                          ║');
    console.log(`║  Est. storage:       ${String(totalMB + ' MB').padStart(10)}                       ║`);
    console.log(`║  Time elapsed:       ${String(elapsed + 's').padStart(10)}                       ║`);
    console.log('║                                                          ║');
    console.log('║  🔑 Test credentials:                                    ║');
    console.log('║     Users:    <email>  /  Digibill@123                   ║');
    console.log('║     Supplier: <email>  /  Supplier@123                   ║');
    console.log('╚══════════════════════════════════════════════════════════╝');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    throw error;
  } finally {
    // ─── Clean Disconnect ──────────────────────────────────────────────────
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB connection closed.');
  }
}

// ─── Run ─────────────────────────────────────────────────────────────────────
seed().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
