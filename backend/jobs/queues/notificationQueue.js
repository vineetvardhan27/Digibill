import { Queue } from 'bullmq';
import { createBullMQConnection } from '../../lib/bullmq-redis.js';

export const NOTIFICATION_QUEUE_NAME = 'notification-queue';

export const notificationQueue = new Queue(NOTIFICATION_QUEUE_NAME, {
  connection: createBullMQConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: true,
    removeOnFail: 1000
  }
});

console.log(`🐂 [BullMQ] Initialized queue: ${NOTIFICATION_QUEUE_NAME}`);
