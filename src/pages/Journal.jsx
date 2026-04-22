import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  getProfile,
  getDailyTotals,
  getMealsForDate,
  getDailyTotalsRange,
  getWeightOnDate,
  todayISO,
} from '../db/database';
import { computeProfileMetrics } from '../utils/calculations';
import {
  formatNumber,
  formatDateLong,
  formatDayAbbrev,
  dateFromISO,
  addDaysISO,
  last7DaysISO,
} from '../utils/format';
import Header from '../components/layout/Header';
import IconButton from '../components/ui/IconButton';
import ProgressRing from '../components/ui/ProgressRing';
import ProgressBar from '../components/ui/ProgressBar';
import KcalBarChart from '../components/charts/KcalBarChart';
import TrendsPanel from '../components/trends/TrendsPanel';
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

function DayCell({ iso, isSelected, isToday, kcal, target, onClick }) {
  const dt = dateFromISO(iso);
  const hasData = kcal > 0;
  const ratio = target > 0 ? Math.min(1.2, kcal / target) : 0;
  const over = kcal > target;

  const circumference = 2 * Math.PI * 14;
  const offset = circumference * (1 - Math.min(1, ratio));

  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center py-2 px-2 rounded-xl min-w-[52px] transition-all duration-200
        ${isSelected
          ? 'bg-gradient-to-br from-[rgba(255,170,51,0.12)] to-[rgba(255,23,68,0.12)] border border-heat-orange'
          : 'border border-transparent hover:bg-bg-surface1'
        }
      `}
    >
      <div className={`
        font-mono text-[9px] tracking-[0.15em] uppercase
        ${isSelected ? 'text-heat-amber font-bold' : isToday ? 'text-heat-amber' : 'text-text-tertiary'}
      `}>
        {formatDayAbbrev(dt)}
      </div>
      <div className={`
        font-display font-bold text-base mt-0.5
        ${isSelected ? 'text-text-primary' : isToday ? 'text-heat-amber' : 'text-text-secondary'}
      `}>
        {dt.getDate()}
      </div>
      <svg width="32" height="32" className="mt-1 -rotate-90">
        <circle
          cx="16" cy="16" r="14"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="2.5"
        />
        {hasData && (
          <circle
            cx="16" cy="16" r="14"
            fill="none"
            stroke={over ? '#FF1744' : '#FFAA33'}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        )}
      </svg>
      <div className={`font-mono text-[9px] mt-0.5 tabular-nums ${hasData ? 'text-text-primary' : 'text-text-tertiary'}`}>
        {hasData ? formatNumber(kcal) : '—'}
      </div>
    </button>
  );
}

function WeekCarousel({ days, selectedIso, todayIso, target, onSelect, onShiftWeek }) {
  return (
    <div className="px-6 pb-3">
      <div className="flex items-center gap-1">
        <button
          onClick={() => onShiftWeek(-1)}
          className="w-8 h-8 flex items-center justify-center text-text-tertiary hover:text-text-primary"
          aria-label="Semaine précédente"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="flex-1 flex justify-between gap-1 overflow-x-auto">
          {days.map((d) => (
            <DayCell
              key={d.iso}
              iso={d.iso}
              isSelected={d.iso === selectedIso}
              isToday={d.iso === todayIso}
              kcal={d.kcal}
              target={target}
              onClick={() => onSelect(d.iso)}
            />
          ))}
        </div>
        <button
          onClick={() => onShiftWeek(1)}
          className="w-8 h-8 flex items-center justify-center text-text-tertiary hover:text-text-primary"
          aria-label="Semaine suivante"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function MacroRow({ name, current, target, variant = 'heat' }) {
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
      <ProgressBar value={ratio} variant={variant} />
    </div>
  );
}

function MealCard({ mealKey, label, Illustration, entries, onAdd, onEditEntry }) {
  const totalKcal = entries.reduce((sum, e) => sum + (e.kcal_snapshot || 0), 0);
  const isEmpty = entries.length === 0;

  if (isEmpty) {
    return (
      <button
        onClick={onAdd}
        className="w-full mb-3 rounded-2xl border border-dashed border-strong py-5 px-5 text-center hover:border-heat-orange hover:bg-[rgba(255,77,0,0.04)] transition-all"
      >
        <div className="flex items-center justify-center gap-3">
          <Illustration size={28} />
          <div className="font-display font-bold text-sm uppercase tracking-[0.06em] text-text-secondary">
            {label}
          </div>
          <div className="font-mono text-[10px] text-heat-orange font-bold tracking-[0.1em] uppercase">
            + Ajouter
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="mb-3 rounded-2xl border border-subtle bg-bg-surface1 p-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <Illustration size={32} />
          <div>
            <div className="font-display font-bold text-[14px] uppercase tracking-[0.06em] text-text-primary">
              {label}
            </div>
            <div className="font-mono text-[10px] text-text-tertiary">
              {entries.length} entrée{entries.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <div>
          <span className="font-display font-bold text-lg text-heat-amber">{formatNumber(totalKcal)}</span>
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
              <span className="font-body text-[13px] text-text-secondary">{e.aliment_nom_snapshot}</span>
              <span className="font-mono text-[11px] text-text-tertiary ml-1">· {e.quantite_g} g</span>
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

export default function Journal() {
  const navigate = useNavigate();
  const today = todayISO();

  // État : date sélectionnée (jour détaillé), date de fin de semaine (pour le carrousel)
  const [selectedIso, setSelectedIso] = useState(today);
  const [weekEndIso, setWeekEndIso] = useState(today);

  // 7 jours du carrousel se terminant à weekEndIso
  const weekDays = useMemo(() => last7DaysISO(weekEndIso), [weekEndIso]);

  const profile = useLiveQuery(getProfile);
  const weekTotals = useLiveQuery(
    () => getDailyTotalsRange(weekDays),
    [weekDays.join('|')]
  );
  const selectedTotals = useLiveQuery(
    () => getDailyTotals(selectedIso),
    [selectedIso]
  );
  const selectedMeals = useLiveQuery(
    () => getMealsForDate(selectedIso),
    [selectedIso]
  );
  const selectedWeight = useLiveQuery(
    () => getWeightOnDate(selectedIso),
    [selectedIso]
  );

  if (!profile || !weekTotals || !selectedTotals || !selectedMeals) return null;

  const metrics = computeProfileMetrics(profile);
  if (!metrics) return null;

  const target = metrics.target_kcal;

  // Données pour le carrousel
  const carouselDays = weekDays.map(iso => ({
    iso,
    kcal: weekTotals[iso]?.kcal || 0,
  }));

  // Stats semaine
  const daysLogged = carouselDays.filter(d => d.kcal > 0).length;
  const totalKcalWeek = carouselDays.reduce((sum, d) => sum + d.kcal, 0);
  const avgKcal = daysLogged > 0 ? Math.round(totalKcalWeek / daysLogged) : 0;

  // Données du jour sélectionné
  const consumed = selectedTotals.kcal;
  const remaining = Math.max(0, target - consumed);
  const over = consumed > target ? consumed - target : 0;
  const ratio = target > 0 ? consumed / target : 0;

  const selectedDate = dateFromISO(selectedIso);
  const isSelectedToday = selectedIso === today;
  const isSelectedFuture = selectedIso > today;

  const handleAdd = (mealKey) => {
    navigate(`/ajout?meal=${mealKey}&date=${selectedIso}`);
  };

  const handleShiftWeek = (direction) => {
    // direction : -1 semaine précédente, +1 semaine suivante
    const newEnd = addDaysISO(weekEndIso, direction * 7);
    // Ne pas aller dans le futur au-delà d'aujourd'hui
    if (direction > 0 && newEnd > today) {
      setWeekEndIso(today);
    } else {
      setWeekEndIso(newEnd);
    }
    // Sélectionne le dernier jour de la nouvelle semaine par défaut
    const newDays = last7DaysISO(newEnd > today ? today : newEnd);
    setSelectedIso(newDays[newDays.length - 1]);
  };

  return (
    <div>
      <Header
        variant="greeting"
        eyebrow="JOURNAL"
        title="Historique"
        action={
          selectedIso !== today && (
            <IconButton
              onClick={() => { setSelectedIso(today); setWeekEndIso(today); }}
              aria-label="Aujourd'hui"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </IconButton>
          )
        }
      />

      <WeekCarousel
        days={carouselDays}
        selectedIso={selectedIso}
        todayIso={today}
        target={target}
        onSelect={setSelectedIso}
        onShiftWeek={handleShiftWeek}
      />

      {/* Stats semaine */}
      <div className="px-6 pt-3 pb-5">
        <div className="p-4 bg-bg-surface1 border border-subtle rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="font-display font-bold text-[12px] uppercase tracking-[0.12em] text-text-secondary">
              Aperçu 7 jours
            </div>
            <div className="font-mono text-[10px] text-text-tertiary tracking-wider">
              {daysLogged} / 7 SAISIS
            </div>
          </div>
          <KcalBarChart
            days={carouselDays}
            target={target}
            selectedIso={selectedIso}
            onSelectDay={setSelectedIso}
          />
          <div className="flex justify-around pt-3 mt-3 border-t border-subtle">
            <div className="flex flex-col items-center">
              <div className="font-display font-bold text-lg text-heat-amber">
                {daysLogged > 0 ? formatNumber(avgKcal) : '—'}
              </div>
              <div className="font-mono text-[9px] tracking-[0.15em] uppercase text-text-tertiary">
                Moy./jour
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="font-display font-bold text-lg">
                {formatNumber(totalKcalWeek)}
              </div>
              <div className="font-mono text-[9px] tracking-[0.15em] uppercase text-text-tertiary">
                Total
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="font-display font-bold text-lg">
                {daysLogged > 0 ? `${Math.round((avgKcal / target) * 100)}%` : '—'}
              </div>
              <div className="font-mono text-[9px] tracking-[0.15em] uppercase text-text-tertiary">
                Cible
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tendances (Phase 3) */}
      <div className="px-6 pb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="font-display font-bold text-[13px] uppercase tracking-[0.12em] text-text-secondary">
            Tendances
          </div>
        </div>
        <TrendsPanel target={target} />
      </div>

      {/* Détail du jour sélectionné */}
      <div className="px-6 pb-3 border-t border-subtle pt-5">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-heat-amber">
              {isSelectedToday ? "AUJOURD'HUI" : formatDayAbbrev(selectedDate)}
            </div>
            <div className="font-display font-bold text-lg uppercase tracking-[0.02em] text-text-primary mt-0.5">
              {formatDateLong(selectedDate)}
            </div>
          </div>
          {selectedWeight && (
            <div className="text-right">
              <div className="font-mono text-[9px] tracking-[0.15em] uppercase text-text-tertiary">Pesée</div>
              <div className="font-display font-bold text-base text-heat-amber">
                {formatNumber(selectedWeight.poids_kg, { decimals: 1 })} kg
              </div>
            </div>
          )}
        </div>

        {isSelectedFuture ? (
          <div className="py-10 text-center text-text-tertiary font-mono text-sm tracking-wider">
            JOUR À VENIR
          </div>
        ) : selectedTotals.count === 0 ? (
          <div className="py-8 text-center">
            <div className="text-text-tertiary text-sm mb-3">Aucun repas saisi pour ce jour.</div>
            <button
              onClick={() => handleAdd('collation')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-heat-orange text-heat-orange font-display font-bold text-xs uppercase tracking-[0.1em] hover:bg-[rgba(255,77,0,0.08)] transition-colors"
            >
              + Ajouter un aliment
            </button>
          </div>
        ) : (
          <>
            {/* Anneau */}
            <div className="flex justify-center mb-4">
              <ProgressRing value={ratio} size={180}>
                <div className="font-display font-extrabold text-[44px] leading-none tracking-tight text-heat-gradient">
                  {formatNumber(consumed)}
                </div>
                <div className="font-mono text-[10px] text-text-tertiary mt-1 tracking-wider">
                  / {formatNumber(target)} kcal
                </div>
                <div className="font-body font-semibold text-[10px] uppercase tracking-[0.2em] text-text-secondary mt-2">
                  {over > 0 ? `+${formatNumber(over)} Dépassé` : `${formatNumber(remaining)} Restant`}
                </div>
              </ProgressRing>
            </div>

            {/* Macros */}
            <div className="flex flex-col gap-3 mb-6">
              <MacroRow name="Protéines" current={selectedTotals.proteines} target={metrics.proteines_g} />
              <MacroRow name="Glucides"  current={selectedTotals.glucides}  target={metrics.glucides_g} />
              <MacroRow name="Lipides"   current={selectedTotals.lipides}   target={metrics.lipides_g} />
              <MacroRow name="Fibres"    current={selectedTotals.fibres}    target={metrics.fibres_g}    variant="success" />
            </div>
          </>
        )}
      </div>

      {/* Repas du jour */}
      {!isSelectedFuture && (
        <div className="px-6 pb-6">
          {MEAL_CONFIG.map(({ key, label, illustration: Illustration }) => (
            <MealCard
              key={key}
              mealKey={key}
              label={label}
              Illustration={Illustration}
              entries={selectedMeals[key] || []}
              onAdd={() => handleAdd(key)}
              onEditEntry={(entryId) => navigate(`/edit/${entryId}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
