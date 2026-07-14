/**
 * Bill Dispute Generator
 * Creates ~30 disputes linked to bills and connections.
 */

import mongoose from 'mongoose';
import { pick } from '../utils/companyGenerator.js';

const DISPUTE_REASONS = [
  'Amount mismatch in invoice',
  'Wrong items delivered',
  'Quantity does not match order',
  'GST calculation seems incorrect',
  'Damaged goods received',
  'Duplicate billing for same order',
  'Delivery date was different from invoice',
  'Price differs from agreed quote',
];

const SUPPLIER_NOTES = [
  'Reviewing the dispute. Will update shortly.',
  'Amount has been corrected in our system.',
  'We apologize for the error. Credit note issued.',
  'Please check the updated invoice.',
];

const OWNER_NOTES = [
  'Please verify the attached receipt.',
  'We have already paid the correct amount.',
  'Requesting a credit note for the difference.',
];

/**
 * Generates BillDispute documents.
 * @param {Array} bills — All bill documents
 * @param {Array} connections — Connection documents (only 'connected' ones)
 * @param {number} count — Target disputes (default 30)
 * @returns {Array} BillDispute documents
 */
export function generateDisputes(bills, connections, count = 30) {
  console.log(`  🔄 Generating ${count} bill disputes...`);

  // Only use connected connections for disputes
  const activeConnections = connections.filter((c) => c.status === 'connected');
  if (activeConnections.length === 0) {
    console.log('  ⚠️  No active connections found, skipping disputes');
    return [];
  }

  const disputes = [];
  const usedBillIds = new Set(); // Avoid multiple disputes on same bill

  let attempts = 0;
  while (disputes.length < count && attempts < count * 5) {
    attempts++;
    const bill = pick(bills);

    // Skip if bill already has a dispute
    if (usedBillIds.has(bill._id.toString())) continue;
    usedBillIds.add(bill._id.toString());

    const connection = pick(activeConnections);
    const statusRoll = Math.random();
    const status = statusRoll < 0.5 ? 'open' : statusRoll < 0.8 ? 'resolved' : 'rejected';

    disputes.push({
      _id: new mongoose.Types.ObjectId(),
      billId: bill._id,
      connectionId: connection._id,
      supplierId: bill.supplierId,
      ownerId: bill.createdBy,
      reason: pick(DISPUTE_REASONS),
      status,
      supplierNote: status !== 'open' ? pick(SUPPLIER_NOTES) : undefined,
      ownerNote: Math.random() > 0.5 ? pick(OWNER_NOTES) : undefined,
      createdAt: new Date(
        bill.date.getTime() + Math.random() * 15 * 24 * 60 * 60 * 1000
      ),
      updatedAt: new Date(),
    });
  }

  console.log(`  ✅ Generated ${disputes.length} bill disputes`);
  return disputes;
}
