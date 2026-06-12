/**
 * OCR API Service
 * Handles communication with the Groq Vision OCR backend endpoint.
 */

import apiClient from '@/lib/api';
import { GroqOCRResult } from '@/types';

interface OCRScanResponse {
  success: boolean;
  message: string;
  data: GroqOCRResult;
}

/**
 * Upload a bill image and get AI-extracted structured data via Groq Vision.
 */
export async function scanBill(file: File): Promise<OCRScanResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<OCRScanResponse>('/ocr/scan', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    // Groq Vision inference can take up to 30 seconds
    timeout: 30000,
  });

  return response.data;
}

export const ocrAPI = {
  scanBill,
};

export default ocrAPI;
