/**
 * Rate Limiting Middleware
 * Three tiers of rate limiting for different API surface areas.
 * All limiters return JSON responses matching the app's standard format.
 *
 * Store selection is controlled by the RATE_LIMIT_STORE env var:
 *   "redis"  (default) — uses the shared ioredis client via rate-limit-redis
 *   "memory" — falls back to the built-in in-memory store
 */

import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import dotenv from 'dotenv';
import redis from '../lib/redis.js';

dotenv.config();

// ─── Store Factory ──────────────────────────────────────────────────────────
const useRedis = (process.env.RATE_LIMIT_STORE || 'redis') === 'redis';

/**
 * Create a RedisStore bound to the shared ioredis client.
 * Each limiter gets its own prefix so the counters don't collide.
 */
function makeStore(prefix) {
  if (!useRedis) return undefined; // express-rate-limit uses its built-in MemoryStore

  return new RedisStore({
    sendCommand: (...args) => {
      // Timeout after 2 s so rate limiting "fails open" quickly when Redis
      // is down (the shared ioredis client has maxRetriesPerRequest: null
      // for BullMQ compatibility, so commands would otherwise hang).
      return Promise.race([
        redis.call(...args),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Redis sendCommand timeout')), 2000)
        ),
      ]);
    },
    prefix: `rl:${prefix}:`,
  });
}

// ─── Shared options ─────────────────────────────────────────────────────────
// passOnStoreError: if Redis is down, allow the request through rather than
// returning a 500.  Rate-limiting is temporarily disabled but the app stays up.
const storeErrorOpts = useRedis ? { passOnStoreError: true } : {};

// ─── Global Limiter ─────────────────────────────────────────────────────────
// Applied to ALL routes. Generous but firm catch-all safety net.
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,                  // 200 requests per window per IP
  standardHeaders: true,     // Return RateLimit-* headers (includes Retry-After)
  legacyHeaders: false,      // Disable X-RateLimit-* headers
  store: makeStore('global'),
  ...storeErrorOpts,
  message: {
    success: false,
    message: 'Too many requests. Please slow down and try again in a few minutes.',
  },
});

// ─── Auth Limiter ───────────────────────────────────────────────────────────
// Applied to /api/auth/login and /api/auth/register only.
// Strict limit to prevent brute-force attacks.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('auth'),
  ...storeErrorOpts,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

// ─── OCR Limiter ────────────────────────────────────────────────────────────
// Applied to /api/ocr/scan only.
// Strictest limit — each scan call hits the external Groq API and is expensive.
export const ocrLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15,                   // 15 requests per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('ocr'),
  ...storeErrorOpts,
  message: {
    success: false,
    message: 'OCR scan limit reached. You can scan up to 15 bills per hour. Please try again later.',
  },
});
