/**
 * Mappers local (Dexie) ↔ Supabase
 *
 * Transforme les records d'un format à l'autre, gère notamment :
 *  - profile_id : auth.uid() côté Supabase
 *  - aliment_id : UUID (perso/OFF) ou null si Ciqual, avec aliment_ciqual_slug
 *  - Exclusion des champs de sync internes
 */

import { db } from '../../db/database';

/**
 * Supprime les champs Dexie internes (id, remote_id, needs_sync) pour ne garder
 * que les champs métier qu'on push vers Supabase.
 */
function stripInternalFields(record) {
  const { id, remote_id, needs_sync, __from_remote, ...rest } = record || {};
  return rest;
}

// ==========================================================================
// PROFIL
// ==========================================================================

export function profileLocalToRemote(local, userId) {
  const payload = stripInternalFields(local);
  // Champs non présents sur le profile Supabase : à filtrer
  const {
    id,              // on n'utilise pas l'id local (string/number), on utilise userId
    created_at,
    ...clean
  } = payload;
  return { ...clean, id: userId };
}

export function profileRemoteToLocal(remote) {
  return {
    // On garde id local = 1 (c'est le convention)
    id: 1,
    remote_id: remote.id,
    nom: remote.nom,
    sexe: remote.sexe,
    date_naissance: remote.date_naissance,
    taille_cm: remote.taille_cm,
    poids_initial_kg: remote.poids_initial_kg ? Number(remote.poids_initial_kg) : null,
    poids_actuel_kg: remote.poids_actuel_kg ? Number(remote.poids_actuel_kg) : null,
    poids_cible_kg: remote.poids_cible_kg ? Number(remote.poids_cible_kg) : null,
    niveau_activite: remote.niveau_activite,
    scenario: remote.scenario,
    proteines_g_par_kg: remote.proteines_g_par_kg ? Number(remote.proteines_g_par_kg) : null,
    created_at: remote.created_at,
    updated_at: remote.updated_at,
    needs_sync: false,
    __from_remote: true,
  };
}

// ==========================================================================
// ALIMENTS (perso et OFF uniquement — pas les ciqual)
// ==========================================================================

export function alimentLocalToRemote(local, userId) {
  const clean = stripInternalFields(local);
  const {
    id, created_at, updated_at,
    // Ces champs sont strictement locaux (par-user), pas sync
    is_favori, nombre_usages, dernier_usage,
    ...rest
  } = clean;
  return {
    ...rest,
    owner_profile_id: userId,
    is_shared: rest.is_shared ?? false,
  };
}

export function alimentRemoteToLocal(remote, { preserveLocal = null } = {}) {
  // Les champs "perso" (is_favori, usages) sont préservés côté local
  // s'ils existent déjà, sinon défauts à false/0.
  const localPerso = preserveLocal || {};
  return {
    remote_id: remote.id,
    owner_profile_id: remote.owner_profile_id,
    workspace_id: remote.workspace_id,
    source: remote.source,
    source_id: remote.source_id,
    code_barres: remote.code_barres,
    nom: remote.nom,
    marque: remote.marque,
    categorie: remote.categorie,
    kcal_100g: remote.kcal_100g != null ? Number(remote.kcal_100g) : null,
    proteines_100g: remote.proteines_100g != null ? Number(remote.proteines_100g) : 0,
    glucides_100g: remote.glucides_100g != null ? Number(remote.glucides_100g) : 0,
    sucres_100g: remote.sucres_100g != null ? Number(remote.sucres_100g) : null,
    lipides_100g: remote.lipides_100g != null ? Number(remote.lipides_100g) : 0,
    satures_100g: remote.satures_100g != null ? Number(remote.satures_100g) : null,
    fibres_100g: remote.fibres_100g != null ? Number(remote.fibres_100g) : null,
    sel_100g: remote.sel_100g != null ? Number(remote.sel_100g) : null,
    portion_defaut_g: remote.portion_defaut_g != null ? Number(remote.portion_defaut_g) : null,
    portion_defaut_nom: remote.portion_defaut_nom,
    is_shared: remote.is_shared ?? false,
    // Perso → on préserve le local, ou on met les défauts si nouveau
    is_favori: localPerso.is_favori ?? false,
    nombre_usages: localPerso.nombre_usages ?? 0,
    dernier_usage: localPerso.dernier_usage ?? null,
    created_at: remote.created_at,
    updated_at: remote.updated_at,
    needs_sync: false,
    __from_remote: true,
  };
}

// ==========================================================================
// CONSOMMATIONS
// ==========================================================================

/**
 * Convertit une consommation locale en payload Supabase.
 * Nécessite de résoudre aliment_id local → aliment_id Supabase ou aliment_ciqual_slug.
 */
export async function consommationLocalToRemote(local, userId) {
  const clean = stripInternalFields(local);
  const { id, aliment_id: localAlimentId, created_at, updated_at, ...rest } = clean;

  // Résoudre l'aliment de référence
  let aliment_id = null;
  let aliment_ciqual_slug = null;

  if (localAlimentId) {
    const aliment = await db.aliments.get(Number(localAlimentId));
    if (aliment) {
      if (aliment.source === 'ciqual') {
        aliment_ciqual_slug = aliment.source_id;
      } else if (aliment.remote_id) {
        aliment_id = aliment.remote_id;
      } else {
        // Aliment non encore sync : on ne peut pas push cette conso tant que l'aliment
        // n'a pas son remote_id. On retourne null pour skip.
        return null;
      }
    }
  }

  return {
    ...rest,
    profile_id: userId,
    aliment_id,
    aliment_ciqual_slug,
  };
}

export async function consommationRemoteToLocal(remote) {
  // Résoudre l'aliment distant → local
  let alimentIdLocal = null;
  if (remote.aliment_id) {
    const local = await db.aliments.where('remote_id').equals(remote.aliment_id).first();
    alimentIdLocal = local?.id ?? null;
  } else if (remote.aliment_ciqual_slug) {
    const local = await db.aliments
      .where('source').equals('ciqual')
      .and(a => a.source_id === remote.aliment_ciqual_slug)
      .first();
    alimentIdLocal = local?.id ?? null;
  }

  return {
    remote_id: remote.id,
    date: remote.date,
    type_repas: remote.type_repas,
    aliment_id: alimentIdLocal,
    aliment_nom_snapshot: remote.aliment_nom_snapshot,
    quantite_g: Number(remote.quantite_g),
    kcal_snapshot: remote.kcal_snapshot != null ? Number(remote.kcal_snapshot) : 0,
    proteines_snapshot: remote.proteines_snapshot != null ? Number(remote.proteines_snapshot) : 0,
    glucides_snapshot: remote.glucides_snapshot != null ? Number(remote.glucides_snapshot) : 0,
    sucres_snapshot: remote.sucres_snapshot != null ? Number(remote.sucres_snapshot) : null,
    lipides_snapshot: remote.lipides_snapshot != null ? Number(remote.lipides_snapshot) : 0,
    satures_snapshot: remote.satures_snapshot != null ? Number(remote.satures_snapshot) : null,
    fibres_snapshot: remote.fibres_snapshot != null ? Number(remote.fibres_snapshot) : null,
    sel_snapshot: remote.sel_snapshot != null ? Number(remote.sel_snapshot) : null,
    position: remote.position ?? 0,
    created_at: remote.created_at,
    updated_at: remote.updated_at,
    needs_sync: false,
    __from_remote: true,
  };
}

// ==========================================================================
// PESEES
// ==========================================================================

export function peseeLocalToRemote(local, userId) {
  const clean = stripInternalFields(local);
  const { id, created_at, updated_at, ...rest } = clean;
  return {
    ...rest,
    profile_id: userId,
  };
}

export function peseeRemoteToLocal(remote) {
  return {
    remote_id: remote.id,
    date: remote.date,
    poids_kg: Number(remote.poids_kg),
    created_at: remote.created_at,
    updated_at: remote.updated_at,
    needs_sync: false,
    __from_remote: true,
  };
}

// ==========================================================================
// TRAINING PLANS
// ==========================================================================

export function trainingPlanLocalToRemote(local, userId) {
  const clean = stripInternalFields(local);
  const { id, created_at, updated_at, ...rest } = clean;
  return {
    ...rest,
    profile_id: userId,
  };
}

export function trainingPlanRemoteToLocal(remote) {
  return {
    remote_id: remote.id,
    nom: remote.nom,
    course_freq: remote.course_freq,
    muscu_freq: remote.muscu_freq,
    start_date: remote.start_date,
    is_active: remote.is_active,
    objectif_course: remote.objectif_course,
    objectif_muscu: remote.objectif_muscu,
    created_at: remote.created_at,
    updated_at: remote.updated_at,
    needs_sync: false,
    __from_remote: true,
  };
}

// ==========================================================================
// TRAINING SESSIONS
// ==========================================================================

export async function trainingSessionLocalToRemote(local, userId) {
  const clean = stripInternalFields(local);
  const { id, plan_id: localPlanId, created_at, updated_at, ...rest } = clean;

  // Résoudre le plan local → remote_id
  let plan_id = null;
  if (localPlanId) {
    const plan = await db.training_plans.get(Number(localPlanId));
    if (plan?.remote_id) {
      plan_id = plan.remote_id;
    } else if (plan) {
      // Plan pas encore sync : on skip pour retenter plus tard
      return null;
    }
  }

  return {
    ...rest,
    profile_id: userId,
    plan_id,
  };
}

export async function trainingSessionRemoteToLocal(remote) {
  // Résoudre plan distant → local
  let planIdLocal = null;
  if (remote.plan_id) {
    const local = await db.training_plans.where('remote_id').equals(remote.plan_id).first();
    planIdLocal = local?.id ?? null;
  }

  return {
    remote_id: remote.id,
    plan_id: planIdLocal,
    date: remote.date,
    type: remote.type,
    sous_type: remote.sous_type,
    titre: remote.titre,
    description: remote.description,
    duree_prevue_min: remote.duree_prevue_min,
    duree_reelle_min: remote.duree_reelle_min,
    intensite: remote.intensite,
    kcal_estimees: remote.kcal_estimees,
    completed: remote.completed ?? false,
    completed_at: remote.completed_at,
    strava_activity_id: remote.strava_activity_id,
    notes: remote.notes,
    created_at: remote.created_at,
    updated_at: remote.updated_at,
    needs_sync: false,
    __from_remote: true,
  };
}
