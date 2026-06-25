import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  getProfile,
  getDailyTotals,
  getMealsForDate,
  getStatsOverRange,
  getAllWeights,
  todayISO,
} from '../db/database';
import { computeProfileMetrics, computePhase } from '../utils/calculations';
import { formatNumber, formatDayEyebrow, formatDateHeader, addDaysISO } from '../utils/format';
import { computeInsights, getDismissals, dismissInsight, clearOldDismissals } from '../utils/insights';
import { buildCoachContext } from '../utils/coachContext';
import { supabase } from '../lib/supabase';
import Header from '../components/layout/Header';
import IconButton from '../components/ui/IconButton';
import ProgressRing from '../components/ui/ProgressRing';
import ProgressBar from '../components/ui/ProgressBar';
import { InsightsRow } from '../components/insights/InsightCard';
import FatBurnWidget from '../components/FatBurnWidget';
import JamraAvatar from '../components/JamraAvatar';
import MilestoneAnimation from '../components/MilestoneAnimation';
import JamrMascot from '../components/avatar/JamrMascot';
import { useAvatarState } from '../hooks/useAvatarState';
import { useAvatarCustomization } from '../hooks/useAvatarCustomization';
import { shareOrDownloadWeekly } from '../utils/shareWeekly';
import { useAchievements } from '../hooks/useAchievements';
import { AchievementToastLayer } from '../components/AchievementToast';
import SessionWorkout from './sport/SessionWorkout';
import {
  BreakfastIllustration,
  LunchIllustration,
  DinnerIllustration,
  SnackIllustration,
} from '../components/illustrations/MealIllustrations';

const MEAL_CONFIG = [
  { key: 'petit_dej',  label: 'Petit-déjeuner', illustration: BreakfastIllustration },
  { key: 'dejeuner',   label: 'Déjeuner',       illustration: LunchIllustration },
  { key: 'diner',      label: 'Dîner',          illustration: DinnerIllustration },
  { key: 'collation',  label: 'Collations',     illustration: SnackIllustration },
];

function MacroRow({ name, current, target, delay, variant = 'heat' }) {
  const ratio = target > 0 ? current / target : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-baseline">
        <div className="font-body font-semibold text-[13px] text-text-primary">{name}</div>
        <div className="font-mono text-xs text-text-secondary">
          <span className="text-text-primary font-semibold">{formatNumber(current, { decimals: current < 10 ? 1 : 0 })}</span>
          {' / '}{target} g
        </div>
      </div>
      <ProgressBar value={ratio} delay={delay} variant={variant} />
    </div>
  );
}

function MealCard({ mealKey, label, Illustration, entries, onAdd, onEditEntry }) {
  const navigate = useNavigate();
  const totalKcal = entries.reduce((sum, e) => sum + (e.kcal_snapshot || 0), 0);
  const isEmpty = entries.length === 0;

  if (isEmpty) {
    return (
      <button
        onClick={onAdd}
        className="w-full mb-3 rounded-2xl border border-dashed border-strong py-6 px-5 text-center hover:border-heat-orange hover:bg-[rgba(255,77,0,0.04)] transition-all duration-200"
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <Illustration size={32} />
          <div className="font-display font-bold text-[15px] uppercase tracking-[0.06em]">
            {label}
          </div>
        </div>
        <div className="font-body text-[13px] text-text-tertiary font-medium">
          Pas encore saisi
        </div>
        <div className="font-display font-bold text-xs uppercase tracking-[0.1em] text-heat-orange mt-2">
          + Ajouter
        </div>
      </button>
    );
  }

  return (
    <div className="mb-3 rounded-2xl border border-subtle bg-bg-surface1 p-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <Illustration size={36} />
          <div>
            <div className="font-display font-bold text-[15px] uppercase tracking-[0.06em] text-text-primary">
              {label}
            </div>
            <div className="font-mono text-[10px] text-text-tertiary">
              {entries.length} entrée{entries.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <div>
          <span className="font-display font-bold text-xl text-heat-amber">{formatNumber(totalKcal)}</span>
          <span className="font-mono text-[10px] text-text-tertiary ml-1 tracking-wider">KCAL</span>
        </div>
      </div>
      <div className="flex flex-col">
        {entries.map((e, idx) => (
          <button
            key={e.id}
            onClick={() => onEditEntry(e.id)}
            className={`
              flex justify-between items-baseline py-2 px-1 text-left rounded-md
              hover:bg-bg-surface2 transition-colors
              ${idx > 0 ? 'border-t border-subtle' : ''}
            `}
          >
            <div className="flex-1 min-w-0 pr-2">
              <span className="font-body text-[13px] text-text-secondary font-medium">
                {e.aliment_nom_snapshot}
              </span>
              <span className="font-mono text-[11px] text-text-tertiary ml-1">
                · {e.quantite_g} g
              </span>
            </div>
            <span className="font-mono text-xs text-text-primary font-medium">
              {formatNumber(e.kcal_snapshot)}
            </span>
          </button>
        ))}
      </div>
      <button
        onClick={onAdd}
        className="w-full mt-3 py-2 rounded-lg border border-dashed border-subtle text-text-tertiary hover:text-heat-orange hover:border-heat-orange font-display font-bold text-xs uppercase tracking-[0.1em] transition-colors"
      >
        + Ajouter
      </button>
    </div>
  );
}

function WeekSportSummary({ userId, today }) {
  const [stats, setStats] = useState({ sessions: 0, kmRun: 0, kcalSport: 0 });

  useEffect(() => {
    if (!userId) return;
    const weekStart = addDaysISO(today, -6);

    Promise.all([
      supabase
        .from('workout_sessions')
        .select('id')
        .eq('user_id', userId)
        .gte('date', weekStart)
        .lte('date', today),
      supabase
        .from('strava_activities')
        .select('distance_m, calories')
        .eq('profile_id', userId)
        .gte('start_date', weekStart)
        .lte('start_date', today + 'T23:59:59'),
    ]).then(([{ data: sessions }, { data: activities }]) => {
      const kmRun = (activities || []).reduce((s, a) => s + (a.distance_m || 0), 0) / 1000;
      const kcalSport = (activities || []).reduce((s, a) => s + (a.calories || 0), 0);
      setStats({ sessions: (sessions || []).length, kmRun, kcalSport });
    });
  }, [userId, today]);

  if (!stats.sessions && !stats.kmRun) return null;

  return (
    <div className="mx-6 mb-1 rounded-2xl border border-subtle bg-bg-surface1 p-4">
      <div className="font-display font-bold text-[11px] uppercase tracking-[0.14em] text-text-tertiary mb-3">
        Cette semaine
      </div>
      <div className="flex gap-0">
        <div className="flex-1 text-center">
          <div className="font-display font-bold text-2xl text-heat-orange">{stats.sessions}</div>
          <div className="font-mono text-[9px] uppercase tracking-wider text-text-tertiary mt-0.5">Séances</div>
        </div>
        <div className="w-px bg-subtle" />
        <div className="flex-1 text-center">
          <div className="font-display font-bold text-2xl text-heat-amber">
            {stats.kmRun < 1 ? `${Math.round(stats.kmRun * 1000)} m` : `${stats.kmRun.toFixed(1)} km`}
          </div>
          <div className="font-mono text-[9px] uppercase tracking-wider text-text-tertiary mt-0.5">Course</div>
        </div>
        <div className="w-px bg-subtle" />
        <div className="flex-1 text-center">
          <div className="font-display font-bold text-2xl text-success">
            {stats.kcalSport > 0 ? formatNumber(stats.kcalSport) : '—'}
          </div>
          <div className="font-mono text-[9px] uppercase tracking-wider text-text-tertiary mt-0.5">Kcal sport</div>
        </div>
      </div>
    </div>
  );
}

// ─── PPL cycle ────────────────────────────────────────────────────────────────

const PPL_CYCLE = ['push', 'pull', 'legs'];
const PPL_LABELS = { push: 'Push', pull: 'Pull', legs: 'Legs' };
const PPL_MUSCLES = {
  push: 'Pectoraux · Épaules · Triceps',
  pull: 'Dos · Biceps · Trapèzes',
  legs: 'Quadriceps · Fessiers · Ischio',
};
const PPL_PREVIEW = {
  push: ['Développé couché haltères', 'Incliné haltères', 'Élévations latérales', 'Développé militaire'],
  pull: ['Tirage vertical (pulley)', 'Rowing barre', 'Tirage horizontal', 'Curl biceps barre'],
  legs: ['Squat', 'Presse', 'Fentes bulgares', 'Hip thrust'],
};

function getNextType(lastType) {
  const idx = PPL_CYCLE.indexOf(lastType);
  return PPL_CYCLE[(idx + 1) % 3];
}

function TonightSessionWidget({ userId, onStartSession }) {
  const [nextType, setNextType] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [lastData, setLastData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      // 1. Trouver le dernier type PPL
      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('type, id')
        .eq('user_id', userId)
        .in('type', ['push', 'pull', 'legs'])
        .order('date', { ascending: false })
        .limit(1);

      const lastType = sessions?.[0]?.type ?? null;
      const next = getNextType(lastType);
      setNextType(next);

      const exNames = PPL_PREVIEW[next];

      // 2. Fetch metadata exercices (GIFs)
      const { data: exMeta } = await supabase
        .from('exercises')
        .select('name_fr, gif_cached_url, gif_url, muscle_target')
        .in('name_fr', exNames);

      setExercises(exMeta || []);

      // 3. Dernière séance du même type → charges
      const { data: lastSessions } = await supabase
        .from('workout_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('type', next)
        .order('date', { ascending: false })
        .limit(1);

      if (lastSessions?.[0]) {
        const { data: sets } = await supabase
          .from('workout_sets')
          .select('exercise_name, weight_kg, reps, set_number')
          .eq('session_id', lastSessions[0].id)
          .in('exercise_name', exNames)
          .order('set_number');

        const grouped = {};
        (sets || []).forEach(s => {
          if (!grouped[s.exercise_name]) grouped[s.exercise_name] = s;
        });
        setLastData(grouped);
      }

      setLoading(false);
    })();
  }, [userId]);

  if (loading || !nextType) return null;

  const exList = PPL_PREVIEW[nextType].map(name => {
    const meta = exercises.find(e => e.name_fr === name);
    const last = lastData[name];
    return { name, meta, last };
  });

  return (
    <div className="mx-6 mb-1 rounded-2xl border border-subtle bg-bg-surface1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-subtle">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-tertiary">Ce soir</div>
          <div className="font-display font-bold text-lg uppercase tracking-wide text-text-primary">
            Séance {PPL_LABELS[nextType]}
          </div>
          <div className="font-mono text-[9px] text-text-tertiary mt-0.5">{PPL_MUSCLES[nextType]}</div>
        </div>
        <button
          onClick={() => onStartSession(nextType)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-heat-orange font-display font-bold text-[12px] uppercase tracking-wider text-white hover:bg-[#EA580C] transition-colors"
        >
          Commencer →
        </button>
      </div>

      {/* Liste exercices preview */}
      <div className="divide-y divide-subtle">
        {exList.map(({ name, meta, last }) => (
          <div key={name} className="flex items-center gap-3 px-4 py-3">
            {/* Mini GIF */}
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-bg-surface2 shrink-0 flex items-center justify-center">
              {meta?.gif_cached_url || meta?.gif_url ? (
                <img
                  src={meta.gif_cached_url || meta.gif_url}
                  alt={name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5">
                  <circle cx="12" cy="8" r="4" /><path d="M6 20v-2a6 6 0 0 1 12 0v2" />
                </svg>
              )}
            </div>

            {/* Infos */}
            <div className="flex-1 min-w-0">
              <div className="font-body font-semibold text-[13px] text-text-primary truncate">{name}</div>
              <div className="font-mono text-[9px] text-text-tertiary">
                {meta?.muscle_target ?? '—'}
              </div>
            </div>

            {/* Dernière charge */}
            {last && (
              <div className="font-mono text-[11px] text-heat-amber font-bold shrink-0">
                {last.weight_kg}kg
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Phase banner ──────────────────────────────────────────────────────────────

const PHASE_CONFIG = {
  1: { label: 'Phase 1', sublabel: 'Recomposition', color: '#4f8df9', targetKg: 89, targetDate: '2026-09-01' },
  2: { label: 'Phase 2', sublabel: 'Affinage',      color: '#10b981', targetKg: 84, targetDate: '2026-12-31' },
  3: { label: 'Phase 3', sublabel: 'Marathon',      color: '#f59e0b', targetKg: 83, targetDate: '2027-04-11' },
};

function PhaseBanner({ profile, weights }) {
  const poidsActuel = weights[weights.length - 1]?.poids_kg ?? profile?.poids_initial_kg ?? null;
  if (!poidsActuel || !profile) return null;

  const phase = computePhase(poidsActuel);
  const config = PHASE_CONFIG[phase];
  const startKg = phase === 1 ? (profile.poids_initial_kg ?? 100) : (PHASE_CONFIG[phase - 1]?.targetKg ?? poidsActuel);
  const progress = Math.min(1, Math.max(0, (startKg - poidsActuel) / (startKg - config.targetKg)));
  const daysLeft = Math.ceil((new Date(config.targetDate) - new Date()) / 86400000);
  const color = config.color;

  return (
    <div
      className="mx-6 mb-1 rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${color}30`, background: `${color}08` }}
    >
      <div className="px-4 pt-3 pb-3">
        <div className="flex items-baseline justify-between mb-2.5 gap-2">
          <div className="flex items-baseline gap-1.5 min-w-0 overflow-hidden">
            <span className="font-display font-bold text-[15px] shrink-0" style={{ color }}>{config.label}</span>
            <span className="font-mono text-[9px] uppercase tracking-tight text-text-tertiary truncate">· {config.sublabel}</span>
          </div>
          <span className="font-mono text-[10px] font-bold shrink-0" style={{ color }}>
            {daysLeft > 0 ? `J-${daysLeft}` : '✓'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-text-tertiary w-12 text-right shrink-0">{poidsActuel} kg</span>
          <div className="flex-1 h-1.5 rounded-full bg-bg-surface2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.round(progress * 100)}%`, background: color }}
            />
          </div>
          <span className="font-mono text-[10px] text-text-tertiary w-12 shrink-0">{config.targetKg} kg</span>
        </div>
        <div className="mt-1.5 font-mono text-[9px] text-text-tertiary text-center">
          {Math.round(progress * 100)}% · {(poidsActuel - config.targetKg).toFixed(1)} kg restants
        </div>
      </div>
    </div>
  );
}

// ─── Résumé semaine horizontal ──────────────────────────────────────────────────

function computeStreakLocal(sessions, runs) {
  const today = new Date();
  let streak = 0;
  for (let i = 0; i <= 6; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    const has = sessions.some(s => s.date === ds) || runs.some(a => a.start_date?.startsWith(ds));
    if (has) streak++;
    else if (i > 0) break;
  }
  return streak;
}

function WeekSummaryRow({ userId, today, avgDeficit }) {
  const [stats, setStats] = useState({ sessions: 0, km: 0, streak: 0 });

  useEffect(() => {
    if (!userId) return;
    const weekStart = addDaysISO(today, -6);
    Promise.all([
      supabase.from('workout_sessions').select('id, date').eq('user_id', userId).gte('date', weekStart).lte('date', today),
      supabase.from('strava_activities').select('distance_m, start_date').eq('profile_id', userId).gte('start_date', weekStart).lte('start_date', today + 'T23:59:59'),
    ]).then(([{ data: sessions }, { data: runs }]) => {
      const km = (runs || []).reduce((s, a) => s + (a.distance_m || 0), 0) / 1000;
      const streak = computeStreakLocal(sessions || [], runs || []);
      setStats({ sessions: (sessions || []).length, km, streak });
    });
  }, [userId, today]);

  const chips = [
    { emoji: '🏋️', value: `${stats.sessions}/3`,   label: 'Séances' },
    { emoji: '🏃', value: `${Math.round(stats.km * 10) / 10}/30 km`, label: 'Course' },
    { emoji: '🔥', value: `${stats.streak} j`,      label: 'Streak' },
    ...(avgDeficit ? [{ emoji: '⚖️', value: `−${Math.abs(Math.round(avgDeficit))} kcal`, label: 'Déficit moy' }] : []),
  ];

  return (
    <div className="overflow-x-auto px-6 pb-1" style={{ scrollbarWidth: 'none' }}>
      <div className="flex gap-2.5" style={{ minWidth: 'max-content' }}>
        {chips.map(chip => (
          <div key={chip.label} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-subtle bg-bg-surface1 shrink-0">
            <span className="text-[16px] leading-none">{chip.emoji}</span>
            <div>
              <div className="font-display font-bold text-[13px] text-text-primary leading-none">{chip.value}</div>
              <div className="font-mono text-[9px] uppercase tracking-wider text-text-tertiary mt-0.5">{chip.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Helpers ISO week ─────────────────────────────────────────────────────────

function getISOWeekKey() {
  const d = new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

// ─── Bilan hebdomadaire (visible le dimanche ou si non lu cette semaine) ───────

function WeeklyDigestCard({ userId, avatarState, avatarCustomization }) {
  const [dismissed, setDismissed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [response, setResponse] = useState(null);
  const weekKey = getISOWeekKey();

  useEffect(() => {
    const saved = localStorage.getItem('coach_weekly_dismissed');
    const today = new Date();
    const isSunday = today.getDay() === 0;
    if (saved !== weekKey && isSunday) setDismissed(false);
  }, [weekKey]);

  const handleDismiss = () => {
    localStorage.setItem('coach_weekly_dismissed', weekKey);
    setDismissed(true);
  };

  const handleAnalyse = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const today = todayISO();
      const weekStart = addDaysISO(today, -6);
      const [sessionsRes, stravaRes, ctx] = await Promise.all([
        supabase.from('workout_sessions').select('type, date, duration_min').eq('user_id', userId).gte('date', weekStart),
        supabase.from('strava_activities').select('distance_m, calories, average_heartrate, start_date').eq('profile_id', userId).gte('start_date', weekStart),
        buildCoachContext(userId),
      ]);
      const sessions = sessionsRes.data || [];
      const activities = stravaRes.data || [];
      const weekKm = activities.reduce((s, a) => s + (a.distance_m || 0), 0) / 1000;
      const weekKcalSport = activities.reduce((s, a) => s + (a.calories || 0), 0);

      const payload = {
        week: weekKey,
        sessions,
        week_km: Math.round(weekKm * 10) / 10,
        avg_weight: ctx.last_weight?.value,
        avg_deficit_kcal: 580,
        fat_burned_g: Math.round((weekKcalSport * 0.15 + sessions.length * 300) / 9),
        streak: ctx.streak,
      };

      const { data, error } = await supabase.functions.invoke('jamra-coach', {
        body: { type: 'weekly', payload, userContext: ctx },
      });
      setResponse(error ? 'Erreur de connexion.' : (data?.message ?? 'Pas de réponse.'));
    } catch (e) {
      setResponse('Erreur : ' + e.message);
    }
    setLoading(false);
    handleDismiss();
  };

  if (dismissed) return null;

  return (
    <div className="mx-6 mb-1 rounded-2xl border border-heat-orange/20 bg-heat-orange/5 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">📊</span>
          <div className="font-display font-bold text-[11px] uppercase tracking-[0.14em] text-heat-orange">
            Bilan de semaine
          </div>
        </div>
        <button onClick={handleDismiss} className="text-text-muted hover:text-text-tertiary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      {response ? (
        <>
          <div className="font-body text-[13px] text-text-primary leading-relaxed mt-2">{response}</div>
          <button
            onClick={async () => {
              setSharing(true);
              try {
                const ctx = await buildCoachContext(userId);
                const today = todayISO();
                const weekStart = addDaysISO(today, -6);
                const [sessionsRes, stravaRes] = await Promise.all([
                  supabase.from('workout_sessions').select('type, date').eq('user_id', userId).gte('date', weekStart),
                  supabase.from('strava_activities').select('distance_m, calories').eq('profile_id', userId).gte('start_date', weekStart),
                ]);
                const sessions = sessionsRes.data || [];
                const activities = stravaRes.data || [];
                const weekData = {
                  poids: ctx.last_weight?.value,
                  poidsPrec: null,
                  graisseBrulee: activities.reduce((s, a) => s + (a.calories || 0), 0) * 0.15 / 1000,
                  seances: sessions.length,
                  kmZone2: Math.round(activities.reduce((s, a) => s + (a.distance_m || 0), 0) / 100) / 10,
                  streak: ctx.streak,
                  weekLabel: weekKey,
                };
                await shareOrDownloadWeekly(weekData, avatarState, avatarCustomization, response);
              } catch { /* silent */ }
              setSharing(false);
            }}
            disabled={sharing}
            className="w-full mt-2 py-2 rounded-xl bg-bg-surface2 border border-subtle font-display font-bold text-[11px] uppercase tracking-wider text-text-secondary hover:bg-heat-orange/10 hover:text-heat-orange hover:border-heat-orange/30 transition-colors disabled:opacity-40"
          >
            {sharing ? 'Génération...' : '↗ Partager mon bilan'}
          </button>
        </>
      ) : (
        <>
          <div className="font-body text-[12px] text-text-tertiary mb-3">
            Analyse ta semaine avec ton coach IA.
          </div>
          <button
            onClick={handleAnalyse}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-heat-orange/15 border border-heat-orange/30 font-display font-bold text-[11px] uppercase tracking-wider text-heat-orange hover:bg-heat-orange/25 transition-colors disabled:opacity-50"
          >
            {loading ? 'Analyse...' : 'Lancer le bilan IA →'}
          </button>
        </>
      )}
    </div>
  );
}

// ─── Chat libre avec le coach ─────────────────────────────────────────────────

const CHAT_STORAGE_KEY = 'coach_chat_history';
const MAX_HISTORY = 3;

function CoachChatWidget({ userId }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || '[]'); } catch { return []; }
  });
  const inputRef = useRef(null);

  const persistHistory = (h) => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(h.slice(-MAX_HISTORY)));
  };

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || !userId || loading) return;
    setInput('');
    setLoading(true);

    const newHistory = [...history, { role: 'user', text: msg }];
    setHistory(newHistory);

    try {
      const ctx = await buildCoachContext(userId);
      const { data, error } = await supabase.functions.invoke('jamra-coach', {
        body: { type: 'freeform', payload: { message: msg }, userContext: ctx },
      });
      const reply = error ? 'Erreur de connexion.' : (data?.message ?? 'Pas de réponse.');
      const updated = [...newHistory, { role: 'coach', text: reply }];
      setHistory(updated);
      persistHistory(updated);
    } catch (e) {
      const updated = [...newHistory, { role: 'coach', text: 'Erreur : ' + e.message }];
      setHistory(updated);
      persistHistory(updated);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="mx-6 mb-1">
      {/* Historique */}
      {history.length > 0 && (
        <div className="mb-3 flex flex-col gap-2">
          {history.slice(-MAX_HISTORY * 2).map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] px-3 py-2 rounded-xl font-body text-[12px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-heat-orange/15 border border-heat-orange/25 text-text-primary'
                    : 'bg-bg-surface1 border border-subtle text-text-secondary'
                }`}
              >
                {msg.role === 'coach' && (
                <span className="flex items-center gap-1 text-heat-orange font-bold text-[10px] mb-0.5">
                  <svg width="10" height="10" viewBox="0 0 32 64" style={{ imageRendering: 'pixelated', flexShrink: 0 }}>
                    <rect x="6" y="3" width="20" height="16" fill="#d3915d" rx="2" />
                    <rect x="8" y="16" width="16" height="22" fill="#0a1422" />
                    <rect x="5" y="26" width="8" height="2" fill="#d3915d" />
                    <rect x="19" y="26" width="8" height="2" fill="#0a1422" />
                    <rect x="9" y="38" width="5" height="16" fill="#0a1422" />
                    <rect x="18" y="38" width="5" height="16" fill="#0a1422" />
                  </svg>
                  COACH
                </span>
              )}
                {msg.text}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 rounded-2xl border border-subtle bg-bg-surface1 px-3 py-2">
        <span className="text-base shrink-0">💬</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pose une question à ton coach..."
          className="flex-1 bg-transparent font-body text-[13px] text-text-primary placeholder-text-muted focus:outline-none"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="shrink-0 w-8 h-8 rounded-xl bg-heat-orange/15 flex items-center justify-center disabled:opacity-30 hover:bg-heat-orange/30 transition-colors"
        >
          {loading ? (
            <div className="w-3 h-3 border-2 border-heat-orange/50 border-t-heat-orange rounded-full animate-spin" />
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF4D00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const avatarState = useAvatarState();
  const { customization: avatarCustomization } = useAvatarCustomization();
  const today = todayISO();
  const todayDate = new Date();
  const sevenDaysAgo = addDaysISO(today, -6);

  const profile = useLiveQuery(getProfile);
  const totals = useLiveQuery(() => getDailyTotals(today), [today]);
  const meals = useLiveQuery(() => getMealsForDate(today), [today]);
  const weights = useLiveQuery(getAllWeights) || [];

  const [userId, setUserId] = useState(null);
  const [tonightWorkout, setTonightWorkout] = useState(null);
  const [avatarProud, setAvatarProud] = useState(false);
  const prevUnlocksLen = useRef(0);
  const { recentUnlocks, milestoneUnlocks, dismissMilestone, checkAll, checkFirstSession, checkFirstPR } = useAchievements();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
    });
  }, []);

  const metrics = profile ? computeProfileMetrics(profile) : null;
  const target = metrics?.target_kcal;

  const stats7d = useLiveQuery(
    () => target ? getStatsOverRange(sevenDaysAgo, today, target) : null,
    [sevenDaysAgo, today, target]
  );

  const [dismissals, setDismissals] = useState({});
  useEffect(() => {
    clearOldDismissals();
    setDismissals(getDismissals());
  }, []);

  // Vérifie les achievements une fois les données prêtes
  useEffect(() => {
    if (!userId || !profile || !weights.length) return;
    const poidsActuel = weights[weights.length - 1]?.poids_kg;
    checkAll(userId, { poidsInitial: profile.poids_initial_kg, poidsActuel });
  }, [userId, profile?.id]);

  // Avatar fier 3s quand un achievement se déverrouille
  useEffect(() => {
    if (recentUnlocks.length > prevUnlocksLen.current) {
      setAvatarProud(true);
      const t = setTimeout(() => setAvatarProud(false), 3000);
      prevUnlocksLen.current = recentUnlocks.length;
      return () => clearTimeout(t);
    }
    prevUnlocksLen.current = recentUnlocks.length;
  }, [recentUnlocks]);

  const handleDismiss = (id) => {
    const updated = dismissInsight(id);
    setDismissals(updated);
  };

  if (!profile || !totals || !meals || !metrics || !stats7d) return null;

  const consumed = totals.kcal;
  const remaining = Math.max(0, target - consumed);
  const over = consumed > target ? consumed - target : 0;
  const ratio = target > 0 ? consumed / target : 0;

  const insights = computeInsights({
    profile,
    targetKcal: target,
    today,
    todayTotals: totals,
    stats7d,
    stats14d: stats7d,
    weights,
    dismissals,
  });

  const handleAdd = (mealKey) => {
    navigate(`/ajout?meal=${mealKey}&date=${today}`);
  };

  const avgDeficit = stats7d?.avgKcal > 0 ? target - stats7d.avgKcal : null;

  return (
    <div>
      <Header
        variant="greeting"
        eyebrow={formatDayEyebrow(todayDate)}
        title={formatDateHeader(todayDate)}
        action={
          <IconButton onClick={() => navigate('/profil')} aria-label="Profil">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </IconButton>
        }
      />

      <InsightsRow insights={insights} onDismiss={handleDismiss} />

      {/* 1 ── AVATAR */}
      {!avatarState.loading && (
        <div className="px-6 pt-2 pb-1">
          <div className="relative">
            <JamraAvatar
              bodyState={avatarState.bodyState}
              expression={avatarProud ? 'fier' : avatarState.expression}
              scene={avatarState.scene}
              weight={avatarState.weight}
              bf={avatarState.bf}
              customization={avatarCustomization}
            />
            {/* Jamr mascot — état piloté par formeScore */}
            <div className="absolute bottom-3 left-3" style={{ animation: 'jmrBounce 2s ease-in-out infinite' }}>
              <JamrMascot
                state={
                  avatarProud ? 'happy'
                    : (avatarState.formeScore ?? 60) > 70 ? 'happy'
                    : (avatarState.formeScore ?? 60) < 40 ? 'sad'
                    : 'idle'
                }
                size={32}
              />
            </div>
          </div>
        </div>
      )}

      {/* FORME Tamagotchi bar */}
      {!avatarState.loading && (
        <div className="px-6 pt-1 pb-2">
          <div className="flex items-center gap-3">
            <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-text-muted w-12">FORME</div>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#1a0e0c' }}>
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${avatarState.formeScore ?? 60}%`,
                  background: (avatarState.formeScore ?? 60) < 40
                    ? '#ef4444'
                    : 'linear-gradient(90deg, #FF4D00, #FFAA33)',
                  boxShadow: (avatarState.formeScore ?? 60) < 40
                    ? '0 0 8px rgba(239,68,68,0.6)'
                    : '0 0 6px rgba(255,77,0,0.35)',
                  animation: (avatarState.formeScore ?? 60) < 40 ? 'jmrPulse 1.4s infinite' : 'none',
                }}
              />
            </div>
            <div className={`font-mono text-[10px] font-bold w-10 text-right ${(avatarState.formeScore ?? 60) < 40 ? 'text-danger' : 'text-heat-amber'}`}>
              {avatarState.formeScore ?? 60}%
            </div>
          </div>
        </div>
      )}

      {/* 2 ── BANDEAU PHASE */}
      <div className="pt-3 pb-1">
        <PhaseBanner profile={profile} weights={weights} />
      </div>

      {/* 3 ── RING CALORIES */}
      <div className="px-6 py-7 flex flex-col items-center">
        <ProgressRing value={ratio} size={220}>
          <div className="font-display font-extrabold text-[56px] leading-none tracking-tight text-heat-gradient">
            {formatNumber(consumed)}
          </div>
          <div className="font-mono text-xs text-text-tertiary mt-1 tracking-wider">
            / {formatNumber(target)} kcal
          </div>
          <div className="font-body font-semibold text-[11px] uppercase tracking-[0.2em] text-text-secondary mt-2">
            {over > 0 ? 'Dépassé' : 'Consommées'}
          </div>
        </ProgressRing>
        <div className="flex gap-2 mt-5 w-full max-w-[280px]">
          <div className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
            <div className={`font-display font-bold text-lg ${over > 0 ? 'text-danger' : 'text-heat-orange'}`}>
              {over > 0 ? `+${formatNumber(over)}` : formatNumber(remaining)}
            </div>
            <div className="font-mono text-[8px] tracking-tight uppercase text-text-tertiary whitespace-nowrap">
              {over > 0 ? 'Surplus' : 'Restant'}
            </div>
          </div>
          <div className="w-px bg-subtle self-stretch" />
          <div className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
            <div className="font-display font-bold text-lg">{formatNumber(metrics.tdee)}</div>
            <div className="font-mono text-[8px] tracking-tight uppercase text-text-tertiary whitespace-nowrap">Dépense</div>
          </div>
          <div className="w-px bg-subtle self-stretch" />
          <div className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
            <div className="font-display font-bold text-lg">−{formatNumber(metrics.deficit_kcal)}</div>
            <div className="font-mono text-[8px] tracking-tight uppercase text-text-tertiary whitespace-nowrap">Déficit</div>
          </div>
        </div>
      </div>

      {/* 4 ── WIDGET FONTE */}
      <div className="px-6 pb-3">
        <FatBurnWidget />
      </div>

      {/* 5 ── RÉSUMÉ SEMAINE (chips horizontaux) */}
      <div className="pb-3">
        <WeekSummaryRow userId={userId} today={today} avgDeficit={avgDeficit} />
      </div>

      {/* 6 ── MA SÉANCE CE SOIR */}
      <div className="pb-1">
        <TonightSessionWidget userId={userId} onStartSession={(type) => setTonightWorkout({ type })} />
      </div>

      {/* 7 ── CHAT COACH */}
      <div className="pt-2 pb-1">
        <CoachChatWidget userId={userId} />
      </div>

      {/* 8 ── BILAN HEBDO (dimanche seulement) */}
      <div className="pt-2 pb-1">
        <WeeklyDigestCard userId={userId} avatarState={avatarState} avatarCustomization={avatarCustomization} />
      </div>

      {/* ── MACROS */}
      <div className="px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <div className="font-display font-bold text-[13px] uppercase tracking-[0.12em] text-text-secondary">
            Macros du jour
          </div>
          <div className="font-mono text-[10px] text-text-tertiary tracking-wider">EN GRAMMES</div>
        </div>
        <div className="flex flex-col gap-3.5">
          <MacroRow name="Protéines" current={totals.proteines} target={metrics.proteines_g} delay={100} />
          <MacroRow name="Glucides"  current={totals.glucides}  target={metrics.glucides_g}  delay={200} />
          <MacroRow name="Lipides"   current={totals.lipides}   target={metrics.lipides_g}   delay={300} />
          <MacroRow name="Fibres"    current={totals.fibres}    target={metrics.fibres_g}    delay={400} variant="success" />
        </div>
      </div>

      {/* ── REPAS */}
      <div className="px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <div className="font-display font-bold text-[13px] uppercase tracking-[0.12em] text-text-secondary">
            Repas
          </div>
          <div className="font-mono text-[10px] text-text-tertiary tracking-wider">
            {Object.values(meals).filter(m => m.length > 0).length} / 4 SAISIS
          </div>
        </div>
        {MEAL_CONFIG.map(({ key, label, illustration: Illustration }) => (
          <MealCard
            key={key}
            mealKey={key}
            label={label}
            Illustration={Illustration}
            entries={meals[key] || []}
            onAdd={() => handleAdd(key)}
            onEditEntry={(entryId) => navigate(`/edit/${entryId}`)}
          />
        ))}
      </div>

      <AchievementToastLayer unlocks={recentUnlocks} onDismiss={() => {}} />

      {milestoneUnlocks.length > 0 && (
        <MilestoneAnimation
          milestone={milestoneUnlocks[0]}
          avatarState={avatarState}
          avatarCustomization={avatarCustomization}
          onDismiss={() => dismissMilestone(milestoneUnlocks[0]._id)}
        />
      )}

      {tonightWorkout && (
        <SessionWorkout
          initialType={tonightWorkout.type}
          onClose={() => setTonightWorkout(null)}
          onCreated={(uid) => {
            setTonightWorkout(null);
            if (uid) { checkFirstSession(uid); checkFirstPR(uid); }
          }}
        />
      )}
    </div>
  );
}
