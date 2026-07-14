/**
 * Supplier Account Generator
 * Creates independent supplier business accounts that connect to shop owners.
 * Passwords are pre-hashed for batch insertion via insertMany().
 */

import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { generatePhone } from '../utils/phoneGenerator.js';
import { generateGSTIN } from '../utils/gstGenerator.js';
import {
  CITIES,
  generateCompanyName,
  generateFullName,
  pick,
  SUPPLIER_CATEGORIES,
} from '../utils/companyGenerator.js';

const DESCRIPTIONS = [
  'Wholesale distributor serving retail stores across the region.',
  'Premium quality supplier with timely deliveries.',
  'Leading supplier of FMCG products in North India.',
  'Trusted partner for Kirana stores since 2005.',
  'Bulk supplier specializing in grains and pulses.',
  'Reliable supplier with competitive pricing.',
  'Family-owned distribution business with 20+ years experience.',
  'Quality-focused supplier with same-day delivery.',
];

/**
 * Generates an array of SupplierAccount documents.
 * @param {number} count — Number of supplier accounts (default 20)
 * @returns {Promise<Array>} Array of supplier account documents
 */
export async function generateSupplierAccounts(count = 20) {
  console.log(`  🔄 Generating ${count} supplier accounts...`);

  const password = await bcrypt.hash('Supplier@123', 10);
  const accounts = [];

  for (let i = 0; i < count; i++) {
    const businessName = generateCompanyName();
    const ownerName = generateFullName();
    const cityObj = pick(CITIES);
    const emailBase = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 15);

    accounts.push({
      _id: new mongoose.Types.ObjectId(),
      businessName,
      ownerName,
      email: `${emailBase}${i + 1}@supplier.dev`,
      password,
      phone: generatePhone(),
      category: pick(SUPPLIER_CATEGORIES),
      location: {
        city: cityObj.city,
        state: cityObj.state,
        pincode: `${cityObj.pin}${String(Math.floor(Math.random() * 100)).padStart(3, '0')}`,
      },
      gstin: Math.random() > 0.3 ? generateGSTIN(cityObj.city) : undefined, // 70% have GSTIN
      description: pick(DESCRIPTIONS),
      profileComplete: Math.random() > 0.2, // 80% complete
      isActive: Math.random() > 0.1, // 90% active
      lastLogin: Math.random() > 0.4
        ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        : undefined,
      createdAt: new Date(Date.now() - Math.random() * 500 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    });
  }

  console.log(`  ✅ Generated ${accounts.length} supplier accounts`);
  return accounts;
}
