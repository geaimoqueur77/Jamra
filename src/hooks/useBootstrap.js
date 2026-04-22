import { useEffect, useState } from 'react';
import { importFoodsIfNeeded } from '../db/database';

/**
 * Hook qui importe le dataset d'aliments au premier lancement.
 * Retourne { ready, count, error }.
 */
export default function useBootstrap() {
  const [state, setState] = useState({ ready: false, count: 0, error: null });

  useEffect(() => {
    let cancelled = false;
    importFoodsIfNeeded()
      .then(({ count }) => {
        if (!cancelled) setState({ ready: true, count, error: null });
      })
      .catch(err => {
        console.error('Bootstrap failed', err);
        if (!cancelled) setState({ ready: true, count: 0, error: err });
      });
    return () => { cancelled = true; };
  }, []);

  return state;
}
