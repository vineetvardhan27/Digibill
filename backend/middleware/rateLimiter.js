/**
 * Rate Limiting Middleware
 * Three tiers of rate limiting for different API surface areas.
 * All limiters return JSON responses matching the app's standard format.
 */

import rateLimit from 'express-rate-limit';

// ─── Global Limiter ─────────────────────────────────────────────────────────
// Applied to ALL routes. Generous but firm catch-all safety net.
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,                  // 200 requests per window per IP
  standardHeaders: true,     // Return RateLimit-* headers
  legacyHeaders: false,      // Disable X-RateLimit-* headers
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
  message: {
    success: false,
    message: 'OCR scan limit reached. You can scan up to 15 bills per hour. Please try again later.',
  },
});
