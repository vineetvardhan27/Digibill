/* eslint-disable */
/**
 * Bill Parser Service — Multi-Strategy Extraction Engine
 * Converts raw OCR/PDF text into structured bill data.
 * Uses: regex patterns, keyword detection, line analysis, heuristics.
 */

import {
  INVOICE_NUMBER_PATTERNS, DATE_PATTERNS, DATE_LABEL_PATTERNS,
  AMOUNT_PATTERNS, TOTAL_LABEL_PATTERNS, SUBTOTAL_LABEL_PATTERNS,
  TAX_LABEL_PATTERNS, DISCOUNT_LABEL_PATTERNS,
  GST_PATTERN, GST_PATTERN_LENIENT, GST_LABEL_PATTERN,
  PAN_PATTERN, PAN_LABEL_PATTERN,
  PHONE_PATTERNS, EMAIL_PATTERN,
  SUPPLIER_LABEL_PATTERNS, COMPANY_SUFFIX_PATTERNS,
  INDIAN_STATES_PATTERN,
} from '../utils/regexPatterns.js';

import {
  cleanText, extractAmount, parseDate, calculateConfidence,
} from '../utils/parserHelpers.js';

/**
 * Parse raw text from an invoice/bill and return structured data.
 * @param {string} rawText
 * @returns {object} Parsed bill data with confidence scores
 */
export function parseBillText(rawText) {
  const text = cleanText(rawText);
  const lines = text.split('\n');
  const hints = {};

  const result = {
    invoiceNumber: null, date: null, dueDate: null,
    supplierName: null, supplierPhone: null, supplierAddress: null,
    gstNumber: null, panNumber: null, email: null,
    items: [], subtotal: null, tax: null, discount: null, totalAmount: null,
  };

  result.invoiceNumber = extractInvoiceNumber(text, lines);
  Object.assign(result, extractDates(text, lines, hints));
  Object.assign(result, extractAmounts(text, lines, hints));
  result.gstNumber = extractGSTNumber(text);
  result.panNumber = extractPAN(text);
  result.email = extractEmail(text);
  Object.assign(result, extractSupplierInfo(text, lines, hints));
  result.items = extractLineItems(lines);
  result.confidence = calculateConfidence(result, hints);

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// INVOICE NUMBER
// ═══════════════════════════════════════════════════════════════════════════

function extractInvoiceNumber(text, lines) {
  // Strategy 1: labelled patterns against full text
  for (const pattern of INVOICE_NUMBER_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].length >= 2) {
      const val = match[1].trim();
      // Reject if it looks like a date or phone number
      if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(val)) continue;
      if (/^\d{10}$/.test(val)) continue;
      return val;
    }
  }

  // Strategy 2: line-by-line context search
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (/invoice|bill|receipt|memo|voucher|challan/.test(lower)) {
      for (const pattern of INVOICE_NUMBER_PATTERNS) {
        const match = line.match(pattern);
        if (match && match[1] && match[1].length >= 2) return match[1].trim();
      }
    }
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// DATE EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════

function extractDates(text, lines, hints) {
  const result = { date: null, dueDate: null };

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Due date (check first — more specific labels)
    if (!result.dueDate && DATE_LABEL_PATTERNS.due.test(line)) {
      const d = extractDateFromLine(line);
      if (d) { result.dueDate = d; continue; }
    }

    // Invoice/bill date
    if (!result.date && DATE_LABEL_PATTERNS.invoice.test(line)) {
      const d = extractDateFromLine(line);
      if (d) { result.date = d; hints.dateFromLabel = true; continue; }
    }

    // Generic "date" keyword
    if (!result.date && /\bdate\b/i.test(lower) && !/due/i.test(lower)) {
      const d = extractDateFromLine(line);
      if (d) { result.date = d; hints.dateFromLabel = true; }
    }
  }

  // Fallback: first date found in the top 10 lines
  if (!result.date) {
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const d = extractDateFromLine(lines[i]);
      if (d) { result.date = d; break; }
    }
  }

  // Sanity: due date should be after invoice date
  if (result.date && result.dueDate) {
    const inv = new Date(result.date);
    const due = new Date(result.dueDate);
    if (due < inv) { result.dueDate = null; }
  }

  return result;
}

function extractDateFromLine(line) {
  for (const pattern of DATE_PATTERNS) {
    const match = line.match(pattern);
    if (match) return parseDate(match[0]);
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// AMOUNT EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════

function extractAmounts(text, lines, hints) {
  const result = { totalAmount: null, subtotal: null, tax: null, discount: null };
  const allAmounts = [];

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];

    // ── Grand Total / Net Total ──
    if (matchesAnyPattern(line, TOTAL_LABEL_PATTERNS)) {
      const amt = extractAmountFromLine(line);
      if (amt !== null && amt > 0) {
        result.totalAmount = amt;
        hints.totalFromLabel = true;
      }
    }

    // ── Subtotal ──
    if (matchesAnyPattern(line, SUBTOTAL_LABEL_PATTERNS)) {
      const amt = extractAmountFromLine(line);
      if (amt !== null && amt > 0) result.subtotal = amt;
    }

    // ── Tax (accumulate CGST + SGST + IGST) ──
    if (matchesAnyPattern(line, TAX_LABEL_PATTERNS)) {
      const amt = extractAmountFromLine(line);
      if (amt !== null && amt > 0) {
        // Don't accumulate if this line also matches total (e.g., "Total Tax")
        if (!matchesAnyPattern(line, TOTAL_LABEL_PATTERNS)) {
          result.tax = (result.tax || 0) + amt;
          result.tax = Math.round(result.tax * 100) / 100;
        }
      }
    }

    // ── Discount ──
    if (matchesAnyPattern(line, DISCOUNT_LABEL_PATTERNS)) {
      const amt = extractAmountFromLine(line);
      if (amt !== null && amt > 0) result.discount = amt;
    }

    // Collect all amounts for fallback
    const amt = extractAmountFromLine(line);
    if (amt !== null && amt > 0) {
      allAmounts.push({ amount: amt, index: idx, line });
    }
  }

  // ── Fallback: largest amount in bottom half = likely total ──
  if (result.totalAmount === null && allAmounts.length > 0) {
    const mid = Math.floor(lines.length / 2);
    const bottomAmounts = allAmounts.filter(a => a.index >= mid);
    const pool = bottomAmounts.length > 0 ? bottomAmounts : allAmounts;
    const largest = pool.reduce((max, c) => c.amount > max.amount ? c : max);
    result.totalAmount = largest.amount;
  }

  // ── Infer missing fields ──
  // If total & subtotal exist but no tax → tax = total - subtotal
  if (result.totalAmount && result.subtotal && !result.tax) {
    const diff = result.totalAmount - result.subtotal;
    if (diff > 0 && diff < result.subtotal * 0.5) {
      result.tax = Math.round(diff * 100) / 100;
    }
  }
  // If total & tax exist but no subtotal → subtotal = total - tax
  if (result.totalAmount && result.tax && !result.subtotal) {
    const diff = result.totalAmount - result.tax;
    if (diff > 0) result.subtotal = Math.round(diff * 100) / 100;
  }

  return result;
}

function extractAmountFromLine(line) {
  // Try currency-prefixed patterns first (higher confidence)
  for (const pattern of AMOUNT_PATTERNS) {
    const match = line.match(pattern);
    if (match && match[1]) return extractAmount(match[1]);
  }
  return extractAmount(line);
}

function matchesAnyPattern(line, patterns) {
  return patterns.some(p => p.test(line));
}

// ═══════════════════════════════════════════════════════════════════════════
// GST / PAN / EMAIL
// ═══════════════════════════════════════════════════════════════════════════

function extractGSTNumber(text) {
  // Try labelled GSTIN first
  const labelledRegex = new RegExp(
    GST_LABEL_PATTERN.source + '\\s*' + GST_PATTERN.source, 'i'
  );
  const labelMatch = text.match(labelledRegex);
  if (labelMatch) {
    const gst = labelMatch[0].match(GST_PATTERN);
    if (gst) return gst[1];
  }

  // Try strict standalone pattern
  const strict = text.match(GST_PATTERN);
  if (strict) return strict[1];

  // Try lenient pattern (catches OCR errors)
  const lenient = text.match(GST_PATTERN_LENIENT);
  if (lenient) {
    const val = lenient[1];
    // Validate state code (01-37 + special)
    const stateCode = parseInt(val.substring(0, 2));
    if (stateCode >= 1 && stateCode <= 37) return val;
  }

  return null;
}

function extractPAN(text) {
  const labelledRegex = new RegExp(
    PAN_LABEL_PATTERN.source + '\\s*' + PAN_PATTERN.source, 'i'
  );
  const labelMatch = text.match(labelledRegex);
  if (labelMatch) {
    const pan = labelMatch[0].match(PAN_PATTERN);
    if (pan) return pan[1];
  }
  // Don't return standalone PAN — too many false positives
  return null;
}

function extractEmail(text) {
  const match = text.match(EMAIL_PATTERN);
  return match ? match[1] : null;
}

// ═══════════════════════════════════════════════════════════════════════════
// SUPPLIER INFO
// ═══════════════════════════════════════════════════════════════════════════

function extractSupplierInfo(text, lines, hints) {
  const result = { supplierName: null, supplierPhone: null, supplierAddress: null };

  // ── Phone ──
  for (const pattern of PHONE_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.supplierPhone = match[1].replace(/[\s\-]/g, '');
      break;
    }
  }

  // ── Supplier Name ──
  // Strategy 1: Labelled ("From:", "Supplier:", "Sold By:")
  for (const line of lines) {
    for (const lp of SUPPLIER_LABEL_PATTERNS) {
      if (lp.test(line)) {
        const name = line.replace(lp, '').trim();
        if (name.length > 1 && name.length < 100) {
          result.supplierName = name;
          hints.supplierFromLabel = true;
          break;
        }
      }
    }
    if (result.supplierName) break;
  }

  // Strategy 2: Look for company suffixes ("Pvt Ltd", "Traders", etc.)
  if (!result.supplierName) {
    for (let i = 0; i < Math.min(lines.length, 8); i++) {
      const line = lines[i].trim();
      for (const sp of COMPANY_SUFFIX_PATTERNS) {
        if (sp.test(line) && line.length > 3 && line.length < 100) {
          result.supplierName = line;
          break;
        }
      }
      if (result.supplierName) break;
    }
  }

  // Strategy 3: First non-trivial line (often the company name/letterhead)
  if (!result.supplierName) {
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const line = lines[i].trim();
      if (
        line.length > 2 && line.length < 80 &&
        !/^\d/.test(line) &&
        !/^(date|invoice|bill|receipt|tax|gst|phone|mob|email|www|http|page|order)/i.test(line) &&
        !GST_PATTERN.test(line) &&
        !/\d{10}/.test(line) &&
        !/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(line)
      ) {
        result.supplierName = line;
        break;
      }
    }
  }

  // ── Address ──
  // Look for lines with Indian PIN codes or "address" label
  for (let i = 0; i < Math.min(lines.length, 12); i++) {
    const line = lines[i];

    // PIN code pattern (6 digits at word boundary)
    if (/\b\d{6}\b/.test(line) && line.length > 10) {
      result.supplierAddress = line.trim();
      break;
    }

    // State name detection
    if (INDIAN_STATES_PATTERN.test(line) && line.length > 8) {
      result.supplierAddress = line.trim();
      break;
    }

    // "Address:" label
    if (/address/i.test(line)) {
      const addr = line.replace(/address[\s.:_\-]*/i, '').trim();
      if (addr.length > 5) {
        result.supplierAddress = addr;
      } else if (i + 1 < lines.length) {
        result.supplierAddress = lines[i + 1].trim();
      }
      break;
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// LINE ITEMS — delegated to lineItemExtractor.js
// ═══════════════════════════════════════════════════════════════════════════

// Re-export the dedicated extractor for use by the parser
import { extractLineItems } from './lineItemExtractor.js';

export default { parseBillText };

