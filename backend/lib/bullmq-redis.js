import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

/**
 * BullMQ requires dedicated Redis connections that are not shared with
 * regular operations because it uses blocking commands (BRPOPLPUSH) which
 * would lock the entire client.
 * 
 * We export a connection factory to create new instances as needed (Queue, Worker, QueueEvents).
 */
export function createBullMQConnection() {
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null, // Required by BullMQ
    lazyConnect: false
  });
}
