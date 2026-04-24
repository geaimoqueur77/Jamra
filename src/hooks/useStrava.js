import { useState, useEffect, useCallback } from 'react';
import {
  getStravaConnection,
  fullStravaSync,
  disconnectStrava as disconnectStravaApi,
  startStravaOAuth,
} from '../lib/strava';
import { useAuth } from './useAuth';

/**
 * Hook Strava pour l'UI : état de connexion + helpers.
 */
export default function useStrava() {
  const { isAuthenticated } = useAuth();
  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setConnection(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const conn = await getStravaConnection();
      setConnection(conn);
      setError(null);
    } catch (err) {
      setError(err.message || 'Erreur Strava');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Sync auto au montage si connecté
  useEffect(() => {
    if (!connection) return;
    const lastSync = connection.last_synced_at ? new Date(connection.last_synced_at).getTime() : 0;
    const now = Date.now();
    // Sync auto si pas fait depuis > 1h
    if (now - lastSync > 60 * 60 * 1000) {
      sync().catch(() => {});
    }
  }, [connection?.profile_id]); // eslint-disable-line

  const connect = useCallback(() => {
    startStravaOAuth();
  }, []);

  const disconnect = useCallback(async () => {
    setLoading(true);
    try {
      await disconnectStravaApi();
      setConnection(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const sync = useCallback(async ({ days = 14 } = {}) => {
    if (syncing) return null;
    setSyncing(true);
    setError(null);
    try {
      const result = await fullStravaSync({ days });
      await refresh();
      return result;
    } catch (err) {
      setError(err.message || 'Erreur sync Strava');
      return null;
    } finally {
      setSyncing(false);
    }
  }, [syncing, refresh]);

  return {
    connection,
    isConnected: !!connection,
    loading,
    syncing,
    error,
    connect,
    disconnect,
    sync,
    refresh,
  };
}
