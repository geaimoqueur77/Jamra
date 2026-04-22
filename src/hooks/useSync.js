import { useEffect, useState } from 'react';
import { subscribeSync, forceSync } from '../lib/sync';

/**
 * Hook d'état de synchronisation.
 * Retourne { status, lastSyncAt, error, pendingCount, forceSync }.
 */
export default function useSync() {
  const [state, setState] = useState({
    status: 'idle',
    lastSyncAt: null,
    error: null,
    pendingCount: 0,
  });

  useEffect(() => {
    const unsub = subscribeSync(setState);
    return () => unsub();
  }, []);

  return { ...state, forceSync };
}
