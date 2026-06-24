import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getLatestWeight, getProfile, todayISO } from '../db/database';
import { supabase } from '../lib/supabase';

/**
 * Détermine bodyState, expression et scene pour JamraAvatar
 * à partir de l'activité récente (séances PPL + Strava + logs nutrition).
 */
export function useAvatarState() {
  const profile = useLiveQuery(getProfile);
  const latestWeight = useLiveQuery(getLatestWeight);
  const [lastWorkout, setLastWorkout] = useState(null);
  const [lastActivity, setLastActivity] = useState(null);
  const [lastPR, setLastPR] = useState(null);
  const [loading, setLoading] = useState(true);

  const today = todayISO();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Dernière séance PPL
      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('date, created_at')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(1);

      if (sessions?.[0]) setLastWorkout(sessions[0]);

      // Dernier PR
      const { data: prs } = await supabase
        .from('workout_sets')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('is_pr', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (prs?.[0]) setLastPR(prs[0]);

      // Dernière activité Strava
      const { data: activities } = await supabase
        .from('strava_activities')
        .select('start_date, relative_effort')
        .eq('profile_id', user.id)
        .order('start_date', { ascending: false })
        .limit(1);

      if (activities?.[0]) setLastActivity(activities[0]);

      setLoading(false);
    })();
  }, []);

  // ─── bodyState depuis le poids actuel ───
  const currentWeight = latestWeight?.poids_kg ?? (profile?.poids_initial_kg ?? 100);
  let bodyState = 1;
  if (currentWeight < 85) bodyState = 4;
  else if (currentWeight < 89) bodyState = 3;
  else if (currentWeight < 93) bodyState = 2;

  // ─── Calcul des délais en heures ───
  const hoursAgo = (dateStr) => {
    if (!dateStr) return Infinity;
    const d = new Date(dateStr);
    return (Date.now() - d.getTime()) / 3600000;
  };

  const workoutHoursAgo = lastWorkout
    ? hoursAgo(lastWorkout.created_at || lastWorkout.date + 'T20:00:00')
    : Infinity;

  const activityHoursAgo = lastActivity
    ? hoursAgo(lastActivity.start_date)
    : Infinity;

  const prHoursAgo = lastPR
    ? hoursAgo(lastPR.created_at)
    : Infinity;

  // Jours sans log nutrition (depuis le dernier log quelconque)
  const logStreak = 0; // TODO: calculer depuis Dexie si besoin

  // ─── Règles de scène ───
  let scene = 'absent';
  if (workoutHoursAgo < 4) scene = 'gym';
  else if (activityHoursAgo < 24) scene = 'route';
  else if (workoutHoursAgo < 24 || activityHoursAgo < 48) scene = 'repos';
  else if (currentWeight < 89 && bodyState >= 2) scene = 'jalon'; // jalon Phase 1 atteint
  else if (workoutHoursAgo > 48 && activityHoursAgo > 48) scene = 'absent';
  else scene = 'repos';

  // ─── Règles d'expression ───
  let expression = 'neutral';
  if (prHoursAgo < 4) {
    expression = 'fier'; // PR tout frais
  } else if (workoutHoursAgo < 2 || activityHoursAgo < 2) {
    expression = 'satisfait'; // séance/sortie terminée récemment
  } else if (scene === 'jalon') {
    expression = 'fier'; // jalon atteint
  } else if ((lastActivity?.relative_effort ?? 0) > 85 || scene === 'repos') {
    expression = 'fatigue'; // effort intense ou repos planifié
  } else if (scene === 'absent') {
    expression = 'coupable'; // série cassée
  }

  return {
    bodyState,
    expression,
    scene,
    weight: currentWeight,
    bf: profile?.mg_depart_pct
      ? Math.round(profile.mg_depart_pct - (profile.poids_initial_kg - currentWeight) * 0.85 * 0.5)
      : null,
    loading,
  };
}
