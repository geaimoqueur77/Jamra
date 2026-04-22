/**
 * Jamra — Sync engine
 *
 * Orchestration de la synchronisation offline-first entre IndexedDB (local)
 * et Supabase (distant). Fonctionnement :
 *
 *   - Au login : pull initial + push complet des données locales en attente
 *   - Toutes les 30s si online : pull incrémental + push des pending
 *   - À chaque mutation locale : push débouncé à 500ms
 *   - Sur event 'online' : flush immédiat
 *
 * État global exposé via subscribe() : { status, lastSyncAt, error, pendingCount }
 */

import { db, registerSyncFlushHandler } from '../../db/database';
import { supabase } from '../supabase';
import {
  pushProfile,
  pushAliments,
  pushConsommations,
  pushPesees,
  pushTrainingPlans,
  pushTrainingSessions,
  pushDeletions,
} from './push';
import {
  pullProfile,
  pullAliments,
  pullConsommations,
  pullPesees,
  pullTrainingPlans,
  pullTrainingSessions,
} from './pull';

// État interne
const state = {
  status: 'idle',     // 'idle' | 'syncing' | 'error' | 'offline'
  lastSyncAt: null,
  error: null,
  pendingCount: 0,
  userId: null,
};

const listeners = new Set();

function emit() {
  for (const l of listeners) {
    try { l({ ...state }); } catch (_) {}
  }
}

function setState(patch) {
  Object.assign(state, patch);
  emit();
}

export function subscribeSync(listener) {
  listeners.add(listener);
  listener({ ...state });
  return () => listeners.delete(listener);
}

// ==========================================================================
// COMPTAGE DES RECORDS EN ATTENTE DE SYNC
// ==========================================================================

async function computePendingCount() {
  const tables = [db.profil, db.aliments, db.consommations, db.pesees, db.repasTypes, db.repasTypeItems, db.training_plans, db.training_sessions];
  let total = 0;
  for (const t of tables) {
    total += await t.filter(r => r.needs_sync === true && r.source !== 'ciqual').count();
  }
  total += await db.pending_deletions.count();
  return total;
}

async function refreshPendingCount() {
  try {
    state.pendingCount = await computePendingCount();
    emit();
  } catch (_) {}
}

// ==========================================================================
// DÉTECTION ONLINE/OFFLINE
// ==========================================================================

function isOnline() {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

// ==========================================================================
// FULL SYNC (push + pull)
// ==========================================================================

let syncInProgress = false;

export async function fullSync() {
  if (syncInProgress) return;
  if (!state.userId) return;
  if (!isOnline()) {
    setState({ status: 'offline' });
    await refreshPendingCount();
    return;
  }

  syncInProgress = true;
  setState({ status: 'syncing', error: null });

  try {
    // 1. PUSH
    // Ordre important : profil → aliments → consommations → pesees → training_plans → sessions → deletions
    // (les consommations dépendent des aliments, les sessions dépendent des plans)
    await pushProfile(state.userId);
    await pushAliments(state.userId);
    // Deuxième passe nécessaire si des consommations dépendent d'aliments fraîchement pushés
    await pushConsommations(state.userId);
    await pushConsommations(state.userId);
    await pushPesees(state.userId);
    await pushTrainingPlans(state.userId);
    // Les sessions peuvent dépendre d'un plan juste pushé
    await pushTrainingSessions(state.userId);
    await pushTrainingSessions(state.userId);
    await pushDeletions();

    // 2. PULL
    await pullProfile(state.userId);
    await pullAliments(state.userId);
    await pullConsommations(state.userId);
    await pullPesees(state.userId);
    await pullTrainingPlans(state.userId);
    await pullTrainingSessions(state.userId);

    setState({
      status: 'idle',
      lastSyncAt: new Date().toISOString(),
      error: null,
    });
  } catch (err) {
    console.error('[sync] fullSync failed:', err);
    setState({
      status: 'error',
      error: err?.message || 'Erreur sync',
    });
  } finally {
    syncInProgress = false;
    await refreshPendingCount();
  }
}

// ==========================================================================
// DEBOUNCED FLUSH (après mutation locale)
// ==========================================================================

let flushTimer = null;

function scheduleFlush() {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    fullSync().catch(() => {});
  }, 500);
}

// ==========================================================================
// POLLING PÉRIODIQUE (pull toutes les 30s)
// ==========================================================================

let pollTimer = null;

function startPolling() {
  stopPolling();
  pollTimer = setInterval(() => {
    if (!isOnline()) return;
    fullSync().catch(() => {});
  }, 30000);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

// ==========================================================================
// ÉVÉNEMENTS RÉSEAU
// ==========================================================================

function handleOnline() {
  console.log('[sync] network back online, flushing...');
  setState({ status: 'idle' });
  fullSync().catch(() => {});
}

function handleOffline() {
  console.log('[sync] went offline');
  setState({ status: 'offline' });
}

// ==========================================================================
// INIT / TEARDOWN
// ==========================================================================

let initialized = false;

/**
 * À appeler quand la session auth est prête et qu'on a l'userId.
 * Fait un full sync initial et démarre le polling.
 */
export async function initSync(userId) {
  if (!userId) return;
  state.userId = userId;

  // Enregistre le handler pour que database.js puisse déclencher un flush
  registerSyncFlushHandler(scheduleFlush);

  if (!initialized) {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    initialized = true;
  }

  startPolling();

  // Sync initial en background
  fullSync().catch(() => {});
}

/**
 * À appeler au logout.
 */
export function stopSync() {
  stopPolling();
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  state.userId = null;
  setState({ status: 'idle', pendingCount: 0, error: null });
}

/**
 * Force un sync manuellement (bouton utilisateur).
 */
export async function forceSync() {
  await fullSync();
}
