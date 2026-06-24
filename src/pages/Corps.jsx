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

function MeasurementForm({ onSaved }) {
  const today = todayISO();
  const [form, setForm] = useState({ weight_kg: '', waist_cm: '', arm_cm: '', chest_cm: '', thigh_cm: '', notes: '' });
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
      notes: form.notes || null,
    };
    await supabase.from('body_measurements').upsert(payload, { onConflict: 'user_id,date' });
    if (form.weight_kg) await addOrUpdateWeight({ date: today, poids_kg: parseFloat(form.weight_kg) });
    setSaving(false);
    onSaved(payload.weight_kg);
  };

  const fields = [
    { key: 'weight_kg', label: 'Poids', unit: 'kg', inputMode: 'decimal' },
    { key: 'waist_cm', label: 'Tour de taille', unit: 'cm', inputMode: 'decimal' },
    { key: 'arm_cm', label: 'Bras (bicep)', unit: 'cm', inputMode: 'decimal' },
    { key: 'chest_cm', label: 'Poitrine', unit: 'cm', inputMode: 'decimal' },
    { key: 'thigh_cm', label: 'Cuisse', unit: 'cm', inputMode: 'decimal' },
  ];

  return (
    <div className="rounded-2xl border border-subtle bg-bg-surface1 p-5 mb-5">
      <div className="font-display font-bold text-[12px] uppercase tracking-[0.14em] text-text-tertiary mb-4">
        Mesures du jour
      </div>
      <div className="flex flex-col gap-3">
        {fields.map(({ key, label, unit, inputMode }) => (
          <div key={key} className="flex items-center gap-3">
            <div className="flex-1 font-body text-[13px] text-text-secondary">{label}</div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                inputMode={inputMode}
                placeholder="—"
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                className="w-20 bg-bg-surface2 border border-subtle rounded-lg px-3 py-2 font-mono text-[13px] text-text-primary placeholder-text-muted focus:border-heat-orange/60 focus:outline-none text-right transition-colors"
              />
              <span className="font-mono text-[10px] text-text-tertiary w-5">{unit}</span>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={handleSave}
        disabled={!form.weight_kg || saving}
        className="mt-4 w-full py-3 rounded-xl bg-heat-orange font-display font-bold text-[13px] uppercase tracking-wide text-white disabled:opacity-40 transition-opacity"
      >
        {saving ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    </div>
  );
}

export default function Corps() {
  const weights = useLiveQuery(getAllWeights) || [];
  const latestWeight = useLiveQuery(getLatestWeight);
  const profile = useLiveQuery(getProfile);
  const [measurements, setMeasurements] = useState([]);
  const [showForm, setShowForm] = useState(false);
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
    <div>
      <Header variant="greeting" eyebrow="SUIVI" title="Corps" />

      {/* Snapshot actuel */}
      <div className="px-6 py-5">
        <div className="rounded-2xl border border-subtle bg-bg-surface1 p-5">
          <div className="font-display font-bold text-[11px] uppercase tracking-[0.14em] text-text-tertiary mb-4">
            Maintenant
          </div>
          <div className="flex justify-around">
            <StatBox
              label="Poids"
              value={latestWeight?.poids_kg}
              unit="kg"
              highlight
            />
            {profile?.poids_cible_kg && (
              <StatBox
                label="Objectif"
                value={profile.poids_cible_kg}
                unit="kg"
              />
            )}
            {trend && (
              <StatBox
                label={trend.slopePerWeek < 0 ? 'Tendance' : 'Tendance'}
                value={trend.slopePerWeek < 0 ? trend.slopePerWeek : `+${trend.slopePerWeek}`}
                unit="kg/sem"
              />
            )}
          </div>
          {latestMeasure && (
            <div className="mt-4 pt-4 border-t border-subtle grid grid-cols-4 gap-2">
              {[
                { v: latestMeasure.waist_cm, l: 'Taille', u: 'cm' },
                { v: latestMeasure.arm_cm,   l: 'Bras',   u: 'cm' },
                { v: latestMeasure.chest_cm, l: 'Poitrine', u: 'cm' },
                { v: latestMeasure.thigh_cm, l: 'Cuisse', u: 'cm' },
              ].map(({ v, l, u }) => (
                <div key={l} className="text-center">
                  <div className="font-mono text-[13px] font-bold text-text-primary">
                    {v ?? '—'}<span className="text-[9px] text-text-tertiary"> {u}</span>
                  </div>
                  <div className="font-mono text-[9px] uppercase tracking-wider text-text-tertiary mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transformation corporelle */}
      <div className="px-6 pb-5">
        <BodyTransformSVG
          currentPhase={currentPhase}
          poidsDepart={profile?.poids_initial_kg}
          poidsCible={profile?.poids_cible_kg}
          poidsActuel={latestWeight?.poids_kg}
        />
      </div>

      {/* Graphique poids */}
      {weights.length >= 2 && (
        <div className="px-6 pb-5">
          <div className="font-display font-bold text-[13px] uppercase tracking-[0.12em] text-text-secondary mb-3">
            Évolution
          </div>
          <div className="rounded-2xl border border-subtle bg-bg-surface1 p-4">
            <WeightLineChart weights={weights} targetKg={profile?.poids_cible_kg} trend={trend} />
          </div>
        </div>
      )}

      {/* Bouton mesures + formulaire */}
      <div className="px-6 pb-32">
        {showForm ? (
          <MeasurementForm onSaved={handleSaved} />
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-3.5 rounded-xl border border-dashed border-strong text-text-secondary hover:border-heat-orange hover:text-heat-orange font-display font-bold text-[12px] uppercase tracking-wider transition-colors mb-5"
          >
            + Saisir les mesures du jour
          </button>
        )}

        {/* Historique mesures */}
        {measurements.length > 0 && (
          <>
            <div className="font-display font-bold text-[13px] uppercase tracking-[0.12em] text-text-secondary mb-3">
              Historique
            </div>
            {measurements.slice(0, 10).map(m => {
              const d = new Date(m.date + 'T12:00:00');
              const dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
              return (
                <div key={m.id} className="flex items-center justify-between py-3 border-b border-subtle">
                  <div className="font-mono text-[11px] text-text-tertiary">{dateStr}</div>
                  <div className="flex gap-4">
                    {m.weight_kg && (
                      <span className="font-mono text-[12px] text-text-primary font-bold">{m.weight_kg} kg</span>
                    )}
                    {m.waist_cm && (
                      <span className="font-mono text-[11px] text-text-secondary">↔ {m.waist_cm}</span>
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
  );
}
