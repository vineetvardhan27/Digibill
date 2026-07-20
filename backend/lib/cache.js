import redis from './redis.js';

/**
 * Generic cache-aside helper.
 *
 * 1. Look up `key` in Redis.
 * 2. On hit → parse JSON and return.
 * 3. On miss → call `fetchFn()` (which typically hits Mongo), write the
 *    result to Redis with the given TTL, then return.
 *
 * @template T
 * @param {string}        key          Redis key
 * @param {number}        ttlSeconds   Time-to-live in seconds
 * @param {() => Promise<T>} fetchFn   Async function that produces the value on cache miss
 * @returns {Promise<T>}
 */
export async function getOrSetCache(key, ttlSeconds, fetchFn) {
  try {
    const cached = await redis.get(key);
    if (cached !== null) {
      return JSON.parse(cached);
    }
  } catch (err) {
    // Redis down — fall through to Mongo
    console.warn(`⚠️  Redis GET failed for "${key}":`, err.message);
  }

  // Cache miss — fetch from the source of truth
  const freshData = await fetchFn();

  try {
    await redis.set(key, JSON.stringify(freshData), 'EX', ttlSeconds);
  } catch (err) {
    console.warn(`⚠️  Redis SET failed for "${key}":`, err.message);
  }

  return freshData;
}

/**
 * Invalidate one or more cache keys.
 *
 * Call this synchronously after a Mongo write commits so the next
 * read refills the cache with fresh data.
 *
 * @param {...string} keys  One or more Redis keys to delete
 */
export async function invalidateCache(...keys) {
  if (keys.length === 0) return;
  try {
    await redis.del(...keys);
  } catch (err) {
    console.warn('⚠️  Redis DEL failed:', err.message);
  }
}
