import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { seedExercisesIfEmpty, ensureBonusExercises } from '../../lib/exerciseSeeder';
import { buildCoachContext } from '../../utils/coachContext';

// ─── Constantes ───────────────────────────────────────────────────────────────

const PPL_PLAN = {
  push: [
    { fr: 'Développé couché haltères', en: 'dumbbell bench press', muscle: 'Pectoraux', secondary: 'Triceps · Épaules' },
    { fr: 'Incliné haltères',          en: 'incline dumbbell press', muscle: 'Pectoraux haut', secondary: 'Triceps · Épaules' },
    { fr: 'Élévations latérales',      en: 'lateral raise', muscle: 'Épaules latérales', secondary: 'Trapèzes' },
    { fr: 'Développé militaire',       en: 'overhead press', muscle: 'Épaules', secondary: 'Triceps · Trapèzes' },
    { fr: 'Dips',                      en: 'dips', muscle: 'Triceps', secondary: 'Pectoraux · Épaules' },
    { fr: 'Triceps câble',             en: 'cable pushdown', muscle: 'Triceps', secondary: '' },
  ],
  pull: [
    { fr: 'Tirage vertical (pulley)',  en: 'lat pulldown', muscle: 'Grand dorsal', secondary: 'Biceps · Épaules' },
    { fr: 'Rowing barre',              en: 'barbell row', muscle: 'Dos moyen', secondary: 'Biceps · Trapèzes' },
    { fr: 'Tirage horizontal',         en: 'seated cable row', muscle: 'Dos moyen', secondary: 'Biceps · Rhomboïdes' },
    { fr: 'Face pulls',                en: 'face pull', muscle: 'Épaules arrière', secondary: 'Trapèzes · Rhomboïdes' },
    { fr: 'Curl biceps barre',         en: 'barbell curl', muscle: 'Biceps', secondary: 'Avant-bras' },
    { fr: 'Shrugs',                    en: 'barbell shrug', muscle: 'Trapèzes', secondary: '' },
  ],
  legs: [
    { fr: 'Squat',                     en: 'barbell squat', muscle: 'Quadriceps', secondary: 'Fessiers · Ischio' },
    { fr: 'Presse',                    en: 'leg press', muscle: 'Quadriceps', secondary: 'Fessiers · Ischio' },
    { fr: 'Fentes bulgares',           en: 'bulgarian split squat', muscle: 'Quadriceps', secondary: 'Fessiers · Ischio' },
    { fr: 'Hip thrust',                en: 'barbell hip thrust', muscle: 'Fessiers', secondary: 'Ischio' },
    { fr: 'Leg curl',                  en: 'leg curl', muscle: 'Ischio-jambiers', secondary: '' },
    { fr: 'Mollets',                   en: 'standing calf raise', muscle: 'Mollets', secondary: '' },
    { fr: 'Abducteurs',                en: 'hip abduction', muscle: 'Abducteurs', secondary: 'Fessiers' },
  ],
};

const TYPE_LABELS = { push: 'Push', pull: 'Pull', legs: 'Legs' };
const REST_DURATION = 90; // secondes

// Exercices bonus optionnels (section séparée, toujours accessibles)
const PPL_BONUS = {
  push: [
    { fr: 'Écartés haltères',   en: 'dumbbell fly',      muscle: 'Pectoraux',             secondary: 'Amplitude maximale' },
    { fr: 'Arnold press',       en: 'arnold press',       muscle: 'Épaules complètes',     secondary: '' },
    { fr: 'Skull crushers',     en: 'skull crusher',      muscle: 'Triceps long',          secondary: '' },
    { fr: 'Cable crossover',    en: 'cable crossover',    muscle: 'Pectoraux',             secondary: 'Finition' },
  ],
  pull: [
    { fr: 'Tractions',          en: 'pull up',            muscle: 'Grand dorsal',          secondary: 'Biceps' },
    { fr: 'Rowing T-bar',       en: 't-bar row',          muscle: 'Épaisseur dos',         secondary: '' },
    { fr: 'Curl marteau',       en: 'hammer curl',        muscle: 'Brachial',              secondary: 'Avant-bras' },
    { fr: 'Reverse fly',        en: 'reverse fly dumbbell', muscle: 'Deltoïdes postérieurs', secondary: '' },
    { fr: 'Curl pupitre',       en: 'preacher curl',      muscle: 'Biceps',                secondary: 'Isolation' },
  ],
  legs: [
    { fr: 'Romanian deadlift',  en: 'romanian deadlift',  muscle: 'Ischio-jambiers',       secondary: 'Fessiers' },
    { fr: 'Hack squat',         en: 'hack squat',         muscle: 'Quadriceps',            secondary: '' },
    { fr: 'Leg extension',      en: 'leg extension',      muscle: 'Quadriceps',            secondary: 'Isolation' },
    { fr: 'Glute kickback câble', en: 'cable glute kickback', muscle: 'Fessiers',          secondary: 'Isolation' },
    { fr: 'Step-ups',           en: 'dumbbell step up',   muscle: 'Jambes',                secondary: 'Fonctionnel' },
  ],
};

// Paliers poids : 0, 2.5, 5 … 200 kg (81 valeurs)
const WEIGHT_OPTIONS = Array.from({ length: 81 }, (_, i) => +(i * 2.5).toFixed(1));
// Reps : 1 … 30
const REPS_OPTIONS = Array.from({ length: 30 }, (_, i) => i + 1);

// Snap vers l'option la plus proche dans une liste
function snapToOption(rawVal, options) {
  const n = parseFloat(rawVal);
  if (isNaN(n) || rawVal === '') return '';
  return options.reduce((best, opt) =>
    Math.abs(opt - n) < Math.abs(best - n) ? opt : best
  ).toString();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function vibrateShort() {
  try { navigator.vibrate?.(200); } catch {}
}
function vibrateDone() {
  try { navigator.vibrate?.([100, 50, 100, 50, 300]); } catch {}
}

// ─── Composants UI ────────────────────────────────────────────────────────────

const INPUT_CLS = 'flex-1 bg-bg-surface1 border border-subtle rounded-xl px-2 py-2.5 font-mono text-[14px] text-text-primary placeholder-text-muted focus:border-heat-orange/60 focus:outline-none disabled:opacity-50 text-center transition-colors min-w-0';

/**
 * SetInput — <select> natif sur mobile (picker iOS/Android), <input number> sur desktop.
 * La valeur est toujours transmise comme string pour rester compatible avec updateSet.
 */
function SetInput({ value, onChange, kind, disabled, placeholder }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const options = kind === 'weight' ? WEIGHT_OPTIONS : REPS_OPTIONS;

  if (isMobile) {
    const selectVal = snapToOption(value, options);
    return (
      <select
        value={selectVal}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        className={INPUT_CLS}
        style={{ textAlignLast: 'center' }}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt} value={String(opt)}>
            {kind === 'weight' ? `${opt} kg` : opt}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type="number"
      inputMode={kind === 'weight' ? 'decimal' : 'numeric'}
      placeholder={placeholder}
      value={value}
      disabled={disabled}
      step={kind === 'weight' ? 2.5 : 1}
      min={kind === 'weight' ? 0 : 1}
      max={kind === 'weight' ? 200 : 30}
      onChange={e => onChange(e.target.value)}
      className={INPUT_CLS}
    />
  );
}

function TopBar({ left, title, right }) {
  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-subtle">
      <div className="w-20">{left}</div>
      <div className="font-display font-bold text-[13px] uppercase tracking-[0.12em] text-text-primary text-center flex-1">
        {title}
      </div>
      <div className="w-20 flex justify-end">{right}</div>
    </div>
  );
}

function RestTimer({ seconds, onDone }) {
  const [remaining, setRemaining] = useState(seconds);
  const rafRef = useRef(null);
  const endRef = useRef(Date.now() + seconds * 1000);

  useEffect(() => {
    const tick = () => {
      const left = Math.max(0, Math.ceil((endRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) { vibrateDone(); onDone(); return; }
      rafRef.current = setTimeout(tick, 200);
    };
    rafRef.current = setTimeout(tick, 200);
    return () => clearTimeout(rafRef.current);
  }, []);

  const pct = 1 - remaining / seconds;
  const r = 28;
  const circ = 2 * Math.PI * r;

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-heat-orange/10 border border-heat-orange/25">
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,77,0,0.15)" strokeWidth="4" />
        <circle
          cx="32" cy="32" r={r} fill="none"
          stroke="#FF4D00" strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          transform="rotate(-90 32 32)"
          style={{ transition: 'stroke-dashoffset 0.2s linear' }}
        />
        <text x="32" y="37" textAnchor="middle" fontSize="14" fontFamily="ui-monospace,monospace" fill="#FF4D00" fontWeight="bold">
          {remaining}s
        </text>
      </svg>
      <div>
        <div className="font-display font-bold text-[13px] text-heat-orange uppercase tracking-wide">Repos</div>
        <div className="font-mono text-[10px] text-text-tertiary mt-0.5">Prépare la prochaine série</div>
      </div>
      <button
        onClick={onDone}
        className="ml-auto font-display font-bold text-[11px] uppercase tracking-wider text-text-tertiary hover:text-text-primary transition-colors"
      >
        Skip
      </button>
    </div>
  );
}

function PRBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-heat-orange/15 border border-heat-orange/30 font-display font-bold text-[10px] text-heat-orange uppercase tracking-wide">
      PR 🔥
    </span>
  );
}

// ─── Vue : sélection de type ──────────────────────────────────────────────────

function TypeSelectView({ onSelect }) {
  return (
    <div className="flex-1 flex flex-col px-6 py-8 gap-4">
      <div className="font-display font-bold text-[11px] uppercase tracking-[0.14em] text-text-tertiary mb-2">
        Type de séance
      </div>
      {Object.entries(TYPE_LABELS).map(([key, label]) => {
        const muscles = {
          push: 'Pectoraux · Épaules · Triceps',
          pull: 'Dos · Biceps · Trapèzes',
          legs: 'Quadriceps · Fessiers · Ischio',
        }[key];
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className="w-full rounded-2xl border border-subtle bg-bg-surface1 p-5 text-left hover:border-heat-orange/40 hover:bg-heat-orange/5 transition-all"
          >
            <div className="font-display font-bold text-2xl uppercase tracking-wide text-text-primary mb-1">
              {label}
            </div>
            <div className="font-mono text-[11px] text-text-tertiary tracking-wide">{muscles}</div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Vue : liste des exercices ────────────────────────────────────────────────

function ExerciseRow({ ex, sessionSets, completedExercises, lastSessionData, exerciseMeta, onSelectExercise, bonus = false }) {
  const sets = sessionSets[ex.fr] || [];
  const done = completedExercises.has(ex.fr);
  const meta = exerciseMeta[ex.fr];
  const setCount = sets.length;

  return (
    <button
      onClick={() => onSelectExercise(ex)}
      className={`w-full flex items-center gap-4 px-6 py-4 border-b border-subtle text-left hover:bg-bg-surface1 transition-colors ${done ? 'opacity-60' : ''}`}
    >
      <div className="w-12 h-12 rounded-xl overflow-hidden bg-bg-surface2 flex items-center justify-center shrink-0">
        {meta?.gif_cached_url || meta?.gif_url ? (
          <img src={meta.gif_cached_url || meta.gif_url} alt={ex.fr} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-body font-semibold text-[14px] text-text-primary truncate">{ex.fr}</span>
          {bonus && !done && setCount === 0 && (
            <span className="shrink-0 font-mono text-[8px] uppercase tracking-wider text-heat-orange border border-heat-orange/30 rounded px-1 py-px">bonus</span>
          )}
        </div>
        <div className="font-mono text-[10px] text-text-tertiary mt-0.5">
          {ex.muscle}{ex.secondary ? ` · ${ex.secondary}` : ''}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        {done && <span className="font-mono text-[10px] text-success">{setCount} séries ✓</span>}
        {!done && setCount > 0 && <span className="font-mono text-[10px] text-heat-amber">{setCount} série{setCount > 1 ? 's' : ''}</span>}
        {lastSessionData[ex.fr]?.length > 0 && (
          <span className="font-mono text-[9px] text-text-muted">Dernier : {lastSessionData[ex.fr][0].weight_kg}kg</span>
        )}
      </div>
    </button>
  );
}

function ExerciseListView({ type, sessionSets, exerciseMeta, completedExercises, lastSessionData, onSelectExercise, onFinish }) {
  const exercises = PPL_PLAN[type];
  const bonusExercises = PPL_BONUS[type] || [];
  const [showBonus, setShowBonus] = useState(false);

  // Ouvre la section bonus automatiquement si un bonus a déjà des séries
  const hasBonusActivity = bonusExercises.some(ex => (sessionSets[ex.fr] || []).length > 0 || completedExercises.has(ex.fr));

  const rowProps = { sessionSets, completedExercises, lastSessionData, exerciseMeta, onSelectExercise };

  return (
    <div className="flex-1 overflow-y-auto pb-28">
      <div className="px-6 pt-5 pb-3">
        <div className="font-display font-bold text-[11px] uppercase tracking-[0.14em] text-text-tertiary">
          {exercises.length} exercices · {TYPE_LABELS[type]}
        </div>
      </div>

      {exercises.map(ex => <ExerciseRow key={ex.fr} ex={ex} {...rowProps} />)}

      {/* Section exercices bonus */}
      <button
        onClick={() => setShowBonus(v => !v)}
        className="w-full flex items-center justify-between px-6 py-3.5 border-b border-t border-subtle bg-bg-surface1 hover:bg-bg-surface2 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-[11px] uppercase tracking-[0.14em] text-text-tertiary">
            Exercices bonus
          </span>
          {hasBonusActivity && (
            <span className="w-1.5 h-1.5 rounded-full bg-heat-orange" />
          )}
          <span className="font-mono text-[10px] text-text-muted">{bonusExercises.length}</span>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`text-text-tertiary transition-transform duration-200 ${(showBonus || hasBonusActivity) ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {(showBonus || hasBonusActivity) && bonusExercises.map(ex => (
        <ExerciseRow key={ex.fr} ex={ex} {...rowProps} bonus />
      ))}

      {/* Bouton fin de séance */}
      <div className="fixed bottom-8 left-0 right-0 px-6">
        <button
          onClick={onFinish}
          className="w-full py-4 rounded-2xl bg-heat-orange font-display font-bold text-[14px] uppercase tracking-wide text-white hover:bg-[#EA580C] transition-colors shadow-lg"
        >
          Terminer la séance
        </button>
      </div>
    </div>
  );
}

// ─── Vue : exercice actif ─────────────────────────────────────────────────────

function ActiveExerciseView({ exercise, sessionId, userId, prMap, lastSessionData, onBack, onSetSaved }) {
  const lastSets = lastSessionData[exercise.fr] || [];

  // Générer les sets initiaux : 3 rangées pré-remplies avec la dernière séance
  const makeInitialSets = () => [
    { weight: lastSets[0]?.weight_kg?.toString() || '', reps: lastSets[0]?.reps?.toString() || '', saved: false },
    { weight: lastSets[1]?.weight_kg?.toString() || '', reps: lastSets[1]?.reps?.toString() || '', saved: false },
    { weight: lastSets[2]?.weight_kg?.toString() || '', reps: lastSets[2]?.reps?.toString() || '', saved: false },
  ];

  const [sets, setSets] = useState(makeInitialSets);
  const [resting, setResting] = useState(false);
  const [savingIdx, setSavingIdx] = useState(null);

  const updateSet = (idx, field, val) => {
    setSets(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s));
  };

  const addSet = () => {
    const lastSaved = [...sets].reverse().find(s => s.saved);
    setSets(prev => [...prev, {
      weight: lastSaved?.weight || '',
      reps: lastSaved?.reps || '',
      saved: false,
    }]);
  };

  const confirmSet = async (idx) => {
    const s = sets[idx];
    if (!s.weight && !s.reps) return;
    setSavingIdx(idx);

    const weight = parseFloat(s.weight) || 0;
    const reps = parseInt(s.reps) || 0;
    const currentPR = prMap[exercise.fr] || 0;
    const isPR = weight > 0 && weight > currentPR;

    await supabase.from('workout_sets').insert({
      session_id: sessionId,
      user_id: userId,
      exercise_name: exercise.fr,
      set_number: idx + 1,
      reps,
      weight_kg: weight,
      is_pr: isPR,
    });

    if (isPR) {
      // Mettre à jour le prMap en temps réel
      onSetSaved(exercise.fr, weight, isPR);
    } else {
      onSetSaved(exercise.fr, weight, false);
    }

    setSets(prev => prev.map((set, i) => i === idx ? { ...set, saved: true, is_pr: isPR } : set));
    setSavingIdx(null);
    vibrateShort();
    setResting(true);
  };

  const savedCount = sets.filter(s => s.saved).length;

  return (
    <div className="flex-1 overflow-y-auto pb-10">
      {/* Header exercice */}
      <div className="px-6 pt-5 pb-5 border-b border-subtle">
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-heat-orange mb-1">
          {exercise.muscle}
        </div>
        <div className="font-display font-bold text-2xl text-text-primary leading-tight mb-1">
          {exercise.fr}
        </div>
        {exercise.secondary && (
          <div className="font-mono text-[10px] text-text-tertiary">{exercise.secondary}</div>
        )}
      </div>

      {/* Timer repos */}
      {resting && (
        <div className="px-6 py-4">
          <RestTimer seconds={REST_DURATION} onDone={() => setResting(false)} />
        </div>
      )}

      {/* Séries */}
      <div className="px-6 pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-display font-bold text-[11px] uppercase tracking-[0.14em] text-text-tertiary">
            Séries
          </div>
          {savedCount > 0 && (
            <div className="font-mono text-[10px] text-success">{savedCount} validées</div>
          )}
        </div>

        {sets.map((set, idx) => (
          <div key={idx} className={`flex items-center gap-2 mb-2.5 ${set.saved ? 'opacity-60' : ''}`}>
            <div className="font-mono text-[11px] text-text-muted w-5 text-center">{idx + 1}</div>

            <SetInput
              kind="weight"
              value={set.weight}
              disabled={set.saved}
              placeholder="kg"
              onChange={val => updateSet(idx, 'weight', val)}
            />

            <span className="font-mono text-[11px] text-text-tertiary shrink-0">×</span>

            <SetInput
              kind="reps"
              value={set.reps}
              disabled={set.saved}
              placeholder="reps"
              onChange={val => updateSet(idx, 'reps', val)}
            />

            {set.saved ? (
              <div className="w-10 flex justify-center">
                {set.is_pr ? <PRBadge /> : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00E676" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            ) : (
              <button
                onClick={() => confirmSet(idx)}
                disabled={savingIdx === idx || (!set.weight && !set.reps)}
                className="w-10 h-10 rounded-xl bg-heat-orange/10 border border-heat-orange/30 flex items-center justify-center hover:bg-heat-orange/20 disabled:opacity-30 transition-colors"
              >
                {savingIdx === idx ? (
                  <div className="w-4 h-4 border-2 border-heat-orange/50 border-t-heat-orange rounded-full animate-spin" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF4D00" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            )}
          </div>
        ))}

        <button
          onClick={addSet}
          className="w-full mt-2 py-2.5 rounded-xl border border-dashed border-subtle text-text-tertiary font-display font-bold text-[11px] uppercase tracking-wider hover:border-heat-orange/40 hover:text-heat-orange transition-colors"
        >
          + Série
        </button>
      </div>

      {/* Dernière séance */}
      {lastSets.length > 0 && (
        <div className="mx-6 mt-5 p-4 rounded-2xl bg-bg-surface1 border border-subtle">
          <div className="font-display font-bold text-[10px] uppercase tracking-[0.14em] text-text-tertiary mb-2">
            Dernière fois
          </div>
          <div className="flex flex-wrap gap-1.5">
            {lastSets.map((s, i) => (
              <span key={i} className="font-mono text-[11px] text-text-secondary">
                {s.weight_kg}kg×{s.reps}{i < lastSets.length - 1 ? ' ·' : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bouton terminer cet exercice */}
      {savedCount > 0 && (
        <div className="px-6 mt-6">
          <button
            onClick={onBack}
            className="w-full py-3.5 rounded-2xl bg-bg-surface1 border border-subtle font-display font-bold text-[13px] uppercase tracking-wide text-text-secondary hover:border-heat-orange/40 hover:text-heat-orange transition-colors"
          >
            Exercice suivant →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Vue : résumé de fin ──────────────────────────────────────────────────────

function CoachSheet({ onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div
        className="w-full rounded-t-3xl border-t border-subtle px-6 pt-5 pb-10"
        style={{ background: '#0A0908', maxHeight: '75vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <div className="font-display font-bold text-[12px] uppercase tracking-[0.12em] text-heat-orange">Coach IA</div>
          </div>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SummaryView({ type, sessionId, userId, duration, savedSets, prMap, onClose }) {
  const [lastWeekVolume, setLastWeekVolume] = useState(null);
  const [copied, setCopied] = useState(false);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachResponse, setCoachResponse] = useState(null);
  const [showCoachSheet, setShowCoachSheet] = useState(false);

  // Calcul du volume total de cette séance
  const totalVolume = Object.values(savedSets).flat().reduce((sum, s) => {
    return sum + (s.weight_kg || 0) * (s.reps || 0);
  }, 0);

  // PRs de cette séance
  const prs = Object.values(savedSets).flat().filter(s => s.is_pr);

  useEffect(() => {
    // Volume de la dernière séance du même type
    (async () => {
      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('id')
        .eq('user_id', savedSets._userId)
        .eq('type', type)
        .neq('id', sessionId)
        .order('date', { ascending: false })
        .limit(1);

      if (!sessions?.[0]) return;
      const { data: sets } = await supabase
        .from('workout_sets')
        .select('weight_kg, reps')
        .eq('session_id', sessions[0].id);

      const vol = (sets || []).reduce((s, r) => s + (r.weight_kg || 0) * (r.reps || 0), 0);
      setLastWeekVolume(Math.round(vol));
    })();
  }, []);

  const formatDuration = (ms) => {
    const min = Math.round(ms / 60000);
    return `${min} min`;
  };

  const handleCopy = async () => {
    const { exportWorkoutSummary } = await import('../../utils/exportWorkout');
    const json = await exportWorkoutSummary(sessionId);
    try {
      await navigator.clipboard.writeText(JSON.stringify(json, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleCoachAnalysis = async () => {
    setShowCoachSheet(true);
    if (coachResponse) return; // déjà récupéré
    setCoachLoading(true);
    try {
      const { exportWorkoutSummary } = await import('../../utils/exportWorkout');
      const [summary, ctx] = await Promise.all([
        exportWorkoutSummary(sessionId),
        buildCoachContext(userId),
      ]);
      const { data, error } = await supabase.functions.invoke('jamra-coach', {
        body: { type: 'workout', payload: summary, userContext: ctx },
      });
      setCoachResponse(error ? 'Erreur de connexion au coach.' : (data?.message ?? 'Pas de réponse.'));
    } catch (e) {
      setCoachResponse('Erreur : ' + e.message);
    }
    setCoachLoading(false);
  };

  const diff = lastWeekVolume != null ? Math.round(totalVolume) - lastWeekVolume : null;

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      {/* Badge type */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-heat-orange/10 border border-heat-orange/25 mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF4D00" strokeWidth="2" strokeLinecap="round">
            <path d="M6.5 6.5h11M6.5 6.5v11M6.5 6.5L17.5 17.5" />
            <circle cx="6.5" cy="6.5" r="2" fill="#FF4D00" />
            <circle cx="17.5" cy="17.5" r="2" fill="#FF4D00" />
          </svg>
        </div>
        <div className="font-display font-bold text-2xl text-text-primary">
          Séance {TYPE_LABELS[type]}
        </div>
        <div className="font-mono text-[11px] text-text-tertiary mt-1 tracking-wider">
          {formatDuration(duration)}
        </div>
      </div>

      {/* Stats */}
      <div className="rounded-2xl border border-subtle bg-bg-surface1 p-5 mb-4">
        <div className="flex justify-around">
          <div className="text-center">
            <div className="font-display font-bold text-2xl text-heat-orange">
              {Math.round(totalVolume).toLocaleString('fr-FR')}
            </div>
            <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-text-tertiary mt-1">Kg volume</div>
          </div>
          {diff != null && (
            <>
              <div className="w-px bg-subtle" />
              <div className="text-center">
                <div className={`font-display font-bold text-2xl ${diff >= 0 ? 'text-success' : 'text-danger'}`}>
                  {diff >= 0 ? `+${diff}` : diff}
                </div>
                <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-text-tertiary mt-1">vs dernière fois</div>
              </div>
            </>
          )}
          <div className="w-px bg-subtle" />
          <div className="text-center">
            <div className="font-display font-bold text-2xl text-heat-amber">
              {Object.keys(savedSets).filter(k => k !== '_userId').length}
            </div>
            <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-text-tertiary mt-1">Exercices</div>
          </div>
        </div>
      </div>

      {/* PRs */}
      {prs.length > 0 && (
        <div className="rounded-2xl border border-heat-orange/25 bg-heat-orange/5 p-4 mb-4">
          <div className="font-display font-bold text-[11px] uppercase tracking-[0.14em] text-heat-orange mb-3">
            🔥 Records personnels
          </div>
          {prs.map((pr, i) => (
            <div key={i} className="font-mono text-[12px] text-text-primary">
              {pr.exercise_name} — {pr.weight_kg}kg × {pr.reps} reps
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-2 mb-3">
        <button
          onClick={handleCopy}
          className="flex-1 py-3 rounded-xl border border-subtle font-display font-bold text-[11px] uppercase tracking-wider text-text-secondary hover:border-heat-orange/40 hover:text-heat-orange transition-colors"
        >
          {copied ? '✓ Copié' : '📋 JSON'}
        </button>
        <button
          onClick={handleCoachAnalysis}
          className="flex-1 py-3 rounded-xl bg-heat-orange/10 border border-heat-orange/30 font-display font-bold text-[11px] uppercase tracking-wider text-heat-orange hover:bg-heat-orange/20 transition-colors"
        >
          🤖 Analyse IA →
        </button>
      </div>
      <button
        onClick={onClose}
        className="w-full py-3.5 rounded-xl bg-heat-orange font-display font-bold text-[13px] uppercase tracking-wider text-white hover:bg-[#EA580C] transition-colors"
      >
        Fermer
      </button>

      {/* Bottom sheet réponse coach */}
      {showCoachSheet && (
        <CoachSheet onClose={() => setShowCoachSheet(false)}>
          {coachLoading ? (
            <div className="flex items-center gap-3 py-6">
              <div className="w-5 h-5 border-2 border-heat-orange/50 border-t-heat-orange rounded-full animate-spin shrink-0" />
              <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-text-tertiary">Analyse en cours...</div>
            </div>
          ) : (
            <div className="font-body text-[14px] text-text-primary leading-relaxed whitespace-pre-wrap">
              {coachResponse}
            </div>
          )}
        </CoachSheet>
      )}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function SessionWorkout({ onClose, onCreated, initialType = null }) {
  const [view, setView] = useState('type_select'); // type_select | exercise_list | exercise_active | summary
  const [sessionType, setSessionType] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [sessionStart, setSessionStart] = useState(null);
  const [userId, setUserId] = useState(null);
  const [activeExercise, setActiveExercise] = useState(null);
  const [completedExercises, setCompletedExercises] = useState(new Set());
  const [savedSets, setSavedSets] = useState({});
  const [prMap, setPrMap] = useState({});
  const [lastSessionData, setLastSessionData] = useState({});
  const [exerciseMeta, setExerciseMeta] = useState({});

  // Initialisation user + seed exercises
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.id) setUserId(user.id);
    });
    seedExercisesIfEmpty();
    ensureBonusExercises(); // upsert bonus même si seed initial déjà fait
  }, []);

  // Démarrage automatique si initialType fourni (attend que userId soit prêt)
  const initialTypeLaunchedRef = useRef(false);
  useEffect(() => {
    if (initialType && userId && PPL_PLAN[initialType] && !initialTypeLaunchedRef.current) {
      initialTypeLaunchedRef.current = true;
      startSession(initialType);
    }
  }, [userId, initialType]);

  // Charge les metadata exercices (GIFs etc.) depuis la table exercises
  useEffect(() => {
    supabase.from('exercises').select('name_fr, gif_url, gif_cached_url, muscle_target').then(({ data }) => {
      if (!data) return;
      const map = {};
      data.forEach(e => { map[e.name_fr] = e; });
      setExerciseMeta(map);
    });
  }, []);

  const startSession = async (type) => {
    if (!userId) return;
    const today = new Date().toISOString().slice(0, 10);
    const { data: session } = await supabase
      .from('workout_sessions')
      .insert({ user_id: userId, date: today, type })
      .select()
      .single();

    if (!session) return;

    setSessionId(session.id);
    setSessionStart(Date.now());
    setSessionType(type);

    // Charge PRs historiques (plan principal + bonus)
    const exerciseNames = [
      ...PPL_PLAN[type].map(e => e.fr),
      ...(PPL_BONUS[type] || []).map(e => e.fr),
    ];
    const { data: history } = await supabase
      .from('workout_sets')
      .select('exercise_name, weight_kg')
      .eq('user_id', userId)
      .in('exercise_name', exerciseNames);

    const prs = {};
    (history || []).forEach(r => {
      if ((r.weight_kg || 0) > (prs[r.exercise_name] || 0)) {
        prs[r.exercise_name] = r.weight_kg;
      }
    });
    setPrMap(prs);

    // Charge la dernière séance du même type pour pré-remplissage
    const { data: lastSessions } = await supabase
      .from('workout_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('type', type)
      .neq('id', session.id)
      .order('date', { ascending: false })
      .limit(1);

    if (lastSessions?.[0]) {
      const { data: lastSets } = await supabase
        .from('workout_sets')
        .select('exercise_name, weight_kg, reps, set_number')
        .eq('session_id', lastSessions[0].id)
        .order('set_number');

      const grouped = {};
      (lastSets || []).forEach(s => {
        if (!grouped[s.exercise_name]) grouped[s.exercise_name] = [];
        grouped[s.exercise_name].push(s);
      });
      setLastSessionData(grouped);
    }

    setView('exercise_list');
  };

  const handleSetSaved = useCallback((exerciseName, weight, isPR) => {
    if (isPR) {
      setPrMap(prev => ({ ...prev, [exerciseName]: weight }));
    }
    // Mise à jour du cache savedSets (pour le résumé)
    supabase
      .from('workout_sets')
      .select('exercise_name, weight_kg, reps, is_pr')
      .eq('session_id', sessionId)
      .then(({ data }) => {
        const grouped = {};
        (data || []).forEach(s => {
          if (!grouped[s.exercise_name]) grouped[s.exercise_name] = [];
          grouped[s.exercise_name].push(s);
        });
        grouped._userId = userId;
        setSavedSets(grouped);
      });
  }, [sessionId, userId]);

  const handleExerciseDone = (exerciseName) => {
    setCompletedExercises(prev => new Set([...prev, exerciseName]));
    setView('exercise_list');
    setActiveExercise(null);
  };

  const handleFinishSession = async () => {
    if (sessionId && sessionStart) {
      const durationMin = Math.round((Date.now() - sessionStart) / 60000);
      await supabase.from('workout_sessions').update({ duration_min: durationMin }).eq('id', sessionId);
    }
    // Reload final savedSets
    const { data } = await supabase
      .from('workout_sets')
      .select('exercise_name, weight_kg, reps, is_pr')
      .eq('session_id', sessionId);
    const grouped = { _userId: userId };
    (data || []).forEach(s => {
      if (!grouped[s.exercise_name]) grouped[s.exercise_name] = [];
      grouped[s.exercise_name].push(s);
    });
    setSavedSets(grouped);
    setView('summary');
  };

  const handleSummaryClose = () => {
    onCreated(userId);
    onClose();
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  const title = {
    type_select: 'Nouvelle séance',
    exercise_list: TYPE_LABELS[sessionType] || 'Séance',
    exercise_active: activeExercise?.fr || 'Exercice',
    summary: 'Résumé',
  }[view];

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#0A0908' }}>
      <TopBar
        left={
          view === 'exercise_active' ? (
            <button onClick={() => handleExerciseDone(activeExercise?.fr)} className="text-text-tertiary hover:text-text-primary transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          ) : view !== 'summary' ? (
            <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ) : null
        }
        title={title}
        right={
          view === 'exercise_list' && sessionStart ? (
            <span className="font-mono text-[11px] text-text-tertiary">
              {Math.round((Date.now() - sessionStart) / 60000)} min
            </span>
          ) : null
        }
      />

      {view === 'type_select' && <TypeSelectView onSelect={startSession} />}

      {view === 'exercise_list' && (
        <ExerciseListView
          type={sessionType}
          sessionSets={savedSets}
          exerciseMeta={exerciseMeta}
          completedExercises={completedExercises}
          lastSessionData={lastSessionData}
          onSelectExercise={(ex) => { setActiveExercise(ex); setView('exercise_active'); }}
          onFinish={handleFinishSession}
        />
      )}

      {view === 'exercise_active' && activeExercise && (
        <ActiveExerciseView
          exercise={activeExercise}
          sessionId={sessionId}
          userId={userId}
          prMap={prMap}
          lastSessionData={lastSessionData}
          onBack={() => handleExerciseDone(activeExercise.fr)}
          onSetSaved={handleSetSaved}
        />
      )}

      {view === 'summary' && (
        <SummaryView
          type={sessionType}
          sessionId={sessionId}
          userId={userId}
          duration={Date.now() - sessionStart}
          savedSets={savedSets}
          prMap={prMap}
          onClose={handleSummaryClose}
        />
      )}
    </div>
  );
}
