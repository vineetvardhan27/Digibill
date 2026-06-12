/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PDF Service — Text Extraction & Scanned PDF Detection
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * TEXT PDFs vs SCANNED PDFs — THE FUNDAMENTAL DIFFERENCE:
 * ───────────────────────────────────────────────────────
 *
 * PDFs are containers, not images.  They can hold two completely different
 * kinds of content:
 *
 *   ┌─────────────────────────────────────────────────────────────────────┐
 *   │                       TEXT (DIGITAL) PDFs                          │
 *   ├─────────────────────────────────────────────────────────────────────┤
 *   │ Created by: Word processors, accounting software, ERP exports,    │
 *   │             "Save as PDF", browser print-to-PDF                   │
 *   │                                                                   │
 *   │ Internal structure:                                               │
 *   │   The PDF file contains actual Unicode text strings with font     │
 *   │   references, positions (x, y coordinates), and rendering         │
 *   │   instructions.  The text exists as CHARACTER DATA, not pixels.   │
 *   │                                                                   │
 *   │   Example PDF operator stream:                                    │
 *   │     BT                         % Begin text object                │
 *   │     /F1 12 Tf                  % Font: F1, size 12pt             │
 *   │     100 700 Td                 % Move to position (100, 700)     │
 *   │     (Invoice #INV-001) Tj      % Draw the string                 │
 *   │     ET                         % End text object                  │
 *   │                                                                   │
 *   │ Extraction speed: ~10ms per page (just reads strings)             │
 *   │ Accuracy: 100% — the exact text is right there in the file        │
 *   │ OCR needed: NO                                                    │
 *   └─────────────────────────────────────────────────────────────────────┘
 *
 *   ┌─────────────────────────────────────────────────────────────────────┐
 *   │                      SCANNED (IMAGE) PDFs                          │
 *   ├─────────────────────────────────────────────────────────────────────┤
 *   │ Created by: Scanners, scan-to-PDF apps, photographed documents    │
 *   │             saved as PDF                                          │
 *   │                                                                   │
 *   │ Internal structure:                                               │
 *   │   The PDF contains one large embedded image per page (JPEG or     │
 *   │   JPEG2000 compressed).  There are NO text strings — just a       │
 *   │   raster bitmap wrapped in a PDF container.                       │
 *   │                                                                   │
 *   │   Example PDF operator stream:                                    │
 *   │     q                          % Save graphics state             │
 *   │     595 0 0 842 0 0 cm         % Scale to A4 dimensions          │
 *   │     /Im0 Do                    % Draw image resource Im0         │
 *   │     Q                          % Restore graphics state          │
 *   │                                                                   │
 *   │ Extraction speed: N/A — there's no text to extract                │
 *   │ Accuracy: 0% without OCR                                         │
 *   │ OCR needed: YES — must rasterize pages and run Tesseract          │
 *   └─────────────────────────────────────────────────────────────────────┘
 *
 * WHY DIRECT TEXT EXTRACTION IS FASTER:
 * ─────────────────────────────────────
 *   • Text PDF extraction = string parsing (~10ms/page)
 *   • OCR = pixel analysis through a neural network (~3–10 seconds/page)
 *   • That's a 300–1000× speed difference
 *   • Text extraction also gives 100% accuracy vs OCR's 70–95%
 *   • No preprocessing needed — no resize, grayscale, sharpen, denoise
 *   • No GPU/CPU-intensive WASM computation
 *
 * OUR STRATEGY:
 * ─────────────
 *   1. Always try direct text extraction first (pdf-parse)
 *   2. Analyze the extracted text to classify the PDF:
 *      - Digital text PDF → use extracted text directly (fast path)
 *      - Scanned PDF → flag it for the controller to handle
 *        (currently: return partial data; future: convert pages to
 *         images and OCR them)
 *   3. Hybrid PDFs (some pages text, some scanned) → use whatever
 *      text we can get and flag the quality
 *
 * HOW pdf-parse WORKS:
 * ────────────────────
 *   pdf-parse is built on Mozilla's PDF.js (pdfjs-dist).  It:
 *     1. Parses the PDF's cross-reference table to find all objects
 *     2. Decompresses content streams (Flate, LZW, etc.)
 *     3. Interprets the PDF operator language (Tj, TJ, ', ", etc.)
 *     4. Extracts text strings with position information
 *     5. Reconstructs reading order from position coordinates
 *     6. Returns the full text as a single string
 *
 *   It does NOT render the PDF visually — it only reads text operators.
 *   This is why it's so fast and why it can't help with scanned PDFs.
 */

import fs from 'fs/promises';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// ─── Configuration ───────────────────────────────────────────────────────────

const CONFIG = {
  /**
   * Minimum character count to consider a PDF as "text-based".
   *
   * WHY 50: A completely blank or scanned PDF may still yield a few
   * characters from watermarks, headers, or OCR layers embedded by
   * scanner software.  50 chars is roughly one line of text — anything
   * less is effectively "no usable content".
   *
   * A typical single-page invoice has 200–2000 characters.
   */
  minTextChars: 50,

  /**
   * Characters-per-page threshold for the "scanned" classification.
   *
   * WHY 30: Some PDFs have sparse metadata text (page numbers, headers)
   * even if the main content is scanned.  If the average is below 30
   * chars per page, the "text" is likely just artifacts, not real
   * invoice content.
   */
  minCharsPerPage: 30,

  /**
   * Maximum file size for PDF processing (bytes).
   * Large PDFs with many pages are unlikely to be single invoices
   * and could consume excessive memory during parsing.
   */
  maxFileSizeBytes: 25 * 1024 * 1024, // 25 MB

  /**
   * Maximum number of pages to process.
   * Invoices rarely exceed 5 pages.  Processing 100-page PDFs
   * would waste resources.
   */
  maxPages: 20,
};

// ─── Core Extraction Function ────────────────────────────────────────────────

/**
 * Extract text content from a PDF file.
 *
 * Automatically detects whether the PDF is:
 *   • Digital (text-based) → returns extracted text with high confidence
 *   • Scanned (image-based) → returns whatever is available, flags it
 *   • Hybrid (mixed) → returns text with a quality warning
 *
 * @param {string} filePath — Absolute path to the PDF file
 *
 * @returns {Promise<{
 *   text: string,
 *   pages: number,
 *   isScanned: boolean,
 *   confidence: number,
 *   classification: 'digital' | 'scanned' | 'hybrid',
 *   processingTime: number,
 *   info: { title, author, creator, creationDate, producer },
 *   textStats: { totalChars, avgCharsPerPage, wordCount, lineCount }
 * }>}
 */
export async function extractTextFromPDF(filePath) {
  const startTime = Date.now();

  // ── Validate file existence and size ──
  let fileStats;
  try {
    fileStats = await fs.stat(filePath);
  } catch (error) {
    throw new Error(`PDF file not found: ${filePath}`);
  }

  if (fileStats.size > CONFIG.maxFileSizeBytes) {
    throw new Error(
      `PDF file too large: ${(fileStats.size / (1024 * 1024)).toFixed(1)}MB ` +
      `(max: ${CONFIG.maxFileSizeBytes / (1024 * 1024)}MB)`
    );
  }

  // ── Validate PDF magic bytes ──
  const isValid = await isValidPDF(filePath);
  if (!isValid) {
    throw new Error(
      'File is not a valid PDF (missing %PDF- header). ' +
      'The file may be corrupted or have a wrong extension.'
    );
  }

  try {
    // ── Read and parse ──
    const dataBuffer = await fs.readFile(filePath);

    const pdfData = await pdfParse(dataBuffer, {
      // Limit page processing for performance
      max: CONFIG.maxPages,
    });

    const text = (pdfData.text || '').trim();
    const pages = pdfData.numpages || 1;
    const processingTime = Date.now() - startTime;

    // ── Compute text statistics ──
    const cleanedText = text.replace(/\s+/g, ' ').trim();
    const totalChars = cleanedText.length;
    const avgCharsPerPage = pages > 0 ? Math.round(totalChars / pages) : 0;
    const wordCount = cleanedText ? cleanedText.split(/\s+/).length : 0;
    const lineCount = text ? text.split('\n').filter((l) => l.trim().length > 0).length : 0;

    // ── Classify the PDF ──
    //
    // Classification logic:
    //   1. If total chars < minTextChars → SCANNED (no usable text)
    //   2. If avg chars/page < minCharsPerPage → SCANNED (sparse metadata only)
    //   3. If chars are present but low per-page → HYBRID (some pages scanned)
    //   4. Otherwise → DIGITAL (full text available)
    //
    let classification;
    let isScanned;
    let confidence;

    if (totalChars < CONFIG.minTextChars) {
      // Almost no text — this is a scanned document
      classification = 'scanned';
      isScanned = true;
      confidence = 10; // Very low — minimal usable data

      console.log(
        `📑 PDF classified as SCANNED: only ${totalChars} chars extracted from ${pages} page(s). ` +
        `The PDF likely contains embedded images with no text layer.`
      );

    } else if (avgCharsPerPage < CONFIG.minCharsPerPage) {
      // Very sparse text — probably metadata from a scanned PDF
      classification = 'scanned';
      isScanned = true;
      confidence = 25; // Low — some text but unreliable

      console.log(
        `📑 PDF classified as SCANNED: ${totalChars} chars / ${pages} pages ` +
        `(${avgCharsPerPage} chars/page — below threshold of ${CONFIG.minCharsPerPage})`
      );

    } else if (avgCharsPerPage < 100 && pages > 1) {
      // Moderate text — possibly a hybrid (some pages scanned)
      classification = 'hybrid';
      isScanned = false; // Has enough text to be useful
      confidence = 60; // Medium — may be missing some content

      console.log(
        `📑 PDF classified as HYBRID: ${totalChars} chars / ${pages} pages ` +
        `(${avgCharsPerPage} chars/page). Some pages may be scanned.`
      );

    } else {
      // Plenty of text — fully digital PDF
      classification = 'digital';
      isScanned = false;
      confidence = 95; // High — direct text extraction is nearly perfect

      console.log(
        `📑 PDF classified as DIGITAL: ${totalChars} chars, ${wordCount} words, ` +
        `${lineCount} lines from ${pages} page(s) in ${processingTime}ms`
      );
    }

    // ── Extract document metadata ──
    const info = {
      title: pdfData.info?.Title || null,
      author: pdfData.info?.Author || null,
      creator: pdfData.info?.Creator || null,
      creationDate: pdfData.info?.CreationDate
        ? parsePDFDate(pdfData.info.CreationDate)
        : null,
      producer: pdfData.info?.Producer || null,
    };

    return {
      text,
      pages,
      isScanned,
      confidence,
      classification,
      processingTime,
      info,
      textStats: {
        totalChars,
        avgCharsPerPage,
        wordCount,
        lineCount,
      },
    };

  } catch (error) {
    // ── Handle specific pdf-parse errors ──
    if (error.message?.includes('encrypted')) {
      throw new Error(
        'This PDF is password-protected/encrypted. ' +
        'Please upload an unprotected version.'
      );
    }

    if (error.message?.includes('XRef') || error.message?.includes('cross-reference')) {
      throw new Error(
        'This PDF has a corrupted structure (invalid cross-reference table). ' +
        'Try re-saving it from a PDF viewer before uploading.'
      );
    }

    throw new Error(`PDF processing failed: ${error.message}`);
  }
}

// ─── Utility Functions ───────────────────────────────────────────────────────

/**
 * Check if a file is a valid PDF by reading its magic bytes.
 *
 * PDF files must start with "%PDF-" (hex: 25 50 44 46 2D).
 * This is a fast check (~0.1ms) that prevents attempting to parse
 * non-PDF files that were uploaded with a .pdf extension.
 *
 * @param {string} filePath — Path to the file
 * @returns {Promise<boolean>}
 */
export async function isValidPDF(filePath) {
  let fileHandle;
  try {
    const buffer = Buffer.alloc(5);
    fileHandle = await fs.open(filePath, 'r');
    await fileHandle.read(buffer, 0, 5, 0);

    // PDF magic bytes: %PDF-
    return buffer.toString('ascii') === '%PDF-';
  } catch {
    return false;
  } finally {
    // Always close the file handle
    if (fileHandle) {
      try { await fileHandle.close(); } catch { /* noop */ }
    }
  }
}

/**
 * Parse a PDF date string into an ISO 8601 date string.
 *
 * PDF dates use the format: D:YYYYMMDDHHmmSSOHH'mm'
 * Example: "D:20240115143052+05'30'" → "2024-01-15T14:30:52+05:30"
 *
 * @param {string} pdfDate — Raw PDF date string
 * @returns {string | null} — ISO 8601 date string or null
 */
function parsePDFDate(pdfDate) {
  if (!pdfDate || typeof pdfDate !== 'string') return null;

  try {
    // Remove "D:" prefix
    const cleaned = pdfDate.replace(/^D:/, '');

    // Extract components: YYYYMMDDHHmmSS
    const year = cleaned.substring(0, 4);
    const month = cleaned.substring(4, 6) || '01';
    const day = cleaned.substring(6, 8) || '01';
    const hour = cleaned.substring(8, 10) || '00';
    const minute = cleaned.substring(10, 12) || '00';
    const second = cleaned.substring(12, 14) || '00';

    const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
    if (isNaN(date.getTime())) return null;

    return date.toISOString();
  } catch {
    return null;
  }
}

/**
 * Get a summary of a PDF file without full text extraction.
 * Useful for quick validation and metadata display.
 *
 * @param {string} filePath — Path to the PDF file
 * @returns {Promise<{
 *   isValid: boolean,
 *   pages: number,
 *   title: string | null,
 *   fileSize: number,
 *   hasText: boolean
 * }>}
 */
export async function getPDFSummary(filePath) {
  try {
    const isValid = await isValidPDF(filePath);
    if (!isValid) {
      return { isValid: false, pages: 0, title: null, fileSize: 0, hasText: false };
    }

    const fileStats = await fs.stat(filePath);
    const dataBuffer = await fs.readFile(filePath);
    const pdfData = await pdfParse(dataBuffer, { max: 1 }); // Only parse first page

    const text = (pdfData.text || '').replace(/\s+/g, ' ').trim();

    return {
      isValid: true,
      pages: pdfData.numpages || 1,
      title: pdfData.info?.Title || null,
      fileSize: fileStats.size,
      hasText: text.length >= CONFIG.minTextChars,
    };
  } catch {
    return { isValid: false, pages: 0, title: null, fileSize: 0, hasText: false };
  }
}

export default {
  extractTextFromPDF,
  isValidPDF,
  getPDFSummary,
};
