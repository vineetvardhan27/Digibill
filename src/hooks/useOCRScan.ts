/**
 * useOCRScan Hook
 * Lightweight hook for scanning bills with Groq Vision AI.
 * Manages scanning state, image preview, and cleanup.
 */

import { useState, useCallback, useRef } from 'react';
import { ocrAPI } from '@/services/ocrApi';
import { GroqOCRResult } from '@/types';
import { toast } from 'sonner';

interface UseOCRScanReturn {
  /** Whether a scan is currently in progress */
  isScanning: boolean;
  /** Object URL for the selected image preview */
  previewUrl: string | null;
  /** The scan result data (null if no scan completed yet) */
  scanResult: GroqOCRResult | null;
  /** Scan a bill image file */
  scanBill: (file: File) => Promise<GroqOCRResult | null>;
  /** Set a preview without scanning (for immediate preview on file select) */
  setPreview: (file: File) => void;
  /** Clean up preview URL and reset state */
  cleanup: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];

export function useOCRScan(): UseOCRScanReturn {
  const [isScanning, setIsScanning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<GroqOCRResult | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  /**
   * Set image preview without triggering a scan.
   */
  const setPreview = useCallback((file: File) => {
    // Revoke previous preview URL
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;
    setPreviewUrl(url);
  }, []);

  /**
   * Scan a bill image with Groq Vision AI.
   * Shows toast notifications for success/warning/error.
   */
  const scanBill = useCallback(async (file: File): Promise<GroqOCRResult | null> => {
    // ─── Client-side validation ──────────────────────────────────────
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Invalid file type', {
        description: 'Please upload a JPG, PNG, WEBP, or HEIC image.',
      });
      return null;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File too large', {
        description: `Maximum file size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
      });
      return null;
    }

    // ─── Set preview immediately ─────────────────────────────────────
    setPreview(file);

    // ─── Start scanning ──────────────────────────────────────────────
    setIsScanning(true);
    setScanResult(null);

    try {
      const response = await ocrAPI.scanBill(file);

      if (response.success && response.data) {
        const result = response.data;
        setScanResult(result);

        // Show appropriate toast based on confidence
        if (result.confidence === 'high') {
          toast.success('Bill scanned successfully', {
            description: `Confidence: High — ${result.supplierName || 'Unknown supplier'}, ₹${result.totalAmount ?? 'N/A'}`,
          });
        } else if (result.confidence === 'medium') {
          toast.warning('Bill scanned with partial confidence', {
            description: 'Some fields may be missing. Please review and correct the auto-filled data.',
          });
        } else {
          toast.warning('Low confidence scan', {
            description: 'Very little data was extracted. Please fill the form manually or try a clearer image.',
          });
        }

        return result;
      } else {
        toast.error('Scan failed', {
          description: response.message || 'Could not extract data from the image.',
        });
        return null;
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';

      // Check for rate limit errors
      if (message.includes('rate limit') || message.includes('Too many')) {
        toast.error('Scan limit reached', {
          description: 'You can scan up to 15 bills per hour. Please try again later.',
        });
      } else if (message.includes('timeout') || message.includes('Timeout')) {
        toast.error('Scan timed out', {
          description: 'The AI took too long to process this image. Please try again.',
        });
      } else {
        toast.error('Scan failed', {
          description: message,
        });
      }

      return null;
    } finally {
      setIsScanning(false);
    }
  }, [setPreview]);

  /**
   * Clean up: revoke object URL and reset all state.
   * Call this when the dialog closes or the form resets.
   */
  const cleanup = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
    setScanResult(null);
    setIsScanning(false);
  }, []);

  return {
    isScanning,
    previewUrl,
    scanResult,
    scanBill,
    setPreview,
    cleanup,
  };
}
