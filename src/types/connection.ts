import { HealthScore } from './health';

export type ConnectionStatus = 'none' | 'pending_sent' | 'pending_received' | 'connected' | 'rejected' | 'disconnected';

export interface Location {
  city: string;
  state: string;
  pincode?: string;
}

export interface DirectorySupplier {
  _id: string;
  businessName: string;
  category: string;
  location: Location;
  description?: string;
  gstin?: string;
  aggregateHealthScore?: HealthScore;
  totalConnectedShops?: number;
  connectionStatus: ConnectionStatus;
  // Included only when connected
  email?: string;
  phone?: string;
  ownerName?: string;
}

export interface DirectoryShop {
  _id: string;
  shopName: string;
  name?: string;
  location: Location;
  categoriesOfInterest?: string[];
  totalConnectedSuppliers?: number;
  createdAt: string;
  connectionStatus: ConnectionStatus;
}

export interface ConnectionRequest {
  _id: string;
  shopOwnerId: {
    _id: string;
    name?: string;
    shopName?: string;
  };
  supplierAccountId: {
    _id: string;
    businessName: string;
    ownerName?: string;
    category?: string;
    location?: Location;
    description?: string;
  };
  status: 'pending' | 'connected' | 'rejected' | 'disconnected';
  initiatedBy: 'shop' | 'supplier';
  requestNote?: string;
  shopNotes?: string;
  createdAt: string;
}

export interface DirectoryFilters {
  categories: { name: string; count: number }[];
  cities: { name: string; count: number }[];
}

export interface DirectoryResponse<T> {
  suppliers?: T[];
  shops?: T[];
  totalCount: number;
  page: number;
  totalPages: number;
  filters: DirectoryFilters;
}
