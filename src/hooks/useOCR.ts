/**
 * useOCR Hook
 * Manages the full OCR workflow state machine for the dedicated Scan Bill page:
 * idle → uploading → processing → parsed → reviewing → saving → saved
 *
 * Updated to work with the Groq Vision API backend response format.
 */

import { useState, useCallback, useRef } from 'react';
import { ocrAPI } from '@/services/ocrApi';
import { billAPI } from '@/lib/api';
import { GroqOCRResult, ParsedBillData, ParsedBillItem, OCRFieldConfidence, OCRResult, OCRWorkflowState } from '@/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];

/**
 * Convert a GroqOCRResult into the ParsedBillData format expected by the OCR review form.
 */
function groqResultToParsedData(groqResult: GroqOCRResult): ParsedBillData {
  return {
    invoiceNumber: null, // Groq response doesn't have invoiceNumber
    date: groqResult.billDate,
    dueDate: groqResult.dueDate,
    supplierName: groqResult.supplierName,
    supplierPhone: groqResult.supplierPhone,
    supplierAddress: groqResult.supplierAddress,
    gstNumber: groqResult.supplierGST,
    items: groqResult.items.map(item => ({
      description: item.description || '',
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice || 0,
      hsnCode: item.hsnCode || '',
      gstRate: (item.gstRate || 0) as any,
      gstType: (item.gstType || 'CGST_SGST') as any,
    })),
    subtotal: groqResult.subtotal,
    totalCGST: groqResult.totalCGST,
    totalSGST: groqResult.totalSGST,
    totalIGST: groqResult.totalIGST,
    tax: null,
    totalAmount: groqResult.totalAmount,
  };
}

/**
 * Generate a confidence fields object from the Groq confidence level.
 */
function groqConfidenceToFieldConfidence(
  groqResult: GroqOCRResult
): OCRFieldConfidence {
  const level = groqResult.confidence === 'high' ? 'high' : groqResult.confidence === 'medium' ? 'low' : 'missing';
  
  return {
    totalAmount: groqResult.totalAmount !== null ? (groqResult.confidence === 'high' ? 'high' : 'low') : 'missing',
    date: groqResult.billDate !== null ? (groqResult.confidence === 'high' ? 'high' : 'low') : 'missing',
    supplierName: groqResult.supplierName !== null ? (groqResult.confidence === 'high' ? 'high' : 'low') : 'missing',
    invoiceNumber: 'missing',
    items: groqResult.items.length > 0 ? (groqResult.confidence === 'high' ? 'high' : 'low') : 'missing',
    gstNumber: groqResult.supplierGST !== null ? 'high' : 'missing',
    dueDate: groqResult.dueDate !== null ? (groqResult.confidence === 'high' ? 'high' : 'low') : 'missing',
    subtotal: 'missing',
    tax: 'missing',
  };
}

interface UseOCRReturn {
  state: OCRWorkflowState;
  file: File | null;
  preview: string | null;
  ocrResult: OCRResult | null;
  editableData: ParsedBillData | null;
  error: string | null;
  uploadProgress: number;
  supplierAlternatives: [];
  uploadFile: (file: File) => Promise<void>;
  reset: () => void;
  setField: <K extends keyof ParsedBillData>(field: K, value: ParsedBillData[K]) => void;
  setItem: (index: number, item: ParsedBillItem) => void;
  addItem: () => void;
  removeItem: (index: number) => void;
  setSelectedSupplierId: (id: string) => void;
  selectedSupplierId: string;
  startReview: () => void;
  goBackToParsed: () => void;
  saveBill: () => Promise<void>;
  retry: () => Promise<void>;
}

export function useOCR(): UseOCRReturn {
  const [state, setState] = useState<OCRWorkflowState>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [editableData, setEditableData] = useState<ParsedBillData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');

  const abortRef = useRef<AbortController | null>(null);
  const lastFileRef = useRef<File | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!file) return 'No file selected';
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Invalid file type: ${file.type}. Accepted: JPG, PNG, WEBP, HEIC`;
    }
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return `File too large: ${sizeMB}MB. Maximum: ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }
    return null;
  }, []);

  const generatePreview = useCallback((file: File): string | null => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  }, []);

  const uploadFile = useCallback(async (selectedFile: File) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      setState('error');
      return;
    }

    setError(null);
    setFile(selectedFile);
    setUploadProgress(0);
    lastFileRef.current = selectedFile;

    const previewUrl = generatePreview(selectedFile);
    setPreview(previewUrl);

    setState('uploading');

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 300);

      setTimeout(() => {
        setState('processing');
      }, 800);

      const response = await ocrAPI.scanBill(selectedFile);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success) {
        const groqData = response.data;
        const parsedData = groqResultToParsedData(groqData);
        const fieldConfidence = groqConfidenceToFieldConfidence(groqData);

        // Convert to OCRResult format for compatibility with existing components
        const compatibleResult: OCRResult = {
          parsed: parsedData,
          matchedSupplier: null,
          supplierMatchConfidence: 0,
          supplierMatchType: 'none',
          supplierAlternatives: [],
          rawText: '',
          metadata: {
            processingMethod: 'image_ocr',
            ocrConfidence: groqData.confidence === 'high' ? 90 : groqData.confidence === 'medium' ? 60 : 30,
            parsingConfidence: {
              overall: groqData.confidence === 'high' ? 90 : groqData.confidence === 'medium' ? 60 : 30,
              fields: fieldConfidence,
            },
            originalFilename: selectedFile.name,
            fileSize: selectedFile.size,
            mimeType: selectedFile.type,
            imageMetadata: null,
          },
        };

        setOcrResult(compatibleResult);
        setEditableData({ ...parsedData });
        setState('parsed');
      } else {
        setError(response.message || 'OCR processing failed');
        setState('error');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      setState('error');
    }
  }, [validateFile, generatePreview]);

  const retry = useCallback(async () => {
    if (lastFileRef.current) {
      await uploadFile(lastFileRef.current);
    }
  }, [uploadFile]);

  const reset = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    if (abortRef.current) {
      abortRef.current.abort();
    }
    setState('idle');
    setFile(null);
    setPreview(null);
    setOcrResult(null);
    setEditableData(null);
    setError(null);
    setUploadProgress(0);
    setSelectedSupplierId('');
    lastFileRef.current = null;
  }, [preview]);

  const setField = useCallback(<K extends keyof ParsedBillData>(
    field: K,
    value: ParsedBillData[K]
  ) => {
    setEditableData(prev => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  }, []);

  const setItem = useCallback((index: number, item: ParsedBillItem) => {
    setEditableData(prev => {
      if (!prev) return prev;
      const newItems = [...prev.items];
      newItems[index] = item;
      return { ...prev, items: newItems };
    });
  }, []);

  const addItem = useCallback(() => {
    setEditableData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, hsnCode: '', gstRate: 0 as any, gstType: 'CGST_SGST' as any }],
      };
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setEditableData(prev => {
      if (!prev) return prev;
      const newItems = prev.items.filter((_, i) => i !== index);
      return { ...prev, items: newItems };
    });
  }, []);

  const startReview = useCallback(() => {
    setState('reviewing');
  }, []);

  const goBackToParsed = useCallback(() => {
    setState('parsed');
  }, []);

  const saveBill = useCallback(async () => {
    if (!editableData || !selectedSupplierId) {
      setError('Please select a supplier and fill in required fields');
      return;
    }

    if (!editableData.totalAmount || editableData.totalAmount <= 0) {
      setError('Total amount is required and must be greater than 0');
      return;
    }

    setState('saving');
    setError(null);

    try {
      const billData = {
        supplierId: selectedSupplierId,
        amount: editableData.totalAmount,
        date: editableData.date || new Date().toISOString(),
        dueDate: editableData.dueDate || undefined,
        description: editableData.invoiceNumber
          ? `Invoice #${editableData.invoiceNumber}`
          : 'OCR Scanned Bill',
        items: editableData.items.filter(
          item => item.description && item.quantity > 0 && item.unitPrice >= 0
        ),
      };

      await billAPI.createBill(billData);
      setState('saved');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save bill';
      setError(message);
      setState('error');
    }
  }, [editableData, selectedSupplierId]);

  return {
    state,
    file,
    preview,
    ocrResult,
    editableData,
    error,
    uploadProgress,
    supplierAlternatives: [],
    uploadFile,
    reset,
    setField,
    setItem,
    addItem,
    removeItem,
    setSelectedSupplierId,
    selectedSupplierId,
    startReview,
    goBackToParsed,
    saveBill,
    retry,
  };
}
