/* eslint-disable */
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Line Item Extractor — Intelligent Table Row Parser
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * WHY LINE ITEM EXTRACTION IS THE HARDEST PART OF BILL PARSING:
 * ──────────────────────────────────────────────────────────────
 *
 *   1. NO STANDARD FORMAT
 *      Every business uses different table layouts:
 *        "Widget ABC    10    150.00    1500.00"    ← space-aligned columns
 *        "1. Widget ABC  10pcs  ₹150  ₹1500"       ← serial number + unit
 *        "Widget ABC x 10 @ Rs.150 = Rs.1500"      ← inline formula
 *        "Widget ABC|10|150.00|1500.00"             ← pipe-delimited
 *        "Widget ABC  Qty:10  Rate:150"             ← key-value pairs
 *
 *   2. OCR COLUMN MISALIGNMENT
 *      Tesseract reads left-to-right, line-by-line. When table columns
 *      don't align perfectly (common in thermal receipts), OCR merges
 *      adjacent columns or splits one cell across two lines:
 *
 *        ORIGINAL IMAGE:          OCR OUTPUT:
 *        ┌──────────┬───┬──────┐
 *        │Widget ABC│ 10│150.00│  "Widget ABC 10150.00"  ← columns merged
 *        │Iron Rod  │  5│ 80.00│  "Iron Rod"             ← split across
 *        │          │   │      │  "5 80.00"                 two lines
 *        └──────────┴───┴──────┘
 *
 *   3. AMBIGUOUS NUMBERS
 *      A line like "Bolt M10 Grade 8.8  2  45.50  91.00" has 5 numbers:
 *        10 (part of name), 8.8 (grade), 2 (qty), 45.50 (rate), 91.00 (total)
 *      The parser must figure out WHICH numbers are qty/rate/total.
 *
 *   4. MULTI-LINE ITEM DESCRIPTIONS
 *      Some invoices wrap long item names across 2-3 lines:
 *        "Stainless Steel Pipe"       ← description line 1
 *        "304 Grade, 2 inch, 6 meter" ← description line 2
 *        "  5   1200.00   6000.00"    ← numbers on a separate line
 *
 *   5. SUMMARY LINES LOOK LIKE ITEMS
 *      "Subtotal  1500.00" has the same structure as an item row.
 *      "CGST @ 9%  135.00" looks like "item_name qty price".
 *      We must skip these using keyword blacklists.
 *
 *   6. MIXED CONTENT
 *      Bills mix items with notes, terms, bank details, and footers.
 *      The item table is usually in the MIDDLE of the document,
 *      bracketed by headers above and totals below.
 *
 * OUR MULTI-PASS STRATEGY:
 * ────────────────────────
 *   Pass 1: Try structured regex patterns (highest confidence)
 *   Pass 2: Detect table boundaries, then parse rows by column position
 *   Pass 3: Tokenize each line — find numeric clusters at the end
 *   Pass 4: Look for key-value formatted items ("Qty: 10, Price: 150")
 *   Pass 5: Heuristic — any line with 2+ trailing numbers in bottom 60%
 *
 * EDGE CASES HANDLED:
 *   • Serial numbers at line start (1., 2), 3-, etc.)
 *   • HSN/SAC codes before item name (8-digit codes)
 *   • Unit embedded in quantity ("10 pcs", "5 kg", "2 doz")
 *   • Currency symbols before prices ("₹150", "Rs. 150")
 *   • Indian comma grouping ("1,50,000.00")
 *   • Items with no quantity (services: "Consultation  5000.00")
 *   • Negative amounts (returns/credits)
 */

import {
  LINE_ITEM_PATTERNS, TABLE_HEADER_PATTERNS,
  TOTAL_LABEL_PATTERNS, SUBTOTAL_LABEL_PATTERNS,
  TAX_LABEL_PATTERNS, DISCOUNT_LABEL_PATTERNS,
  UNIT_KEYWORDS, UNIT_NORMALIZATION,
} from '../utils/regexPatterns.js';

import { extractAmount } from '../utils/parserHelpers.js';

// ─── Configuration ───────────────────────────────────────────────────────────

const CONFIG = {
  /** Minimum line length to consider as a potential item */
  minLineLength: 5,
  /** Maximum item name length (beyond this, it's probably not an item) */
  maxNameLength: 120,
  /** Minimum item name length */
  minNameLength: 1,
  /** Maximum reasonable quantity */
  maxQuantity: 99999,
  /** Maximum reasonable unit price (₹) */
  maxPrice: 99999999,
  /** Minimum numbers at end of line to qualify as a table row */
  minTrailingNumbers: 2,
};

// Keywords that disqualify a line from being an item
const SKIP_KEYWORDS = [
  /^(s\.?\s*no|sr\.?\s*no|sl\.?\s*no|serial|#)\b/i,
  /^(description|particular|item\s*name|product|goods)\b/i,
  /^(qty|quantity|rate|price|amount|total|value|unit)\b/i,
  /^(hsn|sac)\s*(code|no)?\b/i,
  /\b(sub\s*total|subtotal|grand\s*total|net\s*total|net\s*amount|amount\s*due|total\s*amount)\b/i,
  /\b(cgst|sgst|igst|utgst|vat|tax|cess)\b/i,
  /\b(discount|rebate|round\s*off|rounding)\b/i,
  /\b(balance|advance|paid|received|payment)\b/i,
  /\b(terms|conditions|note|remark|bank|account|ifsc|upi)\b/i,
  /\b(thank|regards|authorized|signature|e\.?\s*&?\s*o\.?\s*e)\b/i,
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extract line items from OCR text lines.
 *
 * Returns items with per-item confidence scoring:
 *   'high'   — extracted via a labelled/structured pattern
 *   'medium' — extracted via table detection or tokenization
 *   'low'    — extracted via heuristic fallback
 *
 * @param {string[]} lines - Cleaned text lines
 * @returns {Array<{
 *   name: string,
 *   quantity: number,
 *   price: number,
 *   total: number | null,
 *   unit: string,
 *   confidence: 'high' | 'medium' | 'low',
 *   source: string
 * }>}
 */
export function extractLineItems(lines) {
  // Pass 1: Structured regex patterns
  let items = pass1_structuredPatterns(lines);
  if (items.length > 0) return items;

  // Pass 2: Table boundary detection + column parsing
  items = pass2_tableBoundary(lines);
  if (items.length > 0) return items;

  // Pass 3: Tokenization — find trailing number clusters
  items = pass3_tokenization(lines);
  if (items.length > 0) return items;

  // Pass 4: Key-value style ("Qty: 10, Price: 150")
  items = pass4_keyValue(lines);
  if (items.length > 0) return items;

  // Pass 5: Aggressive heuristic — any line with numbers
  items = pass5_heuristic(lines);

  return items;
}

// ═══════════════════════════════════════════════════════════════════════════
// PASS 1 — Structured Regex Patterns (Highest Confidence)
// ═══════════════════════════════════════════════════════════════════════════
//
// Matches lines against pre-defined table formats from regexPatterns.js.
// These patterns require specific structure (separators, column order)
// and therefore have the highest confidence.

function pass1_structuredPatterns(lines) {
  const items = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!isValidItemLine(trimmed)) continue;

    for (const pattern of LINE_ITEM_PATTERNS) {
      const match = trimmed.match(pattern);
      if (!match) continue;

      let item = null;

      if (match.length >= 5) {
        // name, qty, rate, amount
        item = buildItem(match[1], match[2], match[3], match[4], 'high', 'regex_structured');
      } else if (match.length === 4 && /^\d/.test(match[1])) {
        // qty × name @ rate (format 3)
        item = buildItem(match[2], match[1], match[3], null, 'high', 'regex_qty_x_name');
      } else if (match.length === 4) {
        // name, qty, price
        item = buildItem(match[1], match[2], match[3], null, 'high', 'regex_name_qty_price');
      }

      if (item) { items.push(item); break; }
    }
  }

  return items;
}

// ═══════════════════════════════════════════════════════════════════════════
// PASS 2 — Table Boundary Detection + Column Parsing
// ═══════════════════════════════════════════════════════════════════════════
//
// Strategy:
//   1. Find table header row (contains "Qty", "Rate", "Amount", etc.)
//   2. Find table footer (first "Total"/"Subtotal" line after header)
//   3. Parse every line between header and footer as a data row
//
// This handles the common case where items are between a header and totals.

function pass2_tableBoundary(lines) {
  const items = [];

  // Find header row index
  let headerIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (isTableHeader(lines[i])) {
      headerIdx = i;
      break;
    }
  }

  if (headerIdx === -1) return items;

  // Find footer row (total/subtotal after header)
  let footerIdx = lines.length;
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    if (/\b(sub\s*total|subtotal|grand\s*total|total|net\s*amount)\b/i.test(lower)) {
      footerIdx = i;
      break;
    }
  }

  // Parse data rows between header and footer
  for (let i = headerIdx + 1; i < footerIdx; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed || trimmed.length < CONFIG.minLineLength) continue;
    if (isTableHeader(trimmed)) continue;
    if (shouldSkipLine(trimmed)) continue;

    // Try structured patterns first
    let found = false;
    for (const pattern of LINE_ITEM_PATTERNS) {
      const match = trimmed.match(pattern);
      if (match) {
        const item = match.length >= 5
          ? buildItem(match[1], match[2], match[3], match[4], 'high', 'table_regex')
          : buildItem(match[1], match[2], match[3], null, 'high', 'table_regex');
        if (item) { items.push(item); found = true; break; }
      }
    }

    // If no pattern matched, try tokenization on this row
    if (!found) {
      const item = tokenizeLine(trimmed, 'medium', 'table_tokenized');
      if (item) items.push(item);
    }
  }

  return items;
}

// ═══════════════════════════════════════════════════════════════════════════
// PASS 3 — Tokenization (Trailing Number Detection)
// ═══════════════════════════════════════════════════════════════════════════
//
// Strategy:
//   1. Split each line into tokens (words/numbers)
//   2. Find the rightmost cluster of numeric tokens
//   3. Everything before the numbers = item name
//   4. Assign numbers to qty, rate, total by position
//
// This handles misaligned columns where spacing is inconsistent.

function pass3_tokenization(lines) {
  const items = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!isValidItemLine(trimmed)) continue;

    const item = tokenizeLine(trimmed, 'medium', 'tokenization');
    if (item) items.push(item);
  }

  return items;
}

/**
 * Tokenize a single line and extract item data from trailing numbers.
 *
 * @param {string} line - The text line to parse
 * @param {'high'|'medium'|'low'} confidence - Confidence level to assign
 * @param {string} source - Source label for debugging
 * @returns {object|null} - Extracted item or null
 */
function tokenizeLine(line, confidence, source) {
  // Strip serial number prefix: "1.", "2)", "3-", "(4)"
  let cleaned = line.replace(/^\s*\(?(\d{1,3})[.):\-]\)?\s*/, '');

  // Strip HSN/SAC code prefix: 8-digit number at start
  cleaned = cleaned.replace(/^\d{4,8}\s+/, '');

  // Strip currency symbols for easier parsing
  const forParsing = cleaned.replace(/[₹]/g, '').replace(/Rs\.?\s*/gi, '');

  // Split into tokens
  const tokens = forParsing.split(/\s+/).filter(t => t.length > 0);
  if (tokens.length < 2) return null;

  // Classify each token as numeric or text
  const classified = tokens.map(t => ({
    raw: t,
    value: parseNumericToken(t),
    isNumeric: parseNumericToken(t) !== null,
  }));

  // Find the rightmost contiguous block of numeric tokens
  let numEnd = classified.length - 1;
  while (numEnd >= 0 && !classified[numEnd].isNumeric) numEnd--;
  if (numEnd < 0) return null;

  let numStart = numEnd;
  while (numStart > 0 && classified[numStart - 1].isNumeric) numStart--;

  const numericTokens = classified.slice(numStart, numEnd + 1);
  const textTokens = classified.slice(0, numStart);

  // Need at least 1 text token (name) and 2 numeric tokens (qty + price)
  if (textTokens.length < 1 || numericTokens.length < CONFIG.minTrailingNumbers) return null;

  // Build item name from text tokens
  const name = textTokens
    .map(t => t.raw)
    .join(' ')
    .trim()
    .replace(/\s+/g, ' ');

  if (!name || name.length < CONFIG.minNameLength || name.length > CONFIG.maxNameLength) return null;
  if (shouldSkipLine(name)) return null;

  // Assign numbers based on count
  const nums = numericTokens.map(t => t.value);
  let qty, price, total;

  if (nums.length >= 3) {
    // 3+ numbers: qty, rate, total (take last 3)
    const last3 = nums.slice(-3);
    qty = last3[0];
    price = last3[1];
    total = last3[2];

    // Validate: qty × price ≈ total (within 5% tolerance)
    if (qty > 0 && price > 0 && total > 0) {
      const computed = qty * price;
      const diff = Math.abs(computed - total) / total;
      if (diff > 0.05) {
        // Mismatch — try swapping: maybe it's rate, qty, total
        const altComputed = last3[1] * last3[0];
        const altDiff = Math.abs(altComputed - total) / total;
        if (altDiff <= 0.05) {
          qty = last3[1];
          price = last3[0];
        }
        // If still mismatched, keep original assignment but lower confidence
        confidence = 'low';
      }
    }
  } else if (nums.length === 2) {
    // 2 numbers: could be qty+price or price+total
    // Heuristic: if first number is small (≤ 999) and second is large, it's qty + price
    if (nums[0] <= 999 && nums[1] > nums[0]) {
      qty = nums[0];
      price = nums[1];
      total = qty * price;
    } else {
      // Assume price and total
      price = nums[0];
      total = nums[1];
      qty = total > 0 && price > 0 ? Math.round((total / price) * 100) / 100 : 1;
    }
  } else {
    return null;
  }

  return buildItem(name, String(qty), String(price), total != null ? String(total) : null, confidence, source);
}

/**
 * Parse a token as a numeric value, handling commas and currency.
 * Returns null if the token is not a number.
 */
function parseNumericToken(token) {
  // Remove commas and currency symbols
  const cleaned = token.replace(/[₹,]/g, '').replace(/Rs\.?\s*/gi, '');
  // Must look like a number
  if (!/^\d+(?:\.\d{1,2})?$/.test(cleaned)) return null;
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

// ═══════════════════════════════════════════════════════════════════════════
// PASS 4 — Key-Value Style
// ═══════════════════════════════════════════════════════════════════════════
//
// Handles format: "Item Name - Qty: 10, Price: ₹150, Total: ₹1500"

function pass4_keyValue(lines) {
  const items = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 10) continue;
    if (shouldSkipLine(trimmed)) continue;

    // Look for key-value patterns
    const qtyMatch = trimmed.match(/(?:qty|quantity|nos)[\s.:=]*(\d+(?:\.\d+)?)/i);
    const priceMatch = trimmed.match(/(?:price|rate|unit\s*price|unit\s*rate|mrp)[\s.:=]*(?:₹|Rs\.?\s*)?(\d[\d,]*(?:\.\d{1,2})?)/i);

    if (qtyMatch && priceMatch) {
      // Extract item name (everything before the first key-value pair)
      let name = trimmed
        .replace(/(?:qty|quantity|nos|price|rate|unit\s*price|mrp|total|amount)[\s.:=]*(?:₹|Rs\.?\s*)?\d[\d,]*(?:\.\d{1,2})?/gi, '')
        .replace(/[\-–,]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (name.length < CONFIG.minNameLength) continue;

      const qty = parseFloat(qtyMatch[1]);
      const price = parseFloat(priceMatch[1].replace(/,/g, ''));

      const item = buildItem(name, String(qty), String(price), null, 'medium', 'key_value');
      if (item) items.push(item);
    }
  }

  return items;
}

// ═══════════════════════════════════════════════════════════════════════════
// PASS 5 — Heuristic Fallback (Lowest Confidence)
// ═══════════════════════════════════════════════════════════════════════════
//
// Last resort: scan the bottom 60% of the document for any line that
// has text followed by at least 1 number that looks like a price.
// These are likely items but with low confidence.

function pass5_heuristic(lines) {
  const items = [];
  // For short docs (< 15 lines), scan everything. For longer docs, focus on middle.
  const startIdx = lines.length < 15 ? 0 : Math.floor(lines.length * 0.15);
  const endIdx = lines.length < 15 ? lines.length : Math.floor(lines.length * 0.85);

  for (let i = startIdx; i < endIdx && i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed || trimmed.length < 8) continue;
    if (shouldSkipLine(trimmed)) continue;
    if (isTableHeader(trimmed)) continue;

    // Pattern A: "Some text    123.45" (2+ spaces before number)
    let match = trimmed.match(
      /^(.{3,60}?)\s{2,}(?:₹|Rs\.?\s*)?([\d,]+(?:\.\d{1,2})?)\s*$/
    );

    // Pattern B: "Some text 123.45" (1 space, but number has decimal = likely a price)
    if (!match) {
      match = trimmed.match(
        /^(.{3,60}?)\s+(?:₹|Rs\.?\s*)?([\d,]+\.\d{2})\s*$/
      );
    }

    if (match) {
      const name = match[1].trim();
      const amount = extractAmount(match[2]);
      if (name && amount && amount > 0 && !shouldSkipLine(name)) {
        items.push({
          name,
          quantity: 1,
          price: Math.round(amount * 100) / 100,
          total: Math.round(amount * 100) / 100,
          unit: 'unit',
          confidence: 'low',
          source: 'heuristic_single_amount',
        });
      }
    }
  }

  return items;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build a validated item object.
 * Returns null if the item fails validation.
 */
function buildItem(nameStr, qtyStr, priceStr, totalStr, confidence, source) {
  let name = (nameStr || '').trim().replace(/\s+/g, ' ');

  // Remove serial number prefix if it leaked through
  name = name.replace(/^\d{1,3}[.):\-]\s*/, '');
  // Remove trailing punctuation
  name = name.replace(/[\s.,;:\-]+$/, '');

  if (!name || name.length < CONFIG.minNameLength || name.length > CONFIG.maxNameLength) return null;

  const qty = parseFloat((qtyStr || '').toString().replace(/,/g, ''));
  const price = parseFloat((priceStr || '').toString().replace(/,/g, ''));

  if (isNaN(qty) || qty <= 0 || qty > CONFIG.maxQuantity) return null;
  if (isNaN(price) || price <= 0 || price > CONFIG.maxPrice) return null;

  // Calculate or validate total
  let total = null;
  if (totalStr) {
    total = parseFloat(totalStr.replace(/,/g, ''));
    if (isNaN(total) || total <= 0) {
      total = qty * price;
    }
  } else {
    total = qty * price;
  }
  total = Math.round(total * 100) / 100;

  // Cross-validate: if total was provided, check qty × price ≈ total
  if (totalStr) {
    const computed = qty * price;
    const diff = Math.abs(computed - total);
    const tolerance = total * 0.05; // 5% tolerance for rounding
    if (diff > tolerance && diff > 1) {
      // Mismatch — could be OCR error; keep the provided total but lower confidence
      if (confidence === 'high') confidence = 'medium';
    }
  }

  // Detect unit from name
  let unit = 'unit';
  const nameLower = name.toLowerCase();
  for (const u of UNIT_KEYWORDS) {
    // Match as whole word to avoid "bag" matching in "cabbage"
    const regex = new RegExp(`\\b${u}\\b`, 'i');
    if (regex.test(nameLower)) {
      unit = UNIT_NORMALIZATION[u] || u;
      break;
    }
  }

  return {
    name,
    quantity: qty,
    price: Math.round(price * 100) / 100,
    total,
    unit,
    confidence,
    source,
  };
}

/**
 * Check if a line should be skipped (header, footer, summary, etc.)
 */
function shouldSkipLine(line) {
  return SKIP_KEYWORDS.some(p => p.test(line));
}

/**
 * Check if a line is a valid candidate for an item row.
 */
function isValidItemLine(line) {
  if (!line || line.length < CONFIG.minLineLength) return false;
  if (isTableHeader(line)) return false;
  if (shouldSkipLine(line)) return false;
  // Skip lines that match total/subtotal/tax labels
  const allSummaryPatterns = [
    ...TOTAL_LABEL_PATTERNS,
    ...SUBTOTAL_LABEL_PATTERNS,
    ...TAX_LABEL_PATTERNS,
    ...DISCOUNT_LABEL_PATTERNS,
  ];
  if (allSummaryPatterns.some(p => p.test(line))) return false;
  return true;
}

/**
 * Check if a line is a table header row.
 */
function isTableHeader(line) {
  return TABLE_HEADER_PATTERNS.some(p => p.test(line));
}

export default { extractLineItems };
