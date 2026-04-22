import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { getActiveTrainingPlan, saveTrainingPlan, deactivateTrainingPlan } from '../db/database';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';

const COURSE_OBJECTIFS = [
  { key: 'forme',     label: 'Remise en forme' },
  { key: 'endurance', label: 'Endurance générale' },
  { key: '10km',      label: 'Préparer un 10 km' },
  { key: 'semi',      label: 'Préparer un semi-marathon' },
  { key: 'marathon',  label: 'Préparer un marathon' },
];

const MUSCU_OBJECTIFS = [
  { key: 'tonification', label: 'Tonification' },
  { key: 'hypertrophie', label: 'Hypertrophie' },
  { key: 'force',        label: 'Force' },
  { key: 'maintien',     label: 'Maintien' },
];

function FreqPicker({ label, emoji, color, value, onChange, max = 7 }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{emoji}</span>
        <span className="font-display font-bold text-sm uppercase tracking-[0.06em] text-text-primary">
          {label}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[0, 1, 2, 3, 4, 5, 6, 7].map(n => {
          if (n > max) return null;
          const selected = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`
                py-3 rounded-lg text-center transition-all border
                ${selected
                  ? `border-${color} text-white font-bold bg-gradient-to-br from-heat-amber to-heat-orange`
                  : 'border-subtle bg-bg-surface1 text-text-secondary hover:border-strong'
                }
              `}
            >
              <div className="font-display font-bold text-lg">{n}</div>
              <div className="font-mono text-[9px] tracking-wider uppercase opacity-75">
                / sem
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ObjectifPicker({ label, options, value, onChange }) {
  return (
    <div className="mb-5">
      <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-text-tertiary mb-2">
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={`
              px-3 py-2 rounded-lg text-xs font-display font-bold uppercase tracking-wider transition-all border
              ${value === opt.key
                ? 'border-heat-orange text-heat-amber bg-[rgba(255,170,51,0.08)]'
                : 'border-subtle bg-bg-surface1 text-text-secondary hover:border-strong'
              }
            `}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function TrainingPlanEditor() {
  const navigate = useNavigate();
  const existing = useLiveQuery(getActiveTrainingPlan);

  const [form, setForm] = useState({
    nom: 'Mon programme',
    course_freq: 3,
    muscu_freq: 2,
    objectif_course: 'endurance',
    objectif_muscu: 'force',
  });
  const [saving, setSaving] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const isEdit = !!existing;

  useEffect(() => {
    if (existing) {
      setForm({
        nom: existing.nom || 'Mon programme',
        course_freq: existing.course_freq || 0,
        muscu_freq: existing.muscu_freq || 0,
        objectif_course: existing.objectif_course || 'endurance',
        objectif_muscu: existing.objectif_muscu || 'force',
      });
    }
  }, [existing]);

  const handleSave = async () => {
    if (saving) return;
    if (form.course_freq + form.muscu_freq === 0) {
      // User a mis 0 partout : bizarre mais on laisse
    }
    setSaving(true);
    try {
      await saveTrainingPlan({
        id: existing?.id,
        nom: form.nom.trim() || 'Mon programme',
        course_freq: form.course_freq,
        muscu_freq: form.muscu_freq,
        start_date: existing?.start_date,
        objectif_course: form.course_freq > 0 ? form.objectif_course : null,
        objectif_muscu: form.muscu_freq > 0 ? form.objectif_muscu : null,
      });
      navigate('/entrainement');
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!existing) return;
    await deactivateTrainingPlan(existing.id);
    navigate('/entrainement');
  };

  const totalSessions = form.course_freq + form.muscu_freq;

  return (
    <div className="min-h-dvh flex flex-col">
      <Header
        variant="title"
        title={isEdit ? 'Modifier le plan' : 'Nouveau plan'}
        onBack={() => navigate(-1)}
      />

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* Nom */}
        <div className="mb-5">
          <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-text-tertiary mb-1.5 block">
            Nom du programme
          </label>
          <input
            type="text"
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            placeholder="Mon programme"
            className="w-full px-4 py-3 bg-bg-surface1 border border-subtle rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-heat-orange transition-colors"
          />
        </div>

        {/* Course */}
        <FreqPicker
          label="Séances de course"
          emoji="🏃"
          color="heat-orange"
          value={form.course_freq}
          onChange={(v) => setForm({ ...form, course_freq: v })}
        />
        {form.course_freq > 0 && (
          <ObjectifPicker
            label="Objectif course"
            options={COURSE_OBJECTIFS}
            value={form.objectif_course}
            onChange={(v) => setForm({ ...form, objectif_course: v })}
          />
        )}

        {/* Muscu */}
        <FreqPicker
          label="Séances de muscu"
          emoji="💪"
          color="heat-amber"
          value={form.muscu_freq}
          onChange={(v) => setForm({ ...form, muscu_freq: v })}
          max={6}
        />
        {form.muscu_freq > 0 && (
          <ObjectifPicker
            label="Objectif muscu"
            options={MUSCU_OBJECTIFS}
            value={form.objectif_muscu}
            onChange={(v) => setForm({ ...form, objectif_muscu: v })}
          />
        )}

        {/* Récap */}
        <div className="p-4 rounded-xl bg-bg-surface1 border border-subtle mb-5">
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-text-tertiary mb-2">
            Ton volume
          </div>
          <div className="font-body text-sm text-text-primary">
            <span className="font-display font-bold text-xl text-heat-amber">{totalSessions}</span>
            {' '}séance{totalSessions > 1 ? 's' : ''} par semaine
            {totalSessions >= 6 && (
              <span className="block text-xs text-heat-orange mt-1">⚠️ Gros volume : assure-toi d'avoir un bon sommeil et une alimentation suffisante.</span>
            )}
            {totalSessions === 0 && (
              <span className="block text-xs text-text-tertiary mt-1">Tu peux mettre 0 partout et activer plus tard si tu veux juste tester.</span>
            )}
          </div>
        </div>

        {/* Zone désactivation (uniquement en edit) */}
        {isEdit && (
          <div className="mt-6 pt-6 border-t border-subtle">
            {!confirmDeactivate ? (
              <button
                onClick={() => setConfirmDeactivate(true)}
                className="w-full py-3 rounded-xl border border-subtle text-danger text-sm font-display font-bold uppercase tracking-[0.1em] hover:bg-[rgba(255,23,68,0.05)] transition-all"
              >
                Désactiver ce programme
              </button>
            ) : (
              <div className="p-4 rounded-xl border border-danger bg-[rgba(255,23,68,0.05)]">
                <p className="text-sm text-text-primary mb-3">
                  Désactiver le programme arrête la génération de séances. Tes séances passées sont conservées. Tu peux réactiver à tout moment.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" fullWidth onClick={() => setConfirmDeactivate(false)}>
                    Annuler
                  </Button>
                  <button
                    onClick={handleDeactivate}
                    className="flex-1 py-2 rounded-xl bg-danger text-white font-display font-bold text-xs uppercase tracking-[0.1em]"
                  >
                    Désactiver
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-6 py-5 border-t border-subtle safe-pb">
        <Button fullWidth size="lg" onClick={handleSave} disabled={saving}>
          {saving ? 'Enregistrement...' : (isEdit ? 'Enregistrer les modifications' : 'Créer le programme')}
        </Button>
      </div>
    </div>
  );
}
