import { Queue } from 'bullmq';
import { createBullMQConnection } from '../../lib/bullmq-redis.js';

export const REMINDER_QUEUE_NAME = 'reminder-queue';

export const reminderQueue = new Queue(REMINDER_QUEUE_NAME, {
  connection: createBullMQConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000 // 5s, 10s, 20s
    },
    removeOnComplete: true, // Keep Redis clean
    removeOnFail: 1000 // Keep last 1000 failed jobs in Redis for debugging
  }
});

console.log(`🐂 [BullMQ] Initialized queue: ${REMINDER_QUEUE_NAME}`);
