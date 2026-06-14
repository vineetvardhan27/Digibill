import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSupplierToken } from '@/lib/supplierApi';
import type { SupplierAuth } from '@/types/supplier-portal';

interface SupplierAuthContextType {
  supplierToken: string | null;
  supplier: SupplierAuth | null;
  login: (token: string, supplierData: SupplierAuth) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const SupplierAuthContext = createContext<SupplierAuthContextType | undefined>(undefined);

export function SupplierAuthProvider({ children }: { children: ReactNode }) {
  const [supplierToken, setSupplierToken] = useState<string | null>(getSupplierToken());
  const [supplier, setSupplier] = useState<SupplierAuth | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getSupplierToken();
      if (token) {
        try {
          // Verify token and fetch profile
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/supplier-auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success && data.data) {
            setSupplierToken(token);
            setSupplier(data.data);
          } else {
            // Invalid token
            setSupplierToken(null);
            setSupplier(null);
            localStorage.removeItem('supplierToken');
          }
        } catch (error) {
          console.error('Failed to restore supplier session', error);
          setSupplierToken(null);
          setSupplier(null);
          localStorage.removeItem('supplierToken');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (token: string, supplierData: SupplierAuth) => {
    localStorage.setItem('supplierToken', token);
    setSupplierToken(token);
    setSupplier(supplierData);
  };

  const logout = () => {
    localStorage.removeItem('supplierToken');
    setSupplierToken(null);
    setSupplier(null);
  };

  return (
    <SupplierAuthContext.Provider
      value={{
        supplierToken,
        supplier,
        login,
        logout,
        isAuthenticated: !!supplierToken && !!supplier,
        isLoading
      }}
    >
      {children}
    </SupplierAuthContext.Provider>
  );
}

export function useSupplierAuth() {
  const context = useContext(SupplierAuthContext);
  if (context === undefined) {
    throw new Error('useSupplierAuth must be used within a SupplierAuthProvider');
  }
  return context;
}
