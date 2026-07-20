import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

export const getSupplierToken = (): string | null => {
  return localStorage.getItem('supplierToken');
};

const supplierApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to auto-attach the supplier token
supplierApiClient.interceptors.request.use(
  (config) => {
    const token = getSupplierToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

import { toast } from 'sonner';

// Add a response interceptor to handle token expiry and rate limiting
supplierApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('supplierToken');
      // We don't want to force redirect if they are on a public page,
      // the context/router will handle redirecting unauthenticated users.
    }
    
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const seconds = retryAfter ? parseInt(retryAfter as string, 10) : 60;
      toast.error(`Too many requests, try again in ${seconds}s`);
    }
    
    return Promise.reject(error);
  }
);

export const supplierFetch = async <T>(path: string, options: any = {}): Promise<T> => {
  try {
    const response = await supplierApiClient(path, options);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export default supplierApiClient;
