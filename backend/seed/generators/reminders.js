/**
 * Reminder Generator
 * Creates:
 *   - 1 ReminderConfig per user (10 total)
 *   - ~150 ReminderLog entries linked to unpaid/overdue bills
 */

import mongoose from 'mongoose';
import { generateE164Phone } from '../utils/phoneGenerator.js';
import { pick } from '../utils/companyGenerator.js';

const CHANNELS = ['email', 'whatsapp', 'both'];
const LOG_CHANNELS = ['email', 'whatsapp'];
const DAYS_BEFORE_OPTIONS = [
  [3, 1],
  [7, 3, 1],
  [5, 2],
  [7, 1],
  [3],
  [10, 5, 1],
];

/**
 * Generates ReminderConfig documents (one per user).
 * @param {Array} users — User documents
 * @returns {Array} ReminderConfig documents
 */
export function generateReminderConfigs(users) {
  console.log(`  🔄 Generating ${users.length} reminder configs...`);

  const configs = users.map((user) => {
    const channel = pick(CHANNELS);
    return {
      _id: new mongoose.Types.ObjectId(),
      userId: user._id,
      channel,
      emailAddress: user.email,
      whatsappNumber:
        channel === 'whatsapp' || channel === 'both'
          ? generateE164Phone()
          : undefined,
      reminderDaysBefore: pick(DAYS_BEFORE_OPTIONS),
      enabled: Math.random() > 0.1, // 90% enabled
      createdAt: user.createdAt,
      updatedAt: new Date(),
    };
  });

  console.log(`  ✅ Generated ${configs.length} reminder configs`);
  return configs;
}

/**
 * Generates ReminderLog documents for unpaid/overdue bills.
 * @param {Array} bills — All bill documents
 * @param {Array} users — User documents
 * @param {number} count — Target number of logs (default 150)
 * @returns {Array} ReminderLog documents
 */
export function generateReminderLogs(bills, users, count = 150) {
  console.log(`  🔄 Generating ${count} reminder logs...`);

  // Filter to unpaid bills (these would have reminders)
  const unpaidBills = bills.filter((b) => !b.isPaid && b.dueDate);
  if (unpaidBills.length === 0) {
    console.log('  ⚠️  No unpaid bills found, skipping reminder logs');
    return [];
  }

  const logs = [];

  for (let i = 0; i < count; i++) {
    const bill = pick(unpaidBills);
    const channel = pick(LOG_CHANNELS);
    const daysBefore = pick([1, 3, 5, 7]);
    const sentAt = new Date(
      bill.dueDate.getTime() - daysBefore * 24 * 60 * 60 * 1000
    );

    logs.push({
      _id: new mongoose.Types.ObjectId(),
      billId: bill._id,
      userId: bill.createdBy,
      sentAt,
      channel,
      status: Math.random() > 0.1 ? 'sent' : 'failed', // 90% success
      errorMessage: Math.random() <= 0.1 ? 'SMTP connection timeout' : undefined,
      daysBefore,
      createdAt: sentAt,
      updatedAt: sentAt,
    });
  }

  console.log(`  ✅ Generated ${logs.length} reminder logs`);
  return logs;
}
