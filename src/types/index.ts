export interface User {
  id?: string; // For compatibility
  _id?: string; // MongoDB ID
  name: string;
  email: string;
  phone?: string;
  shopName?: string;
  shopAddress?: string;
  createdAt?: Date;
}

export interface Supplier {
  id?: string; // For compatibility
  _id: string; // MongoDB ID
  name: string;
  phone?: string;
  address?: string;
  email?: string;
  gstNumber?: string;
  totalSpend: number;
  totalBills: number;
  lastPurchaseDate?: Date;
  pendingAmount: number;
  createdAt: Date;
}

export interface Bill {
  id?: string; // For compatibility
  _id: string; // MongoDB ID
  supplierId: string;
  supplier?: {
    id: string;
    name: string;
    phone?: string;
    address?: string;
  };
  supplierName?: string; // Deprecated, use supplier.name
  amount: number;
  date: Date;
  description?: string;
  isPaid: boolean;
  paidDate?: Date;
  dueDate?: Date;
  imageUrl?: string;
  items?: BillItem[];
  products?: BillProduct[]; // Deprecated, use items
  createdAt: Date;
}

export interface BillItem {
  name: string;
  quantity: number;
  price: number;
  unit?: string;
}

export interface BillProduct {
  id: string;
  name: string;
  quantity: number;
  price: number;
  unit?: string;
}

export interface DashboardStats {
  totalSpend: number;
  totalBills: number;
  totalSuppliers: number;
  pendingPayments: number;
  monthlySpend: number;
  monthlyBills?: number;
  monthlyChange: number;
  paidBills?: number;
  unpaidBills?: number;
  paidAmount?: number;
  paymentRate?: number;
}

export interface MonthlyData {
  month: string;
  amount: number;
}

export interface SupplierSpend {
  name: string;
  amount: number;
  percentage: number;
}

// ==================== OCR TYPES ====================

export interface ParsedBillItem {
  name: string;
  quantity: number;
  price: number;
  unit?: string;
}

export interface ParsedBillData {
  invoiceNumber: string | null;
  date: string | null;
  dueDate: string | null;
  supplierName: string | null;
  supplierPhone: string | null;
  supplierAddress: string | null;
  gstNumber: string | null;
  items: ParsedBillItem[];
  subtotal: number | null;
  tax: number | null;
  totalAmount: number | null;
}

export interface OCRFieldConfidence {
  totalAmount: 'high' | 'low' | 'missing';
  date: 'high' | 'low' | 'missing';
  supplierName: 'high' | 'low' | 'missing';
  invoiceNumber: 'high' | 'low' | 'missing';
  items: 'high' | 'low' | 'missing';
  gstNumber: 'high' | 'low' | 'missing';
  dueDate: 'high' | 'low' | 'missing';
  subtotal: 'high' | 'low' | 'missing';
  tax: 'high' | 'low' | 'missing';
}

export interface OCRConfidence {
  overall: number;
  fields: OCRFieldConfidence;
}

export interface MatchedSupplier {
  _id: string;
  name: string;
  phone: string | null;
  address: string | null;
  gstNumber?: string | null;
  totalBills?: number;
  totalSpend?: number;
}

export interface SupplierAlternative {
  supplier: MatchedSupplier;
  confidence: number;
  matchType: string;
}

export interface OCRMetadata {
  processingMethod: 'image_ocr' | 'pdf_text_extraction';
  ocrConfidence: number;
  parsingConfidence: OCRConfidence;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  imageMetadata: Record<string, unknown> | null;
}

export interface OCRResult {
  parsed: ParsedBillData;
  matchedSupplier: MatchedSupplier | null;
  supplierMatchConfidence: number;
  supplierMatchType: 'exact' | 'exact_expanded' | 'contains' | 'abbreviation' | 'word_overlap' | 'fuse_fuzzy' | 'gst_verified' | 'phone_verified' | 'initials' | 'fuzzy' | 'none';
  supplierAlternatives: SupplierAlternative[];
  rawText: string;
  metadata: OCRMetadata;
}

export type OCRWorkflowState =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'parsed'
  | 'reviewing'
  | 'saving'
  | 'saved'
  | 'error';

// ==================== GROQ VISION OCR TYPES ====================

export interface GroqOCRItem {
  name: string;
  quantity: number;
  price: number;
  unit: string;
}

export interface GroqOCRResult {
  supplierName: string | null;
  supplierPhone: string | null;
  supplierAddress: string | null;
  supplierGST: string | null;
  billDate: string | null;
  dueDate: string | null;
  totalAmount: number | null;
  description: string | null;
  items: GroqOCRItem[];
  confidence: 'high' | 'medium' | 'low';
}
