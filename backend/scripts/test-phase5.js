/**
 * test-phase5.js
 * 
 * Verifies that:
 * 1. A new standard signup gets emailVerified: false and gets a 403 on POST /api/bills
 * 2. A simulated Google Auth signup gets emailVerified: true and gets a 201 (or 400 validation error, but NOT 403) on POST /api/bills
 */
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/digibill';

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║       Digibill Phase 5 Verification          ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  // Connect to DB to insert a mock Google user
  await mongoose.connect(MONGODB_URI);
  
  // Clean up previous test runs
  await User.deleteMany({ email: { $in: ['test-standard@example.com', 'test-google@example.com'] } });

  // 1. Test Standard Signup
  console.log('── Testing Standard Signup ──');
  const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Standard User',
      email: 'test-standard@example.com',
      password: 'password123',
      phone: '1234567890'
    })
  });
  const registerData = await registerRes.json();
  const standardToken = registerData.data.token;
  
  console.log(`Standard User emailVerified: ${registerData.data.user.emailVerified}`);
  
  const billRes1 = await fetch(`${BASE_URL}/api/bills`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${standardToken}`
    },
    body: JSON.stringify({ amount: 100 }) // invalid body, but auth happens first
  });
  
  console.log(`POST /api/bills Status: ${billRes1.status}`);
  if (billRes1.status === 403) {
    console.log('✅ Standard user correctly blocked (403)');
  } else {
    console.log('❌ Standard user NOT blocked');
  }

  // 2. Test Simulated Google Signup
  console.log('\n── Testing Google Signup ──');
  // We mock the DB state directly since we can't mint a valid Google ID token
  const googleUser = new User({
    name: 'Google User',
    email: 'test-google@example.com',
    googleId: 'google-123',
    emailVerified: true
  });
  await googleUser.save();
  
  const googleToken = jwt.sign({ id: googleUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
  const billRes2 = await fetch(`${BASE_URL}/api/bills`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${googleToken}`
    },
    body: JSON.stringify({ amount: 100 }) // Invalid body to trigger 400 validation error, not 403
  });
  
  console.log(`POST /api/bills Status: ${billRes2.status}`);
  if (billRes2.status === 400) {
    console.log('✅ Google user passed email verification and reached validation layer (400)');
  } else if (billRes2.status === 403) {
    console.log('❌ Google user incorrectly blocked (403)');
  } else {
    console.log(`⚠️ Unexpected status: ${billRes2.status}`);
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
