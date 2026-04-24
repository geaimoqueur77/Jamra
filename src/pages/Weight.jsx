import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  getAllWeights,
  getLatestWeight,
  getWeightOnDate,
  addOrUpdateWeight,
  deleteWeight,
  getProfile,
  todayISO,
} from '../db/database';
import { formatNumber, formatDateLong, dateFromISO } from '../utils/format';
import { SCENARIOS } from '../utils/calculations';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
import WeightLineChart from '../components/charts/WeightLineChart';
import WeightProjection from '../components/trends/WeightProjection';

import AnimatedCounter from '../components/ui/AnimatedCounter';

function Stat({ label, value, unit, tone = 'default', animate = false }) {
  const toneClass =
    tone === 'danger' ? 'text-danger' :
    tone === 'success' ? 'text-success' :
    tone === 'heat' ? 'text-heat-gradient' :
    'text-text-primary';
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`font-display font-bold text-xl leading-none tabular ${toneClass}`} style={{ letterSpacing: '-0.02em' }}>
        {animate && typeof value === 'number' ? (
          <AnimatedCounter value={value} decimals={1} />
        ) : (
          value
        )}
        {unit && <span className="font-mono text-xs text-text-tertiary ml-1">{unit}</span>}
      </div>
      <div className="font-mono text-[9px] tracking-[0.15em] uppercase text-text-tertiary mt-1.5">
        {label}
      </div>
    </div>
  );
}

function WeightEntry({ w, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const dt = dateFromISO(w.date);
  return (
    <div className="flex items-center justify-between py-3 border-t border-subtle first:border-t-0">
      <div>
        <div className="font-body font-semibold text-sm text-text-primary">
          {formatDateLong(dt)}
        </div>
        <div className="font-mono text-[10px] text-text-tertiary tracking-wider uppercase">
          {w.created_at && `saisie ${new Date(w.created_at).toLocaleDateString('fr-FR')}`}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="font-mono font-semibold text-sm text-text-primary">
          {formatNumber(w.poids_kg, { decimals: 1 })} kg
        </div>
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-tertiary hover:text-danger hover:bg-[rgba(255,23,68,0.08)] transition-colors"
            aria-label="Supprimer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            </svg>
          </button>
        ) : (
          <div className="flex gap-1">
            <button
              onClick={() => setConfirming(false)}
              className="px-2 py-1 text-xs font-mono text-text-tertiary hover:text-text-primary"
            >
              annuler
            </button>
            <button
              onClick={() => { onDelete(w.id); setConfirming(false); }}
              className="px-2 py-1 text-xs font-display font-bold uppercase tracking-wider text-white bg-danger rounded"
            >
              supprimer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Weight() {
  const navigate = useNavigate();
  const today = todayISO();

  const profile = useLiveQuery(getProfile);
  const weights = useLiveQuery(getAllWeights) || [];
  const latest = useLiveQuery(getLatestWeight);

  const [selectedDate, setSelectedDate] = useState(today);
  const [dateMode, setDateMode] = useState('today'); // 'today' | 'other'
  const [inputValue, setInputValue] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedWeight = useLiveQuery(
    () => getWeightOnDate(selectedDate),
    [selectedDate]
  );
  const isSelectedToday = selectedDate === today;

  // Pré-remplir en fonction du jour sélectionné
  useEffect(() => {
    if (selectedWeight) {
      setInputValue(String(selectedWeight.poids_kg));
    } else if (isSelectedToday && latest) {
      setInputValue(String(latest.poids_kg));
    } else if (isSelectedToday && profile?.poids_actuel_kg) {
      setInputValue(String(profile.poids_actuel_kg));
    } else {
      setInputValue('');
    }
  }, [selectedWeight, latest, profile, isSelectedToday]);

  if (!profile) return null;

  const currentWeight = latest?.poids_kg ?? profile.poids_actuel_kg;
  const startWeight = profile.poids_actuel_kg || currentWeight;
  const targetWeight = profile.poids_cible_kg;

  // Stats
  let deltaTotal = null, deltaWeek = null, toGo = null;
  if (latest && weights.length > 0) {
    const first = weights[0];
    deltaTotal = Math.round((latest.poids_kg - first.poids_kg) * 10) / 10;

    // Variation 7 jours : poids il y a ~7j vs aujourd'hui
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoff = sevenDaysAgo.toISOString().slice(0, 10);
    const oldEntries = weights.filter(w => w.date <= cutoff);
    if (oldEntries.length > 0) {
      const ref = oldEntries[oldEntries.length - 1];
      deltaWeek = Math.round((latest.poids_kg - ref.poids_kg) * 10) / 10;
    }
  }
  if (targetWeight != null && currentWeight != null) {
    toGo = Math.round((currentWeight - targetWeight) * 10) / 10;
  }

  const handleSave = async () => {
    const v = Number(inputValue.replace(',', '.'));
    if (isNaN(v) || v < 20 || v > 300) return;
    if (selectedDate > today) return; // pas de date future
    setSaving(true);
    try {
      await addOrUpdateWeight({ date: selectedDate, poids_kg: Math.round(v * 10) / 10 });
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    await deleteWeight(id);
  };

  const fmtDelta = (v) => {
    if (v == null) return '—';
    if (v === 0) return '0,0';
    return v > 0 ? `+${formatNumber(v, { decimals: 1 })}` : formatNumber(v, { decimals: 1 });
  };

  return (
    <div>
      <Header variant="greeting" eyebrow="SUIVI" title="Mon poids" />

      {/* Saisie rapide */}
      <div className="px-6 pb-5 animate-fade-up">
        <div className="p-5 surface-card rounded-2xl">
          {/* Toggle Aujourd'hui / Autre date */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-lg mb-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <button
              onClick={() => { setDateMode('today'); setSelectedDate(today); }}
              className={`
                py-2 px-3 rounded-md text-xs font-display font-bold uppercase tracking-[0.08em] transition-all press-down
                ${dateMode === 'today'
                  ? 'text-white shadow-sm'
                  : 'text-text-tertiary hover:text-text-primary'
                }
              `}
              style={{
                background: dateMode === 'today' ? 'linear-gradient(135deg, #FFAA33 0%, #FF4D00 100%)' : 'transparent',
              }}
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => setDateMode('other')}
              className={`
                py-2 px-3 rounded-md text-xs font-display font-bold uppercase tracking-[0.08em] transition-all press-down
                ${dateMode === 'other'
                  ? 'text-white shadow-sm'
                  : 'text-text-tertiary hover:text-text-primary'
                }
              `}
              style={{
                background: dateMode === 'other' ? 'linear-gradient(135deg, #FFAA33 0%, #FF4D00 100%)' : 'transparent',
              }}
            >
              Autre date
            </button>
          </div>

          {dateMode === 'other' && (
            <div className="mb-3 animate-fade-in">
              <input
                type="date"
                value={selectedDate}
                max={today}
                min="2020-01-01"
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-subtle rounded-xl font-mono text-sm text-text-primary focus:outline-none focus:border-heat-orange [color-scheme:dark]"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              />
            </div>
          )}

          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-tertiary mb-3 text-center font-bold">
            {selectedWeight
              ? (isSelectedToday ? 'Modifier la pesée du jour' : 'Modifier cette pesée')
              : (isSelectedToday ? 'Je me pèse aujourd\'hui' : 'Ajouter une pesée')
            }
          </div>
          <div className="flex items-baseline justify-center gap-2 mb-5">
            <input
              type="number"
              inputMode="decimal"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="0,0"
              step="0.1"
              min="20"
              max="300"
              className="w-44 bg-transparent border-none outline-none text-center font-display font-extrabold text-6xl leading-none text-heat-gradient tabular"
              style={{ letterSpacing: '-0.03em' }}
            />
            <span className="font-display font-bold text-xl text-text-secondary">kg</span>
          </div>
          <Button
            fullWidth
            size="lg"
            onClick={handleSave}
            disabled={saving || !inputValue || isNaN(Number(inputValue.replace(',', '.')))}
          >
            {saving ? 'Enregistrement...' : selectedWeight ? 'Mettre à jour' : 'Enregistrer'}
          </Button>
          {selectedWeight && isSelectedToday && (
            <div className="text-center mt-3 font-mono text-[10px] text-text-tertiary tracking-wider uppercase">
              Tu es déjà pesé aujourd'hui
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 pb-5 animate-fade-up" style={{ animationDelay: '80ms', animationFillMode: 'backwards' }}>
        <div className="grid grid-cols-4 gap-3 p-5 surface-card rounded-2xl">
          <Stat
            label="Actuel"
            value={currentWeight != null ? formatNumber(currentWeight, { decimals: 1 }) : '—'}
            unit="kg"
            tone="heat"
          />
          <Stat
            label="7 j"
            value={fmtDelta(deltaWeek)}
            unit="kg"
            tone={deltaWeek == null ? 'default' : (deltaWeek <= 0 ? 'success' : 'danger')}
          />
          <Stat
            label="Total"
            value={fmtDelta(deltaTotal)}
            unit="kg"
            tone={deltaTotal == null ? 'default' : (deltaTotal <= 0 ? 'success' : 'danger')}
          />
          <Stat
            label="Reste"
            value={toGo != null ? formatNumber(Math.abs(toGo), { decimals: 1 }) : '—'}
            unit="kg"
          />
        </div>
      </div>

      {/* Courbe */}
      <div className="px-6 pb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="font-display font-bold text-[13px] uppercase tracking-[0.12em] text-text-secondary">
            Évolution
          </div>
          <div className="font-mono text-[10px] text-text-tertiary tracking-wider">
            {weights.length} PESÉES
          </div>
        </div>
        <div className="p-4 bg-bg-surface1 border border-subtle rounded-2xl">
          <WeightLineChart weights={weights} target={targetWeight} />
          {weights.length >= 2 && (
            <div className="flex items-center gap-4 justify-center mt-3 pt-3 border-t border-subtle">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-heat-amber border border-bg-base" />
                <span className="font-mono text-[9px] tracking-wider uppercase text-text-tertiary">Pesée</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-[2.5px] bg-gradient-to-r from-heat-amber to-heat-orange rounded" />
                <span className="font-mono text-[9px] tracking-wider uppercase text-text-tertiary">Moy. 7 j</span>
              </div>
              {targetWeight != null && (
                <div className="flex items-center gap-1.5">
                  <div className="w-5 border-t border-dashed border-success" />
                  <span className="font-mono text-[9px] tracking-wider uppercase text-text-tertiary">Objectif</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Projection (Phase 3) */}
      <div className="px-6 pb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="font-display font-bold text-[13px] uppercase tracking-[0.12em] text-text-secondary">
            Projection
          </div>
        </div>
        <WeightProjection
          weights={weights}
          targetKg={targetWeight}
          theoreticalWeekLoss={SCENARIOS[profile.scenario]?.kg_par_semaine}
        />
      </div>

      {/* Historique */}
      <div className="px-6 pb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="font-display font-bold text-[13px] uppercase tracking-[0.12em] text-text-secondary">
            Historique
          </div>
          <div className="font-mono text-[10px] text-text-tertiary tracking-wider">
            {weights.length}
          </div>
        </div>
        <div className="p-4 bg-bg-surface1 border border-subtle rounded-2xl">
          {weights.length === 0 ? (
            <div className="text-center py-6 text-text-tertiary text-sm">
              Tu n'as pas encore enregistré de pesée.
            </div>
          ) : (
            [...weights].reverse().map(w => (
              <WeightEntry key={w.id} w={w} onDelete={handleDelete} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
