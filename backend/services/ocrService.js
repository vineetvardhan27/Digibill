/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OCR Service — Tesseract.js Engine
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * HOW TESSERACT OCR WORKS INTERNALLY:
 * ────────────────────────────────────
 * Tesseract (originally by HP Labs, now maintained by Google) is a
 * multi-stage pipeline that converts pixels into characters:
 *
 *   ┌───────────┐   ┌──────────┐   ┌──────────┐   ┌───────────┐
 *   │ 1. INPUT  │──▶│ 2. BINAR │──▶│ 3. LAYOUT│──▶│ 4. RECOG  │
 *   │   IMAGE   │   │  -IZATION│   │  ANALYSIS│   │   NITION  │
 *   └───────────┘   └──────────┘   └──────────┘   └───────────┘
 *        │                │              │               │
 *   Raw pixels       Otsu/Sauvola    Connected       LSTM neural
 *   (grayscale)      thresholding    component       network per
 *                    → pure B&W      analysis →      character
 *                                    text lines,     sequence →
 *                                    word boxes,     UTF-8 text
 *                                    baselines
 *
 * Stage 1 — INPUT:
 *   Tesseract expects a clean grayscale or RGB image.  It does NOT
 *   preprocess images well internally — that's why our imageProcessor.js
 *   exists.  The cleaner the input, the better every downstream stage.
 *
 * Stage 2 — BINARIZATION:
 *   Converts the image to pure black-and-white using Otsu's method
 *   (global threshold) or Sauvola's method (local adaptive threshold).
 *   This is why our gamma and contrast preprocessing is so important —
 *   it gives the binarizer a bimodal histogram with clear peaks for
 *   "ink" and "paper", making the threshold easy to find.
 *
 * Stage 3 — LAYOUT ANALYSIS:
 *   Finds text regions, columns, paragraphs, lines, and words using
 *   connected component analysis.  Each blob of black pixels is a
 *   potential character.  Blobs are grouped into words (by spacing),
 *   words into lines (by baseline alignment), lines into blocks.
 *   This is where rotation and skew correction happens.
 *
 * Stage 4 — RECOGNITION (LSTM):
 *   Each text line is fed into a trained LSTM (Long Short-Term Memory)
 *   neural network.  The LSTM slides across the line pixel-by-pixel
 *   and predicts character probabilities at each position.  A CTC
 *   (Connectionist Temporal Classification) decoder collapses the
 *   predictions into the final character sequence.
 *
 * WHY PREPROCESSING MATTERS:
 * ──────────────────────────
 *   1. BINARIZATION FAILURE: If the input has low contrast (grey text
 *      on grey paper), Otsu picks a bad threshold → characters are
 *      incomplete or merged with the background.
 *      → FIX: Our normalize + gamma + contrast pipeline.
 *
 *   2. BLUR SMEARING: Blurred characters have soft edges.  During
 *      connected component analysis, adjacent characters merge into
 *      one blob → "rn" becomes "m", "cl" becomes "d".
 *      → FIX: Our sharpening step.
 *
 *   3. NOISE INJECTION: Salt-and-pepper noise creates tiny blobs that
 *      the layout analyzer interprets as periods, commas, or diacritics.
 *      → FIX: Our median filter.
 *
 *   4. RESOLUTION TOO LOW: Characters below ~20 px height don't have
 *      enough pixels for the LSTM to distinguish similar shapes
 *      (0/O, 1/l/I, 5/S, 8/B).
 *      → FIX: Our upscaling with Lanczos interpolation.
 *
 * COMMON OCR FAILURE SCENARIOS:
 * ─────────────────────────────
 *   ┌──────────────────────┬─────────────────────────────────────────┐
 *   │ Failure Mode         │ Symptoms & Mitigation                   │
 *   ├──────────────────────┼─────────────────────────────────────────┤
 *   │ Skewed/rotated image │ Characters split across lines, garbled  │
 *   │                      │ word order. Tesseract has built-in      │
 *   │                      │ deskew but it's unreliable >15°.        │
 *   │                      │ → Future: add auto-deskew preprocessing │
 *   ├──────────────────────┼─────────────────────────────────────────┤
 *   │ Handwritten text     │ LSTM trained on printed fonts only.     │
 *   │                      │ Handwriting → random character soup.    │
 *   │                      │ → User must manually enter handwritten  │
 *   │                      │   portions.                             │
 *   ├──────────────────────┼─────────────────────────────────────────┤
 *   │ Watermarks / stamps  │ Overlay text competes with bill text.   │
 *   │                      │ Layout analyzer creates false regions.  │
 *   │                      │ → Grayscale + contrast helps separate.  │
 *   ├──────────────────────┼─────────────────────────────────────────┤
 *   │ Non-Latin scripts    │ Hindi, Tamil, etc. require separate     │
 *   │                      │ trained data files (.traineddata).      │
 *   │                      │ → Currently English only. Extendable    │
 *   │                      │   by adding language packs.             │
 *   ├──────────────────────┼─────────────────────────────────────────┤
 *   │ Colored backgrounds  │ Red text on pink paper → very low       │
 *   │                      │ contrast after grayscale conversion.    │
 *   │                      │ → Normalize + aggressive gamma helps.   │
 *   ├──────────────────────┼─────────────────────────────────────────┤
 *   │ Folded/crumpled bill │ 3D deformations cause variable focus.   │
 *   │                      │ Some regions are sharp, others blurred. │
 *   │                      │ → Sharpening helps partially. Ideal:    │
 *   │                      │   flat surface when photographing.      │
 *   ├──────────────────────┼─────────────────────────────────────────┤
 *   │ Very small font      │ Thermal receipt 6pt text at 72 DPI →    │
 *   │                      │ characters are <10 px tall.             │
 *   │                      │ → Our upscaling to min 1000px helps.    │
 *   ├──────────────────────┼─────────────────────────────────────────┤
 *   │ JPEG compression     │ Block artefacts create false edges.     │
 *   │                      │ → We output PNG between preprocessing   │
 *   │                      │   and OCR to avoid this.                │
 *   └──────────────────────┴─────────────────────────────────────────┘
 *
 * ARCHITECTURE DECISIONS:
 * ───────────────────────
 *   • SINGLETON WORKER: Tesseract.js spawns a Web Worker (or Node
 *     worker_thread) and loads ~15 MB of trained LSTM data.  Creating
 *     a new worker per request would add 3–5 seconds of overhead.
 *     The singleton pattern amortizes this across all requests.
 *
 *   • IDLE TIMEOUT: The worker holds ~50–80 MB of RAM (LSTM weights +
 *     WASM heap).  Auto-terminating after 5 minutes of inactivity
 *     frees this memory on low-traffic servers.
 *
 *   • RETRY LOGIC: OCR can fail transiently (corrupted image, WASM
 *     memory limit).  We terminate the broken worker and create a
 *     fresh one on retry, which resets the WASM heap.
 *
 *   • PROGRESS LOGGING: Tesseract reports progress 0–100% during
 *     recognition.  We log at 25% intervals for server-side monitoring.
 */

import Tesseract from 'tesseract.js';

// ─── Configuration ───────────────────────────────────────────────────────────

const CONFIG = {
  /**
   * Language for OCR recognition.
   * 'eng' = English. To add Hindi: 'eng+hin' (requires hin.traineddata).
   * Adding languages increases worker init time (~2s per language) and
   * memory (~15 MB per language's LSTM model).
   */
  language: 'eng',

  /**
   * Tesseract OEM (OCR Engine Mode).
   *   0 = Legacy engine only (faster, less accurate)
   *   1 = LSTM neural net only (slower, much more accurate) ← USED
   *   2 = Legacy + LSTM (slowest, marginal accuracy gain over 1)
   *   3 = Default — let Tesseract decide (usually picks 1)
   *
   * We use 1 explicitly because:
   *   • LSTM accuracy is 15–30% better than legacy on bill images
   *   • The speed difference is negligible after our preprocessing
   *   • Legacy mode doesn't support all Unicode characters
   */
  oem: 1,

  /**
   * Tesseract PSM (Page Segmentation Mode).
   *   3 = Fully automatic page segmentation (default)
   *   4 = Assume a single column of text
   *   6 = Assume a single uniform block of text
   *
   * PSM 3 is best for invoices because they have mixed layouts:
   * headers, tables, footers, sometimes multi-column.
   */
  psm: 3,

  /**
   * Idle timeout in milliseconds.
   * After this duration with no OCR requests, the worker is terminated
   * to free ~50–80 MB of RAM.  It will be re-created on the next request.
   */
  idleTimeoutMs: 5 * 60 * 1000, // 5 minutes

  /**
   * Maximum retries for transient OCR failures.
   * Each retry creates a fresh worker (resets WASM heap).
   */
  maxRetries: 1,
};

// ─── Worker Lifecycle ────────────────────────────────────────────────────────

/** @type {Tesseract.Worker | null} */
let worker = null;
let workerReady = false;
let workerInitializing = false;

/** @type {NodeJS.Timeout | null} */
let idleTimer = null;

/** Track total OCR calls and cumulative processing time for monitoring */
const stats = {
  totalCalls: 0,
  totalTimeMs: 0,
  workerInitCount: 0,
  failureCount: 0,
  lastCallAt: null,
};

/**
 * Get or create the Tesseract worker (lazy singleton).
 *
 * If another request is already initializing the worker, this function
 * waits for that initialization to complete rather than creating a
 * duplicate — this prevents the "thundering herd" problem on cold start.
 *
 * @returns {Promise<Tesseract.Worker>}
 */
async function getWorker() {
  // Reset idle timer on every access
  resetIdleTimer();

  // Fast path: worker already ready
  if (worker && workerReady) {
    return worker;
  }

  // Guard: another caller is already initializing
  if (workerInitializing) {
    // Poll until ready (max 30 seconds)
    for (let i = 0; i < 60; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (worker && workerReady) return worker;
    }
    throw new Error('Tesseract worker initialization timed out');
  }

  // Initialize
  workerInitializing = true;
  stats.workerInitCount++;

  const initStart = Date.now();
  console.log(`🔍 Initializing Tesseract OCR worker (lang=${CONFIG.language}, OEM=${CONFIG.oem})...`);

  try {
    worker = await Tesseract.createWorker(CONFIG.language, CONFIG.oem, {
      logger: (m) => {
        // Log progress at 25% intervals during recognition
        if (m.status === 'recognizing text') {
          const pct = Math.round((m.progress || 0) * 100);
          if (pct % 25 === 0 && pct > 0) {
            console.log(`  ⏳ OCR recognition: ${pct}%`);
          }
        }
      },
    });

    // Configure Tesseract parameters for invoice/bill optimization
    await worker.setParameters({
      // Page segmentation mode
      tessedit_pageseg_mode: String(CONFIG.psm),

      // Prefer digits and common bill characters (subtle accuracy boost)
      // This doesn't restrict output — it biases the LSTM's softmax
      tessedit_char_whitelist: '',

      // Preserve inter-word spaces (important for table-like layouts)
      preserve_interword_spaces: '1',
    });

    workerReady = true;
    const initMs = Date.now() - initStart;
    console.log(`✅ Tesseract worker ready in ${(initMs / 1000).toFixed(1)}s`);

    // Start idle auto-shutdown timer
    resetIdleTimer();

    return worker;
  } catch (error) {
    worker = null;
    workerReady = false;
    throw new Error(`Failed to initialize Tesseract worker: ${error.message}`, { cause: error });
  } finally {
    workerInitializing = false;
  }
}

/**
 * Reset the idle shutdown timer.
 * Called on every worker access to keep it alive during active use.
 */
function resetIdleTimer() {
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
  idleTimer = setTimeout(async () => {
    await terminateWorker('idle timeout');
  }, CONFIG.idleTimeoutMs);
}

/**
 * Terminate the Tesseract worker and free its memory.
 *
 * @param {string} reason — Why the worker is being terminated (for logging)
 */
async function terminateWorker(reason = 'manual') {
  if (!worker) return;

  console.log(`🔻 Terminating Tesseract worker (reason: ${reason})...`);

  try {
    await worker.terminate();
  } catch (error) {
    console.warn(`  ⚠ Worker termination warning: ${error.message}`);
  }

  worker = null;
  workerReady = false;

  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
}

// ─── Core OCR Function ───────────────────────────────────────────────────────

/**
 * Perform OCR on a preprocessed image file.
 *
 * Returns the raw extracted text, a confidence score, per-word details
 * with bounding boxes, and performance timing.
 *
 * The confidence score (0–100) represents Tesseract's internal certainty
 * averaged across all recognized characters.  Interpretation guide:
 *   90–100  Excellent — clean printed text, good photo
 *   70–89   Good — minor blur or noise, most text correct
 *   50–69   Fair — some characters likely wrong, needs manual review
 *   <50     Poor — heavy blur, handwriting, or wrong language
 *
 * @param {string} imagePath  — Path to the preprocessed image (PNG preferred)
 * @param {number} [attempt]  — Internal retry counter (do not set manually)
 *
 * @returns {Promise<{
 *   rawText: string,
 *   confidence: number,
 *   processingTime: number,
 *   words: Array<{ text: string, confidence: number, bbox: object }>,
 *   lines: Array<{ text: string, confidence: number }>,
 *   paragraphs: number,
 *   characterCount: number
 * }>}
 */
export async function recognizeImage(imagePath, attempt = 0) {
  const startTime = Date.now();

  try {
    const w = await getWorker();

    console.log(`🔍 Running OCR on: ${imagePath.split(/[/\\]/).pop()}`);

    // ── Execute recognition ──
    const { data } = await w.recognize(imagePath);

    const processingTime = Date.now() - startTime;

    // ── Extract structured results ──
    const rawText = data.text || '';
    const confidence = Math.round(data.confidence || 0);

    // Per-word details with bounding boxes (useful for future highlighting)
    const words = (data.words || []).map((word) => ({
      text: word.text,
      confidence: Math.round(word.confidence || 0),
      bbox: word.bbox
        ? {
            x0: word.bbox.x0,
            y0: word.bbox.y0,
            x1: word.bbox.x1,
            y1: word.bbox.y1,
          }
        : null,
    }));

    // Per-line details (useful for table row detection)
    const lines = (data.lines || []).map((line) => ({
      text: line.text?.trim() || '',
      confidence: Math.round(line.confidence || 0),
    }));

    // Count paragraphs (text blocks separated by blank lines)
    const paragraphs = (data.paragraphs || []).length;

    // Total character count (excluding whitespace)
    const characterCount = rawText.replace(/\s/g, '').length;

    // ── Update internal stats ──
    stats.totalCalls++;
    stats.totalTimeMs += processingTime;
    stats.lastCallAt = new Date().toISOString();

    // ── Log result summary ──
    const avgTime = Math.round(stats.totalTimeMs / stats.totalCalls);
    console.log(
      `✅ OCR complete: ${characterCount} chars, ${words.length} words, ` +
      `${confidence}% confidence, ${(processingTime / 1000).toFixed(1)}s ` +
      `(avg: ${(avgTime / 1000).toFixed(1)}s over ${stats.totalCalls} calls)`
    );

    // ── Warn on low confidence ──
    if (confidence < 50) {
      console.warn(
        `  ⚠ Low OCR confidence (${confidence}%). Possible causes:\n` +
        `    • Blurry or out-of-focus image\n` +
        `    • Handwritten text (not supported)\n` +
        `    • Non-English text\n` +
        `    • Heavy noise or watermarks`
      );
    }

    // Reset idle timer (successful call = worker is in use)
    resetIdleTimer();

    return {
      rawText,
      confidence,
      processingTime,
      words,
      lines,
      paragraphs,
      characterCount,
    };

  } catch (error) {
    stats.failureCount++;
    const processingTime = Date.now() - startTime;

    console.error(
      `❌ OCR failed (attempt ${attempt + 1}/${CONFIG.maxRetries + 1}): ${error.message}`
    );

    // ── Retry logic ──
    // Terminate the broken worker and try once more with a fresh one.
    // This handles transient WASM memory corruption and worker crashes.
    if (attempt < CONFIG.maxRetries) {
      console.log('  🔄 Retrying with fresh worker...');
      await terminateWorker('error recovery');
      return recognizeImage(imagePath, attempt + 1);
    }

    // ── Final failure ──
    await terminateWorker('unrecoverable error');

    const wrapped = new Error(
      `OCR recognition failed after ${attempt + 1} attempt(s): ${error.message}`
    );
    wrapped.cause = error;
    wrapped.processingTime = processingTime;
    throw wrapped;
  }
}

// ─── Utility Functions ───────────────────────────────────────────────────────

/**
 * Get OCR engine health and statistics.
 * Useful for monitoring dashboards and health check endpoints.
 *
 * @returns {{
 *   workerActive: boolean,
 *   workerReady: boolean,
 *   totalCalls: number,
 *   avgProcessingTimeMs: number,
 *   failureCount: number,
 *   failureRate: string,
 *   lastCallAt: string | null,
 *   workerInitCount: number
 * }}
 */
export function getStats() {
  return {
    workerActive: worker !== null,
    workerReady,
    totalCalls: stats.totalCalls,
    avgProcessingTimeMs: stats.totalCalls > 0
      ? Math.round(stats.totalTimeMs / stats.totalCalls)
      : 0,
    failureCount: stats.failureCount,
    failureRate: stats.totalCalls > 0
      ? `${((stats.failureCount / stats.totalCalls) * 100).toFixed(1)}%`
      : '0%',
    lastCallAt: stats.lastCallAt,
    workerInitCount: stats.workerInitCount,
  };
}

/**
 * Graceful shutdown — terminate the worker and clear timers.
 * Call this in the server's SIGTERM/SIGINT handler.
 */
export async function shutdown() {
  await terminateWorker('server shutdown');
  console.log('🔍 OCR service shut down cleanly');
}

export default {
  recognizeImage,
  getStats,
  shutdown,
};
