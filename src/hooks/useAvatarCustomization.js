import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const DEFAULT_CUSTOMIZATION = {
  skin: 'medium',
  hair: 'short_dark',
  glasses: 'none',
  outfit: 'default',
  shoes: 'default',
};

export function useAvatarCustomization() {
  const [customization, setCustomization] = useState(DEFAULT_CUSTOMIZATION);
  const [userStats, setUserStats] = useState({ xp: 0, sessions: 0, runs: 0, achievements: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [profileRes, sessionsRes, runsRes, achievementsRes] = await Promise.all([
        supabase.from('profiles').select('avatar_customization, xp').eq('id', user.id).single(),
        supabase.from('workout_sessions').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('strava_activities').select('id', { count: 'exact', head: true }).eq('profile_id', user.id),
        supabase.from('user_achievements').select('key').eq('user_id', user.id),
      ]);

      if (profileRes.data?.avatar_customization && Object.keys(profileRes.data.avatar_customization).length > 0) {
        setCustomization({ ...DEFAULT_CUSTOMIZATION, ...profileRes.data.avatar_customization });
      }

      setUserStats({
        xp: profileRes.data?.xp ?? 0,
        sessions: sessionsRes.count ?? 0,
        runs: runsRes.count ?? 0,
        achievements: (achievementsRes.data ?? []).map(a => a.key),
      });

      setLoading(false);
    })();
  }, []);

  const isUnlocked = useCallback((option) => {
    if (option.default) return true;
    if (option.unlockAt === 0) return true;
    if (typeof option.unlockAt === 'number') {
      // Distinguish XP vs session count by size
      if (option.unlockAt >= 100) return userStats.xp >= option.unlockAt;
      return userStats.sessions >= option.unlockAt || userStats.runs >= option.unlockAt;
    }
    if (typeof option.unlockAt === 'string') {
      return userStats.achievements.includes(option.unlockAt);
    }
    return false;
  }, [userStats]);

  const unlockLabel = useCallback((option) => {
    if (option.default || option.unlockAt === 0) return null;
    if (typeof option.unlockAt === 'number') {
      if (option.unlockAt >= 100) return `${option.unlockAt} XP`;
      return `${option.unlockAt} séances`;
    }
    if (option.unlockAt === 'marathon_signed') return 'Dossard';
    if (option.unlockAt === 'streak_7') return 'Streak 7j';
    return option.unlockAt;
  }, []);

  const save = useCallback(async (newCustomization) => {
    setCustomization(newCustomization);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles')
      .update({ avatar_customization: newCustomization, updated_at: new Date().toISOString() })
      .eq('id', user.id);
  }, []);

  return { customization, setCustomization, userStats, isUnlocked, unlockLabel, save, loading };
}
