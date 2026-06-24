import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';

// ─── Circuits ─────────────────────────────────────────────────────────────────

export const EXPRESS_CIRCUITS = {
  surf_plage: {
    key: 'surf_plage',
    label: 'Surf / Plage',
    icon: '🏄',
    description: '3 tours · 20 min · Aucun matériel',
    color: '#0EA5E9',
    exercises: [
      { name: 'Pompes',            target: '15 reps', muscle: 'Pectoraux' },
      { name: 'Squats sautés',     target: '20 reps', muscle: 'Quadriceps' },
      { name: 'Fentes alternées',  target: '12 / jambe', muscle: 'Fessiers' },
      { name: 'Gainage',           target: '45 s',    muscle: 'Core' },
      { name: 'Hip thrust au sol', target: '20 reps', muscle: 'Fessiers' },
    ],
  },
  hotel: {
    key: 'hotel',
    label: 'Hôtel',
    icon: '🏨',
    description: '3 tours · 20 min · Chaise + lit',
    color: '#8B5CF6',
    exercises: [
      { name: 'Pompes',                        target: '15 reps',    muscle: 'Pectoraux' },
      { name: 'Squats sautés',                 target: '20 reps',    muscle: 'Quadriceps' },
      { name: 'Fentes alternées',              target: '12 / jambe', muscle: 'Fessiers' },
      { name: 'Gainage',                       target: '45 s',       muscle: 'Core' },
      { name: 'Hip thrust au sol',             target: '20 reps',    muscle: 'Fessiers' },
      { name: 'Dips sur chaise',               target: '12 reps',    muscle: 'Triceps' },
      { name: 'Fentes bulgares (pied sur lit)', target: '10 / jambe', muscle: 'Quadriceps' },
    ],
  },
};

const TOTAL_ROUNDS = 3;
const OFFLINE_KEY = 'jamra_express_sessions';

// ─── Offline storage ──────────────────────────────────────────────────────────

export function getOfflineSessions() {
  try { return JSON.parse(localStorage.getItem(OFFLINE_KEY) || '[]'); } catch { return []; }
}

function saveOfflineSession(session) {
  const all = getOfflineSessions();
  all.push(session);
  localStorage.setItem(OFFLINE_KEY, JSON.stringify(all));
}

export async function syncOfflineSessions(userId) {
  const sessions = getOfflineSessions();
  const unsynced = sessions.filter(s => !s.synced);
  if (!unsynced.length) return 0;

  let count = 0;
  for (const s of unsynced) {
    try {
      const { data: session } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: userId,
          date: s.date,
          type: `express_${s.circuit}`,
          duration_min: s.duration_min,
          notes: `Séance express : ${EXPRESS_CIRCUITS[s.circuit]?.label}`,
        })
        .select()
        .single();

      if (session) {
        const sets = s.exercises_completed.map((e, i) => ({
          session_id: session.id,
          user_id: userId,
          exercise_name: e.name,
          set_number: e.round,
          reps: e.reps_done ?? 0,
          weight_kg: 0,
          is_pr: false,
        }));
        if (sets.length) await supabase.from('workout_sets').insert(sets);
        s.synced = true;
        count++;
      }
    } catch { /* skip, retry next time */ }
  }

  localStorage.setItem(OFFLINE_KEY, JSON.stringify(sessions));
  return count;
}

// ─── Composants ───────────────────────────────────────────────────────────────

function TopBar({ title, onClose }) {
  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-subtle">
      <button onClick={onClose} className="text-text-tertiary hover:text-text-primary">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <div className="font-display font-bold text-[13px] uppercase tracking-[0.12em] text-text-primary">
        {title}
      </div>
      <div className="w-8" />
    </div>
  );
}

function CircuitTimer({ started }) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(started || Date.now());

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const min = Math.floor(elapsed / 60);
  const sec = elapsed % 60;
  return (
    <span className="font-mono text-[11px] text-text-tertiary">
      {String(min).padStart(2, '0')}:{String(sec).padStart(2, '0')}
    </span>
  );
}

// ─── Sélecteur de circuit ─────────────────────────────────────────────────────

function CircuitSelectView({ onSelect, onClose }) {
  return (
    <div className="flex-1 flex flex-col px-6 py-8 gap-4">
      <div className="font-display font-bold text-[11px] uppercase tracking-[0.14em] text-text-tertiary mb-2">
        Séance Express
      </div>
      {Object.values(EXPRESS_CIRCUITS).map(circuit => (
        <button
          key={circuit.key}
          onClick={() => onSelect(circuit.key)}
          className="w-full rounded-2xl border border-subtle bg-bg-surface1 p-5 text-left hover:border-heat-orange/40 hover:bg-heat-orange/5 transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{circuit.icon}</span>
            <div>
              <div className="font-display font-bold text-xl uppercase tracking-wide text-text-primary">
                {circuit.label}
              </div>
              <div className="font-mono text-[10px] text-text-tertiary tracking-wide">{circuit.description}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {circuit.exercises.map(ex => (
              <span key={ex.name} className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-bg-surface2 text-text-tertiary">
                {ex.name}
              </span>
            ))}
          </div>
        </button>
      ))}
      <div className="mt-2 rounded-xl border border-subtle p-3">
        <div className="font-mono text-[10px] text-text-tertiary">
          Mode hors-ligne — les séances express sont sauvegardées localement et synchronisées automatiquement au retour de connexion.
        </div>
      </div>
    </div>
  );
}

// ─── Vue active (rounds) ──────────────────────────────────────────────────────

function ActiveCircuitView({ circuit, startTime, onFinish }) {
  const exercises = EXPRESS_CIRCUITS[circuit].exercises;
  // checked[round][exerciseIndex] = true/false
  const [checked, setChecked] = useState(
    Array.from({ length: TOTAL_ROUNDS }, () => new Array(exercises.length).fill(false))
  );

  const toggle = (round, idx) => {
    setChecked(prev => {
      const next = prev.map(r => [...r]);
      next[round][idx] = !next[round][idx];
      return next;
    });
    try { navigator.vibrate?.(80); } catch {}
  };

  const completedRounds = checked.filter(round => round.every(Boolean)).length;
  const totalChecked = checked.flat().filter(Boolean).length;

  const buildCompleted = () => {
    const result = [];
    checked.forEach((round, ri) => {
      round.forEach((done, ei) => {
        if (done) result.push({ name: exercises[ei].name, round: ri + 1, reps_done: null });
      });
    });
    return result;
  };

  return (
    <div className="flex-1 overflow-y-auto pb-32">
      {/* Header stats */}
      <div className="flex items-center justify-between px-6 py-3 bg-bg-surface1 border-b border-subtle">
        <div className="flex items-center gap-2">
          <span className="text-xl">{EXPRESS_CIRCUITS[circuit].icon}</span>
          <div>
            <div className="font-display font-bold text-[12px] text-text-primary uppercase tracking-wide">
              {EXPRESS_CIRCUITS[circuit].label}
            </div>
            <div className="font-mono text-[9px] text-text-tertiary">
              {completedRounds}/{TOTAL_ROUNDS} tours · {totalChecked} exercices
            </div>
          </div>
        </div>
        <CircuitTimer started={startTime} />
      </div>

      {/* Rounds */}
      {Array.from({ length: TOTAL_ROUNDS }, (_, ri) => {
        const roundDone = checked[ri].every(Boolean);
        return (
          <div key={ri} className="px-6 pt-5">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-display font-bold text-[11px] ${roundDone ? 'bg-success text-white' : 'bg-bg-surface2 text-text-tertiary'}`}>
                {ri + 1}
              </div>
              <div className="font-display font-bold text-[11px] uppercase tracking-[0.12em] text-text-tertiary">
                Tour {ri + 1}
              </div>
              {roundDone && <span className="font-mono text-[10px] text-success">✓ Terminé</span>}
            </div>

            <div className="rounded-2xl border border-subtle bg-bg-surface1 overflow-hidden mb-1">
              {exercises.map((ex, ei) => (
                <button
                  key={ei}
                  onClick={() => toggle(ri, ei)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left border-b border-subtle last:border-b-0 transition-colors ${checked[ri][ei] ? 'bg-success/5' : 'hover:bg-bg-surface2'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${checked[ri][ei] ? 'bg-success border-success' : 'border-subtle'}`}>
                      {checked[ri][ei] && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className={`font-body font-semibold text-[13px] ${checked[ri][ei] ? 'text-text-tertiary line-through' : 'text-text-primary'}`}>
                        {ex.name}
                      </div>
                      <div className="font-mono text-[9px] text-text-tertiary">{ex.muscle}</div>
                    </div>
                  </div>
                  <div className="font-mono text-[11px] text-heat-amber font-bold">{ex.target}</div>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {/* Bouton Terminer */}
      <div className="fixed bottom-8 left-0 right-0 px-6">
        <button
          onClick={() => onFinish(buildCompleted())}
          className={`w-full py-4 rounded-2xl font-display font-bold text-[14px] uppercase tracking-wide text-white shadow-lg transition-colors ${completedRounds >= TOTAL_ROUNDS ? 'bg-heat-orange hover:bg-[#EA580C]' : 'bg-bg-surface2 text-text-tertiary'}`}
        >
          {completedRounds >= TOTAL_ROUNDS ? '🔥 Terminer la séance' : `Encore ${TOTAL_ROUNDS - completedRounds} tour${TOTAL_ROUNDS - completedRounds > 1 ? 's' : ''}...`}
        </button>
      </div>
    </div>
  );
}

// ─── Vue résumé express ───────────────────────────────────────────────────────

function ExpressSummaryView({ circuit, durationMs, exercisesCompleted, onClose }) {
  const [saved, setSaved] = useState(false);

  const durationMin = Math.round(durationMs / 60000);
  const totalExercises = exercisesCompleted.length;

  const handleSave = () => {
    const session = {
      id: `express_${Date.now()}`,
      circuit,
      date: new Date().toISOString().slice(0, 10),
      started_at: new Date(Date.now() - durationMs).toISOString(),
      duration_min: durationMin,
      rounds_completed: TOTAL_ROUNDS,
      exercises_completed: exercisesCompleted,
      synced: false,
    };
    saveOfflineSession(session);
    setSaved(true);
    try { navigator.vibrate?.([100, 50, 100, 50, 300]); } catch {}
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">{EXPRESS_CIRCUITS[circuit].icon}</div>
        <div className="font-display font-bold text-2xl text-text-primary mb-1">
          {EXPRESS_CIRCUITS[circuit].label}
        </div>
        <div className="font-mono text-[11px] text-text-tertiary tracking-wider">Séance terminée</div>
      </div>

      <div className="rounded-2xl border border-subtle bg-bg-surface1 p-5 mb-4">
        <div className="flex justify-around">
          <div className="text-center">
            <div className="font-display font-bold text-2xl text-heat-orange">{TOTAL_ROUNDS}</div>
            <div className="font-mono text-[9px] uppercase tracking-wider text-text-tertiary mt-1">Tours</div>
          </div>
          <div className="w-px bg-subtle" />
          <div className="text-center">
            <div className="font-display font-bold text-2xl text-heat-amber">{durationMin} min</div>
            <div className="font-mono text-[9px] uppercase tracking-wider text-text-tertiary mt-1">Durée</div>
          </div>
          <div className="w-px bg-subtle" />
          <div className="text-center">
            <div className="font-display font-bold text-2xl text-success">{totalExercises}</div>
            <div className="font-mono text-[9px] uppercase tracking-wider text-text-tertiary mt-1">Exercices</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-subtle p-3 mb-4">
        <div className="font-mono text-[10px] text-text-tertiary">
          {saved
            ? '✓ Sauvegardé hors-ligne — sera synchronisé automatiquement au retour de connexion.'
            : 'Sauvegarde locale (hors-ligne). Synchronisation automatique quand tu seras connecté.'}
        </div>
      </div>

      <div className="flex gap-3">
        {!saved && (
          <button
            onClick={handleSave}
            className="flex-1 py-3.5 rounded-xl bg-heat-orange/10 border border-heat-orange/30 font-display font-bold text-[12px] uppercase tracking-wider text-heat-orange hover:bg-heat-orange/20 transition-colors"
          >
            Enregistrer hors-ligne
          </button>
        )}
        <button
          onClick={onClose}
          className="flex-1 py-3.5 rounded-xl bg-heat-orange font-display font-bold text-[12px] uppercase tracking-wider text-white hover:bg-[#EA580C] transition-colors"
        >
          {saved ? 'Fermer' : 'Ignorer'}
        </button>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function ExpressWorkout({ onClose, onSaved }) {
  const [view, setView] = useState('select'); // select | active | summary
  const [circuit, setCircuit] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [exercisesCompleted, setExercisesCompleted] = useState([]);

  const handleSelectCircuit = (key) => {
    setCircuit(key);
    setStartTime(Date.now());
    setView('active');
  };

  const handleFinish = (completed) => {
    setExercisesCompleted(completed);
    setView('summary');
  };

  const title = { select: 'Séance Express', active: EXPRESS_CIRCUITS[circuit]?.label || 'Circuit', summary: 'Résumé' }[view];

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#0A0908' }}>
      <TopBar title={title} onClose={onClose} />

      {view === 'select' && <CircuitSelectView onSelect={handleSelectCircuit} onClose={onClose} />}
      {view === 'active' && circuit && (
        <ActiveCircuitView circuit={circuit} startTime={startTime} onFinish={handleFinish} />
      )}
      {view === 'summary' && (
        <ExpressSummaryView
          circuit={circuit}
          durationMs={Date.now() - startTime}
          exercisesCompleted={exercisesCompleted}
          onClose={() => { onClose(); onSaved?.(); }}
        />
      )}
    </div>
  );
}
