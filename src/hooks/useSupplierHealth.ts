import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api';
import type { HealthScore } from '@/types/health';

interface UseSupplierHealthReturn {
  health: (HealthScore & { supplierId: string; supplierName: string }) | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSupplierHealth(supplierId: string | null): UseSupplierHealthReturn {
  const [health, setHealth] = useState<UseSupplierHealthReturn['health']>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    if (!supplierId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/suppliers/${supplierId}/health`);
      setHealth(response.data.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch health score');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  return { health, loading, error, refetch: fetchHealth };
}
