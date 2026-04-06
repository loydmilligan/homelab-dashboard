import { useState, useEffect, useCallback } from 'react';
import type { DashboardState } from '../types/inventory';
import { fetchState } from '../lib/state';

const POLL_INTERVAL = 30000; // 30 seconds

export function useStatePolling() {
  const [state, setState] = useState<DashboardState | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchState();
      setState(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  return { state, error, loading, refresh };
}
