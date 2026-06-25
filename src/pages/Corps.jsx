import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getAllWeights, getLatestWeight, addOrUpdateWeight, getProfile, todayISO } from '../db/database';
import { supabase } from '../lib/supabase';
import Header from '../components/layout/Header';
import { projectWeightTrend, computePhase } from '../utils/calculations';
import WeightLineChart from '../components/charts/WeightLineChart';
import { useAchievements } from '../hooks/useAchievements';
import { AchievementToastLayer } from '../components/AchievementToast';
import BodyTransformSVG from '../components/BodyTransformSVG';
import TransformTimeline from '../components/TransformTimeline';
import { useAvatarCustomization } from '../hooks/useAvatarCustomization';

function StatBox({ label, value, unit, highlight }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className={`font-display font-bold text-xl ${highlight ? 'text-heat-orange' : 'text-text-primary'}`}>
        {value ?? '—'}<span className="font-mono text-[11px] text-text-tertiary ml-0.5">{unit}</span>
      </div>
      <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-text-tertiary">{label}</div>
    </div>
  );
}

function MeasurementFormSheet({ onSaved, onClose }) {
  const today = todayISO();
  const [form, setForm] = useState({ weight_kg: '', waist_cm: '', arm_cm: '', chest_cm: '', thigh_cm: '' });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.weight_kg) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      user_id: user.id,
      date: today,
      weight_kg: parseFloat(form.weight_kg) || null,
      waist_cm: parseFloat(form.waist_cm) || null,
      arm_cm: parseFloat(form.arm_cm) || null,
      chest_cm: parseFloat(form.chest_cm) || null,
      thigh_cm: parseFloat(form.thigh_cm) || null,
    };
    await supabase.from('body_measurements').upsert(payload, { onConflict: 'user_id,date' });
    if (form.weight_kg) await addOrUpdateWeight({ date: today, poids_kg: parseFloat(form.weight_kg) });
    setSaving(false);
    onSaved(payload.weight_kg);
  };

  const fields = [
    { key: 'weight_kg', label: 'Poids', unit: 'kg' },
    { key: 'waist_cm', label: 'Tour de taille', unit: 'cm' },
    { key: 'arm_cm', label: 'Bras', unit: 'cm' },
    { key: 'chest_cm', label: 'Poitrine', unit: 'cm' },
    { key: 'thigh_cm', label: 'Cuisse', unit: 'cm' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div
        className="w-full max-w-2xl mx-auto rounded-t-3xl border-t border-white/10 pb-10 pt-6 px-6"
        style={{ background: '#0A0908', transition: 'transform 300ms cubic-bezier(0.32,0.72,0,1)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-6" />
        <div className="font-display font-bold text-lg text-text-primary mb-5">Mesures du jour</div>
        <div className="flex flex-col gap-4 mb-6">
          {fields.map(({ key, label, unit }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="font-body text-[14px] text-text-secondary">{label}</div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="—"
                  value={form[key]}
                  onChange={e => set(key, e.target.value)}
                  className="w-20 bg-bg-surface2 border border-white/10 rounded-xl px-3 py-2.5 font-mono text-[14px] text-text-primary placeholder-text-muted focus:border-heat-orange/60 focus:outline-none text-right transition-colors"
                />
                <span className="font-mono text-[11px] text-text-tertiary w-6">{unit}</span>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={handleSave}
          disabled={!form.weight_kg || saving}
          className="w-full py-4 rounded-2xl bg-heat-orange font-display font-bold text-[14px] uppercase tracking-wider text-white disabled:opacity-40 active:scale-[0.98] transition-all"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}

export default function Corps() {
  const weights = useLiveQuery(getAllWeights) || [];
  const latestWeight = useLiveQuery(getLatestWeight);
  const profile = useLiveQuery(getProfile);
  const [measurements, setMeasurements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const { customization: avatarCustomization } = useAvatarCustomization();
  const { checkMinus5kg, checkPhase1, recentUnlocks } = useAchievements();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('body_measurements')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(20);
      setMeasurements(data || []);
    })();
  }, []);

  const trend = weights.length >= 2 ? projectWeightTrend(weights, profile?.poids_cible_kg) : null;
  const currentPhase = computePhase(latestWeight?.poids_kg);

  const latestMeasure = measurements[0];

  const handleSaved = async (newWeightKg) => {
    setShowForm(false);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(20);
    setMeasurements(data || []);
    if (newWeightKg && profile) {
      await checkMinus5kg(user.id, profile.poids_initial_kg, newWeightKg);
      await checkPhase1(user.id, newWeightKg);
    }
  };

  return (
    <>
    <div>
      <Header variant="greeting" eyebrow="SUIVI" title="Corps" />

      {/* Snapshot actuel — grille 2×2 */}
      <div className="px-4 py-4">
        <div className="rounded-[20px] border border-white/5 bg-bg-surface1 p-5">
          <div className="font-display font-bold text-[11px] uppercase tracking-[0.14em] text-text-tertiary mb-4">
            Maintenant
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-xl bg-bg-surface2">
              <div className="font-display font-bold text-2xl text-heat-orange">
                {latestWeight?.poids_kg ?? '—'}<span className="font-mono text-[12px] text-text-tertiary ml-1">kg</span>
              </div>
              <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-text-tertiary mt-1">Poids actuel</div>
            </div>
            {profile?.poids_cible_kg ? (
              <div className="text-center p-3 rounded-xl bg-bg-surface2">
                <div className="font-display font-bold text-2xl text-text-primary">
                  {profile.poids_cible_kg}<span className="font-mono text-[12px] text-text-tertiary ml-1">kg</span>
                </div>
                <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-text-tertiary mt-1">Objectif</div>
              </div>
            ) : (
              <div className="text-center p-3 rounded-xl bg-bg-surface2">
                <div className="font-display font-bold text-2xl text-text-primary">
                  {trend ? (
                    <span className={trend.slopePerWeek < 0 ? 'text-success' : 'text-heat-amber'}>
                      {trend.slopePerWeek < 0 ? trend.slopePerWeek : `+${trend.slopePerWeek}`}
                    </span>
                  ) : '—'}<span className="font-mono text-[12px] text-text-tertiary ml-1">kg/sem</span>
                </div>
                <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-text-tertiary mt-1">Tendance</div>
              </div>
            )}
            {latestMeasure?.waist_cm && (
              <div className="text-center p-3 rounded-xl bg-bg-surface2">
                <div className="font-display font-bold text-2xl text-text-primary">
                  {latestMeasure.waist_cm}<span className="font-mono text-[12px] text-text-tertiary ml-1">cm</span>
                </div>
                <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-text-tertiary mt-1">Tour taille</div>
              </div>
            )}
            {latestMeasure?.arm_cm && (
              <div className="text-center p-3 rounded-xl bg-bg-surface2">
                <div className="font-display font-bold text-2xl text-text-primary">
                  {latestMeasure.arm_cm}<span className="font-mono text-[12px] text-text-tertiary ml-1">cm</span>
                </div>
                <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-text-tertiary mt-1">Bras</div>
              </div>
            )}
          </div>
          {trend && profile?.poids_cible_kg && (
            <div className="mt-3 pt-3 border-t border-white/5 text-center">
              <span className={`font-display font-bold text-[13px] ${trend.slopePerWeek < 0 ? 'text-success' : 'text-heat-amber'}`}>
                {trend.slopePerWeek < 0 ? trend.slopePerWeek : `+${trend.slopePerWeek}`} kg/sem
              </span>
              <span className="font-mono text-[10px] text-text-tertiary ml-2">tendance</span>
            </div>
          )}
        </div>
      </div>

      {/* Transformation corporelle */}
      <div className="px-4 pb-4">
        <BodyTransformSVG
          currentPhase={currentPhase}
          poidsDepart={profile?.poids_initial_kg}
          poidsCible={profile?.poids_cible_kg}
          poidsActuel={latestWeight?.poids_kg}
        />
      </div>

      {/* Graphique poids */}
      {weights.length >= 2 && (
        <div className="px-4 pb-4">
          <div className="font-display font-bold text-[11px] uppercase tracking-[0.14em] text-text-tertiary mb-3">
            Évolution
          </div>
          <div className="rounded-[20px] border border-white/5 bg-bg-surface1 p-4">
            <WeightLineChart weights={weights} targetKg={profile?.poids_cible_kg} trend={trend} />
          </div>
        </div>
      )}

      {/* Timeline de transformation */}
      {weights.length >= 2 && (
        <TransformTimeline weights={weights} profile={profile} customization={avatarCustomization} />
      )}

      {/* Bouton mesures */}
      <div className="px-4 pb-32">
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-4 rounded-[20px] border border-dashed border-white/15 text-text-secondary hover:border-heat-orange hover:text-heat-orange font-display font-bold text-[12px] uppercase tracking-wider active:scale-[0.98] transition-all mb-5"
        >
          + Saisir les mesures du jour
        </button>

        {/* Historique mesures */}
        {measurements.length > 0 && (
          <>
            <div className="font-display font-bold text-[11px] uppercase tracking-[0.14em] text-text-tertiary mb-3">
              Historique mesures
            </div>
            {measurements.slice(0, 10).map(m => {
              const d = new Date(m.date + 'T12:00:00');
              const dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
              return (
                <div key={m.id} className="flex items-center justify-between py-3 border-b border-white/5">
                  <div className="font-mono text-[11px] text-text-tertiary">{dateStr}</div>
                  <div className="flex gap-4">
                    {m.weight_kg && (
                      <span className="font-mono text-[12px] text-text-primary font-bold">{m.weight_kg} kg</span>
                    )}
                    {m.waist_cm && (
                      <span className="font-mono text-[11px] text-text-secondary">↔ {m.waist_cm} cm</span>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
      <AchievementToastLayer unlocks={recentUnlocks} onDismiss={() => {}} />
    </div>
    {showForm && (
      <MeasurementFormSheet onSaved={handleSaved} onClose={() => setShowForm(false)} />
    )}
  </>
  );
}
