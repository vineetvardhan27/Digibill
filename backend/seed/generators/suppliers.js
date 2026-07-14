/**
 * Supplier Generator
 * Creates 130 suppliers distributed across users (~13 per user).
 * Financial fields (totalSpend, pendingAmount, totalBills, lastPurchaseDate)
 * are initialized to 0 and will be back-filled after bills are inserted.
 */

import mongoose from 'mongoose';
import { generatePhone } from '../utils/phoneGenerator.js';
import {
  CITIES,
  generateAddress,
  generateCompanyName,
  pick,
} from '../utils/companyGenerator.js';

/**
 * Generates an array of Supplier documents.
 * @param {Array} users — Array of user documents (need _id and location)
 * @param {number} count — Total number of suppliers (default 130)
 * @returns {Array} Array of supplier documents
 */
export function generateSuppliers(users, count = 130) {
  console.log(`  🔄 Generating ${count} suppliers across ${users.length} users...`);

  const suppliers = [];
  const perUser = Math.floor(count / users.length);
  let remaining = count - perUser * users.length;

  for (const user of users) {
    // Each user gets `perUser` suppliers, plus 1 extra until remainder is used up
    const userSupplierCount = perUser + (remaining > 0 ? 1 : 0);
    if (remaining > 0) remaining--;

    for (let i = 0; i < userSupplierCount; i++) {
      const cityObj = pick(CITIES);
      const inviteRoll = Math.random();

      suppliers.push({
        _id: new mongoose.Types.ObjectId(),
        name: generateCompanyName(),
        phone: generatePhone(),
        address: generateAddress(cityObj),
        createdBy: user._id,
        // Financial fields — will be back-filled after bill generation
        totalSpend: 0,
        pendingAmount: 0,
        totalBills: 0,
        lastPurchaseDate: null,
        isDeleted: false,
        inviteStatus: inviteRoll < 0.2 ? 'active' : inviteRoll < 0.5 ? 'invited' : 'not_invited',
        portalEnabled: inviteRoll < 0.2, // Only 'active' suppliers have portal
        portalEmail: inviteRoll < 0.2
          ? `supplier${suppliers.length + 1}@portal.dev`
          : undefined,
        createdAt: new Date(
          Date.now() - (Math.random() * 600 + 30) * 24 * 60 * 60 * 1000
        ),
        updatedAt: new Date(),
      });
    }
  }

  console.log(`  ✅ Generated ${suppliers.length} suppliers`);
  return suppliers;
}
