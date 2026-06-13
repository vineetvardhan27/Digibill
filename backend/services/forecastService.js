import Bill from '../models/Bill.js';
import mongoose from 'mongoose';

/**
 * Generate a cash flow forecast
 * @param {string} userId - The user ID
 * @param {number} days - Number of days to forecast (30 or 90)
 * @returns {Promise<Object>} Forecast data
 */
export async function generateForecast(userId, days = 30) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endWindow = new Date(today);
  endWindow.setDate(endWindow.getDate() + parseInt(days));
  endWindow.setHours(23, 59, 59, 999);

  // Fetch all bills for the user
  const bills = await Bill.find({ createdBy: userId })
    .populate('supplierId', 'name')
    .lean();

  const pendingBills = bills.filter(b => !b.isPaid);
  const paidBills = bills.filter(b => b.isPaid);

  const forecastItems = [];

  // 1. Add all pending bills that are due within the window (or overdue)
  for (const bill of pendingBills) {
    const dueDate = bill.dueDate ? new Date(bill.dueDate) : new Date(bill.date);
    // If a pending bill has no due date or its due date is before today,
    // we can consider its cash outflow as "due today" for forecasting purposes.
    let projectedDate = new Date(dueDate);
    if (projectedDate < today) {
      projectedDate = new Date(today); // Overdue bills impact cashflow immediately
    }

    if (projectedDate <= endWindow) {
      forecastItems.push({
        date: projectedDate.toISOString(),
        supplierId: bill.supplierId?._id || 'unknown',
        supplierName: bill.supplierId?.name || 'Unknown Supplier',
        amount: bill.amount,
        type: 'confirmed',
        billId: bill._id
      });
    }
  }

  // Group paid bills by supplier to find recurring patterns
  const paidBySupplier = {};
  for (const bill of paidBills) {
    if (!bill.supplierId) continue;
    const sId = bill.supplierId._id.toString();
    if (!paidBySupplier[sId]) {
      paidBySupplier[sId] = { supplier: bill.supplierId, bills: [] };
    }
    paidBySupplier[sId].bills.push(bill);
  }

  // 2. Detect recurring patterns
  const recurringSuppliers = [];
  
  for (const [sId, data] of Object.entries(paidBySupplier)) {
    const supplierBills = data.bills.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // We need at least 3 paid bills to detect a pattern
    if (supplierBills.length >= 3) {
      const intervals = [];
      let totalAmount = 0;
      
      for (let i = 1; i < supplierBills.length; i++) {
        const d1 = new Date(supplierBills[i - 1].date);
        const d2 = new Date(supplierBills[i].date);
        const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
        intervals.push(diffDays);
      }
      
      supplierBills.forEach(b => totalAmount += b.amount);
      const avgAmount = totalAmount / supplierBills.length;
      
      const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
      
      // Check consistency (tolerance of ±5 days)
      const isConsistent = intervals.every(interval => Math.abs(interval - avgInterval) <= 5);
      
      if (isConsistent && avgInterval > 0) {
        recurringSuppliers.push({
          supplierId: sId,
          supplierName: data.supplier.name,
          interval: Math.round(avgInterval),
          avgAmount: avgAmount,
          lastDate: new Date(supplierBills[supplierBills.length - 1].date)
        });
      }
    }
  }

  // 3. Project recurring bills into the future window
  for (const recurring of recurringSuppliers) {
    let nextDate = new Date(recurring.lastDate);
    nextDate.setDate(nextDate.getDate() + recurring.interval);

    // Keep projecting while the next date is within our window
    while (nextDate <= endWindow) {
      if (nextDate >= today) {
        // Check if there is already a confirmed bill for this supplier around this date
        // to avoid double counting. Let's say ±7 days.
        const hasExisting = forecastItems.some(item => 
          item.type === 'confirmed' &&
          item.supplierId.toString() === recurring.supplierId &&
          Math.abs((new Date(item.date) - nextDate) / (1000 * 60 * 60 * 24)) <= 7
        );

        if (!hasExisting) {
          forecastItems.push({
            date: nextDate.toISOString(),
            supplierId: recurring.supplierId,
            supplierName: recurring.supplierName,
            amount: recurring.avgAmount,
            type: 'predicted'
          });
        }
      }
      // Increment by interval
      nextDate.setDate(nextDate.getDate() + recurring.interval);
    }
  }

  // Sort all forecast items by date
  forecastItems.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Calculate totals
  let totalConfirmed = 0;
  let totalPredicted = 0;
  
  forecastItems.forEach(item => {
    if (item.type === 'confirmed') totalConfirmed += item.amount;
    else if (item.type === 'predicted') totalPredicted += item.amount;
  });

  // Calculate daily totals for the chart
  const dailyTotalsMap = new Map();
  
  // Initialize all days in the window with 0
  for (let i = 0; i <= days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
    dailyTotalsMap.set(dateStr, { confirmed: 0, predicted: 0, total: 0 });
  }

  forecastItems.forEach(item => {
    const dateStr = item.date.split('T')[0];
    if (dailyTotalsMap.has(dateStr)) {
      const current = dailyTotalsMap.get(dateStr);
      if (item.type === 'confirmed') {
        current.confirmed += item.amount;
      } else {
        current.predicted += item.amount;
      }
      current.total += item.amount;
    }
  });

  const dailyTotals = Array.from(dailyTotalsMap.entries()).map(([date, amounts]) => ({
    date,
    ...amounts
  }));

  // Sort daily totals just in case
  dailyTotals.sort((a, b) => new Date(a.date) - new Date(b.date));

  return {
    items: forecastItems,
    totalConfirmed,
    totalPredicted,
    dailyTotals
  };
}

export default { generateForecast };
