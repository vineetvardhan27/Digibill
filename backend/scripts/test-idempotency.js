/**
 * test-idempotency.js
 * 
 * Verifies that the Idempotency Middleware correctly caches and replays
 * successful responses. 
 * 
 * Usage:
 *   1. Ensure the server is running (npm run dev)
 *   2. Ensure Redis is running (localhost:6379)
 *   3. Set AUTH_TOKEN or pass it via env
 *   
 *   AUTH_TOKEN=<jwt> node scripts/test-idempotency.js
 */

import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';

if (!AUTH_TOKEN) {
  console.error(
    '❌  AUTH_TOKEN is required.\n' +
    '    Set it in .env or pass it directly:\n' +
    '    AUTH_TOKEN=<your-jwt> node scripts/test-idempotency.js\n'
  );
  process.exit(1);
}

const url = `${BASE_URL}/api/reminders/test`;
const idempotencyKey = `test-key-${Date.now()}`;

const headers = {
  Authorization: `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json',
  'Idempotency-Key': idempotencyKey
};

async function timedFetch(label) {
  const start = performance.now();
  const res = await fetch(url, { method: 'POST', headers });
  const elapsed = (performance.now() - start).toFixed(2);
  
  let body;
  try {
    body = await res.json();
  } catch {
    body = await res.text();
  }

  const isIdempotent = res.headers.has('x-idempotent-response');

  console.log(`\n── ${label} ──`);
  console.log(`   Status     : ${res.status}`);
  console.log(`   Time       : ${elapsed} ms`);
  console.log(`   Cached Hit : ${isIdempotent ? '✅ YES' : '❌ NO'}`);
  console.log(`   Response   : ${JSON.stringify(body).slice(0, 100)}...`);

  return { status: res.status, body, isIdempotent };
}

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║       Digibill Idempotency Middleware        ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`Targeting: POST ${url}`);
  console.log(`Using Key: ${idempotencyKey}\n`);

  console.log('Firing Request 1 (Expect cache MISS - actual execution)');
  const req1 = await timedFetch('REQUEST 1');
  
  if (req1.status >= 400) {
    console.error('\n⚠️  Request 1 failed. The idempotency middleware only caches 2xx responses.');
    console.error('   Please fix the underlying error (e.g., config missing) and retry.');
    process.exit(1);
  }

  console.log('\nWaiting 1 second before retrying...\n');
  await new Promise(r => setTimeout(r, 1000));

  console.log('Firing Request 2 (Expect cache HIT - immediate return)');
  const req2 = await timedFetch('REQUEST 2');

  console.log('\n══════════════════════════════════════════════');
  if (req2.isIdempotent && JSON.stringify(req1.body) === JSON.stringify(req2.body)) {
    console.log('✅ TEST PASSED');
    console.log('   The second request was intercepted by Redis and returned the exact same payload.');
  } else {
    console.log('❌ TEST FAILED');
    if (!req2.isIdempotent) console.log('   The second request did not include X-Idempotent-Response header.');
    if (JSON.stringify(req1.body) !== JSON.stringify(req2.body)) console.log('   The response payloads did not match.');
  }
  console.log('══════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
