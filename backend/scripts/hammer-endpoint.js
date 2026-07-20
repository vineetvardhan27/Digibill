/**
 * hammer-endpoint.js
 *
 * Fires 50 sequential requests at a target endpoint and logs each
 * response's status code plus any Retry-After header.
 *
 * Usage:
 *   node scripts/hammer-endpoint.js                          # defaults to /api/auth/login
 *   TARGET=/api/health node scripts/hammer-endpoint.js       # override endpoint
 *   REQUESTS=100 node scripts/hammer-endpoint.js             # override count
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const TARGET   = process.env.TARGET   || '/api/auth/login';
const REQUESTS = parseInt(process.env.REQUESTS || '50', 10);

const url = `${BASE_URL}${TARGET}`;

// POST with dummy body so the auth route actually processes the request
// (it will return 400 validation errors, but that still counts toward the limit)
const fetchOptions = {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'hammer@test.dev', password: 'x' }),
};

async function main() {
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║         Digibill Rate-Limit Hammer Test           ║');
  console.log('╚═══════════════════════════════════════════════════╝');
  console.log(`  Target   : ${url}`);
  console.log(`  Requests : ${REQUESTS}`);
  console.log(`  Method   : ${fetchOptions.method}`);
  console.log('');
  console.log('  #   Status   Retry-After   RateLimit-Remaining');
  console.log('  ─── ──────── ──────────── ────────────────────');

  let first429 = null;

  for (let i = 1; i <= REQUESTS; i++) {
    try {
      const res = await fetch(url, fetchOptions);

      const retryAfter = res.headers.get('retry-after') || '—';
      const remaining  = res.headers.get('ratelimit-remaining') || '—';
      const status     = res.status;

      const tag = status === 429 ? ' ← 🛑 RATE LIMITED' : '';
      console.log(
        `  ${String(i).padStart(3)}   ${status}      ${String(retryAfter).padStart(6)}          ${String(remaining).padStart(5)}${tag}`
      );

      if (status === 429 && !first429) {
        first429 = i;
      }
    } catch (err) {
      console.log(`  ${String(i).padStart(3)}   ERR   ${err.message}`);
    }
  }

  console.log('');
  console.log('══════════════════════════════════════════════════════');
  if (first429) {
    console.log(`  ✅ First 429 at request #${first429} (auth limiter max = 10)`);
  } else {
    console.log('  ℹ️  No 429 received — limit was not reached.');
    console.log('     (Global limiter allows 200 reqs/15 min; auth allows 10.)');
  }
  console.log('══════════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('Hammer test failed:', err);
  process.exit(1);
});
