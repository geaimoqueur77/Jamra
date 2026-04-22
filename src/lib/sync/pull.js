/**
 * Pull operations : récupère les changements depuis Supabase et les merge en local.
 *
 * Pour chaque table :
 *   1. SELECT * FROM table WHERE updated_at > last_pulled_at (+ filtre user_id via RLS)
 *   2. Pour chaque record distant :
 *       - S'il existe déjà en local (par remote_id), on le met à jour
 *       - Sinon, on l'insère en local
 *   3. On stocke updated_at max comme last_pulled_at pour la prochaine fois
 *
 * Principe "last-write-wins" : si un record local a updated_at plus récent
 * que le distant, on ne le touche pas (le push le propagera).
 */

import { supabase } from '../supabase';
import { db } from '../../db/database';
import {
  profileRemoteToLocal,
  alimentRemoteToLocal,
  consommationRemoteToLocal,
  peseeRemoteToLocal,
} from './mappers';

async function getLastPulled(key) {
  const row = await db.sync_state.get(key);
  return row?.value ?? '1970-01-01T00:00:00Z';
}

async function setLastPulled(key, value) {
  await db.sync_state.put({ key, value });
}

/**
 * Helper générique : merge un record distant dans une table locale,
 * en respectant la règle last-write-wins.
 */
async function mergeRemote(localTable, remoteId, localData, matchBy = 'remote_id') {
  const existing = matchBy === 'remote_id'
    ? await localTable.where('remote_id').equals(remoteId).first()
    : await localTable.where(matchBy).equals(localData[matchBy]).first();

  if (!existing) {
    // Nouveau record distant → insert
    await localTable.add(localData);
    return 'inserted';
  }

  // Conflit potentiel : comparaison des updated_at
  const remoteTime = new Date(localData.updated_at || 0).getTime();
  const localTime = new Date(existing.updated_at || 0).getTime();

  if (remoteTime > localTime) {
    // Le distant est plus récent → on update en local
    await localTable.update(existing.id, { ...localData, __from_remote: true });
    return 'updated';
  }

  // Le local est plus récent ou égal → on ne touche pas
  return 'skipped';
}

// ==========================================================================
// PULL PROFIL
// ==========================================================================

export async function pullProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return { count: 0 }; // pas de profil remote
    throw error;
  }

  const localData = profileRemoteToLocal(data);
  const existing = await db.profil.get(1);

  if (!existing) {
    await db.profil.add(localData);
    return { count: 1, action: 'inserted' };
  }

  const remoteTime = new Date(localData.updated_at || 0).getTime();
  const localTime = new Date(existing.updated_at || 0).getTime();

  if (remoteTime > localTime && !existing.needs_sync) {
    // Le distant est plus récent ET on n'a pas de changements locaux non pushés
    await db.profil.update(1, { ...localData, __from_remote: true });
    return { count: 1, action: 'updated' };
  }

  return { count: 0, action: 'skipped' };
}

// ==========================================================================
// PULL ALIMENTS
// ==========================================================================

export async function pullAliments(userId) {
  const lastPulled = await getLastPulled('aliments.last_pulled_at');

  const { data, error } = await supabase
    .from('aliments')
    .select('*')
    .gt('updated_at', lastPulled);

  if (error) throw error;
  if (!data || data.length === 0) return { count: 0 };

  let count = 0;
  let maxUpdated = lastPulled;

  for (const remote of data) {
    const localData = alimentRemoteToLocal(remote);
    const action = await mergeRemote(db.aliments, remote.id, localData);
    if (action !== 'skipped') count++;
    if (remote.updated_at > maxUpdated) maxUpdated = remote.updated_at;
  }

  await setLastPulled('aliments.last_pulled_at', maxUpdated);
  return { count };
}

// ==========================================================================
// PULL CONSOMMATIONS
// ==========================================================================

export async function pullConsommations(userId) {
  const lastPulled = await getLastPulled('consommations.last_pulled_at');

  const { data, error } = await supabase
    .from('consommations')
    .select('*')
    .gt('updated_at', lastPulled);

  if (error) throw error;
  if (!data || data.length === 0) return { count: 0 };

  let count = 0;
  let maxUpdated = lastPulled;

  for (const remote of data) {
    const localData = await consommationRemoteToLocal(remote);
    const action = await mergeRemote(db.consommations, remote.id, localData);
    if (action !== 'skipped') count++;
    if (remote.updated_at > maxUpdated) maxUpdated = remote.updated_at;
  }

  await setLastPulled('consommations.last_pulled_at', maxUpdated);
  return { count };
}

// ==========================================================================
// PULL PESEES
// ==========================================================================

export async function pullPesees(userId) {
  const lastPulled = await getLastPulled('pesees.last_pulled_at');

  const { data, error } = await supabase
    .from('pesees')
    .select('*')
    .gt('updated_at', lastPulled);

  if (error) throw error;
  if (!data || data.length === 0) return { count: 0 };

  let count = 0;
  let maxUpdated = lastPulled;

  for (const remote of data) {
    const localData = peseeRemoteToLocal(remote);
    const action = await mergeRemote(db.pesees, remote.id, localData);
    if (action !== 'skipped') count++;
    if (remote.updated_at > maxUpdated) maxUpdated = remote.updated_at;
  }

  await setLastPulled('pesees.last_pulled_at', maxUpdated);
  return { count };
}
