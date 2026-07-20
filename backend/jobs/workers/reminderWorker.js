import { Worker, QueueEvents } from 'bullmq';
import { createBullMQConnection } from '../../lib/bullmq-redis.js';
import { REMINDER_QUEUE_NAME } from '../queues/reminderQueue.js';
import reminderService from '../../services/reminderService.js';
import FailedReminder from '../../models/FailedReminder.js';

let worker;
let queueEvents;

export function startReminderWorker() {
  if (worker) return;

  const connection = createBullMQConnection();

  worker = new Worker(
    REMINDER_QUEUE_NAME,
    async (job) => {
      console.log(`⚙️ [BullMQ] Processing job ${job.id} (attempt ${job.attemptsMade + 1})`);
      const { bill, config, daysBefore } = job.data;
      
      // We pass isQueue: true so that sendReminder will throw the error up
      // if it fails, which tells BullMQ to retry the job.
      await reminderService.sendReminder({ 
        bill, 
        config, 
        daysBefore, 
        isQueue: true 
      });
      
      return { success: true, billId: bill._id };
    },
    { connection }
  );

  worker.on('completed', (job) => {
    console.log(`✅ [BullMQ] Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.log(`❌ [BullMQ] Job ${job.id} failed (attempt ${job.attemptsMade}): ${err.message}`);
  });

  // Setup QueueEvents to handle the dead-letter log logic
  // We use QueueEvents because it triggers even if a job fails on another worker node
  queueEvents = new QueueEvents(REMINDER_QUEUE_NAME, {
    connection: createBullMQConnection()
  });

  queueEvents.on('failed', async ({ jobId, failedReason }) => {
    try {
      const { Job } = await import('bullmq');
      const job = await Job.fromId(worker.client, REMINDER_QUEUE_NAME, jobId);
      
      if (job && job.attemptsMade === job.opts.attempts) {
        console.log(`💀 [BullMQ] Job ${jobId} exhausted all ${job.attemptsMade} retries. Moving to Dead Letter Log.`);
        
        await FailedReminder.create({
          jobId,
          payload: job.data,
          errorMessage: failedReason || job.failedReason || 'Unknown error',
          attemptCount: job.attemptsMade
        });
      }
    } catch (e) {
      console.error(`⚠️ [BullMQ] Failed to process dead letter for job ${jobId}:`, e.message);
    }
  });

  console.log(`👷 [BullMQ] Started worker for queue: ${REMINDER_QUEUE_NAME}`);
}

export function stopReminderWorker() {
  if (worker) {
    worker.close();
    worker = null;
  }
  if (queueEvents) {
    queueEvents.close();
    queueEvents = null;
  }
}
