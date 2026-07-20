import Bill from '../models/Bill.js';
import ReminderConfig from '../models/ReminderConfig.js';
import ReminderLog from '../models/ReminderLog.js';
import { reminderQueue } from '../jobs/queues/reminderQueue.js';
import { sendEmail } from '../lib/email.js';

// ─── Twilio Client (lazy-initialized) ───────────────────────────────────────
let twilioClient = null;

async function getTwilioClient() {
  if (!twilioClient) {
    const twilio = await import('twilio');
    twilioClient = twilio.default(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
  return twilioClient;
}

// ─── HTML Email Template ────────────────────────────────────────────────────
function buildEmailHTML({ supplierName, amount, dueDate, billId }) {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const formattedDate = new Date(dueDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
  const manageLink = `${clientUrl}/bills?highlight=${billId}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" style="background-color:#f4f6f9;padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" style="background-color:#ffffff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:600;">⏰ Payment Reminder</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">from Digibill</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
                Hi! This is a friendly reminder about an upcoming payment:
              </p>
              <table role="presentation" width="100%" style="background-color:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                    <span style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Supplier</span><br>
                    <span style="color:#111827;font-size:16px;font-weight:600;">${supplierName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                    <span style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Amount Due</span><br>
                    <span style="color:#dc2626;font-size:20px;font-weight:700;">${formattedAmount}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;">
                    <span style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Due Date</span><br>
                    <span style="color:#111827;font-size:16px;font-weight:600;">${formattedDate}</span>
                  </td>
                </tr>
              </table>
              <a href="${manageLink}" target="_blank" rel="noopener"
                 style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.02em;">
                View &amp; Manage Bill →
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
                Sent by Digibill • You can manage your reminder preferences in Settings.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Send Email Reminder ────────────────────────────────────────────────────
async function sendEmailReminder({ emailAddress, supplierName, amount, dueDate, billId }) {
  const html = buildEmailHTML({ supplierName, amount, dueDate, billId });
  const subject = `⏰ Payment Reminder: ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount)} due to ${supplierName}`;

  await sendEmail({
    to: emailAddress,
    subject,
    html
  });
}

// ─── Send WhatsApp Reminder ─────────────────────────────────────────────────
async function sendWhatsAppReminder({ whatsappNumber, supplierName, amount, dueDate, billId }) {
  const client = await getTwilioClient();
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const formattedDate = new Date(dueDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
  const link = `${clientUrl}/bills?highlight=${billId}`;

  const body = `Hi! Reminder: Bill of ${formattedAmount} to ${supplierName} is due on ${formattedDate}. Manage it here: ${link}`;

  await client.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
    to: `whatsapp:${whatsappNumber}`,
    body
  });
}

// ─── Send Reminder for a Single Bill ────────────────────────────────────────
async function sendReminder({ bill, config, daysBefore, isTest = false, isQueue = false }) {
  const supplierName = bill.supplierId?.name || 'Unknown Supplier';
  const { amount, dueDate, _id: billId } = bill;
  const channels = config.channel === 'both' ? ['email', 'whatsapp'] : [config.channel];

  let failedChannels = 0;
  let lastError = null;

  for (const channel of channels) {
    try {
      if (channel === 'email') {
        await sendEmailReminder({
          emailAddress: config.emailAddress,
          supplierName,
          amount,
          dueDate,
          billId
        });
      } else if (channel === 'whatsapp') {
        await sendWhatsAppReminder({
          whatsappNumber: config.whatsappNumber,
          supplierName,
          amount,
          dueDate,
          billId
        });
      }

      // Log success (skip logging for test reminders, but DO log for queue reminders)
      if (!isTest) {
        await ReminderLog.create({
          billId,
          userId: config.userId,
          sentAt: new Date(),
          channel,
          status: 'sent',
          daysBefore
        });
      }

      console.log(`  ✅ [${channel}] Reminder sent for bill ${billId} (${daysBefore}d before)`);
    } catch (error) {
      console.error(`  ❌ [${channel}] Failed for bill ${billId}:`, error.message);
      failedChannels++;
      lastError = error;

      // Log failure (skip logging for test reminders)
      if (!isTest && !isQueue) {
        await ReminderLog.create({
          billId,
          userId: config.userId,
          sentAt: new Date(),
          channel,
          status: 'failed',
          errorMessage: error.message,
          daysBefore
        });
      }

      // Re-throw for test reminders so the API can report the error
      if (isTest) {
        throw error;
      }
    }
  }

  // For BullMQ: if ANY channel failed, we throw so the job is retried.
  // We only throw if it's a queued job.
  if (isQueue && failedChannels > 0) {
    throw lastError;
  }
}

// ─── Process All Reminders (called by cron) ─────────────────────────────────
async function processReminders() {
  const now = new Date();
  console.log(`\n📬 [ReminderService] Starting reminder processing at ${now.toISOString()}`);

  // Fetch all enabled reminder configs
  const configs = await ReminderConfig.find({ enabled: true });

  if (configs.length === 0) {
    console.log('  ℹ️  No enabled reminder configs found. Skipping.');
    return { processed: 0, sent: 0, failed: 0 };
  }

  let totalProcessed = 0;
  let totalSent = 0;
  let totalFailed = 0;

  for (const config of configs) {
    try {
      const { userId, reminderDaysBefore } = config;

      for (const daysBefore of reminderDaysBefore) {
        // Calculate the target due date (today + N days)
        const targetDate = new Date();
        targetDate.setHours(0, 0, 0, 0);
        targetDate.setDate(targetDate.getDate() + daysBefore);

        const targetDateEnd = new Date(targetDate);
        targetDateEnd.setHours(23, 59, 59, 999);

        // Find pending bills for this user due on the target date
        const bills = await Bill.find({
          createdBy: userId,
          isPaid: false,
          dueDate: { $gte: targetDate, $lte: targetDateEnd }
        }).populate('supplierId', 'name');

        for (const bill of bills) {
          // Check for existing log to prevent duplicate reminders
          const existingLog = await ReminderLog.findOne({
            billId: bill._id,
            userId,
            daysBefore,
            status: 'sent'
          });

          if (existingLog) {
            console.log(`  ⏭️  Skipping bill ${bill._id} — already reminded for ${daysBefore}d window`);
            continue;
          }

          totalProcessed++;

          try {
            await sendReminder({ bill, config, daysBefore });
            totalSent++;
          } catch {
            totalFailed++;
          }
        }
      }
    } catch (error) {
      console.error(`  ❌ Error processing config for user ${config.userId}:`, error.message);
    }
  }

  console.log(`📬 [ReminderService] Completed — Processed: ${totalProcessed}, Sent: ${totalSent}, Failed: ${totalFailed}\n`);
  return { processed: totalProcessed, sent: totalSent, failed: totalFailed };
}

// ─── Queue All Reminders (BullMQ path) ──────────────────────────────────────
async function queueReminders() {
  const now = new Date();
  console.log(`\n📬 [ReminderService] Starting queueing process at ${now.toISOString()}`);

  const configs = await ReminderConfig.find({ enabled: true });

  if (configs.length === 0) {
    console.log('  ℹ️  No enabled reminder configs found. Skipping.');
    return { processed: 0, queued: 0 };
  }

  let totalProcessed = 0;
  let totalQueued = 0;

  for (const config of configs) {
    try {
      const { userId, reminderDaysBefore } = config;

      for (const daysBefore of reminderDaysBefore) {
        const targetDate = new Date();
        targetDate.setHours(0, 0, 0, 0);
        targetDate.setDate(targetDate.getDate() + daysBefore);

        const targetDateEnd = new Date(targetDate);
        targetDateEnd.setHours(23, 59, 59, 999);

        const bills = await Bill.find({
          createdBy: userId,
          isPaid: false,
          dueDate: { $gte: targetDate, $lte: targetDateEnd }
        }).populate('supplierId', 'name');

        for (const bill of bills) {
          const existingLog = await ReminderLog.findOne({
            billId: bill._id,
            userId,
            daysBefore,
            status: 'sent'
          });

          if (existingLog) {
            console.log(`  ⏭️  Skipping bill ${bill._id} — already reminded for ${daysBefore}d window`);
            continue;
          }

          totalProcessed++;

          try {
            await reminderQueue.add(
              `send-reminder-${bill._id}-${daysBefore}`, 
              { bill, config, daysBefore }
            );
            totalQueued++;
            console.log(`  ➕ Queued reminder for bill ${bill._id}`);
          } catch (e) {
            console.error(`  ❌ Failed to queue reminder for bill ${bill._id}:`, e.message);
          }
        }
      }
    } catch (error) {
      console.error(`  ❌ Error processing config for user ${config.userId}:`, error.message);
    }
  }

  console.log(`📬 [ReminderService] Completed queueing — Processed: ${totalProcessed}, Queued: ${totalQueued}\n`);
  return { processed: totalProcessed, queued: totalQueued };
}

// ─── Send Test Reminder ─────────────────────────────────────────────────────
async function sendTestReminder(userId) {
  const config = await ReminderConfig.findOne({ userId });

  if (!config) {
    throw new Error('No reminder configuration found. Please set up your config first.');
  }

  if (!config.enabled) {
    throw new Error('Reminders are currently disabled. Enable them in your config first.');
  }

  // Find a pending bill to use as test data, or create mock data
  let bill = await Bill.findOne({
    createdBy: userId,
    isPaid: false,
    dueDate: { $exists: true }
  }).populate('supplierId', 'name');

  if (!bill) {
    // Use mock data if no pending bills exist
    bill = {
      _id: 'test-bill-id',
      supplierId: { name: 'Test Supplier' },
      amount: 5000,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
    };
  }

  await sendReminder({ bill, config, daysBefore: 0, isTest: true });

  return { message: 'Test reminder sent successfully!' };
}

export default {
  processReminders,
  queueReminders,
  sendTestReminder,
  sendReminder
};
