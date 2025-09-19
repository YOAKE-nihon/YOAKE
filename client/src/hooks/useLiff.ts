import { useState, useCallback } from 'react';
import { ApiResponse } from '../types';

interface UseApiReturn<T = any> {
  loading: boolean;
  error: string | null;
  execute: (apiCall: () => Promise<ApiResponse<T>>) => Promise<T | null>;
  reset: () => void;
}

const useApi = <T = any>(): UseApiReturn<T> => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (apiCall: () => Promise<ApiResponse<T>>): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiCall();
      
      if (response.success) {
        return response.data || null;
      } else {
        setError(response.message || 'APIエラーが発生しました');
        return null;
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'ネットワークエラーが発生しました';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    reset,
  };
};

export default useApi;