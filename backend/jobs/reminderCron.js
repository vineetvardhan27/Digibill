import cron from 'node-cron';
import reminderService from '../services/reminderService.js';

// Daily at 9:00 AM IST = 3:30 AM UTC → cron: '30 3 * * *'
// Note: '0 3 * * *' is 8:30 AM IST. Using '30 3 * * *' for exact 9:00 AM IST.
const CRON_SCHEDULE = '30 3 * * *';

let scheduledTask = null;

function start() {
  if (scheduledTask) {
    console.log('⚠️  [ReminderCron] Cron job is already running.');
    return;
  }

  scheduledTask = cron.schedule(CRON_SCHEDULE, async () => {
    const startTime = new Date();
    console.log(`\n🕘 [ReminderCron] Job started at ${startTime.toISOString()}`);

    try {
      const result = await reminderService.processReminders();
      const endTime = new Date();
      const durationMs = endTime - startTime;
      console.log(`🕘 [ReminderCron] Job completed at ${endTime.toISOString()} (took ${durationMs}ms)`);
      console.log(`   Results: ${JSON.stringify(result)}`);
    } catch (error) {
      console.error(`🕘 [ReminderCron] Job failed at ${new Date().toISOString()}:`, error.message);
      console.error(error.stack);
    }
  }, {
    timezone: 'Asia/Kolkata'
  });

  console.log(`🕘 [ReminderCron] Scheduled daily at 9:00 AM IST (${CRON_SCHEDULE})`);
}

function stop() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('🕘 [ReminderCron] Cron job stopped.');
  }
}

export default { start, stop };
