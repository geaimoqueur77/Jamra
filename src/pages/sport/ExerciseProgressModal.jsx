import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ExerciseProgressChart from '../../components/charts/ExerciseProgressChart';

export default function ExerciseProgressModal({ exerciseName, userId, onClose }) {
  const [data, setData] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    (async () => {
      // Charge les métadonnées (GIF, instructions) depuis exercises
      const { data: exMeta } = await supabase
        .from('exercises')
        .select('*')
        .eq('name_fr', exerciseName)
        .maybeSingle();
      setMeta(exMeta);

      // Charge la progression : max weight par séance
      const { data: sets } = await supabase
        .from('workout_sets')
        .select('weight_kg, workout_sessions(date)')
        .eq('user_id', userId)
        .eq('exercise_name', exerciseName)
        .not('weight_kg', 'is', null)
        .order('created_at');

      // Grouper par session
      const bySession = {};
      for (const s of sets || []) {
        const date = s.workout_sessions?.date;
        if (!date) continue;
        if (!bySession[date] || s.weight_kg > bySession[date]) {
          bySession[date] = s.weight_kg;
        }
      }

      const progression = Object.entries(bySession)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, max_weight]) => ({ date, max_weight, exercise: exerciseName }));

      setData(progression);
      setLoading(false);
    })();
  }, [exerciseName, userId]);

  const allTime = data?.length ? Math.max(...data.map(d => d.max_weight)) : null;
  const lastDate = data?.length ? data[data.length - 1].date : null;
  const lastDateStr = lastDate
    ? new Date(lastDate + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    : null;

  return (
    <div className="fixed inset-0 z-60 flex flex-col" style={{ background: '#0A0908' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-subtle">
        <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="font-display font-bold text-[13px] uppercase tracking-[0.12em] text-text-primary text-center flex-1">
          Progression
        </div>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto pb-10">
        {/* GIF ou placeholder */}
        <div className="flex justify-center pt-6 pb-4 px-6">
          {loading ? (
            <div className="w-[280px] h-[200px] rounded-2xl bg-bg-surface1 animate-pulse" />
          ) : meta?.gif_cached_url || meta?.gif_url ? (
            <img
              src={meta.gif_cached_url || meta.gif_url}
              alt={exerciseName}
              className="w-[280px] rounded-2xl object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-[280px] h-[160px] rounded-2xl bg-bg-surface1 border border-subtle flex items-center justify-center">
              <div className="font-mono text-[10px] uppercase tracking-wider text-text-muted">GIF bientôt disponible</div>
            </div>
          )}
        </div>

        {/* Infos exercice */}
        <div className="px-6 pb-4">
          {meta?.muscle_target && (
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-heat-orange mb-1">
              {meta.muscle_target}
              {meta.muscles_secondary?.length > 0 && ` · ${meta.muscles_secondary.join(' · ')}`}
            </div>
          )}
          <div className="font-display font-bold text-xl text-text-primary mb-1">{exerciseName}</div>
          {meta?.equipment && (
            <div className="font-mono text-[10px] text-text-tertiary">{meta.equipment}</div>
          )}
        </div>

        {/* Points clés d'exécution */}
        {meta?.cues_fr?.length > 0 && (
          <div className="px-6 mb-4">
            <div className="rounded-2xl bg-bg-surface1 border border-subtle p-4 space-y-2">
              {meta.cues_fr.map((cue, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-heat-orange shrink-0 mt-1.5" />
                  <span className="font-mono text-[12px] text-text-secondary leading-snug">{cue}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Record */}
        {allTime && (
          <div className="mx-6 mb-4 flex items-center gap-4 p-4 rounded-2xl bg-heat-orange/8 border border-heat-orange/20">
            <div>
              <div className="font-display font-bold text-2xl text-heat-orange">{allTime} kg</div>
              <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-text-tertiary mt-0.5">
                Record · {lastDateStr}
              </div>
            </div>
            <div className="ml-auto text-xl">🏆</div>
          </div>
        )}

        {/* Courbe progression */}
        {!loading && data?.length > 0 && (
          <div className="px-6 mb-5">
            <div className="font-display font-bold text-[11px] uppercase tracking-[0.14em] text-text-tertiary mb-3">
              Charge max par séance
            </div>
            <div className="rounded-2xl border border-subtle bg-bg-surface1 p-4">
              <ExerciseProgressChart data={data} />
            </div>
            <div className="flex justify-between mt-2">
              <div className="font-mono text-[9px] text-text-muted">{data.length} séances</div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {meta?.instructions?.length > 0 && (
          <div className="px-6">
            <button
              onClick={() => setShowInstructions(v => !v)}
              className="w-full flex items-center justify-between py-3 font-display font-bold text-[12px] uppercase tracking-[0.12em] text-text-secondary"
            >
              Comment faire
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${showInstructions ? 'rotate-180' : ''}`}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {showInstructions && (
              <div className="flex flex-col gap-2 pb-4">
                {meta.instructions.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="font-mono text-[10px] text-heat-orange mt-0.5 w-4 shrink-0">{i + 1}.</div>
                    <div className="font-body text-[13px] text-text-secondary leading-relaxed">{step}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
