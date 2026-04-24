/**
 * Jamra — Client Strava
 *
 * Gère le cycle complet :
 *   1. OAuth authorize → redirection vers Strava
 *   2. Callback → échange code → serverless → persistance en Supabase
 *   3. Refresh token automatique quand expiré
 *   4. Pull des activités + matching avec séances planifiées
 */

import { supabase } from './supabase';

const CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID;
const SCOPES = 'read,activity:read';

/**
 * Retourne le domaine de l'app (pour la redirection OAuth).
 */
function getAppOrigin() {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}

// ==========================================================================
// OAUTH FLOW
// ==========================================================================

/**
 * Lance le flow OAuth Strava. Redirige le navigateur vers Strava.
 * La redirection revient sur /strava-callback avec ?code=XXX.
 */
export function startStravaOAuth() {
  if (!CLIENT_ID) {
    throw new Error('VITE_STRAVA_CLIENT_ID manquant dans les variables d\'environnement');
  }

  const redirectUri = `${getAppOrigin()}/strava-callback`;
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: SCOPES,
  });

  window.location.href = `https://www.strava.com/oauth/authorize?${params.toString()}`;
}

/**
 * Échange le code OAuth contre un access_token + refresh_token (via serverless)
 * puis persiste la connexion dans Supabase.
 */
export async function completeStravaOAuth(code) {
  const resp = await fetch('/api/strava/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || 'Échec connexion Strava');
  }

  const data = await resp.json();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error('Non connecté');

  // Upsert dans strava_connections
  const { error } = await supabase
    .from('strava_connections')
    .upsert({
      profile_id: userData.user.id,
      strava_athlete_id: data.athlete_id,
      firstname: data.firstname,
      lastname: data.lastname,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      scope: data.scope,
    }, { onConflict: 'profile_id' });

  if (error) throw error;

  return data;
}

// ==========================================================================
// CONNEXION / ÉTAT
// ==========================================================================

/**
 * Retourne la connexion Strava de l'utilisateur courant, ou null si non connecté.
 */
export async function getStravaConnection() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return null;

  const { data, error } = await supabase
    .from('strava_connections')
    .select('*')
    .eq('profile_id', userData.user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Supprime la connexion Strava (déconnexion).
 */
export async function disconnectStrava() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error('Non connecté');

  const { error } = await supabase
    .from('strava_connections')
    .delete()
    .eq('profile_id', userData.user.id);

  if (error) throw error;
}

// ==========================================================================
// TOKEN REFRESH
// ==========================================================================

async function refreshAccessToken(connection) {
  const resp = await fetch('/api/strava/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: connection.refresh_token }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || 'Échec refresh token Strava');
  }

  const data = await resp.json();

  // Persiste les nouveaux tokens
  const { error } = await supabase
    .from('strava_connections')
    .update({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
    })
    .eq('profile_id', connection.profile_id);

  if (error) throw error;

  return { ...connection, ...data };
}

/**
 * Retourne un access_token valide (refresh si expiré).
 */
async function getValidAccessToken() {
  let connection = await getStravaConnection();
  if (!connection) throw new Error('Strava non connecté');

  const expiresAt = new Date(connection.expires_at).getTime();
  const now = Date.now();
  // Refresh si expire dans moins de 5 minutes
  if (expiresAt - now < 5 * 60 * 1000) {
    connection = await refreshAccessToken(connection);
  }

  return connection.access_token;
}

// ==========================================================================
// FETCH ACTIVITIES
// ==========================================================================

/**
 * Fetch les activités récentes de l'utilisateur depuis l'API Strava,
 * puis les stocke dans la table strava_activities (upsert).
 *
 * @param {object} opts { days: int } - combien de jours en arrière fetcher (défaut 14)
 * @returns {object} { count, newCount }
 */
export async function syncStravaActivities({ days = 14 } = {}) {
  const token = await getValidAccessToken();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error('Non connecté');

  const since = Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000);
  const url = `https://www.strava.com/api/v3/athlete/activities?after=${since}&per_page=100`;

  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!resp.ok) {
    if (resp.status === 401) {
      throw new Error('Token Strava invalide — reconnecte-toi');
    }
    const text = await resp.text();
    throw new Error(`Strava API error ${resp.status}: ${text}`);
  }

  const activities = await resp.json();

  if (!activities || activities.length === 0) {
    await supabase
      .from('strava_connections')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('profile_id', userData.user.id);
    return { count: 0, newCount: 0 };
  }

  // Upsert dans strava_activities
  const rows = activities.map(a => ({
    id: a.id,
    profile_id: userData.user.id,
    start_date: a.start_date,
    type: a.type,
    sport_type: a.sport_type,
    name: a.name,
    distance_m: a.distance,
    moving_time_s: a.moving_time,
    elapsed_time_s: a.elapsed_time,
    total_elevation_gain_m: a.total_elevation_gain,
    average_heartrate: a.average_heartrate,
    max_heartrate: a.max_heartrate,
    average_speed_mps: a.average_speed,
    kilojoules: a.kilojoules,
    calories: a.calories ?? null,
    has_heartrate: a.has_heartrate ?? false,
    raw: a,
  }));

  const { error, count } = await supabase
    .from('strava_activities')
    .upsert(rows, { onConflict: 'id', count: 'exact' });

  if (error) throw error;

  await supabase
    .from('strava_connections')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('profile_id', userData.user.id);

  return { count: rows.length };
}

// ==========================================================================
// MATCHING AVEC SÉANCES PLANIFIÉES
// ==========================================================================

/**
 * Pour chaque activité Strava non encore associée, essaye de la matcher
 * avec une séance planifiée du même jour et type compatible.
 *
 * Règles :
 *  - Run/TrailRun/Walk → type 'course'
 *  - WeightTraining/Workout → type 'muscu'
 *  - Swim/Ride/... → ignorés pour l'instant (pas dans le modèle)
 *  - Match si : même jour ET type compatible ET séance non completed ET pas déjà liée à une autre Strava
 */
function stravaTypeToTrainingType(stravaType) {
  const lower = (stravaType || '').toLowerCase();
  if (['run', 'trailrun', 'treadmillrun', 'walk', 'virtualrun'].includes(lower)) return 'course';
  if (['weighttraining', 'workout', 'crossfit'].includes(lower)) return 'muscu';
  return null;
}

/**
 * Récupère les activités Strava récentes + séances de la même période,
 * et met à jour les séances en liant à l'activité Strava quand un match existe.
 *
 * Met aussi à jour duree_reelle_min et passe completed=true.
 */
export async function matchStravaToSessions({ days = 14 } = {}) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { matched: 0 };

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: activities }, { data: sessions }] = await Promise.all([
    supabase
      .from('strava_activities')
      .select('*')
      .eq('profile_id', userData.user.id)
      .gte('start_date', since),
    supabase
      .from('training_sessions')
      .select('*')
      .eq('profile_id', userData.user.id)
      .gte('date', since.slice(0, 10))
      .is('strava_activity_id', null),
  ]);

  if (!activities || !sessions) return { matched: 0 };

  let matched = 0;
  const usedActivities = new Set();

  for (const session of sessions) {
    if (session.completed) continue;

    // On cherche une activité du même jour, type compatible, pas encore utilisée
    const sessionDate = session.date;
    const candidate = activities.find(a => {
      if (usedActivities.has(a.id)) return false;
      const activityDate = a.start_date.slice(0, 10);
      if (activityDate !== sessionDate) return false;
      const mappedType = stravaTypeToTrainingType(a.type);
      return mappedType === session.type;
    });

    if (!candidate) continue;

    usedActivities.add(candidate.id);

    // Durée en minutes (moving_time de préférence, sinon elapsed)
    const dureeMin = Math.round((candidate.moving_time_s || candidate.elapsed_time_s || 0) / 60);

    // kcal : priorité à la valeur Strava, sinon kilojoules
    const kcal = candidate.calories != null
      ? Math.round(candidate.calories)
      : candidate.kilojoules != null
        ? Math.round(candidate.kilojoules)
        : null;

    const { error } = await supabase
      .from('training_sessions')
      .update({
        strava_activity_id: String(candidate.id),
        duree_reelle_min: dureeMin || null,
        kcal_estimees: kcal,
        completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', session.id);

    if (!error) matched++;
  }

  return { matched };
}

/**
 * Synchronisation complète : fetch des activités Strava puis matching.
 * À appeler au login + bouton manuel.
 */
export async function fullStravaSync({ days = 14 } = {}) {
  const syncResult = await syncStravaActivities({ days });
  const matchResult = await matchStravaToSessions({ days });
  return {
    activities: syncResult.count,
    matched: matchResult.matched,
  };
}

// ==========================================================================
// LECTURE ACTIVITÉS (pour UI)
// ==========================================================================

/**
 * Retourne les activités Strava d'une date précise.
 */
export async function getActivitiesForDate(dateISO) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return [];

  const start = `${dateISO}T00:00:00Z`;
  const end = `${dateISO}T23:59:59Z`;

  const { data, error } = await supabase
    .from('strava_activities')
    .select('*')
    .eq('profile_id', userData.user.id)
    .gte('start_date', start)
    .lte('start_date', end)
    .order('start_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Somme des kcal brûlées un jour donné (utilisée pour ajuster le TDEE).
 */
export async function getKcalBurnedForDate(dateISO) {
  const activities = await getActivitiesForDate(dateISO);
  return activities.reduce((sum, a) => {
    const kcal = a.calories ?? a.kilojoules ?? 0;
    return sum + Math.round(kcal);
  }, 0);
}
