/* eslint-disable */
/**
 * cache-benchmark.js
 *
 * Hits GET /api/analytics/forecast twice for the same authenticated user
 * and prints cold (Mongo) vs warm (Redis) response times.
 *
 * Usage:
 *   1. Make sure the backend server is running (npm run dev / node server.js)
 *   2. Make sure Redis is running on localhost:6379
 *   3. Set AUTH_TOKEN below (or pass via env)
 *
 *   node scripts/cache-benchmark.js
 */

import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// ── Obtain a valid JWT token ────────────────────────────────────────────
// You can either hardcode a token here for a quick test, or set AUTH_TOKEN
// in your environment / .env file.
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';

if (!AUTH_TOKEN) {
  console.error(
    '❌  AUTH_TOKEN is required.\n' +
    '    Set it in .env or pass it directly:\n' +
    '    AUTH_TOKEN=<your-jwt> node scripts/cache-benchmark.js\n'
  );
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json'
};

// ── Helpers ─────────────────────────────────────────────────────────────
async function timedFetch(label, url) {
  const start = performance.now();
  const res = await fetch(url, { headers });
  const elapsed = (performance.now() - start).toFixed(2);
  const body = await res.json();

  console.log(`\n── ${label} ──`);
  console.log(`   Status : ${res.status}`);
  console.log(`   Time   : ${elapsed} ms`);
  console.log(`   Items  : ${body.data?.items?.length ?? 'N/A'}`);
  console.log(`   Confirmed total : ₹${body.data?.totalConfirmed ?? 'N/A'}`);
  console.log(`   Predicted total : ₹${body.data?.totalPredicted ?? 'N/A'}`);

  return { elapsed: parseFloat(elapsed), body };
}

// ── Flush the forecast cache so the first call is guaranteed cold ─────
async function flushForecastCache() {
  // We use a direct Redis call to ensure a clean cold start.
  // This import dynamically loads the same ioredis client the app uses.
  try {
    const { default: redis } = await import('../lib/redis.js');
    // We don't know the exact userId, but we can scan for forecast:* keys
    const stream = redis.scanStream({ match: 'forecast:*', count: 100 });
    let deleted = 0;
    for await (const keys of stream) {
      if (keys.length) {
        await redis.del(...keys);
        deleted += keys.length;
      }
    }
    console.log(`🧹 Flushed ${deleted} forecast cache key(s)`);
    // Don't disconnect — the client is shared and other code may need it
  } catch (err) {
    console.warn('⚠️  Could not flush forecast cache (Redis may not be running):', err.message);
  }
}

// ── Main ────────────────────────────────────────────────────────────────
async function main() {
  const forecastUrl = `${BASE_URL}/api/analytics/forecast?days=30`;

  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   Digibill Cache Benchmark — /api/forecast   ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`Target: ${forecastUrl}\n`);

  // Step 1 — flush any existing cache so hit #1 is a guaranteed cold read
  await flushForecastCache();

  // Step 2 — Cold request (Mongo)
  const cold = await timedFetch('COLD (Mongo)', forecastUrl);

  // Step 3 — Warm request (Redis)
  const warm = await timedFetch('WARM (Redis)', forecastUrl);

  // Step 4 — Summary
  const speedup = cold.elapsed / warm.elapsed;
  console.log('\n══════════════════════════════════════════════');
  console.log(`  Cold : ${cold.elapsed} ms`);
  console.log(`  Warm : ${warm.elapsed} ms`);
  console.log(`  Speed-up : ${speedup.toFixed(1)}×`);
  console.log('══════════════════════════════════════════════\n');

  process.exit(0);
}

main().catch(err => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
