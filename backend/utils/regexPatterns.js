/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Centralized Regex Patterns for Bill/Invoice Text Parsing
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Designed for Indian invoices (₹, GST, PAN, etc.) but extensible for any locale.
 *
 * REGEX DESIGN PRINCIPLES:
 *   • Patterns are ordered from MOST SPECIFIC to LEAST SPECIFIC — the
 *     parser tries them top-down and takes the first match.
 *   • Capture groups are used consistently:
 *       Group 1 = the value we want (invoice #, amount, date, etc.)
 *       Group 0 = the full match including labels/context
 *   • OCR errors are anticipated in character classes:
 *       [O0] for zero/oh, [Il1|] for one/ell/pipe, [S5] for five/ess
 *   • All patterns use the 'i' flag (case-insensitive) where appropriate.
 */

// ═══════════════════════════════════════════════════════════════════════════
// INVOICE / BILL NUMBER
// ═══════════════════════════════════════════════════════════════════════════
//
// Invoices use wildly inconsistent numbering schemes:
//   INV-2024-001, #A-1234, Bill No. 5678, Receipt/23-24/001,
//   GST/KA/2024/001, 24-25-INV-0042
//
// Strategy: try labelled patterns first (higher confidence), then
// standalone patterns that look like invoice numbers by structure.

export const INVOICE_NUMBER_PATTERNS = [
  // ── Labelled patterns (label + value) ──
  // "Invoice No: INV-2024-001" or "Bill # A/1234"
  /(?:invoice|inv|bill|receipt|memo|voucher|challan|ref|order)[\s.#:_\-]*(?:no|number|num|#|id)?[\s.#:_\-]*([A-Z0-9][\w\-/.]{2,25})/i,

  // "Tax Invoice INV/2024/001"
  /(?:tax\s+)?invoice[\s]*[#:]?\s*([A-Z0-9][\w\-/.]{2,25})/i,

  // "D.C. No: 12345" or "Delivery Challan No. 456"
  /(?:d\.?c\.?|delivery\s*challan)[\s.#:_\-]*(?:no|number)?[\s.#:_\-]*([A-Z0-9][\w\-/.]{2,20})/i,

  // "Proforma Invoice PI-2024-001"
  /(?:proforma|pro[\s-]*forma)[\s]*(?:invoice)?[\s.#:_\-]*([A-Z0-9][\w\-/.]{2,25})/i,

  // ── Standalone structural patterns (no label required) ──
  // INV-2024-001, INV/2024/001
  /\b(INV[\-/]?\d{3,10}(?:[\-/]\d+)*)\b/i,

  // BILL-001, BILL/23-24/001
  /\b(BILL[\-/]?\d{3,10}(?:[\-/]\d+)*)\b/i,

  // REC-001 (receipt)
  /\b(REC[\-/]?\d{3,10})\b/i,

  // VO-001 (voucher)
  /\b(VO[\-/]?\d{3,10})\b/i,

  // Generic "#A-1234" or "#12345"
  /#\s*([A-Z0-9][\w\-/]{3,20})/i,
];

// ═══════════════════════════════════════════════════════════════════════════
// DATE PATTERNS
// ═══════════════════════════════════════════════════════════════════════════
//
// Indian invoices commonly use DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY.
// Software-generated PDFs may use YYYY-MM-DD (ISO) or "15 Jan 2024".
// OCR may misread separators: slashes become pipes, dots vanish, etc.
//
// IMPORTANT: DD/MM/YYYY (Indian) vs MM/DD/YYYY (US) ambiguity.
// If day ≤ 12, we ALWAYS assume DD/MM/YYYY (Indian convention).

export const DATE_PATTERNS = [
  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (most common in India)
  /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/,

  // DD/MM/YY (two-digit year)
  /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2})\b/,

  // YYYY-MM-DD (ISO — from software-generated bills)
  /(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/,

  // "15 Jan 2024" or "15 January 2024" or "15-Jan-2024"
  /(\d{1,2})[\s\-]+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,\-]+(\d{4})/i,

  // "15 Jan 24" (two-digit year)
  /(\d{1,2})[\s\-]+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,\-]+(\d{2})\b/i,

  // "Jan 15, 2024" or "January 15 2024" (US/software format)
  /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s]+(\d{1,2})[\s,]+(\d{4})/i,

  // "Jan 15, 24" (US/software, two-digit year)
  /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s]+(\d{1,2})[\s,]+(\d{2})\b/i,
];

// Labels that typically precede a date value on an invoice
export const DATE_LABEL_PATTERNS = {
  invoice: /(?:invoice\s*date|bill\s*date|date\s*of\s*(?:invoice|bill|issue)|dated?|dt|order\s*date|trans(?:action)?\s*date)[\s.:_\-]*/i,
  due: /(?:due\s*date|payment\s*(?:due|date)|pay\s*(?:by|before)|due\s*(?:on|by|before)|expir(?:y|es?)\s*date|last\s*date)[\s.:_\-]*/i,
};

// ═══════════════════════════════════════════════════════════════════════════
// AMOUNT / CURRENCY PATTERNS
// ═══════════════════════════════════════════════════════════════════════════
//
// Indian currency formatting: ₹1,23,456.78 (lakhs/crores grouping)
//   Pattern: \d{1,3}(,\d{2})*(,\d{3})? — NOT the western \d{1,3}(,\d{3})*
//   But we accept both because many invoices use western grouping too.
//
// OCR common misreads: ₹ → 2, Rs → R5, . → , (period→comma)

export const AMOUNT_PATTERNS = [
  // ₹ 1,23,456.78 or Rs. 1,23,456.78 or INR 1,23,456.78
  /(?:₹|Rs\.?|INR|Rupees?)\s*([\d,]+\.?\d{0,2})/i,

  // "Rupees One Lakh Twenty Three Thousand" — skip words-to-number (too complex)

  // 1,23,456.78 (with decimal — high confidence)
  /([\d,]+\.\d{2})\b/,

  // 1,23,456 (Indian grouping without decimal — medium confidence)
  /\b(\d{1,3}(?:,\d{2})*(?:,\d{3})?)\b/,

  // Plain numbers ≥ 3 digits (low confidence fallback)
  /\b(\d{3,}(?:\.\d{1,2})?)\b/,
];

// ── Amount Label Patterns ──

// Labels for the TOTAL amount (most important field)
export const TOTAL_LABEL_PATTERNS = [
  /\b(?:grand\s*total|net\s*(?:total|amount|payable)|total\s*(?:amount|payable|due)|amount\s*(?:due|payable)|bill\s*(?:amount|total)|invoice\s*total|total\s*rs|total\s*₹|balance\s*due)\b/i,
  /\b(?:total)\b(?!.*(?:qty|quantity|items?|pieces?|pcs|weight|wt))/i, // "total" but not "total qty"
];

// Labels for subtotal
export const SUBTOTAL_LABEL_PATTERNS = [
  /\b(?:sub[\s\-]*total|subtotal|taxable\s*(?:amount|value)|base\s*(?:amount|value)|before\s*tax|pre[\s\-]*tax)\b/i,
];

// Labels for tax — important: accumulate CGST + SGST + IGST
export const TAX_LABEL_PATTERNS = [
  // Specific GST tax types (India)
  /\b(?:cgst|sgst|igst|utgst)\b[\s@]*(?:\d+\.?\d*\s*%)?/i,
  // Generic tax labels
  /\b(?:gst\s*(?:amount)?|tax\s*(?:amount)?|vat|service\s*tax|total\s*tax|tax\s*total|cess)\b/i,
];

// Labels for discount
export const DISCOUNT_LABEL_PATTERNS = [
  /\b(?:discount|disc|less|rebate|off|concession|trade\s*discount)\b/i,
];

// ═══════════════════════════════════════════════════════════════════════════
// GST NUMBER (Indian GSTIN)
// ═══════════════════════════════════════════════════════════════════════════
//
// GSTIN format: 2-digit state code + PAN (10 chars) + entity code + Z + checksum
//   Position:    1-2          3-12            13       14     15
//   Pattern:     \d{2}      [A-Z]{5}\d{4}[A-Z]  \d       Z    [A-Z\d]
//
// BREAKDOWN:
//   Pos 1-2:   State code (01–37, plus special codes)
//              01=Jammu&Kashmir, 27=Maharashtra, 29=Karnataka, 33=Tamil Nadu, etc.
//   Pos 3-7:   First 5 chars of PAN — ALWAYS LETTERS
//              4th char indicates entity type: C=Company, P=Person, F=Firm, etc.
//   Pos 8-11:  Last 5 chars of PAN — 4 DIGITS + 1 LETTER
//   Pos 12:    PAN last char (letter)
//   Pos 13:    Entity number (1-9 for multiple registrations under same PAN)
//   Pos 14:    ALWAYS 'Z' (reserved for future use)
//   Pos 15:    Check digit (alphanumeric, computed via Luhn mod 36)
//
// Valid GSTIN examples:
//   27AAACB1234F1Z5  (Maharashtra, Company)
//   29ABCDE1234F1ZP  (Karnataka, Trust)
//   07AAACR5055K1ZK  (Delhi)
//
// Invalid patterns to reject:
//   00AAAAA0000A0ZA  (state code 00 is invalid)
//   27AAACB1234F1A5  (position 14 must be Z)

export const GST_PATTERN = /\b(\d{2}[A-Z]{5}\d{4}[A-Z]\d[Zz][A-Z\d])\b/;

// More lenient GST pattern to catch OCR errors (O→0, I→1, etc.)
export const GST_PATTERN_LENIENT = /\b(\d{2}[A-Z0-9]{5}\d{4}[A-Z0-9]\d[Zz][A-Z0-9])\b/;

// Labels that precede a GSTIN
export const GST_LABEL_PATTERN = /(?:gst(?:in)?|gstn|gst[\s]*(?:no|number|#|id)|tax[\s]*(?:id|identification)|tin)[\s.:_#\-]*/i;

// ═══════════════════════════════════════════════════════════════════════════
// PAN NUMBER (Indian Permanent Account Number)
// ═══════════════════════════════════════════════════════════════════════════
//
// PAN format: 5 LETTERS + 4 DIGITS + 1 LETTER
//   Pos 1-3: Random alpha
//   Pos 4:   Entity type (C=Company, P=Person, H=HUF, F=Firm, A=AOP, T=Trust, etc.)
//   Pos 5:   First letter of surname/entity name
//   Pos 6-9: Sequential digits (0001–9999)
//   Pos 10:  Alphabetic check digit

export const PAN_PATTERN = /\b([A-Z]{5}\d{4}[A-Z])\b/;
export const PAN_LABEL_PATTERN = /(?:pan|pan[\s]*(?:no|number|#|card))[\s.:_#\-]*/i;

// ═══════════════════════════════════════════════════════════════════════════
// PHONE NUMBER (Indian)
// ═══════════════════════════════════════════════════════════════════════════
//
// Indian mobile: 10 digits starting with 6-9
// With country code: +91 or 0
// May have spaces, dashes, or no separator

export const PHONE_PATTERNS = [
  // Labelled: "Phone: +91 98765 43210" or "Mob: 9876543210"
  /(?:ph(?:one)?|mob(?:ile)?|tel|contact|call|cell)[\s.:_\-]*(?:\+?91[\s\-]?)?0?([6-9]\d{9})/i,

  // Labelled with formatted number: "Ph: 98765-43210"
  /(?:ph(?:one)?|mob(?:ile)?|tel|contact)[\s.:_\-]*(?:\+?91[\s\-]?)?0?([6-9]\d{4}[\s\-]\d{5})/i,

  // Standalone +91 prefix
  /\+91[\s\-]?([6-9]\d{9})/,
  /\+91[\s\-]?([6-9]\d{4}[\s\-]\d{5})/,

  // Bare 10-digit mobile (lowest priority — may catch false positives)
  /\b([6-9]\d{9})\b/,
];

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL
// ═══════════════════════════════════════════════════════════════════════════

export const EMAIL_PATTERN = /\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b/;

// ═══════════════════════════════════════════════════════════════════════════
// LINE ITEM PATTERNS (table row parsing)
// ═══════════════════════════════════════════════════════════════════════════
//
// Invoices present line items in wildly different table formats.
// We handle the most common ones:
//
//   Format 1: "Widget ABC    10    150.00    1500.00"  (name, qty, rate, amount)
//   Format 2: "1. Widget ABC  10  150.00  1500.00"    (serial #, name, qty, rate, amount)
//   Format 3: "10 x Widget ABC @ ₹150"                (qty × name @ rate)
//   Format 4: "Widget ABC - Qty: 10, Price: ₹150"     (key-value style)
//   Format 5: "Widget ABC  10 pcs  ₹150.00  ₹1500"   (with unit)

export const LINE_ITEM_PATTERNS = [
  // Format 1: "Item Name    qty    rate    amount" (space-separated columns)
  /^(.+?)\s{2,}(\d+(?:\.\d+)?)\s+(?:₹|Rs\.?\s*)?([\d,]+(?:\.\d{1,2})?)\s+(?:₹|Rs\.?\s*)?([\d,]+(?:\.\d{1,2})?)$/,

  // Format 2: "1. Item Name   qty   rate   amount" (serial numbered)
  /^\d+[.)]\s*(.+?)\s{2,}(\d+(?:\.\d+)?)\s+(?:₹|Rs\.?\s*)?([\d,]+(?:\.\d{1,2})?)\s+(?:₹|Rs\.?\s*)?([\d,]+(?:\.\d{1,2})?)$/,

  // Format 3: "qty x Item @ rate" or "qty × Item @ ₹rate"
  /^(\d+(?:\.\d+)?)\s*[xX×]\s*(.+?)\s*[@]\s*(?:₹|Rs\.?\s*)?([\d,]+(?:\.\d{1,2})?)$/,

  // Format 4: "Item - Qty: 10, Price: 150" (key-value)
  /^(.+?)\s*[-–]\s*(?:qty|quantity)[\s:]*(\d+(?:\.\d+)?)\s*,?\s*(?:price|rate|amt|amount)[\s:]*(?:₹|Rs\.?\s*)?([\d,]+(?:\.\d{1,2})?)$/i,

  // Format 5: "Item Name  qty unit  ₹rate  ₹amount" (with unit column)
  /^(.+?)\s{2,}(\d+(?:\.\d+)?)\s*(?:pcs|nos|kg|ltr|box|pack|set|pair|doz|unit|mtr|btl)\s+(?:₹|Rs\.?\s*)?([\d,]+(?:\.\d{1,2})?)\s+(?:₹|Rs\.?\s*)?([\d,]+(?:\.\d{1,2})?)$/i,

  // Format 6: HSN-code based (common in GST invoices)
  // "12345678  Item Name  10  150.00  1500.00"
  /^\d{4,8}\s+(.+?)\s{2,}(\d+(?:\.\d+)?)\s+(?:₹|Rs\.?\s*)?([\d,]+(?:\.\d{1,2})?)\s+(?:₹|Rs\.?\s*)?([\d,]+(?:\.\d{1,2})?)$/,
];

// Header patterns — lines matching these are TABLE HEADERS, not items
export const TABLE_HEADER_PATTERNS = [
  /^\s*(?:s\.?\s*no|sr\.?\s*no|sl\.?\s*no|#|serial)\s/i,
  /(?:description|particular|item\s*name|product)\s+(?:qty|quantity|rate|price|amount)/i,
  /(?:qty|quantity)\s+(?:rate|price|unit)\s+(?:amount|total|value)/i,
  /\b(?:hsn|sac)\s*(?:code)?\s+(?:description|item)/i,
];

// ═══════════════════════════════════════════════════════════════════════════
// SUPPLIER / COMPANY NAME
// ═══════════════════════════════════════════════════════════════════════════

export const SUPPLIER_LABEL_PATTERNS = [
  /(?:from|supplier|vendor|seller|company|firm|shop|store|billed\s*by|sold\s*by|issued\s*by|m\/s|messrs?)[\s.:_\-]*/i,
];

// Patterns that indicate a line is a company name (heuristic)
export const COMPANY_SUFFIX_PATTERNS = [
  /\b(?:pvt\.?\s*ltd\.?|private\s*limited|limited|llp|llc|inc\.?|corp\.?|co\.?|enterprises?|traders?|industries?|solutions?|services?|associates?|agencies?|distributors?|suppliers?|exporters?|importers?|mart|store|emporium|hub|zone|house|group|international|global)\b/i,
];

// ═══════════════════════════════════════════════════════════════════════════
// ADDRESS
// ═══════════════════════════════════════════════════════════════════════════

export const ADDRESS_PATTERNS = [
  // Indian PIN code (6 digits) at end of line
  /(.+?[\s,]+\d{6})\b/,
  // Labelled address
  /(?:address|addr|regd\.?\s*off(?:ice)?|reg(?:istered)?\s*off(?:ice)?)[\s.:_\-]*(.+)/i,
];

// Indian state names for address detection
export const INDIAN_STATES_PATTERN = /\b(?:Andhra\s*Pradesh|Arunachal|Assam|Bihar|Chhattisgarh|Goa|Gujarat|Haryana|Himachal|Jharkhand|Karnataka|Kerala|Madhya\s*Pradesh|Maharashtra|Manipur|Meghalaya|Mizoram|Nagaland|Odisha|Orissa|Punjab|Rajasthan|Sikkim|Tamil\s*Nadu|Telangana|Tripura|Uttar\s*Pradesh|Uttarakhand|West\s*Bengal|Delhi|Chandigarh|Puducherry|Pondicherry|Jammu|Kashmir|Ladakh)\b/i;

// ═══════════════════════════════════════════════════════════════════════════
// UNIT KEYWORDS
// ═══════════════════════════════════════════════════════════════════════════

export const UNIT_KEYWORDS = [
  // Piece-based
  'pcs', 'pieces', 'piece', 'pc',
  // Weight
  'kg', 'kgs', 'kilogram', 'kilograms',
  'g', 'gm', 'gms', 'gram', 'grams',
  'quintal', 'qtl', 'ton', 'tonne',
  // Volume
  'l', 'ltr', 'ltrs', 'litre', 'litres', 'liter', 'liters',
  'ml', 'mls', 'millilitre',
  // Packaging
  'box', 'boxes', 'bx',
  'pack', 'packs', 'pkt', 'pkts', 'packet', 'packets',
  'carton', 'cartons', 'ctn',
  'bundle', 'bundles', 'bdl',
  'case', 'cases',
  // Count-based
  'doz', 'dozen', 'dozens',
  'unit', 'units',
  'nos', 'no', 'number', 'numbers',
  'set', 'sets',
  'pair', 'pairs',
  'ream', 'reams',
  // Containers
  'roll', 'rolls',
  'bag', 'bags',
  'can', 'cans',
  'bottle', 'bottles', 'btl',
  'jar', 'jars',
  'drum', 'drums',
  'tin', 'tins',
  // Length
  'meter', 'meters', 'mtr', 'mtrs', 'm',
  'ft', 'feet', 'foot',
  'inch', 'inches', 'in',
  'cm', 'centimeter',
  'yard', 'yards', 'yd',
  // Area
  'sqft', 'sq.ft', 'sqm', 'sq.m',
];

// Unit normalization map — maps variants to canonical unit names
export const UNIT_NORMALIZATION = {
  pcs: 'pcs', pieces: 'pcs', piece: 'pcs', pc: 'pcs', nos: 'pcs', no: 'pcs',
  kg: 'kg', kgs: 'kg', kilogram: 'kg', kilograms: 'kg',
  g: 'g', gm: 'g', gms: 'g', gram: 'g', grams: 'g',
  l: 'L', ltr: 'L', ltrs: 'L', litre: 'L', litres: 'L', liter: 'L', liters: 'L',
  ml: 'mL', mls: 'mL',
  box: 'box', boxes: 'box', bx: 'box',
  pack: 'pack', packs: 'pack', pkt: 'pack', pkts: 'pack', packet: 'pack', packets: 'pack',
  doz: 'doz', dozen: 'doz', dozens: 'doz',
  set: 'set', sets: 'set',
  pair: 'pair', pairs: 'pair',
  roll: 'roll', rolls: 'roll',
  bag: 'bag', bags: 'bag',
  bottle: 'bottle', bottles: 'bottle', btl: 'bottle',
  meter: 'm', meters: 'm', mtr: 'm', mtrs: 'm', m: 'm',
  ft: 'ft', feet: 'ft', foot: 'ft',
  unit: 'unit', units: 'unit',
};
