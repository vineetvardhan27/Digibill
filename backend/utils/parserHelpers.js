/* eslint-disable */
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Parser Helper Utilities
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Reusable functions for:
 *   • Text cleaning / OCR artifact removal
 *   • Amount extraction / Indian currency normalization
 *   • Multi-format date parsing (DD/MM/YYYY, YYYY-MM-DD, "15 Jan 2024", etc.)
 *   • Confidence scoring for parsed bill data
 *   • String similarity (Levenshtein) for fuzzy matching
 *   • Company name normalization
 */

// ─── Month Mapping ──────────────────────────────────────────────────────────

const MONTH_MAP = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, september: 8, sept: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

// ═══════════════════════════════════════════════════════════════════════════
// TEXT CLEANING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Clean and normalize raw OCR text output.
 *
 * OCR engines produce many artifacts that can break regex parsing:
 *   • Random control characters from WASM buffer misreads
 *   • Pipes (|) misread as I or l
 *   • Smart quotes from font confusion
 *   • Non-breaking spaces from PDF layout
 *   • Zero-width characters from Unicode normalization issues
 *   • Extra whitespace from column alignment
 *
 * This function fixes all of these while preserving the line structure
 * that the parser depends on for context-aware extraction.
 *
 * @param {string} text - Raw OCR or PDF-extracted text
 * @returns {string} - Cleaned, normalized text
 */
export function cleanText(text) {
  if (!text || typeof text !== 'string') return '';

  return text
    // ── Normalize line endings ──
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')

    // ── Fix common OCR character misreads ──
    // Pipe → I (OCR reads vertical strokes as pipe)
    .replace(/[|]/g, 'I')
    // Smart quotes → straight quotes
    .replace(/[`''‛]/g, "'")
    .replace(/[""‟„]/g, '"')
    // En-dash, em-dash → hyphen (OCR reads dashes inconsistently)
    .replace(/[–—]/g, '-')
    // Bullet points and decorative chars → space
    .replace(/[•◦▪▸►▶◆★☆]/g, ' ')

    // ── Remove invisible characters ──
    .replace(/\u00A0/g, ' ')     // Non-breaking space
    .replace(/\u200B/g, '')      // Zero-width space
    .replace(/\u200C/g, '')      // Zero-width non-joiner
    .replace(/\u200D/g, '')      // Zero-width joiner
    .replace(/\uFEFF/g, '')      // BOM (Byte Order Mark)
    // Control chars (keep \n = 0x0A, \t = 0x09)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

    // ── Normalize whitespace (preserve newlines) ──
    .replace(/[^\S\n]+/g, ' ')

    // ── Clean each line ──
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
    .trim();
}

/**
 * Normalize text for keyword matching (lowercase, collapsed whitespace).
 *
 * @param {string} text
 * @returns {string}
 */
export function normalizeForSearch(text) {
  if (!text) return '';
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

// ═══════════════════════════════════════════════════════════════════════════
// AMOUNT EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extract a numeric amount from text, handling Indian number formatting.
 *
 * Indian number system uses lakhs (1,00,000) and crores (1,00,00,000)
 * grouping, unlike the Western system (100,000 and 10,000,000).
 *
 * Examples:
 *   "₹1,23,456.78"    → 123456.78
 *   "Rs. 5,000"        → 5000
 *   "1,500.00"         → 1500.00
 *   "INR 12,34,567"    → 1234567
 *   "50000"            → 50000
 *   "1,23,456"         → 123456 (Indian grouping)
 *   "1,234,567"        → 1234567 (Western grouping)
 *
 * Edge cases handled:
 *   "1,500" — could be 1500 or 1.5 (European). We assume 1500 (Indian/US).
 *   "1.500" — could be 1500 (European) or 1.5. We check context.
 *
 * @param {string} text - Text containing a monetary amount
 * @returns {number | null} - Extracted amount or null
 */
export function extractAmount(text) {
  if (!text || typeof text !== 'string') return null;

  // Remove currency symbols and labels
  let cleaned = text
    .replace(/[₹$€£¥]/g, '')
    .replace(/(?:Rs\.?|INR|USD|EUR|Rupees?)\s*/gi, '')
    .replace(/[\s]/g, '') // Remove all spaces
    .trim();

  if (!cleaned) return null;

  // ── Pattern 1: Number with commas and optional decimal ──
  // Matches: 1,23,456.78  or  1,234,567.89  or  5,000
  const commaMatch = cleaned.match(/^-?([\d,]+)(?:\.(\d{1,2}))?$/);
  if (commaMatch) {
    const intPart = commaMatch[1].replace(/,/g, '');
    const decPart = commaMatch[2] || '';
    const value = parseFloat(decPart ? `${intPart}.${decPart}` : intPart);
    if (!isNaN(value) && value >= 0) return Math.round(value * 100) / 100;
  }

  // ── Pattern 2: Plain number with optional decimal ──
  // Matches: 50000  or  123.45
  const plainMatch = cleaned.match(/^-?(\d+)(?:\.(\d{1,2}))?$/);
  if (plainMatch) {
    const value = parseFloat(plainMatch[0]);
    if (!isNaN(value) && value >= 0) return Math.round(value * 100) / 100;
  }

  // ── Fallback: extract first number-like sequence ──
  const fallback = cleaned.match(/(\d[\d,]*\.?\d*)/);
  if (fallback) {
    const value = parseFloat(fallback[1].replace(/,/g, ''));
    if (!isNaN(value) && value >= 0) return Math.round(value * 100) / 100;
  }

  return null;
}

/**
 * Format an amount for display in Indian locale.
 *
 * @param {number} amount
 * @returns {string} - e.g., "₹1,23,456.78"
 */
export function formatIndianAmount(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) return '₹0.00';

  return '₹' + amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// DATE PARSING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse a date string in multiple formats and return an ISO date string.
 *
 * Supported formats:
 *   DD/MM/YYYY     15/01/2024      → Indian standard
 *   DD-MM-YYYY     15-01-2024      → Indian standard
 *   DD.MM.YYYY     15.01.2024      → European / some Indian
 *   DD/MM/YY       15/01/24        → Short year
 *   YYYY-MM-DD     2024-01-15      → ISO (software-generated)
 *   DD Mon YYYY    15 Jan 2024     → Text month
 *   Mon DD, YYYY   January 15, 24  → US format
 *
 * AMBIGUITY RESOLUTION:
 *   When DD ≤ 12 (e.g., 05/06/2024), it's impossible to distinguish
 *   DD/MM/YYYY from MM/DD/YYYY. We ALWAYS assume DD/MM/YYYY because:
 *     1. This application is for Indian businesses
 *     2. India uses DD/MM/YYYY universally
 *     3. The user can manually correct if wrong
 *
 * @param {string} text - Date string to parse
 * @returns {string | null} - ISO 8601 date string or null
 */
export function parseDate(text) {
  if (!text || typeof text !== 'string') return null;

  const trimmed = text.trim();

  // ── ISO: YYYY-MM-DD or YYYY/MM/DD ──
  const isoMatch = trimmed.match(/(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1]);
    const month = parseInt(isoMatch[2]);
    const day = parseInt(isoMatch[3]);
    const date = safeDate(year, month, day);
    if (date) return date.toISOString();
  }

  // ── DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY ──
  const dmyFull = trimmed.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
  if (dmyFull) {
    const day = parseInt(dmyFull[1]);
    const month = parseInt(dmyFull[2]);
    const year = parseInt(dmyFull[3]);
    // Always DD/MM/YYYY (Indian convention)
    const date = safeDate(year, month, day);
    if (date) return date.toISOString();
  }

  // ── DD/MM/YY (two-digit year) ──
  const dmyShort = trimmed.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2})\b/);
  if (dmyShort) {
    const day = parseInt(dmyShort[1]);
    const month = parseInt(dmyShort[2]);
    let year = parseInt(dmyShort[3]);
    // Expand 2-digit year: 00–49 → 2000–2049, 50–99 → 1950–1999
    year = year < 50 ? 2000 + year : 1900 + year;
    const date = safeDate(year, month, day);
    if (date) return date.toISOString();
  }

  // ── "15 Jan 2024" or "15-Jan-2024" or "15 January 2024" ──
  const dMonthY = trimmed.match(
    /(\d{1,2})[\s\-]+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*[\s,\-]+(\d{2,4})/i
  );
  if (dMonthY) {
    const day = parseInt(dMonthY[1]);
    const monthKey = dMonthY[2].toLowerCase().slice(0, 3);
    const month = MONTH_MAP[monthKey];
    let year = parseInt(dMonthY[3]);
    if (year < 100) year = year < 50 ? 2000 + year : 1900 + year;
    if (month !== undefined) {
      const date = safeDate(year, month + 1, day); // month+1 because safeDate expects 1-indexed
      if (date) return date.toISOString();
    }
  }

  // ── "Jan 15, 2024" or "January 15 2024" ──
  const monthDY = trimmed.match(
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*[\s]+(\d{1,2})[\s,]+(\d{2,4})/i
  );
  if (monthDY) {
    const monthKey = monthDY[1].toLowerCase().slice(0, 3);
    const month = MONTH_MAP[monthKey];
    const day = parseInt(monthDY[2]);
    let year = parseInt(monthDY[3]);
    if (year < 100) year = year < 50 ? 2000 + year : 1900 + year;
    if (month !== undefined) {
      const date = safeDate(year, month + 1, day);
      if (date) return date.toISOString();
    }
  }

  return null;
}

/**
 * Safely create a Date object with validation.
 * Rejects impossible dates like Feb 30, month 13, year 1800.
 *
 * @param {number} year - Full 4-digit year
 * @param {number} month - 1-indexed month (1=Jan, 12=Dec)
 * @param {number} day - Day of month
 * @returns {Date | null} - Valid Date or null
 */
function safeDate(year, month, day) {
  // Basic range checks
  if (year < 1900 || year > 2100) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  // Create date (month is 0-indexed in JS)
  const date = new Date(year, month - 1, day);

  // Verify the date didn't overflow (e.g., Feb 31 → March 3)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  // Reject future dates (bills shouldn't be from the future)
  const now = new Date();
  now.setDate(now.getDate() + 7); // Allow 1 week tolerance for timezone/data-entry
  if (date > now) return null;

  return date;
}

/**
 * Check if a Date object is valid.
 *
 * @param {Date} date
 * @returns {boolean}
 */
export function isValidDate(date) {
  return date instanceof Date && !isNaN(date.getTime());
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIDENCE SCORING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate a confidence score (0–100) for the parsed bill data.
 *
 * The score reflects how many critical fields were successfully extracted
 * and how reliable each extraction appears to be.
 *
 * Weights are based on business importance:
 *   • Total amount (25%) — the most critical field for bill management
 *   • Supplier name (15%) — needed for association
 *   • Date (15%) — needed for sorting and due date tracking
 *   • Line items (15%) — valuable for detailed record-keeping
 *   • Invoice number (10%) — useful for deduplication
 *   • GST number (5%) — tax compliance
 *   • Due date (5%) — payment scheduling
 *   • Subtotal (5%) — financial verification
 *   • Tax (5%) — tax filing support
 *
 * Field-level confidence is 'high', 'low', or 'missing':
 *   'high'    — field extracted cleanly via a labelled/specific pattern
 *   'low'     — field extracted via fallback/heuristic (may be wrong)
 *   'missing' — field not found at all
 *
 * @param {object} parsedData - The parsed bill data object
 * @param {object} [hints] - Optional hints about extraction quality
 * @returns {{ overall: number, fields: object }}
 */
export function calculateConfidence(parsedData, hints = {}) {
  const weights = {
    totalAmount: 25,
    supplierName: 15,
    date: 15,
    items: 15,
    invoiceNumber: 10,
    gstNumber: 5,
    dueDate: 5,
    subtotal: 5,
    tax: 5,
  };

  let score = 0;
  const fieldConfidence = {};

  // ── Total amount ──
  if (parsedData.totalAmount && parsedData.totalAmount > 0) {
    score += weights.totalAmount;
    // 'high' if it was found via a label like "Grand Total: ₹1500"
    // 'low' if it was inferred as the largest number
    fieldConfidence.totalAmount = hints.totalFromLabel ? 'high' : 'low';
    // Even 'low' gets full score — an inferred total is better than nothing
    if (hints.totalFromLabel) {
      fieldConfidence.totalAmount = 'high';
    }
  } else {
    fieldConfidence.totalAmount = 'missing';
  }

  // ── Supplier name ──
  if (parsedData.supplierName && parsedData.supplierName.length > 1) {
    score += weights.supplierName;
    fieldConfidence.supplierName = hints.supplierFromLabel ? 'high' : 'low';
  } else {
    fieldConfidence.supplierName = 'missing';
  }

  // ── Date ──
  if (parsedData.date) {
    score += weights.date;
    fieldConfidence.date = hints.dateFromLabel ? 'high' : 'low';
  } else {
    fieldConfidence.date = 'missing';
  }

  // ── Invoice number ──
  if (parsedData.invoiceNumber) {
    score += weights.invoiceNumber;
    fieldConfidence.invoiceNumber = 'high'; // Always from a label/pattern
  } else {
    fieldConfidence.invoiceNumber = 'missing';
  }

  // ── Line items ──
  if (parsedData.items && parsedData.items.length > 0) {
    const validItems = parsedData.items.filter(
      item => item.name && item.quantity > 0 && item.price > 0
    );
    if (validItems.length > 0) {
      score += weights.items;
      fieldConfidence.items = validItems.length >= 2 ? 'high' : 'low';
    } else {
      score += weights.items * 0.3;
      fieldConfidence.items = 'low';
    }
  } else {
    fieldConfidence.items = 'missing';
  }

  // ── GST number ──
  if (parsedData.gstNumber) {
    // Validate GSTIN structure
    const gstValid = /^\d{2}[A-Z]{5}\d{4}[A-Z]\d[Zz][A-Z\d]$/.test(parsedData.gstNumber);
    score += gstValid ? weights.gstNumber : weights.gstNumber * 0.5;
    fieldConfidence.gstNumber = gstValid ? 'high' : 'low';
  } else {
    fieldConfidence.gstNumber = 'missing';
  }

  // ── Due date ──
  if (parsedData.dueDate) {
    score += weights.dueDate;
    fieldConfidence.dueDate = 'high';
  } else {
    fieldConfidence.dueDate = 'missing';
  }

  // ── Subtotal ──
  if (parsedData.subtotal && parsedData.subtotal > 0) {
    score += weights.subtotal;
    fieldConfidence.subtotal = 'high';
  } else {
    fieldConfidence.subtotal = 'missing';
  }

  // ── Tax ──
  if (parsedData.tax && parsedData.tax > 0) {
    score += weights.tax;
    fieldConfidence.tax = 'high';
  } else {
    fieldConfidence.tax = 'missing';
  }

  // ── Cross-validation bonus ──
  // If subtotal + tax ≈ total, all three are likely correct → boost score
  if (parsedData.subtotal && parsedData.tax && parsedData.totalAmount) {
    const computed = parsedData.subtotal + parsedData.tax;
    const diff = Math.abs(computed - parsedData.totalAmount);
    const tolerance = parsedData.totalAmount * 0.02; // 2% tolerance
    if (diff <= tolerance) {
      // Subtotal + tax = total → strong validation, upgrade to 'high'
      fieldConfidence.totalAmount = 'high';
      fieldConfidence.subtotal = 'high';
      fieldConfidence.tax = 'high';
    }
  }

  return {
    overall: Math.min(Math.round(score), 100),
    fields: fieldConfidence,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// STRING SIMILARITY (FUZZY MATCHING)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Normalize a supplier/company name for comparison.
 * Removes common suffixes, punctuation, extra spaces.
 *
 * "M/s ABC Traders Pvt. Ltd." → "abc"
 * "XYZ Industries (India)" → "xyz india"
 *
 * @param {string} name
 * @returns {string}
 */
export function normalizeCompanyName(name) {
  if (!name || typeof name !== 'string') return '';

  return name
    .trim()
    .toLowerCase()
    // Remove M/s prefix (common in Indian invoices)
    .replace(/^m\/s\.?\s*/i, '')
    // Remove common business suffixes
    .replace(/\b(pvt|private|ltd|limited|llp|llc|inc|incorporated|corp|corporation|co|company|enterprises?|traders?|industries?|solutions?|services?|associates?|agencies?|distributors?|mart|store|group|international|global)\b\.?/gi, '')
    // Remove punctuation
    .replace(/[.,\-_&()\[\]{}'"]/g, ' ')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Levenshtein distance between two strings.
 * Uses optimized two-row algorithm (O(min(m,n)) space instead of O(m×n)).
 *
 * @param {string} a
 * @param {string} b
 * @returns {number} - Edit distance
 */
export function levenshteinDistance(a, b) {
  if (!a || !b) return Math.max((a || '').length, (b || '').length);
  if (a === b) return 0;

  // Ensure a is the shorter string (optimization)
  if (a.length > b.length) [a, b] = [b, a];

  const aLen = a.length;
  const bLen = b.length;

  // Two-row optimization: only keep current and previous rows
  let prevRow = new Array(aLen + 1);
  let currRow = new Array(aLen + 1);

  for (let j = 0; j <= aLen; j++) prevRow[j] = j;

  for (let i = 1; i <= bLen; i++) {
    currRow[0] = i;
    for (let j = 1; j <= aLen; j++) {
      const cost = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1;
      currRow[j] = Math.min(
        prevRow[j] + 1,       // deletion
        currRow[j - 1] + 1,   // insertion
        prevRow[j - 1] + cost  // substitution
      );
    }
    [prevRow, currRow] = [currRow, prevRow]; // Swap rows
  }

  return prevRow[aLen];
}

/**
 * Calculate string similarity ratio (0 to 1).
 * 1 = identical, 0 = completely different.
 *
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function stringSimilarity(a, b) {
  if (!a && !b) return 1;
  if (!a || !b) return 0;

  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;

  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
  return 1 - distance / maxLen;
}

/**
 * Check if string B contains string A as a word-aligned substring.
 * "ABC" in "ABC Traders Pvt Ltd" → true
 * "ABC" in "XABC Trading" → false (not word-aligned)
 *
 * @param {string} needle
 * @param {string} haystack
 * @returns {boolean}
 */
export function containsAsWord(needle, haystack) {
  if (!needle || !haystack) return false;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i').test(haystack);
}
