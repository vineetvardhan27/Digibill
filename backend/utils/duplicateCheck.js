import Bill from '../models/Bill.js';

export async function checkForDuplicates(userId, { supplierId, amount, billDate }) {
  if (!supplierId || !amount || !billDate) return [];

  // Parse target date and amount
  const targetDate = new Date(billDate);
  const targetAmount = parseFloat(amount);

  if (isNaN(targetDate.getTime()) || isNaN(targetAmount)) return [];

  // Fetch candidate bills for this user and supplier
  const candidates = await Bill.find({
    createdBy: userId,
    supplierId: supplierId,
  }).populate('supplierId', 'name');

  const matches = candidates.filter(existingBill => {
    // Check amount variance (within 2%)
    const amountDiff = Math.abs(existingBill.amount - targetAmount);
    const maxVariance = targetAmount * 0.02;
    const amountMatches = amountDiff <= maxVariance;

    // Check date variance (within 7 days)
    const existingDate = new Date(existingBill.date);
    const msPerDay = 1000 * 60 * 60 * 24;
    const dateDiffDays = Math.abs(existingDate - targetDate) / msPerDay;
    const dateMatches = dateDiffDays <= 7;

    return amountMatches && dateMatches;
  });

  return matches;
}
