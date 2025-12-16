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
