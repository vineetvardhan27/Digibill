import { useState, useEffect, useCallback } from 'react';
import { analyticsAPI } from '@/lib/api';
import type { ForecastResponse } from '@/types/forecast';

interface UseForecastReturn {
  forecast: ForecastResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useForecast(days: number): UseForecastReturn {
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchForecast = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsAPI.getForecast(days);
      setForecast(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch forecast');
      setForecast(null);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  return { forecast, loading, error, refetch: fetchForecast };
}
