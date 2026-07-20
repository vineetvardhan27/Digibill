/**
 * Re-export the shared ioredis client from config/redis.js.
 *
 * This module acts as the canonical import path for all Redis
 * consumers (caching, rate limiting, BullMQ queues, etc.).
 * Having a single barrel file keeps imports consistent and makes
 * it trivial to swap the underlying implementation later.
 */
export { default } from '../config/redis.js';
