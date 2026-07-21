import 'dotenv/config.js';
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

/**
 * BullMQ requires dedicated Redis connections that are not shared with
 * regular operations because it uses blocking commands (BRPOPLPUSH) which
 * would lock the entire client.
 * 
 * We export a connection factory to create new instances as needed (Queue, Worker, QueueEvents).
 */
export function createBullMQConnection() {
  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: null, // Required by BullMQ
    lazyConnect: false
  });
  
  client.on('error', (err) => {
    // Suppress console spam if Redis is down locally. BullMQ will keep retrying.
    if (err.code !== 'ECONNREFUSED') {
      console.error(`❌ BullMQ Redis error: ${err.message}`);
    }
  });

  return client;
}
