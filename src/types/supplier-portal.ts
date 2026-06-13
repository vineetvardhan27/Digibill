export interface SupplierAuth {
  id: string;
  name: string;
  portalEmail: string;
  inviteStatus: 'not_invited' | 'invited' | 'active';
  shopName?: string;
  ownerId?: string;
}

export interface SupplierDashboard {
  totalBills: number;
  pendingAmount: number;
  paidAmount: number;
  disputedAmount: number;
  recentBills: SupplierBill[];
}

export interface SupplierBill {
  _id: string;
  amount: number;
  description: string;
  dueDate: string;
  status: 'pending' | 'paid' | 'disputed';
  createdAt: string;
  lineItems?: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  acknowledgedAt?: string;
  dispute?: BillDispute;
  invoices?: SupplierInvoice[];
}

export interface BillDispute {
  _id: string;
  reason: string;
  status: 'open' | 'resolved' | 'rejected';
  createdAt: string;
  ownerNote?: string;
  resolvedAt?: string;
}

export interface SupplierInvoice {
  _id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  notes?: string;
  billId?: string;
}

export interface ActivityItem {
  id: string;
  type: 'bill_created' | 'bill_paid' | 'dispute_opened' | 'dispute_resolved' | 'invoice_uploaded';
  text: string;
  createdAt: string;
}
