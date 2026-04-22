/**
 * Push operations : envoie les records locaux vers Supabase.
 * Pour chaque table, on :
 *   1. Récupère les records needs_sync=true
 *   2. Upsert vers Supabase (insert si remote_id null, update sinon)
 *   3. Récupère l'UUID Supabase et update le record local (remote_id + needs_sync=false)
 */

import { supabase } from '../supabase';
import { db } from '../../db/database';
import {
  profileLocalToRemote,
  alimentLocalToRemote,
  consommationLocalToRemote,
  peseeLocalToRemote,
  trainingPlanLocalToRemote,
  trainingSessionLocalToRemote,
} from './mappers';

/**
 * Helper : met à jour le record local avec remote_id après push réussi
 * sans re-déclencher le hook "needs_sync=true".
 */
async function markPushed(table, localId, remoteId) {
  await table.update(localId, { remote_id: remoteId, needs_sync: false });
}

// ==========================================================================
// PUSH PROFIL
// ==========================================================================

export async function pushProfile(userId) {
  const profile = await db.profil.get(1);
  if (!profile || !profile.needs_sync) return { count: 0 };

  const payload = profileLocalToRemote(profile, userId);

  // Le profile Supabase existe déjà (créé par le trigger handle_new_user)
  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;

  await markPushed(db.profil, profile.id, data.id);
  return { count: 1 };
}

// ==========================================================================
// PUSH ALIMENTS (perso + openfoodfacts)
// ==========================================================================

export async function pushAliments(userId) {
  const pending = await db.aliments
    .filter(a => a.needs_sync === true && a.source !== 'ciqual')
    .toArray();

  let count = 0;

  for (const local of pending) {
    const payload = alimentLocalToRemote(local, userId);
    let result;

    if (local.remote_id) {
      result = await supabase
        .from('aliments')
        .update(payload)
        .eq('id', local.remote_id)
        .select()
        .single();
    } else {
      result = await supabase
        .from('aliments')
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) {
      console.error('[sync] push aliment failed:', result.error, local);
      continue;
    }

    await markPushed(db.aliments, local.id, result.data.id);
    count++;
  }

  return { count };
}

// ==========================================================================
// PUSH CONSOMMATIONS
// ==========================================================================

export async function pushConsommations(userId) {
  const pending = await db.consommations
    .filter(c => c.needs_sync === true)
    .toArray();

  let count = 0;
  let skipped = 0;

  for (const local of pending) {
    const payload = await consommationLocalToRemote(local, userId);

    if (!payload) {
      // L'aliment de référence n'a pas encore son remote_id
      // On réessaiera au prochain cycle
      skipped++;
      continue;
    }

    let result;
    if (local.remote_id) {
      result = await supabase
        .from('consommations')
        .update(payload)
        .eq('id', local.remote_id)
        .select()
        .single();
    } else {
      result = await supabase
        .from('consommations')
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) {
      console.error('[sync] push consommation failed:', result.error, local);
      continue;
    }

    await markPushed(db.consommations, local.id, result.data.id);
    count++;
  }

  return { count, skipped };
}

// ==========================================================================
// PUSH PESEES
// ==========================================================================

export async function pushPesees(userId) {
  const pending = await db.pesees
    .filter(p => p.needs_sync === true)
    .toArray();

  let count = 0;

  for (const local of pending) {
    const payload = peseeLocalToRemote(local, userId);

    // Pour les pesees, unique (profile_id, date) donc on fait un upsert sur (profile_id, date)
    const { data, error } = await supabase
      .from('pesees')
      .upsert(payload, { onConflict: 'profile_id,date' })
      .select()
      .single();

    if (error) {
      console.error('[sync] push pesee failed:', error, local);
      continue;
    }

    await markPushed(db.pesees, local.id, data.id);
    count++;
  }

  return { count };
}

// ==========================================================================
// PUSH TRAINING PLANS
// ==========================================================================

export async function pushTrainingPlans(userId) {
  const pending = await db.training_plans
    .filter(p => p.needs_sync === true)
    .toArray();

  let count = 0;
  for (const local of pending) {
    const payload = trainingPlanLocalToRemote(local, userId);

    let result;
    if (local.remote_id) {
      result = await supabase
        .from('training_plans')
        .update(payload)
        .eq('id', local.remote_id)
        .select()
        .single();
    } else {
      result = await supabase
        .from('training_plans')
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) {
      console.error('[sync] push training_plan failed:', result.error, local);
      continue;
    }

    await markPushed(db.training_plans, local.id, result.data.id);
    count++;
  }

  return { count };
}

// ==========================================================================
// PUSH TRAINING SESSIONS
// ==========================================================================

export async function pushTrainingSessions(userId) {
  const pending = await db.training_sessions
    .filter(s => s.needs_sync === true)
    .toArray();

  let count = 0;
  let skipped = 0;

  for (const local of pending) {
    const payload = await trainingSessionLocalToRemote(local, userId);

    if (!payload) {
      skipped++;
      continue;
    }

    let result;
    if (local.remote_id) {
      result = await supabase
        .from('training_sessions')
        .update(payload)
        .eq('id', local.remote_id)
        .select()
        .single();
    } else {
      result = await supabase
        .from('training_sessions')
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) {
      console.error('[sync] push training_session failed:', result.error, local);
      continue;
    }

    await markPushed(db.training_sessions, local.id, result.data.id);
    count++;
  }

  return { count, skipped };
}

// ==========================================================================
// PUSH PENDING DELETIONS
// ==========================================================================

const TABLE_MAP = {
  profil: 'profiles',
  aliments: 'aliments',
  consommations: 'consommations',
  pesees: 'pesees',
  repasTypes: 'repas_types',
  repasTypeItems: 'repas_type_items',
  training_plans: 'training_plans',
  training_sessions: 'training_sessions',
};

export async function pushDeletions() {
  const pending = await db.pending_deletions.toArray();
  let count = 0;

  for (const deletion of pending) {
    const remoteTable = TABLE_MAP[deletion.table_name];
    if (!remoteTable) {
      await db.pending_deletions.delete(deletion.id);
      continue;
    }

    const { error } = await supabase
      .from(remoteTable)
      .delete()
      .eq('id', deletion.remote_id);

    if (error) {
      console.error('[sync] push deletion failed:', error, deletion);
      continue;
    }

    await db.pending_deletions.delete(deletion.id);
    count++;
  }

  return { count };
}
