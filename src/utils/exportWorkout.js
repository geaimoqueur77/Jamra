import { supabase } from '../lib/supabase';

/**
 * Génère un bilan JSON structuré d'une séance, prêt pour le module coaching.
 * Peut être copié dans le clipboard ou envoyé à l'API Anthropic (session suivante).
 */
export async function exportWorkoutSummary(sessionId) {
  const [{ data: session }, { data: sets }] = await Promise.all([
    supabase.from('workout_sessions').select('*').eq('id', sessionId).single(),
    supabase
      .from('workout_sets')
      .select('exercise_name, set_number, weight_kg, reps, is_pr, created_at')
      .eq('session_id', sessionId)
      .order('exercise_name')
      .order('set_number'),
  ]);

  if (!session) return null;

  // Grouper les sets par exercice
  const byExercise = {};
  for (const s of sets || []) {
    if (!byExercise[s.exercise_name]) byExercise[s.exercise_name] = [];
    byExercise[s.exercise_name].push(s);
  }

  const exercises = Object.entries(byExercise).map(([name, exSets]) => {
    const volumeKg = exSets.reduce((sum, s) => sum + (s.weight_kg || 0) * (s.reps || 0), 0);
    const bestSet = exSets.reduce((best, s) => {
      const v = (s.weight_kg || 0) * (s.reps || 0);
      return v > (best.weight_kg || 0) * (best.reps || 0) ? s : best;
    }, exSets[0]);

    return {
      name,
      sets: exSets.map(s => ({
        set: s.set_number,
        kg: s.weight_kg,
        reps: s.reps,
        is_pr: s.is_pr,
      })),
      volume_kg: Math.round(volumeKg),
      best_set: bestSet ? `${bestSet.weight_kg}kg × ${bestSet.reps}` : null,
    };
  });

  const totalVolumeKg = exercises.reduce((sum, e) => sum + e.volume_kg, 0);
  const prs = (sets || [])
    .filter(s => s.is_pr)
    .map(s => `${s.exercise_name} — ${s.weight_kg}kg × ${s.reps}`);

  return {
    date: session.date,
    type: session.type,
    duration_min: session.duration_min,
    exercises,
    total_volume_kg: totalVolumeKg,
    prs,
    notes: session.notes || '',
  };
}
