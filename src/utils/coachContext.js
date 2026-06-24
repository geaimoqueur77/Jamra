import { supabase } from '../lib/supabase';
import { getProfile, getAllWeights, todayISO } from '../db/database';
import { addDaysISO } from './format';

/**
 * Agrège le contexte utilisateur complet pour le module coaching.
 * Combine données Dexie (profil local) + Supabase (sport, Strava).
 */
export async function buildCoachContext(userId) {
  const today = todayISO();
  const weekStart = addDaysISO(today, -6);

  const [profile, weights, workoutRes, stravaRes] = await Promise.all([
    getProfile(),
    getAllWeights(),
    supabase
      .from('workout_sessions')
      .select('type, date, duration_min')
      .eq('user_id', userId)
      .gte('date', weekStart)
      .lte('date', today)
      .order('date', { ascending: false }),
    supabase
      .from('strava_activities')
      .select('distance_m, average_heartrate, start_date, calories')
      .eq('profile_id', userId)
      .gte('start_date', weekStart)
      .lte('start_date', today + 'T23:59:59')
      .order('start_date', { ascending: false }),
  ]);

  const weekSessions = workoutRes.data || [];
  const stravaActivities = stravaRes.data || [];

  // Dernière séance muscu
  const lastSession = weekSessions[0] ?? null;

  // Dernière activité Strava (course)
  const lastRun = stravaActivities
    .filter(a => a.distance_m > 0)
    .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))[0] ?? null;

  // Km courus cette semaine
  const weekKm = stravaActivities.reduce((s, a) => s + (a.distance_m || 0), 0) / 1000;

  // Poids actuel (dernier relevé)
  const lastWeightEntry = weights?.length ? weights[weights.length - 1] : null;
  const poidsActuel = lastWeightEntry?.poids_kg ?? profile?.poids_initial_kg ?? null;
  const poidsInitial = profile?.poids_initial_kg ?? null;

  // Streak : jours consécutifs avec au moins une activité (muscu ou Strava)
  const streak = computeStreak(weekSessions, stravaActivities);

  // Graisse brûlée totale estimée (depuis départ)
  const pertePoids = poidsInitial && poidsActuel ? Math.max(0, poidsInitial - poidsActuel) : 0;
  const fatBurnedTotalG = Math.round(pertePoids * 0.85 * 1000);

  // Zone 2 estimation (HR 130-145 bpm)
  const zone2Pct = lastRun?.average_heartrate
    ? lastRun.average_heartrate >= 130 && lastRun.average_heartrate <= 145 ? 85 : 60
    : null;

  return {
    profile: {
      poids: poidsActuel,
      mg: profile?.mg_depart_pct ?? 30,
      phase: profile?.phase_actuelle ?? 1,
      objectif_marathon: profile?.objectif_marathon ?? '2027-04-11',
    },
    last_weight: lastWeightEntry
      ? { value: lastWeightEntry.poids_kg, date: lastWeightEntry.date }
      : null,
    last_session: lastSession
      ? { type: lastSession.type, date: lastSession.date, duration_min: lastSession.duration_min }
      : null,
    last_run: lastRun
      ? {
          distance_km: Math.round((lastRun.distance_m / 1000) * 10) / 10,
          avg_hr: lastRun.average_heartrate,
          zone2_pct: zone2Pct,
          date: lastRun.start_date?.slice(0, 10),
        }
      : null,
    week_sessions: weekSessions.length,
    week_km: Math.round(weekKm * 10) / 10,
    streak,
    fat_burned_total_g: fatBurnedTotalG,
  };
}

function computeStreak(sessions, stravaActivities) {
  const today = new Date();
  let streak = 0;
  for (let i = 0; i <= 6; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const hasSession = sessions.some(s => s.date === dateStr);
    const hasRun = stravaActivities.some(a => a.start_date?.startsWith(dateStr));
    if (hasSession || hasRun) {
      streak++;
    } else if (i > 0) {
      break; // streak brisé
    }
  }
  return streak;
}
