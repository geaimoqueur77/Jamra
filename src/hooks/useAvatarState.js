import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getLatestWeight, getProfile, todayISO } from '../db/database';
import { supabase } from '../lib/supabase';

function computeFormeScore({ daysSinceSession, daysSinceRun, streak }) {
  let score = 100;
  if (daysSinceSession > 3) score -= 20;
  if (daysSinceSession > 7) score -= 30;
  if (daysSinceRun > 3) score -= 15;
  if (daysSinceRun > 7) score -= 25;
  if (streak >= 7) score += 15;
  if (streak >= 14) score += 10;
  return Math.max(0, Math.min(100, score));
}

export function useAvatarState() {
  const profile = useLiveQuery(getProfile);
  const latestWeight = useLiveQuery(getLatestWeight);
  const [lastWorkout, setLastWorkout] = useState(null);
  const [lastActivity, setLastActivity] = useState(null);
  const [lastPR, setLastPR] = useState(null);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  const today = todayISO();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('date, created_at')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(1);
      if (sessions?.[0]) setLastWorkout(sessions[0]);

      const { data: prs } = await supabase
        .from('workout_sets')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('is_pr', true)
        .order('created_at', { ascending: false })
        .limit(1);
      if (prs?.[0]) setLastPR(prs[0]);

      const { data: activities } = await supabase
        .from('strava_activities')
        .select('start_date, relative_effort')
        .eq('profile_id', user.id)
        .order('start_date', { ascending: false })
        .limit(1);
      if (activities?.[0]) setLastActivity(activities[0]);

      // Streak : jours consécutifs avec séance (14 derniers max)
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const { data: recentSessions } = await supabase
        .from('workout_sessions')
        .select('date')
        .eq('user_id', user.id)
        .gte('date', twoWeeksAgo.toISOString().slice(0, 10))
        .order('date', { ascending: false });

      if (recentSessions?.length) {
        const sessionDates = new Set(recentSessions.map(s => s.date));
        let s = 0;
        const d = new Date();
        while (s < 14) {
          if (!sessionDates.has(d.toISOString().slice(0, 10))) break;
          s++;
          d.setDate(d.getDate() - 1);
        }
        setStreak(s);
      }

      setLoading(false);
    })();
  }, []);

  // ─── bodyState depuis le poids actuel ───
  const currentWeight = latestWeight?.poids_kg ?? (profile?.poids_initial_kg ?? 100);
  let bodyState = 1;
  if (currentWeight < 85) bodyState = 4;
  else if (currentWeight < 89) bodyState = 3;
  else if (currentWeight < 93) bodyState = 2;

  // ─── Délais en heures ───
  const hoursAgo = (dateStr) => {
    if (!dateStr) return Infinity;
    return (Date.now() - new Date(dateStr).getTime()) / 3600000;
  };

  const workoutHoursAgo = lastWorkout
    ? hoursAgo(lastWorkout.created_at || lastWorkout.date + 'T20:00:00')
    : Infinity;
  const activityHoursAgo = lastActivity ? hoursAgo(lastActivity.start_date) : Infinity;
  const prHoursAgo = lastPR ? hoursAgo(lastPR.created_at) : Infinity;

  // ─── Tamagotchi formeScore ───
  const daysSinceSession = workoutHoursAgo / 24;
  const daysSinceRun = activityHoursAgo / 24;
  const formeScore = computeFormeScore({ daysSinceSession, daysSinceRun, streak });

  // ─── Règles de scène ───
  let scene = 'absent';
  if (workoutHoursAgo < 4) scene = 'gym';
  else if (activityHoursAgo < 24) scene = 'route';
  else if (workoutHoursAgo < 24 || activityHoursAgo < 48) scene = 'repos';
  else if (currentWeight < 89 && bodyState >= 2) scene = 'jalon';
  else if (workoutHoursAgo > 48 && activityHoursAgo > 48) scene = 'absent';
  else scene = 'repos';

  if (formeScore < 30 && scene !== 'gym' && scene !== 'route') scene = 'absent';

  // ─── Règles d'expression ───
  let expression = 'neutral';
  if (prHoursAgo < 4) {
    expression = 'fier';
  } else if (workoutHoursAgo < 2 || activityHoursAgo < 2) {
    expression = 'satisfait';
  } else if (scene === 'jalon') {
    expression = 'fier';
  } else if ((lastActivity?.relative_effort ?? 0) > 85 || scene === 'repos') {
    expression = 'fatigue';
  } else if (scene === 'absent') {
    expression = 'coupable';
  }

  if (expression === 'neutral') {
    if (formeScore > 80) expression = 'satisfait';
    else if (formeScore < 20) expression = 'coupable';
    else if (formeScore < 40) expression = 'fatigue';
  }

  // ─── Overrides horaires ───
  const hour = new Date().getHours();
  if (hour >= 23 || hour < 6) {
    scene = 'sleep';
    expression = 'fatigue';
  } else if (hour >= 6 && hour < 9 && scene === 'absent') {
    scene = 'morning';
    expression = 'fatigue';
  } else if (hour >= 22 && hour < 23 && expression === 'neutral') {
    expression = 'fatigue';
  }

  return {
    bodyState,
    expression,
    scene,
    formeScore,
    streak,
    weight: currentWeight,
    bf: profile?.mg_depart_pct
      ? Math.round(profile.mg_depart_pct - (profile.poids_initial_kg - currentWeight) * 0.85 * 0.5)
      : null,
    loading,
  };
}
