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

      {/* Insights contextuels (Phase 3) */}
      <InsightsRow insights={insights} onDismiss={handleDismiss} />

      {/* Carte Activité du jour (Phase 5.A) */}
      <TodayActivityCard date={today} isStravaConnected={isStravaConnected} />

      {/* Hero Ring */}
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

        <div className="flex gap-5 mt-5">
          <div className="flex flex-col items-center gap-0.5">
            <div className={`font-display font-bold text-lg ${over > 0 ? 'text-danger' : 'text-heat-orange'}`}>
              {over > 0 ? `+${formatNumber(over)}` : formatNumber(remaining)}
            </div>
            <div className="font-mono text-[9px] tracking-[0.15em] uppercase text-text-tertiary">
              {over > 0 ? 'Dépassement' : 'Restant'}
            </div>
          </div>
          <div className="w-px bg-subtle" />
          <div className="flex flex-col items-center gap-0.5">
            <div className="font-display font-bold text-lg">
              {formatNumber(metrics.tdee)}
            </div>
            <div className="font-mono text-[9px] tracking-[0.15em] uppercase text-text-tertiary">
              Dépense
              {metrics.strava_adjustment > 0 && (
                <span className="text-[#FC4C02] font-bold ml-1">
                  +{formatNumber(metrics.strava_adjustment)}
                </span>
              )}
            </div>
          </div>
          <div className="w-px bg-subtle" />
          <div className="flex flex-col items-center gap-0.5">
            <div className="font-display font-bold text-lg">
              −{formatNumber(metrics.deficit_kcal)}
            </div>
            <div className="font-mono text-[9px] tracking-[0.15em] uppercase text-text-tertiary">
              Déficit
            </div>
          </div>
        </div>
      </div>

      {/* Macros */}
      <div className="px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <div className="font-display font-bold text-[13px] uppercase tracking-[0.12em] text-text-secondary">
            Macros du jour
          </div>
          <div className="font-mono text-[10px] text-text-tertiary tracking-wider">
            EN GRAMMES
          </div>
        </div>
        <div className="flex flex-col gap-3.5">
          <MacroRow name="Protéines" current={totals.proteines} target={metrics.proteines_g} delay={100} />
          <MacroRow name="Glucides"  current={totals.glucides}  target={metrics.glucides_g}  delay={200} />
          <MacroRow name="Lipides"   current={totals.lipides}   target={metrics.lipides_g}   delay={300} />
          <MacroRow name="Fibres"    current={totals.fibres}    target={metrics.fibres_g}    delay={400} variant="success" />
        </div>
      </div>

      {/* Repas */}
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
    </div>
  );
}
