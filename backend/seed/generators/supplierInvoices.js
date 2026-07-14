/**
 * Supplier Invoice Generator
 * Creates ~50 invoices uploaded by suppliers through connections.
 */

import mongoose from 'mongoose';
import { pick } from '../utils/companyGenerator.js';

const FILE_NAMES = [
  'invoice_scan.pdf',
  'bill_photo.jpg',
  'receipt_2025.pdf',
  'delivery_challan.pdf',
  'purchase_order.pdf',
  'gst_invoice.pdf',
  'credit_note.pdf',
  'tax_invoice.jpg',
];

const NOTES = [
  'Scanned copy of original invoice',
  'Photo taken at time of delivery',
  'Updated invoice with corrected amounts',
  'Monthly consolidated bill',
  'Replacement invoice after dispute',
];

/**
 * Generates SupplierInvoice documents.
 * @param {Array} bills — Bill documents (to optionally link)
 * @param {Array} connections — Connection documents
 * @param {number} count — Target invoices (default 50)
 * @returns {Array} SupplierInvoice documents
 */
export function generateSupplierInvoices(bills, connections, count = 50) {
  console.log(`  🔄 Generating ${count} supplier invoices...`);

  const activeConnections = connections.filter((c) => c.status === 'connected');
  if (activeConnections.length === 0) {
    console.log('  ⚠️  No active connections found, skipping supplier invoices');
    return [];
  }

  const invoices = [];

  for (let i = 0; i < count; i++) {
    const connection = pick(activeConnections);
    const bill = Math.random() > 0.3 ? pick(bills) : null; // 70% linked to a bill
    const fileName = pick(FILE_NAMES);
    const uploadedAt = new Date(
      Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000
    );

    invoices.push({
      _id: new mongoose.Types.ObjectId(),
      billId: bill ? bill._id : undefined,
      connectionId: connection._id,
      supplierId: bill ? bill.supplierId : undefined,
      ownerId: connection.shopOwnerId,
      fileUrl: `/uploads/invoices/${new mongoose.Types.ObjectId()}_${fileName}`,
      fileName,
      uploadedAt,
      notes: Math.random() > 0.4 ? pick(NOTES) : undefined,
      createdAt: uploadedAt,
      updatedAt: uploadedAt,
    });
  }

  console.log(`  ✅ Generated ${invoices.length} supplier invoices`);
  return invoices;
}
