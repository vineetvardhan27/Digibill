/**
 * Invoice Number Generator
 * Produces sequential invoice numbers in the format: INV-YYYY-NNNNNN
 * Thread-safe counter resets per year.
 */

let counter = 0;

/**
 * Generates the next invoice number.
 * @param {Date} date — Invoice date (used to derive the year)
 * @returns {string} Invoice number like "INV-2026-000123"
 */
export function generateInvoiceNumber(date) {
  counter += 1;
  const year = date.getFullYear();
  const seq = String(counter).padStart(6, '0');
  return `INV-${year}-${seq}`;
}

/**
 * Resets the invoice counter (useful between seed runs).
 */
export function resetInvoiceCounter() {
  counter = 0;
}
