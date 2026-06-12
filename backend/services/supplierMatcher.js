/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Supplier Matcher Service — Fuse.js-Powered Fuzzy Matching
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Matches OCR-extracted supplier names against existing suppliers in MongoDB.
 *
 * Features:
 *   • Fuse.js fuzzy search with tuned thresholds for invoice text
 *   • Multi-strategy matching: exact → normalized → Fuse.js fuzzy → word-overlap
 *   • Alias expansion (common abbreviations: "TRDRS" → "TRADERS", etc.)
 *   • Confidence scoring (0–1) with configurable thresholds
 *   • Alternative matches for ambiguous cases
 *   • Duplicate prevention via normalization + caching
 *   • GST number cross-matching for higher confidence
 *
 * Returns:
 *   { matchedSupplier, confidence, alternatives, matchType }
 */

import Fuse from 'fuse.js';
import Supplier from '../models/Supplier.js';
import {
  normalizeCompanyName,
  stringSimilarity,
  containsAsWord,
} from '../utils/parserHelpers.js';

// ─── Configuration ───────────────────────────────────────────────────────────

/** Minimum confidence to accept a match */
const CONFIDENCE_THRESHOLD = 0.50;

/** Minimum confidence for an "auto-accept" match (no review needed) */
const HIGH_CONFIDENCE_THRESHOLD = 0.85;

/** Maximum number of alternative suggestions to return */
const MAX_ALTERNATIVES = 3;

/** Minimum score for alternatives to be included */
const ALTERNATIVES_THRESHOLD = 0.35;

// ─── Fuse.js Options ─────────────────────────────────────────────────────────
// Tuned for invoice supplier name matching — tolerant of OCR typos,
// abbreviations, and missing suffixes.

const FUSE_OPTIONS = {
  // Search keys with weights (name is primary, aliases are secondary)
  keys: [
    { name: 'normalizedName', weight: 0.7 },
    { name: 'name', weight: 0.3 },
  ],
  // 0 = perfect match, 1 = match anything
  // 0.4 is tuned for OCR typos (1-2 chars wrong in a 10-char name)
  threshold: 0.4,
  // How far from the expected position a match can be
  distance: 200,
  // Minimum character length to start matching
  minMatchCharLength: 2,
  // Include the score in results (lower = better match)
  includeScore: true,
  // Include matches metadata for debugging
  includeMatches: true,
  // Use extended search patterns
  useExtendedSearch: false,
  // Ignore case and diacritics
  isCaseSensitive: false,
  // Don't require the full pattern to be found
  findAllMatches: true,
  // Ignore location for better partial matching
  ignoreLocation: true,
  // Sort by score
  sortFn: (a, b) => a.score - b.score,
};

// ─── Common Abbreviation Map ─────────────────────────────────────────────────
// OCR frequently reads abbreviated names on invoices.
// This map expands abbreviations so "ABC TRDRS" matches "ABC Traders".

const ABBREVIATION_MAP = {
  // Business type abbreviations
  'trdrs': 'traders',
  'trdr': 'trader',
  'trad': 'traders',
  'trdg': 'trading',
  'inds': 'industries',
  'ind': 'industries',
  'indus': 'industries',
  'mfg': 'manufacturing',
  'mfrs': 'manufacturers',
  'mfr': 'manufacturer',
  'entp': 'enterprises',
  'entps': 'enterprises',
  'enterp': 'enterprises',
  'enter': 'enterprises',
  'ent': 'enterprises',
  'corp': 'corporation',
  'assoc': 'associates',
  'assn': 'association',
  'dist': 'distributors',
  'distri': 'distributors',
  'distrs': 'distributors',
  'svcs': 'services',
  'svc': 'services',
  'serv': 'services',
  'soln': 'solutions',
  'solns': 'solutions',
  'tech': 'technologies',
  'techno': 'technologies',
  'engr': 'engineers',
  'engg': 'engineering',
  'const': 'construction',
  'constr': 'construction',
  'infra': 'infrastructure',
  'pharm': 'pharmaceuticals',
  'pharma': 'pharmaceuticals',
  'hosp': 'hospital',
  'med': 'medical',
  'agri': 'agriculture',
  'agro': 'agro',
  'intl': 'international',
  'natl': 'national',
  'govt': 'government',
  'pvt': 'private',
  'ltd': 'limited',
  'llp': 'llp',

  // Common word abbreviations from OCR
  'gen': 'general',
  'elec': 'electrical',
  'electr': 'electrical',
  'mech': 'mechanical',
  'chem': 'chemicals',
  'bldg': 'building',
  'sup': 'suppliers',
  'suppl': 'suppliers',
  'splrs': 'suppliers',
  'whlsl': 'wholesale',
  'whsl': 'wholesale',
  'ret': 'retail',
  'furn': 'furniture',
  'hdw': 'hardware',
  'hw': 'hardware',
  'swt': 'sweet',
  'bkry': 'bakery',
  'rest': 'restaurant',
  'mtl': 'metals',
  'stl': 'steel',
  'plstc': 'plastics',
  'txtl': 'textiles',
  'ppr': 'paper',
  'pkg': 'packaging',
};

// ═══════════════════════════════════════════════════════════════════════════
// CORE MATCHING FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Match an OCR-extracted supplier name against the user's existing suppliers.
 *
 * @param {string} extractedName - Raw supplier name from OCR
 * @param {string} userId - User ID to scope the supplier search
 * @param {object} [options] - Optional matching parameters
 * @param {string} [options.gstNumber] - GST number for cross-validation
 * @param {string} [options.phone] - Phone number for cross-validation
 * @returns {Promise<{
 *   matchedSupplier: object|null,
 *   confidence: number,
 *   matchType: string,
 *   alternatives: Array<{supplier: object, confidence: number, matchType: string}>
 * }>}
 */
export async function matchSupplier(extractedName, userId, options = {}) {
  const noMatch = {
    matchedSupplier: null,
    confidence: 0,
    matchType: 'none',
    alternatives: [],
  };

  if (!extractedName || !userId) {
    return noMatch;
  }

  // ─── 1. Fetch all active suppliers ─────────────────────────────────
  const suppliers = await Supplier.find({
    createdBy: userId,
    isDeleted: { $ne: true },
  }).lean();

  if (suppliers.length === 0) {
    return noMatch;
  }

  // ─── 2. Prepare supplier data with normalized names ────────────────
  const enrichedSuppliers = suppliers.map((s) => ({
    ...s,
    normalizedName: normalizeCompanyName(s.name),
    expandedName: expandAbbreviations(normalizeCompanyName(s.name)),
  }));

  const normalizedExtracted = normalizeCompanyName(extractedName);
  const expandedExtracted = expandAbbreviations(normalizedExtracted);

  // ─── 3. Multi-Strategy Matching ────────────────────────────────────
  const candidates = [];

  for (const supplier of enrichedSuppliers) {
    const scores = {};

    // ── Strategy 1: Exact match on normalized name ──
    if (normalizedExtracted === supplier.normalizedName) {
      candidates.push({
        supplier,
        confidence: 1.0,
        matchType: 'exact',
        scores: { exact: 1.0 },
      });
      continue;
    }

    // ── Strategy 2: Exact match after abbreviation expansion ──
    if (expandedExtracted === supplier.expandedName) {
      candidates.push({
        supplier,
        confidence: 0.97,
        matchType: 'exact_expanded',
        scores: { expanded: 0.97 },
      });
      continue;
    }

    // ── Strategy 3: Contains match (one includes the other) ──
    let containsScore = 0;
    if (
      normalizedExtracted.includes(supplier.normalizedName) ||
      supplier.normalizedName.includes(normalizedExtracted)
    ) {
      const shorter = normalizedExtracted.length < supplier.normalizedName.length
        ? normalizedExtracted
        : supplier.normalizedName;
      const longer = normalizedExtracted.length >= supplier.normalizedName.length
        ? normalizedExtracted
        : supplier.normalizedName;
      containsScore = (shorter.length / longer.length) * 0.95;
    }
    scores.contains = containsScore;

    // ── Strategy 4: Expanded abbreviation similarity ──
    const expandedScore = stringSimilarity(expandedExtracted, supplier.expandedName);
    scores.expanded = expandedScore;

    // ── Strategy 5: Levenshtein similarity on normalized names ──
    const levScore = stringSimilarity(normalizedExtracted, supplier.normalizedName);
    scores.levenshtein = levScore;

    // ── Strategy 6: Word-level overlap ──
    const wordScore = calculateWordOverlap(normalizedExtracted, supplier.normalizedName);
    scores.wordOverlap = wordScore;

    // ── Strategy 7: Word-level overlap on expanded names ──
    const expandedWordScore = calculateWordOverlap(expandedExtracted, supplier.expandedName);
    scores.expandedWordOverlap = expandedWordScore;

    // ── Strategy 8: Initials match ──
    // "A.B.C." or "ABC" matches "Anil Bhai Chemicals"
    const initialsScore = matchInitials(normalizedExtracted, supplier.normalizedName);
    scores.initials = initialsScore;

    // ── Combine scores with weighted maximum ──
    const combinedScore = Math.max(
      containsScore,
      expandedScore * 0.98,
      levScore,
      wordScore * 0.92,
      expandedWordScore * 0.95,
      initialsScore * 0.80,
    );

    if (combinedScore >= ALTERNATIVES_THRESHOLD) {
      // Determine the dominant match type
      const maxScoreKey = Object.entries(scores).reduce(
        (a, b) => (b[1] > a[1] ? b : a)
      )[0];

      const matchType =
        maxScoreKey === 'contains' ? 'contains' :
        maxScoreKey === 'expanded' || maxScoreKey === 'expandedWordOverlap' ? 'abbreviation' :
        maxScoreKey === 'initials' ? 'initials' :
        maxScoreKey === 'wordOverlap' ? 'word_overlap' :
        'fuzzy';

      candidates.push({
        supplier,
        confidence: Math.round(combinedScore * 100) / 100,
        matchType,
        scores,
      });
    }
  }

  // ─── 4. Fuse.js Fuzzy Search ───────────────────────────────────────
  // Run Fuse.js on the enriched supplier list for deep fuzzy matching
  const fuse = new Fuse(enrichedSuppliers, FUSE_OPTIONS);

  // Search with both original and expanded names
  const fuseResults = [
    ...fuse.search(normalizedExtracted),
    ...fuse.search(expandedExtracted),
  ];

  // Deduplicate Fuse results by supplier ID
  const seenFuseIds = new Set();
  for (const result of fuseResults) {
    const supplierId = result.item._id.toString();
    if (seenFuseIds.has(supplierId)) continue;
    seenFuseIds.add(supplierId);

    // Fuse score: 0 = perfect, 1 = no match
    // Convert to our 0-1 confidence scale (inverted)
    const fuseConfidence = Math.round((1 - result.score) * 100) / 100;

    // Check if this supplier already exists in candidates
    const existingIdx = candidates.findIndex(
      (c) => c.supplier._id.toString() === supplierId
    );

    if (existingIdx >= 0) {
      // Update if Fuse found a better score
      if (fuseConfidence > candidates[existingIdx].confidence) {
        candidates[existingIdx].confidence = fuseConfidence;
        candidates[existingIdx].matchType = 'fuse_fuzzy';
        candidates[existingIdx].scores.fuse = fuseConfidence;
      }
    } else if (fuseConfidence >= ALTERNATIVES_THRESHOLD) {
      candidates.push({
        supplier: result.item,
        confidence: fuseConfidence,
        matchType: 'fuse_fuzzy',
        scores: { fuse: fuseConfidence },
      });
    }
  }

  // ─── 5. Cross-Validation Boost ─────────────────────────────────────
  // If GST or phone matches, boost confidence significantly
  if (options.gstNumber || options.phone) {
    for (const candidate of candidates) {
      let boost = 0;

      // GST match is very strong evidence
      if (
        options.gstNumber &&
        candidate.supplier.gstNumber &&
        options.gstNumber.replace(/\s/g, '').toUpperCase() ===
          candidate.supplier.gstNumber.replace(/\s/g, '').toUpperCase()
      ) {
        boost = Math.max(boost, 0.3);
        candidate.matchType = 'gst_verified';
      }

      // Phone match is moderate evidence
      if (
        options.phone &&
        candidate.supplier.phone &&
        options.phone.replace(/\D/g, '').slice(-10) ===
          candidate.supplier.phone.replace(/\D/g, '').slice(-10)
      ) {
        boost = Math.max(boost, 0.15);
        if (candidate.matchType !== 'gst_verified') {
          candidate.matchType = 'phone_verified';
        }
      }

      candidate.confidence = Math.min(1.0, candidate.confidence + boost);
    }
  }

  // ─── 6. Sort and Select Best Match ─────────────────────────────────
  candidates.sort((a, b) => b.confidence - a.confidence);

  // Deduplicate by supplier ID (keep highest confidence)
  const deduped = [];
  const seenIds = new Set();
  for (const c of candidates) {
    const id = c.supplier._id.toString();
    if (!seenIds.has(id)) {
      seenIds.add(id);
      deduped.push(c);
    }
  }

  if (deduped.length === 0) {
    return noMatch;
  }

  const best = deduped[0];

  // Only return a match if above threshold
  if (best.confidence < CONFIDENCE_THRESHOLD) {
    return {
      matchedSupplier: null,
      confidence: 0,
      matchType: 'none',
      alternatives: deduped
        .slice(0, MAX_ALTERNATIVES)
        .map((c) => ({
          supplier: formatSupplier(c.supplier),
          confidence: c.confidence,
          matchType: c.matchType,
        })),
    };
  }

  // Build alternatives (exclude the best match)
  const alternatives = deduped
    .slice(1, MAX_ALTERNATIVES + 1)
    .filter((c) => c.confidence >= ALTERNATIVES_THRESHOLD)
    .map((c) => ({
      supplier: formatSupplier(c.supplier),
      confidence: c.confidence,
      matchType: c.matchType,
    }));

  return {
    matchedSupplier: formatSupplier(best.supplier),
    confidence: best.confidence,
    matchType: best.matchType,
    alternatives,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// DUPLICATE PREVENTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if a supplier name would be a duplicate of an existing supplier.
 * Used before creating a new supplier from OCR data.
 *
 * @param {string} name - Proposed supplier name
 * @param {string} userId - User ID
 * @returns {Promise<{
 *   isDuplicate: boolean,
 *   existingSupplier: object|null,
 *   confidence: number,
 *   suggestion: string
 * }>}
 */
export async function checkDuplicate(name, userId) {
  if (!name || !userId) {
    return { isDuplicate: false, existingSupplier: null, confidence: 0, suggestion: '' };
  }

  const result = await matchSupplier(name, userId);

  if (result.matchedSupplier && result.confidence >= HIGH_CONFIDENCE_THRESHOLD) {
    return {
      isDuplicate: true,
      existingSupplier: result.matchedSupplier,
      confidence: result.confidence,
      suggestion: `This appears to be the same as "${result.matchedSupplier.name}" (${Math.round(result.confidence * 100)}% match). Use the existing supplier instead?`,
    };
  }

  if (result.matchedSupplier && result.confidence >= CONFIDENCE_THRESHOLD) {
    return {
      isDuplicate: false,
      existingSupplier: result.matchedSupplier,
      confidence: result.confidence,
      suggestion: `Similar supplier found: "${result.matchedSupplier.name}" (${Math.round(result.confidence * 100)}% match). Are you sure this is different?`,
    };
  }

  return { isDuplicate: false, existingSupplier: null, confidence: 0, suggestion: '' };
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Expand common abbreviations in a company name.
 * "abc trdrs" → "abc traders"
 *
 * @param {string} name - Normalized company name
 * @returns {string} - Name with abbreviations expanded
 */
function expandAbbreviations(name) {
  if (!name) return '';

  return name
    .split(/\s+/)
    .map((word) => ABBREVIATION_MAP[word] || word)
    .join(' ')
    .trim();
}

/**
 * Calculate word-level overlap between two name strings.
 * Uses Jaccard similarity with minimum word matching.
 *
 * @param {string} a - First name (normalized)
 * @param {string} b - Second name (normalized)
 * @returns {number} - Overlap score (0-1)
 */
function calculateWordOverlap(a, b) {
  if (!a || !b) return 0;

  const wordsA = new Set(a.split(/\s+/).filter((w) => w.length > 1));
  const wordsB = new Set(b.split(/\s+/).filter((w) => w.length > 1));

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let exactMatches = 0;
  let fuzzyMatches = 0;

  for (const wordA of wordsA) {
    if (wordsB.has(wordA)) {
      exactMatches++;
    } else {
      // Check for fuzzy word-level match (e.g., typos)
      for (const wordB of wordsB) {
        const sim = stringSimilarity(wordA, wordB);
        if (sim >= 0.75) {
          fuzzyMatches++;
          break;
        }
      }
    }
  }

  const totalMatches = exactMatches + fuzzyMatches * 0.8;
  const unionSize = Math.max(wordsA.size, wordsB.size);

  return totalMatches / unionSize;
}

/**
 * Match initials against a full name.
 * "ABC" matches "Anil Bhai Chemicals" → high score
 * "AB" doesn't match "Anil Traders" → low score
 *
 * @param {string} query - Potentially an initials string
 * @param {string} fullName - Full supplier name
 * @returns {number} - Match score (0-1)
 */
function matchInitials(query, fullName) {
  if (!query || !fullName) return 0;

  // Clean up: remove dots and spaces from potential initials
  const cleanQuery = query.replace(/[.\s]/g, '').toLowerCase();

  // Only try initials matching for short queries (1-5 chars, all letters)
  if (cleanQuery.length < 2 || cleanQuery.length > 5 || !/^[a-z]+$/.test(cleanQuery)) {
    return 0;
  }

  const words = fullName.split(/\s+/).filter((w) => w.length > 0);

  // Get initials of the full name
  const initials = words.map((w) => w.charAt(0)).join('').toLowerCase();

  if (cleanQuery === initials) {
    // Perfect initials match — but cap confidence since initials are ambiguous
    return 0.85;
  }

  // Check if query is a prefix of initials
  if (initials.startsWith(cleanQuery) && cleanQuery.length >= 2) {
    return 0.65 * (cleanQuery.length / initials.length);
  }

  return 0;
}

/**
 * Format a supplier document for API response.
 * Strips internal fields and returns only what the client needs.
 *
 * @param {object} supplier - Raw supplier document
 * @returns {object} - Formatted supplier
 */
function formatSupplier(supplier) {
  return {
    _id: supplier._id,
    name: supplier.name,
    phone: supplier.phone || null,
    address: supplier.address || null,
    gstNumber: supplier.gstNumber || null,
    totalBills: supplier.totalBills || 0,
    totalSpend: supplier.totalSpend || 0,
  };
}

// ─── Named Exports ───────────────────────────────────────────────────────────
export default { matchSupplier, checkDuplicate };
