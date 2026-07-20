import axios, { AxiosInstance, AxiosError } from 'axios';
import { Supplier, Bill, DashboardStats, MonthlyData, SupplierSpend } from '@/types';
import type { HealthScore, HealthSummaryItem } from '@/types/health';
import type { ForecastResponse } from '@/types/forecast';
import supplierApiClient from './supplierApi';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token and idempotency key
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Phase 4: Idempotency
    // Automatically inject an Idempotency-Key for sensitive endpoints if not already provided
    const isIdempotentRoute = config.url?.match(/\/(payments|reminders)/i) && config.method?.toLowerCase() === 'post';
    if (isIdempotentRoute && !config.headers['Idempotency-Key']) {
      config.headers['Idempotency-Key'] = crypto.randomUUID();
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

import { toast } from 'sonner';

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const seconds = retryAfter ? parseInt(retryAfter as string, 10) : 60;
      toast.error(`Too many requests, try again in ${seconds}s`);
    }
    
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);

// ==================== AUTH API ====================

export const authAPI = {
  register: async (data: { name: string; email: string; password: string; phone?: string }) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  me: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  verifyEmail: async (token: string) => {
    const response = await apiClient.post('/auth/verify-email', { token });
    return response.data;
  },

  resendVerification: async (email: string) => {
    const response = await apiClient.post('/auth/resend-verification', { email });
    return response.data;
  },

  googleLogin: async (idToken: string) => {
    const response = await apiClient.post('/auth/google', { idToken });
    return response.data;
  },

  verifyToken: async () => {
    const response = await apiClient.post('/auth/verify-token');
    return response.data;
  },

  updateProfile: async (data: { name?: string; phone?: string; shopName?: string; shopAddress?: string }) => {
    const response = await apiClient.put('/auth/profile', data);
    return response.data;
  },
};

// ==================== SUPPLIER API ====================

export const supplierAPI = {
  // Get all suppliers with optional filters
  getSuppliers: async (params?: {
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get<{
      success: boolean;
      data: {
        suppliers: Supplier[];
        pagination: {
          total: number;
          page: number;
          pages: number;
          limit: number;
        };
      };
    }>('/suppliers', { params });
    return response.data;
  },

  // Get supplier by ID
  getSupplier: async (id: string) => {
    const response = await apiClient.get<{
      success: boolean;
      data: { supplier: Supplier };
    }>(`/suppliers/${id}`);
    return response.data;
  },

  // Create new supplier
  createSupplier: async (data: {
    name: string;
    phone: string;
    address: string;
    email?: string;
    gstNumber?: string;
  }) => {
    const response = await apiClient.post<{
      success: boolean;
      data: { supplier: Supplier };
      message: string;
    }>('/suppliers', data);
    return response.data;
  },

  // Update supplier
  updateSupplier: async (id: string, data: Partial<Supplier>) => {
    const response = await apiClient.put<{
      success: boolean;
      data: { supplier: Supplier };
      message: string;
    }>(`/suppliers/${id}`, data);
    return response.data;
  },

  // Delete supplier
  deleteSupplier: async (id: string) => {
    const response = await apiClient.delete<{
      success: boolean;
      message: string;
    }>(`/suppliers/${id}`);
    return response.data;
  },

  // Invite supplier
  inviteSupplier: async (id: string) => {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
    }>(`/suppliers/${id}/invite`);
    return response.data;
  },

  // Get health score for a single supplier
  getHealthScore: async (id: string) => {
    const response = await apiClient.get<{
      success: boolean;
      data: HealthScore & { supplierId: string; supplierName: string };
    }>(`/suppliers/${id}/health`);
    return response.data;
  },

  // Get health summary for all suppliers
  getHealthSummary: async () => {
    const response = await apiClient.get<{
      success: boolean;
      data: HealthSummaryItem[];
    }>('/suppliers/health-summary');
    return response.data;
  },
};

// ==================== CONNECTIONS API ====================

export const connectionAPI = {
  getConnections: async (params?: { status?: string }) => {
    const response = await apiClient.get<{
      success: boolean;
      data: import('@/types').Connection[];
    }>('/connections', { params });
    return response.data;
  },

  getPending: async () => {
    const response = await apiClient.get<{
      success: boolean;
      data: import('@/types').ConnectionRequest[];
    }>('/connections/pending');
    return response.data;
  },

  respond: async (id: string, action: 'accept' | 'reject') => {
    const response = await apiClient.patch<{
      success: boolean;
      data: import('@/types').Connection;
    }>(`/connections/${id}/respond`, { action });
    return response.data;
  },

  disconnect: async (id: string) => {
    const response = await apiClient.patch<{
      success: boolean;
      message: string;
    }>(`/connections/${id}/disconnect`);
    return response.data;
  },

  updateNotes: async (id: string, shopNotes: string) => {
    const response = await apiClient.patch<{
      success: boolean;
      data: import('@/types').Connection;
    }>(`/connections/${id}/notes`, { shopNotes });
    return response.data;
  }
};

export const paymentAPI = {
  // Phase 6: Razorpay Integration
  createOrder: async (billId: string) => {
    const response = await apiClient.post<{
      success: boolean;
      data: {
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
      };
    }>('/payments/orders', { billId });
    return response.data;
  },
};

export const supplierConnectionAPI = {
  getConnections: async (params?: { status?: string }) => {
    const response = await supplierApiClient.get<{
      success: boolean;
      data: import('@/types').Connection[];
    }>('/supplier-connections', { params });
    return response.data;
  },

  getPending: async () => {
    const response = await supplierApiClient.get<{
      success: boolean;
      data: import('@/types').ConnectionRequest[];
    }>('/supplier-connections/pending');
    return response.data;
  },

  respond: async (id: string, action: 'accept' | 'reject') => {
    const response = await supplierApiClient.patch<{
      success: boolean;
      data: import('@/types').Connection;
    }>(`/supplier-connections/${id}/respond`, { action });
    return response.data;
  },

  disconnect: async (id: string) => {
    const response = await supplierApiClient.patch<{
      success: boolean;
      message: string;
    }>(`/supplier-connections/${id}/disconnect`);
    return response.data;
  },

  getDashboard: async () => {
    const response = await supplierApiClient.get<{
      success: boolean;
      data: {
        connectedShopsCount: number;
        totalBills: number;
        totalOwedToYou: number;
        totalReceived: number;
        recentActivity: any[];
      };
    }>('/supplier-connections/dashboard');
    return response.data;
  },

  getProfile: async () => {
    const response = await supplierApiClient.get<{
      success: boolean;
      data: any;
    }>('/supplier-connections/profile');
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await supplierApiClient.patch<{
      success: boolean;
      data: any;
    }>('/supplier-connections/profile', data);
    return response.data;
  }
};

// ==================== BILL API ====================

export const billAPI = {
  // Get all bills with optional filters
  getBills: async (params?: {
    connectionId?: string;
    supplierId?: string; // DEPRECATED
    isPaid?: boolean;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get<{
      success: boolean;
      data: {
        bills: Bill[];
        pagination: {
          total: number;
          page: number;
          pages: number;
          limit: number;
        };
        stats: {
          totalAmount: number;
          paidAmount: number;
          pendingAmount: number;
        };
      };
    }>('/bills', { params });
    return response.data;
  },

  // Get bill by ID
  getBill: async (id: string) => {
    const response = await apiClient.get<{
      success: boolean;
      data: { bill: Bill };
    }>(`/bills/${id}`);
    return response.data;
  },

  // Check for duplicates
  checkDuplicate: async (data: { supplierId: string; amount: number; billDate: string }) => {
    const response = await apiClient.post<{
      success: boolean;
      isDuplicate: boolean;
      data: { matches: Bill[] };
    }>('/bills/check-duplicate', data);
    return response.data;
  },

  // Create new bill
  createBill: async (data: {
    connectionId?: string;
    supplierId?: string; // DEPRECATED
    amount: number;
    date: string;
    dueDate?: string;
    description?: string;
    items?: Array<{
      name: string;
      quantity: number;
      price: number;
      unit?: string;
    }>;
  }) => {
    const response = await apiClient.post<{
      success: boolean;
      data: { bill: Bill };
      message: string;
    }>('/bills', data);
    return response.data;
  },

  // Update bill
  updateBill: async (id: string, data: Partial<Bill>) => {
    const response = await apiClient.put<{
      success: boolean;
      data: { bill: Bill };
      message: string;
    }>(`/bills/${id}`, data);
    return response.data;
  },

  // Mark bill as paid
  markAsPaid: async (id: string, paidDate?: string) => {
    const response = await apiClient.put<{
      success: boolean;
      data: { bill: Bill };
      message: string;
    }>(`/bills/${id}/pay`, { paidDate });
    return response.data;
  },

  // Delete bill
  deleteBill: async (id: string) => {
    const response = await apiClient.delete<{
      success: boolean;
      message: string;
    }>(`/bills/${id}`);
    return response.data;
  },

  // Get disputes
  getDisputes: async (params?: { status?: string; connectionId?: string }) => {
    const statusStr = typeof params === 'string' ? params : (params?.status || 'open');
    const connectionId = typeof params === 'object' ? params.connectionId : undefined;
    
    const queryParams: any = { status: statusStr };
    if (connectionId) queryParams.connectionId = connectionId;

    const response = await apiClient.get<{
      success: boolean;
      data: import('@/types').BillDispute[];
    }>('/bills/disputes', { params: queryParams });
    return response.data;
  },

  // Update dispute
  updateDispute: async (id: string, data: { status: string; ownerNote?: string }) => {
    const response = await apiClient.patch<{
      success: boolean;
      data: import('@/types').BillDispute;
    }>(`/bills/disputes/${id}`, data);
    return response.data;
  },
};

// ==================== DASHBOARD API ====================

export const dashboardAPI = {
  // Get dashboard stats
  getStats: async () => {
    const response = await apiClient.get<{
      success: boolean;
      data: {
        stats: DashboardStats;
      };
    }>('/dashboard/stats');
    return response.data;
  },
};

// ==================== ANALYTICS API ====================

interface AnalyticsChartData {
  monthlySpend: MonthlyData[];
  supplierBreakdown: SupplierSpend[];
  categoryBreakdown: Array<{
    itemName: string;
    totalQuantity: number;
    totalValue: number;
    avgPrice: number;
  }>;
  paymentTrends: Array<{
    year: number;
    month: number;
    monthName: string;
    paymentsCount: number;
    paymentsAmount: number;
    avgPaymentTime: number;
  }>;
}

export const analyticsAPI = {
  // Get analytics charts data
  getCharts: async (months: number = 6) => {
    const response = await apiClient.get<{
      success: boolean;
      data: AnalyticsChartData;
    }>('/analytics/charts', { params: { months } });
    return response.data;
  },

  // Get analytics summary
  getSummary: async () => {
    const response = await apiClient.get<{
      success: boolean;
      data: {
        overall: {
          totalBills: number;
          totalAmount: number;
          avgBillAmount: number;
          maxBillAmount: number;
          minBillAmount: number;
        };
        paymentStatus: {
          paid: { count: number; amount: number };
          unpaid: { count: number; amount: number };
        };
        overdue: {
          count: number;
          amount: number;
        };
      };
    }>('/analytics/summary');
    return response.data;
  },

  // Get due bills
  getDueBills: async (days: number = 7) => {
    const response = await apiClient.get<{
      success: boolean;
      data: {
        bills: Bill[];
        grouped: {
          overdue: Bill[];
          dueSoon: Bill[];
        };
        stats: {
          overdue: { count: number; amount: number };
          dueSoon: { count: number; amount: number };
          total: { count: number; amount: number };
        };
      };
    }>('/bills/due', { params: { days } });
    return response.data;
  },

  // Get upcoming bills
  getUpcomingBills: async (startDays: number = 0, endDays: number = 30) => {
    const response = await apiClient.get<{
      success: boolean;
      data: {
        bills: Bill[];
        groupedByWeek: Record<string, Bill[]>;
        stats: {
          count: number;
          totalAmount: number;
        };
      };
    }>('/bills/upcoming', { params: { startDays, endDays } });
    return response.data;
  },

  // Get cash flow forecast
  getForecast: async (days: number = 30) => {
    const response = await apiClient.get<{
      success: boolean;
      data: ForecastResponse;
    }>(`/analytics/forecast?days=${days}`);
    return response.data;
  },
};

// Export the configured axios instance for custom requests
export default apiClient;
