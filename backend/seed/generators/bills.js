/**
 * Bill Generator
 * Creates ~2,800 bills distributed across suppliers.
 * Each bill has 2–5 embedded items with realistic Kirana products,
 * pre-computed GST fields, and proper status distribution.
 *
 * Status distribution:
 *   ~40% Paid       — isPaid=true, paidDate set
 *   ~25% Pending    — isPaid=false, dueDate in future
 *   ~20% Overdue    — isPaid=false, dueDate in past
 *   ~15% Partially Paid — isPaid=false (treated like pending with some payment intent)
 *
 * All computed fields (taxableAmount, cgst, sgst, igst, totalAmount,
 * subtotal, totalCGST, totalSGST, totalIGST, grandTotal, amount) are
 * pre-calculated to bypass the pre-save middleware for fast insertMany().
 */

import mongoose from 'mongoose';
import { generateInvoiceNumber, resetInvoiceCounter } from '../utils/invoiceGenerator.js';
import { KIRANA_ITEMS, pick, pickN } from '../utils/companyGenerator.js';

// 24 months in milliseconds
const TWENTY_FOUR_MONTHS_MS = 24 * 30 * 24 * 60 * 60 * 1000;

/**
 * Generates a random date within the last 24 months.
 * @returns {Date}
 */
function randomDateInLast24Months() {
  const offset = Math.random() * TWENTY_FOUR_MONTHS_MS;
  return new Date(Date.now() - offset);
}

/**
 * Generates a random quantity between 1 and 50.
 */
function randomQty() {
  return Math.floor(Math.random() * 50) + 1;
}

/**
 * Builds embedded bill items with pre-computed tax fields.
 * @param {number} itemCount — Number of items (2–5)
 * @returns {{ items: Array, subtotal: number, totalCGST: number, totalSGST: number, totalIGST: number, grandTotal: number }}
 */
function buildBillItems(itemCount) {
  const selectedItems = pickN(KIRANA_ITEMS, itemCount);
  let subtotal = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;

  const items = selectedItems.map((product) => {
    const quantity = randomQty();
    // Random unit price within the product's range
    const unitPrice = Number(
      (product.unit[0] + Math.random() * (product.unit[1] - product.unit[0])).toFixed(2)
    );
    const gstRate = product.gst;
    // 80% intra-state (CGST+SGST), 20% inter-state (IGST)
    const gstType = Math.random() > 0.2 ? 'CGST_SGST' : 'IGST';

    const taxableAmount = Number((quantity * unitPrice).toFixed(2));
    let cgst = 0, sgst = 0, igst = 0;

    if (gstType === 'CGST_SGST') {
      const halfRate = gstRate / 2;
      cgst = Number((taxableAmount * (halfRate / 100)).toFixed(2));
      sgst = Number((taxableAmount * (halfRate / 100)).toFixed(2));
    } else {
      igst = Number((taxableAmount * (gstRate / 100)).toFixed(2));
    }

    const totalAmount = Number((taxableAmount + cgst + sgst + igst).toFixed(2));

    subtotal += taxableAmount;
    totalCGST += cgst;
    totalSGST += sgst;
    totalIGST += igst;

    return {
      _id: new mongoose.Types.ObjectId(),
      description: product.desc,
      quantity,
      unitPrice,
      hsnCode: product.hsnCode,
      gstRate,
      gstType,
      taxableAmount,
      cgst,
      sgst,
      igst,
      totalAmount,
    };
  });

  subtotal = Number(subtotal.toFixed(2));
  totalCGST = Number(totalCGST.toFixed(2));
  totalSGST = Number(totalSGST.toFixed(2));
  totalIGST = Number(totalIGST.toFixed(2));
  const grandTotal = Number((subtotal + totalCGST + totalSGST + totalIGST).toFixed(2));

  return { items, subtotal, totalCGST, totalSGST, totalIGST, grandTotal };
}

/**
 * Generates Bill documents distributed across suppliers.
 * @param {Array} suppliers — Supplier documents
 * @param {Array} connections — Connection documents (for connectionId linking)
 * @param {number} totalBills — Target number of bills (default 2800)
 * @returns {{ bills: Array, billsBySupplier: Map }} Bills + grouped lookup
 */
export function generateBills(suppliers, connections, totalBills = 2800) {
  console.log(`  🔄 Generating ${totalBills} bills across ${suppliers.length} suppliers...`);

  resetInvoiceCounter();

  const bills = [];
  const billsBySupplier = new Map(); // supplierId → [bills]
  const perSupplier = Math.floor(totalBills / suppliers.length);
  let remaining = totalBills - perSupplier * suppliers.length;

  // Build a lookup: supplierId → connectionId (if exists)
  const supplierConnectionMap = new Map();
  for (const conn of connections) {
    // We can't directly map supplierId → connectionId since connections use supplierAccountId
    // So connections are only linked if there is a match; most bills won't have connectionId
  }

  for (const supplier of suppliers) {
    const billCount = perSupplier + (remaining > 0 ? 1 : 0);
    if (remaining > 0) remaining--;

    const supplierBills = [];

    for (let i = 0; i < billCount; i++) {
      const billDate = randomDateInLast24Months();
      const itemCount = Math.floor(Math.random() * 4) + 2; // 2–5 items
      const { items, subtotal, totalCGST, totalSGST, totalIGST, grandTotal } =
        buildBillItems(itemCount);

      // Determine bill status
      const statusRoll = Math.random();
      let isPaid = false;
      let paidDate = undefined;
      let dueDate;
      let description;

      if (statusRoll < 0.40) {
        // PAID — 40%
        isPaid = true;
        // Due date was 15-45 days after bill
        const dueDaysAfter = Math.floor(Math.random() * 30) + 15;
        dueDate = new Date(billDate.getTime() + dueDaysAfter * 24 * 60 * 60 * 1000);
        // Paid sometime between bill date and due date (or a few days late)
        const payDelay = Math.floor(Math.random() * (dueDaysAfter + 10));
        paidDate = new Date(billDate.getTime() + payDelay * 24 * 60 * 60 * 1000);
        description = 'Payment completed';
      } else if (statusRoll < 0.65) {
        // PENDING — 25%
        // Due date in the future (15–60 days from now)
        const dueDaysAhead = Math.floor(Math.random() * 45) + 15;
        dueDate = new Date(Date.now() + dueDaysAhead * 24 * 60 * 60 * 1000);
        description = 'Payment pending';
      } else if (statusRoll < 0.85) {
        // OVERDUE — 20%
        // Due date in the past (already passed)
        const overdueDaysAgo = Math.floor(Math.random() * 90) + 5;
        dueDate = new Date(Date.now() - overdueDaysAgo * 24 * 60 * 60 * 1000);
        description = 'Payment overdue';
      } else {
        // PARTIALLY PAID — 15%
        // Due date in the past or near future
        const dueDays = Math.floor(Math.random() * 60) - 15;
        dueDate = new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000);
        description = 'Partial payment received';
      }

      const invoiceNumber = generateInvoiceNumber(billDate);

      const bill = {
        _id: new mongoose.Types.ObjectId(),
        supplierId: supplier._id,
        createdBy: supplier.createdBy,
        amount: grandTotal,
        date: billDate,
        description: `${invoiceNumber} - ${description}`,
        isPaid,
        dueDate,
        paidDate,
        items,
        subtotal,
        totalCGST,
        totalSGST,
        totalIGST,
        grandTotal,
        acknowledgedBySupplier: isPaid && Math.random() > 0.3,
        acknowledgedAt: isPaid && Math.random() > 0.3
          ? new Date(billDate.getTime() + 2 * 24 * 60 * 60 * 1000)
          : undefined,
        createdAt: billDate,
        updatedAt: paidDate || new Date(),
      };

      bills.push(bill);
      supplierBills.push(bill);
    }

    billsBySupplier.set(supplier._id.toString(), supplierBills);
  }

  console.log(`  ✅ Generated ${bills.length} bills with ${bills.reduce((sum, b) => sum + b.items.length, 0)} embedded items`);
  return { bills, billsBySupplier };
}

/**
 * Computes back-fill data for a supplier's financial fields based on their bills.
 * @param {Array} supplierBills — Bills belonging to this supplier
 * @returns {object} { totalSpend, pendingAmount, totalBills, lastPurchaseDate }
 */
export function computeSupplierStats(supplierBills) {
  const totalSpend = Number(
    supplierBills.reduce((sum, b) => sum + b.amount, 0).toFixed(2)
  );
  const pendingAmount = Number(
    supplierBills.filter((b) => !b.isPaid).reduce((sum, b) => sum + b.amount, 0).toFixed(2)
  );
  const totalBills = supplierBills.length;
  const sorted = [...supplierBills].sort((a, b) => b.date - a.date);
  const lastPurchaseDate = sorted.length > 0 ? sorted[0].date : null;

  return { totalSpend, pendingAmount, totalBills, lastPurchaseDate };
}
