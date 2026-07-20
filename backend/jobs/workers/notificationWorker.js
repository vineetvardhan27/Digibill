import { Worker, QueueEvents } from 'bullmq';
import { createBullMQConnection } from '../../lib/bullmq-redis.js';
import { NOTIFICATION_QUEUE_NAME } from '../queues/notificationQueue.js';
import { sendEmail } from '../../lib/email.js';

let worker;
let queueEvents;

export function startNotificationWorker() {
  if (worker) return;

  const connection = createBullMQConnection();

  worker = new Worker(
    NOTIFICATION_QUEUE_NAME,
    async (job) => {
      console.log(`⚙️ [BullMQ] Processing notification job ${job.id}`);
      
      const { type, payload } = job.data;
      
      if (type === 'payment-receipt') {
        const { to, supplierName, amount, billId } = payload;
        
        await sendEmail({
          to,
          subject: '✅ Payment Receipt: Digibill',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Payment Successful</h2>
              <p>Your payment of <strong>${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)}</strong> to <strong>${supplierName}</strong> has been successfully processed.</p>
              <p>Bill ID: ${billId}</p>
              <hr />
              <p style="color: #666; font-size: 12px;">Powered by Digibill UPI Integrations</p>
            </div>
          `
        });
      }
      
      return { success: true };
    },
    { connection }
  );

  worker.on('failed', (job, err) => {
    console.log(`❌ [BullMQ] Notification job ${job.id} failed: ${err.message}`);
  });

  queueEvents = new QueueEvents(NOTIFICATION_QUEUE_NAME, {
    connection: createBullMQConnection()
  });

  console.log(`👷 [BullMQ] Started worker for queue: ${NOTIFICATION_QUEUE_NAME}`);
}
