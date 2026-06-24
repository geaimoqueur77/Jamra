import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

async function checkAndUnlock(userId, achievementKey) {
  const { data: ach } = await supabase
    .from('achievements')
    .select('id, key, label, icon, xp')
    .eq('key', achievementKey)
    .maybeSingle();

  if (!ach) return null;

  const { data: existing } = await supabase
    .from('user_achievements')
    .select('id')
    .eq('user_id', userId)
    .eq('achievement_id', ach.id)
    .maybeSingle();

  if (existing) return null;

  const { error } = await supabase.from('user_achievements').insert({
    user_id: userId,
    achievement_id: ach.id,
  });

  if (error) return null;

  if (ach.xp > 0) {
    await supabase.rpc('add_xp', { user_id_param: userId, amount_param: ach.xp });
  }

  return ach;
}

export function useAchievements() {
  const [recentUnlocks, setRecentUnlocks] = useState([]);

  const addUnlock = (ach) => {
    const entry = { ...ach, _id: Date.now() };
    setRecentUnlocks(prev => [...prev, entry]);
    setTimeout(() => {
      setRecentUnlocks(prev => prev.filter(u => u._id !== entry._id));
    }, 4000);
  };

  const checkFirstSession = useCallback(async (userId) => {
    const { count } = await supabase
      .from('workout_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    if (count >= 1) {
      const ach = await checkAndUnlock(userId, 'first_session');
      if (ach) addUnlock(ach);
    }
  }, []);

  const checkFirstPR = useCallback(async (userId) => {
    const { count } = await supabase
      .from('workout_sets')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_pr', true);
    if (count >= 1) {
      const ach = await checkAndUnlock(userId, 'first_pr');
      if (ach) addUnlock(ach);
    }
  }, []);

  const checkMinus5kg = useCallback(async (userId, poidsInitial, poidsActuel) => {
    if (poidsInitial - poidsActuel >= 5) {
      const ach = await checkAndUnlock(userId, 'minus_5kg');
      if (ach) addUnlock(ach);
    }
  }, []);

  const checkPhase1 = useCallback(async (userId, poidsActuel) => {
    if (poidsActuel < 89) {
      const ach = await checkAndUnlock(userId, 'phase1_done');
      if (ach) addUnlock(ach);
    }
  }, []);

  const checkStreak7 = useCallback(async (userId) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const since = sevenDaysAgo.toISOString().slice(0, 10);
    const { data: sessions } = await supabase
      .from('workout_sessions')
      .select('date')
      .eq('user_id', userId)
      .gte('date', since);
    const uniqueDays = new Set((sessions || []).map(s => s.date));
    if (uniqueDays.size >= 7) {
      const ach = await checkAndUnlock(userId, 'streak_7');
      if (ach) addUnlock(ach);
    }
  }, []);

  const checkRun20km = useCallback(async (userId) => {
    const { data } = await supabase
      .from('strava_activities')
      .select('distance_m')
      .eq('profile_id', userId)
      .gte('distance_m', 20000)
      .limit(1);
    if (data?.length > 0) {
      const ach = await checkAndUnlock(userId, 'run_20km');
      if (ach) addUnlock(ach);
    }
  }, []);

  const checkMarathonSigned = useCallback(async (userId) => {
    if (!userId) return;
    const ach = await checkAndUnlock(userId, 'marathon_signed');
    if (ach) addUnlock(ach);
  }, []);

  const checkAll = useCallback(async (userId, { poidsInitial, poidsActuel } = {}) => {
    if (!userId) return;
    await Promise.all([
      checkFirstSession(userId),
      checkFirstPR(userId),
      checkRun20km(userId),
      checkStreak7(userId),
      ...(poidsInitial && poidsActuel ? [
        checkMinus5kg(userId, poidsInitial, poidsActuel),
        checkPhase1(userId, poidsActuel),
      ] : []),
    ]);
  }, [checkFirstSession, checkFirstPR, checkRun20km, checkStreak7, checkMinus5kg, checkPhase1]);

  return {
    recentUnlocks,
    checkFirstSession,
    checkFirstPR,
    checkMinus5kg,
    checkPhase1,
    checkStreak7,
    checkRun20km,
    checkMarathonSigned,
    checkAll,
  };
}

export async function getUserAchievements(userId) {
  const { data } = await supabase
    .from('user_achievements')
    .select('unlocked_at, achievements(key, label, description, icon, xp)')
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false });
  return (data || []).map(ua => ({ ...ua.achievements, unlocked_at: ua.unlocked_at }));
}
