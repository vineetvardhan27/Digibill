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
const timeoutPromise = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), ms));

export async function getOrSetCache(key, ttlSeconds, fetchFn) {
  try {
    const cached = await Promise.race([
      redis.get(key),
      timeoutPromise(1000)
    ]);
    if (cached !== null) {
      return JSON.parse(cached);
    }
  } catch (err) {
    // Redis down or timed out — fall through to Mongo
    console.warn(`⚠️  Redis GET failed/timeout for "${key}"`);
  }

  // Cache miss — fetch from the source of truth
  const freshData = await fetchFn();

  try {
    await Promise.race([
      redis.set(key, JSON.stringify(freshData), 'EX', ttlSeconds),
      timeoutPromise(1000)
    ]);
  } catch (err) {
    console.warn(`⚠️  Redis SET failed/timeout for "${key}"`);
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
    await Promise.race([
      redis.del(...keys),
      timeoutPromise(1000)
    ]);
  } catch (err) {
    console.warn(`⚠️  Redis DEL failed/timeout for keys: ${keys.join(', ')}`);
  }
}
