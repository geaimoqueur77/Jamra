import { useState, useEffect } from 'react';
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
import { computeProfileMetrics } from '../utils/calculations';
import { analyzeAdaptation } from '../utils/adaptiveMetrics';
import { formatNumber, formatDayEyebrow, formatDateHeader, addDaysISO } from '../utils/format';
import { computeInsights, getDismissals, dismissInsight, clearOldDismissals } from '../utils/insights';
import Header from '../components/layout/Header';
import IconButton from '../components/ui/IconButton';
import ProgressRing from '../components/ui/ProgressRing';
import ProgressBar from '../components/ui/ProgressBar';
import { InsightsRow } from '../components/insights/InsightCard';
import TodayActivityCard from '../components/home/TodayActivityCard';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import useStrava from '../hooks/useStrava';
import { getKcalBurnedForDate } from '../lib/strava';
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

function MacroMiniCard({ label, current, target, color }) {
  const ratio = target > 0 ? Math.min(1.2, current / target) : 0;
  const pct = Math.round(ratio * 100);
  const over = ratio > 1;
  return (
    <div className="surface-card rounded-xl px-3 py-3 text-center hover-lift">
      <div className="font-display font-bold text-lg leading-none tabular" style={{ letterSpacing: '-0.02em' }}>
        <AnimatedCounter value={current} decimals={current < 10 ? 1 : 0} />
      </div>
      <div className="font-mono text-[9px] text-text-tertiary uppercase tracking-wider mt-1">
        {label} · {target}g
      </div>
      <div className="h-1 bg-bg-surface2 rounded-full mt-2.5 relative overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out-quart"
          style={{
            width: `${Math.min(100, pct)}%`,
            background: over ? '#FF1744' : color,
            animationDelay: '400ms',
          }}
        />
      </div>
    </div>
  );
}

const MEAL_ACCENTS = {
  petit_dej: { color: '#FFAA33', bg: 'rgba(255,170,51,0.12)' },
  dejeuner:  { color: '#FF4D00', bg: 'rgba(255,77,0,0.12)' },
  diner:     { color: '#FF1744', bg: 'rgba(255,23,68,0.12)' },
  collation: { color: '#9B7AFF', bg: 'rgba(155,122,255,0.12)' },
};

function MealCard({ mealKey, label, Illustration, entries, onAdd, onEditEntry }) {
  const navigate = useNavigate();
  const totalKcal = entries.reduce((sum, e) => sum + (e.kcal_snapshot || 0), 0);
  const isEmpty = entries.length === 0;
  const accent = MEAL_ACCENTS[mealKey] || MEAL_ACCENTS.collation;

  if (isEmpty) {
    return (
      <button
        onClick={onAdd}
        className="w-full mb-2 rounded-2xl py-4 px-4 press-down text-left group transition-all"
        style={{
          background: 'transparent',
          border: '1px dashed rgba(255,255,255,0.1)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
            style={{ background: accent.bg }}
          >
            <Illustration size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display font-bold text-sm uppercase tracking-[0.04em] text-text-primary">
              {label}
            </div>
            <div className="font-mono text-[10px] text-text-tertiary tracking-wider uppercase mt-0.5">
              Pas encore saisi
            </div>
          </div>
          <div
            className="font-display font-bold text-[11px] uppercase tracking-[0.1em] transition-colors"
            style={{ color: accent.color }}
          >
            + Ajouter
          </div>
        </div>
      </button>
    );
  }

  const preview = entries.slice(0, 2).map(e => e.aliment_nom_snapshot?.split(',')[0]).filter(Boolean).join(' · ');
  const moreCount = entries.length > 2 ? ` +${entries.length - 2}` : '';

  return (
    <div className="mb-2 surface-card rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={onAdd}
        className="w-full px-4 py-3 flex items-center gap-3 press-down"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: accent.bg }}
        >
          <Illustration size={22} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="font-display font-bold text-sm uppercase tracking-[0.04em] text-text-primary">
            {label}
          </div>
          <div className="font-mono text-[10px] text-text-tertiary tracking-wide mt-0.5 truncate">
            {preview}{moreCount}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-display font-bold text-lg leading-none tabular" style={{ color: accent.color, letterSpacing: '-0.02em' }}>
            {formatNumber(totalKcal)}
          </div>
          <div className="font-mono text-[9px] text-text-tertiary tracking-wider uppercase mt-1">
            kcal
          </div>
        </div>
      </button>

      {/* Divider + entries (cliquables pour éditer) */}
      <div className="border-t border-subtle">
        {entries.map((e, idx) => (
          <button
            key={e.id}
            onClick={() => onEditEntry(e.id)}
            className={`
              w-full flex justify-between items-baseline py-2 px-4 text-left
              hover:bg-white/3 transition-colors press-down
              ${idx > 0 ? 'border-t border-subtle' : ''}
            `}
          >
            <div className="flex-1 min-w-0 pr-2">
              <span className="font-body text-[13px] text-text-secondary truncate">
                {e.aliment_nom_snapshot}
              </span>
              <span className="font-mono text-[10px] text-text-tertiary ml-1.5 tabular">
                {e.quantite_g} g
              </span>
            </div>
            <span className="font-mono text-xs text-text-primary font-medium tabular">
              {formatNumber(e.kcal_snapshot)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const today = todayISO();
  const todayDate = new Date();
  const sevenDaysAgo = addDaysISO(today, -6);

  const profile = useLiveQuery(getProfile);
  const totals = useLiveQuery(() => getDailyTotals(today), [today]);
  const meals = useLiveQuery(() => getMealsForDate(today), [today]);
  const weights = useLiveQuery(getAllWeights) || [];

  // Strava : kcal brûlées aujourd'hui pour ajustement dynamique du TDEE
  const { isConnected: isStravaConnected, connection } = useStrava();
  const [kcalBurnedToday, setKcalBurnedToday] = useState(0);

  useEffect(() => {
    if (!isStravaConnected) {
      setKcalBurnedToday(0);
      return;
    }
    getKcalBurnedForDate(today)
      .then(setKcalBurnedToday)
      .catch(() => setKcalBurnedToday(0));
  }, [today, isStravaConnected, connection?.last_synced_at]);

  // Adaptation métabolique observée (refresh périodique, pas temps-réel)
  const [adaptationPct, setAdaptationPct] = useState(0);
  useEffect(() => {
    if (!profile) return;
    analyzeAdaptation(profile, 28)
      .then(result => {
        if (result?.adaptation?.detected) {
          setAdaptationPct(result.adaptation.adaptation_pct);
        } else {
          setAdaptationPct(0);
        }
      })
      .catch(() => setAdaptationPct(0));
  }, [profile?.id, profile?.poids_actuel_kg]);

  const metrics = profile
    ? computeProfileMetrics(profile, {
        extraKcalBurned: kcalBurnedToday,
        adaptationPct,
      })
    : null;
  const target = metrics?.target_kcal;

  const stats7d = useLiveQuery(
    () => target ? getStatsOverRange(sevenDaysAgo, today, target) : null,
    [sevenDaysAgo, today, target]
  );

  // Insights & dismissals
  const [dismissals, setDismissals] = useState({});
  useEffect(() => {
    clearOldDismissals();
    setDismissals(getDismissals());
  }, []);

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
    stats14d: stats7d, // pas besoin pour les règles actuelles
    weights,
    dismissals,
  });

  const handleAdd = (mealKey) => {
    navigate(`/ajout?meal=${mealKey}&date=${today}`);
  };

  // Greeting personnalisé selon l'heure
  const hour = todayDate.getHours();
  const greeting = hour < 5 ? 'Bonne nuit' : hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const firstName = (profile?.nom || '').split(' ')[0] || 'Ghali';
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <div>
      <Header
        variant="greeting"
        eyebrow={`${formatDayEyebrow(todayDate)} · ${formatDateHeader(todayDate).split(' ').slice(0, 2).join(' ')}`}
        title={`${greeting}, ${firstName}`}
        action={
          <button
            onClick={() => navigate('/profil')}
            className="w-10 h-10 rounded-full flex items-center justify-center press-down transition-all"
            style={{
              background: 'rgba(255, 170, 51, 0.08)',
              border: '0.5px solid rgba(255, 170, 51, 0.3)',
              color: '#FFAA33',
              fontWeight: 500,
              fontSize: '15px',
            }}
            aria-label="Profil"
          >
            {initial}
          </button>
        }
      />

      {/* Insights contextuels (Phase 3) */}
      <InsightsRow insights={insights} onDismiss={handleDismiss} />

      {/* Carte Activité du jour (Phase 5.A) */}
      <TodayActivityCard date={today} isStravaConnected={isStravaConnected} />

      {/* Hero Ring */}
      <div className="px-6 py-6 flex flex-col items-center animate-fade-up">
        <ProgressRing value={ratio} size={224} strokeWidth={12} showTicks>
          <div className="text-heat-gradient font-display font-extrabold leading-none tracking-tight" style={{ fontSize: '56px' }}>
            <AnimatedCounter value={consumed} />
          </div>
          <div className="font-mono text-[11px] text-text-tertiary mt-2 tracking-[0.18em] uppercase tabular">
            / {formatNumber(target)} kcal
          </div>
          <div className="mt-3 font-display font-bold text-[11px] uppercase tracking-[0.2em]"
               style={{ color: over > 0 ? '#FFAA33' : 'rgba(255, 170, 51, 0.85)' }}>
            {over > 0 ? `+${formatNumber(over)} dépassé` : `${formatNumber(remaining)} restantes`}
          </div>
        </ProgressRing>

        <div className="flex gap-4 mt-6 surface-card rounded-2xl px-5 py-3.5">
          <div className="flex flex-col items-center gap-0.5">
            <div className="font-display font-bold text-lg leading-none tabular" style={{ letterSpacing: '-0.02em' }}>
              {formatNumber(metrics.tdee)}
            </div>
            <div className="font-mono text-[9px] tracking-[0.15em] uppercase text-text-tertiary mt-1.5 flex items-center gap-1">
              Dépense
              {metrics.strava_adjustment > 0 && (
                <span className="text-[#FC4C02] font-bold tabular">
                  +{formatNumber(metrics.strava_adjustment)}
                </span>
              )}
            </div>
          </div>
          <div className="w-px bg-subtle" />
          <div className="flex flex-col items-center gap-0.5">
            <div className={`font-display font-bold text-lg leading-none tabular ${over > 0 ? 'text-danger' : 'text-heat-orange'}`} style={{ letterSpacing: '-0.02em' }}>
              {over > 0 ? `+${formatNumber(over)}` : `−${formatNumber(metrics.deficit_kcal)}`}
            </div>
            <div className="font-mono text-[9px] tracking-[0.15em] uppercase text-text-tertiary mt-1.5">
              {over > 0 ? 'Excédent' : 'Déficit'}
            </div>
          </div>
          {metrics.adaptation_pct < 0 && (
            <>
              <div className="w-px bg-subtle" />
              <div className="flex flex-col items-center gap-0.5">
                <div className="font-display font-bold text-lg leading-none tabular text-heat-amber" style={{ letterSpacing: '-0.02em' }}>
                  {Math.round(metrics.adaptation_pct * 100)}%
                </div>
                <div className="font-mono text-[9px] tracking-[0.15em] uppercase text-text-tertiary mt-1.5">
                  Adapté
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Macros */}
      <div className="px-6 py-5 animate-fade-up" style={{ animationDelay: '120ms', animationFillMode: 'backwards' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="font-display font-bold text-[11px] uppercase tracking-[0.15em] text-text-tertiary">
            Macros
          </div>
          <div className="font-mono text-[10px] text-text-tertiary tracking-wider uppercase">
            Aujourd'hui
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 stagger-1">
          <MacroMiniCard label="Prot" current={totals.proteines} target={metrics.proteines_g} color="#FFAA33" />
          <MacroMiniCard label="Gluc" current={totals.glucides}  target={metrics.glucides_g}  color="#FF4D00" />
          <MacroMiniCard label="Lip"  current={totals.lipides}   target={metrics.lipides_g}   color="#FF1744" />
          <MacroMiniCard label="Fib"  current={totals.fibres}    target={metrics.fibres_g}    color="#00E676" />
        </div>
      </div>

      {/* Repas */}
      <div className="px-6 py-5 pb-24 animate-fade-up" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="font-display font-bold text-[11px] uppercase tracking-[0.15em] text-text-tertiary">
            Repas
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {MEAL_CONFIG.map(({ key }) => {
                const hasEntries = (meals[key] || []).length > 0;
                return (
                  <div
                    key={key}
                    className="w-1.5 h-1.5 rounded-full transition-all"
                    style={{
                      background: hasEntries ? '#FFAA33' : 'rgba(255,255,255,0.15)',
                    }}
                  />
                );
              })}
            </div>
            <div className="font-mono text-[10px] text-text-tertiary tracking-wider uppercase tabular">
              {Object.values(meals).filter(m => m.length > 0).length}/4
            </div>
          </div>
        </div>

        <div className="stagger-1">
          {MEAL_CONFIG.map(({ key, label, illustration: Illustration }) => (
            <div key={key} className="animate-fade-up" style={{ animationFillMode: 'backwards' }}>
              <MealCard
                mealKey={key}
                label={label}
                Illustration={Illustration}
                entries={meals[key] || []}
                onAdd={() => handleAdd(key)}
                onEditEntry={(entryId) => navigate(`/edit/${entryId}`)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
