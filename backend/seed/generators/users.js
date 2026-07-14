/**
 * User Generator
 * Creates 10 Kirana store owner accounts with realistic Indian data.
 * Passwords are pre-hashed to bypass the bcrypt pre-save middleware
 * for fast batch insertion via insertMany().
 */

import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { generatePhone } from '../utils/phoneGenerator.js';
import {
  CITIES,
  FIRST_NAMES,
  generateAddress,
  generateShopName,
  pick,
  pickN,
  SUPPLIER_CATEGORIES,
} from '../utils/companyGenerator.js';

const SURNAMES = [
  'Sharma', 'Gupta', 'Agarwal', 'Verma', 'Singh',
  'Patel', 'Jain', 'Bansal', 'Mehta', 'Kumar',
];

/**
 * Generates an array of user documents.
 * @param {number} count — Number of users to generate (default 10)
 * @returns {Promise<Array>} Array of user documents ready for insertMany()
 */
export async function generateUsers(count = 10) {
  console.log(`  🔄 Generating ${count} users...`);

  // Pre-hash the default password once (all seed users share the same password)
  const passwordHash = await bcrypt.hash('Digibill@123', 10);

  const users = [];

  for (let i = 0; i < count; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const surname = SURNAMES[i % SURNAMES.length];
    const cityObj = CITIES[i % CITIES.length];
    const name = `${firstName} ${surname}`;

    users.push({
      _id: new mongoose.Types.ObjectId(),
      name,
      email: `${firstName.toLowerCase()}.${surname.toLowerCase()}${i + 1}@digibill.dev`,
      phone: generatePhone(),
      shopName: generateShopName(surname),
      shopAddress: generateAddress(cityObj),
      passwordHash,
      supplierPortalEnabled: Math.random() > 0.3, // 70% have portal enabled
      location: {
        city: cityObj.city,
        state: cityObj.state,
      },
      categoriesOfInterest: pickN(SUPPLIER_CATEGORIES, Math.floor(Math.random() * 3) + 1),
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    });
  }

  console.log(`  ✅ Generated ${users.length} users`);
  return users;
}
