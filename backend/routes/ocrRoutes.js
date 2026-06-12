/**
 * OCR Routes
 * Defines API endpoints for bill scanning using Groq Vision API.
 * Uses multer with memory storage — images never touch disk.
 */

import express from 'express';
import multer from 'multer';
import authMiddleware from '../middleware/authMiddleware.js';
import { ocrLimiter } from '../middleware/rateLimiter.js';
import { scanBill } from '../controllers/ocrController.js';

const router = express.Router();

// ─── Multer Configuration (Memory Storage) ──────────────────────────────────

// Allowed image MIME types for Groq Vision
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
];

// File size limit: 10 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Memory storage — file stays in buffer, never written to disk
const storage = multer.memoryStorage();

// File filter — validates MIME type
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(
      `Invalid file type: ${file.mimetype}. Accepted formats: JPG, PNG, WEBP, HEIC.`
    );
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

// ─── Error Handling Middleware for Multer ─────────────────────────────────────

function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Only one file can be uploaded at a time.',
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected field name. Use "file" as the field name.',
        });
      default:
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
    }
  }

  if (err && err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  next(err);
}

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/ocr/scan
 * @desc    Upload a bill image and extract structured data via Groq Vision AI
 * @access  Private (JWT required), Rate Limited (15/hr before auth)
 *
 * Middleware order: ocrLimiter → authMiddleware → multer → handler
 * The rate limiter is applied BEFORE auth so unauthenticated flood attempts
 * are also blocked.
 *
 * Request: multipart/form-data with field "file"
 *
 * Response:
 * {
 *   success: true,
 *   message: "Bill scanned successfully",
 *   data: {
 *     supplierName, supplierPhone, supplierAddress, supplierGST,
 *     billDate, dueDate, totalAmount, description,
 *     items: [{ name, quantity, price, unit }],
 *     confidence: "high" | "medium" | "low"
 *   }
 * }
 */
router.post(
  '/scan',
  ocrLimiter,
  authMiddleware,
  upload.single('file'),
  handleMulterError,
  scanBill
);

export default router;
