/**
 * Connection Generator
 * Creates connections between Users (shop owners) and SupplierAccounts.
 * Respects the compound unique index: { shopOwnerId, supplierAccountId }.
 */

import mongoose from 'mongoose';
import { pick } from '../utils/companyGenerator.js';

const REQUEST_NOTES = [
  'Would like to connect for regular supply orders.',
  'Interested in your product catalog.',
  'Need a reliable supplier for my store.',
  'Looking for bulk pricing on FMCG products.',
  'Referred by another store owner.',
];

/**
 * Generates Connection documents.
 * @param {Array} users — User documents
 * @param {Array} supplierAccounts — SupplierAccount documents
 * @param {number} count — Target number of connections (default 40)
 * @returns {Array} Connection documents
 */
export function generateConnections(users, supplierAccounts, count = 40) {
  console.log(`  🔄 Generating ${count} connections...`);

  const connections = [];
  const usedPairs = new Set(); // Enforce unique (shopOwnerId, supplierAccountId)

  let attempts = 0;
  const maxAttempts = count * 5; // Safety valve to prevent infinite loops

  while (connections.length < count && attempts < maxAttempts) {
    attempts++;
    const user = pick(users);
    const supplierAccount = pick(supplierAccounts);
    const pairKey = `${user._id}-${supplierAccount._id}`;

    // Skip duplicate pairs
    if (usedPairs.has(pairKey)) continue;
    usedPairs.add(pairKey);

    const statusRoll = Math.random();
    let status, connectedAt, respondedAt;

    if (statusRoll < 0.55) {
      status = 'connected';
      respondedAt = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000);
      connectedAt = respondedAt;
    } else if (statusRoll < 0.75) {
      status = 'pending';
      respondedAt = undefined;
      connectedAt = undefined;
    } else if (statusRoll < 0.90) {
      status = 'rejected';
      respondedAt = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
      connectedAt = undefined;
    } else {
      status = 'disconnected';
      respondedAt = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000);
      connectedAt = undefined;
    }

    connections.push({
      _id: new mongoose.Types.ObjectId(),
      shopOwnerId: user._id,
      supplierAccountId: supplierAccount._id,
      status,
      initiatedBy: Math.random() > 0.5 ? 'shop' : 'supplier',
      requestNote: Math.random() > 0.4 ? pick(REQUEST_NOTES) : undefined,
      connectedAt,
      respondedAt,
      createdAt: new Date(Date.now() - Math.random() * 300 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    });
  }

  console.log(`  ✅ Generated ${connections.length} connections`);
  return connections;
}
