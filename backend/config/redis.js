import Redis from 'ioredis';

/**
 * Create and export a shared Redis client.
 *
 * The connection URL is read from the REDIS_URL environment variable.
 * In Docker Compose this is overridden to `redis://redis:6379`;
 * for local development it defaults to `redis://localhost:6379`.
 */
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // don't reject commands — needed for BullMQ & rate-limit-redis
  retryStrategy(times) {
    // Exponential back-off capped at 3 seconds
    const delay = Math.min(times * 200, 3000);
    return delay;
  },
  lazyConnect: false, // connect immediately on import
});

redis.on('connect', () => {
  console.log(`✅ Redis Connected: ${redisUrl}`);
});

redis.on('error', (err) => {
  console.error(`❌ Redis connection error: ${err.message}`);
});

export default redis;
