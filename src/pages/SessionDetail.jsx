import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, updateSession, deleteSession, toggleSessionCompleted, getProfile } from '../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import { estimateSessionKcal } from '../utils/trainingPlanner';
import { formatDateLong, formatNumber, dateFromISO } from '../utils/format';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';

const TYPE_CONFIG = {
  course:   { emoji: '🏃', label: 'Course', color: 'text-heat-orange' },
  muscu:    { emoji: '💪', label: 'Musculation', color: 'text-heat-amber' },
  repos:    { emoji: '🛌', label: 'Repos', color: 'text-text-tertiary' },
  autre:    { emoji: '⚡', label: 'Autre', color: 'text-success' },
};

const INTENSITE_LABELS = {
  faible: 'Faible',
  moderee: 'Modérée',
  soutenue: 'Soutenue',
  intense: 'Intense',
};

export default function SessionDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const profile = useLiveQuery(getProfile);
  const session = useLiveQuery(() => db.training_sessions.get(Number(id)), [id]);

  const [dureeReelle, setDureeReelle] = useState('');
  const [notes, setNotes] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session) {
      setDureeReelle(session.duree_reelle_min != null ? String(session.duree_reelle_min) : '');
      setNotes(session.notes || '');
    }
  }, [session]);

  if (!session) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-text-tertiary font-mono text-sm">
        Chargement...
      </div>
    );
  }

  const config = TYPE_CONFIG[session.type] || TYPE_CONFIG.autre;
  const dt = dateFromISO(session.date);
  const duree = session.duree_reelle_min || session.duree_prevue_min;
  const kcalEstimees = estimateSessionKcal({
    type: session.type,
    sous_type: session.sous_type,
    duree_min: duree,
    poids_kg: profile?.poids_actuel_kg,
  });

  const handleToggle = async () => {
    await toggleSessionCompleted(session.id);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const duree = dureeReelle === '' ? null : Number(dureeReelle);
      await updateSession(session.id, {
        duree_reelle_min: isNaN(duree) ? null : duree,
        notes: notes.trim() || null,
      });
      navigate(-1);
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await deleteSession(session.id);
    navigate('/entrainement', { replace: true });
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <Header variant="title" title="Séance" onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto px-6 py-4 pb-6">
        {/* Hero */}
        <div className="text-center mb-6 animate-fade-up">
          <div className="text-5xl mb-3">{config.emoji}</div>
          <div className={`font-mono text-[10px] tracking-[0.2em] uppercase ${config.color} mb-1.5 font-bold`}>
            {config.label}
          </div>
          <div className="font-display font-bold text-xl uppercase tracking-[0.02em] text-text-primary px-2" style={{ letterSpacing: '-0.01em' }}>
            {session.titre}
          </div>
          <div className="font-mono text-[10px] text-text-tertiary tracking-wider mt-2">
            {formatDateLong(dt)}
          </div>
        </div>

        {/* Description */}
        {session.description && (
          <div className="mb-5 p-4 surface-card rounded-2xl animate-fade-up" style={{ animationDelay: '60ms', animationFillMode: 'backwards' }}>
            <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-text-tertiary mb-2 font-bold">
              Description
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">{session.description}</p>
          </div>
        )}

        {/* Paramètres grid */}
        <div className="mb-5 grid grid-cols-2 gap-3 stagger-1">
          {session.duree_prevue_min != null && (
            <div className="p-4 surface-card rounded-2xl animate-fade-up" style={{ animationFillMode: 'backwards' }}>
              <div className="font-mono text-[9px] tracking-[0.15em] uppercase text-text-tertiary font-bold">
                Durée prévue
              </div>
              <div className="font-display font-bold text-2xl text-text-primary mt-2 leading-none tabular" style={{ letterSpacing: '-0.02em' }}>
                {session.duree_prevue_min}
                <span className="font-mono text-xs text-text-tertiary ml-1.5 font-normal">min</span>
              </div>
            </div>
          )}
          {session.intensite && (
            <div className="p-4 surface-card rounded-2xl animate-fade-up" style={{ animationFillMode: 'backwards' }}>
              <div className="font-mono text-[9px] tracking-[0.15em] uppercase text-text-tertiary font-bold">
                Intensité
              </div>
              <div className="font-display font-bold text-2xl text-heat-amber mt-2 leading-none" style={{ letterSpacing: '-0.02em' }}>
                {INTENSITE_LABELS[session.intensite] || session.intensite}
              </div>
            </div>
          )}
          {kcalEstimees > 0 && (
            <div className="p-4 surface-featured rounded-2xl col-span-2 animate-fade-up" style={{ animationFillMode: 'backwards' }}>
              <div className="font-mono text-[9px] tracking-[0.15em] uppercase text-heat-amber font-bold">
                Kcal estimées
              </div>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="font-display font-bold text-3xl text-heat-gradient leading-none tabular" style={{ letterSpacing: '-0.02em' }}>
                  {formatNumber(kcalEstimees)}
                </span>
                <span className="font-mono text-xs text-text-tertiary font-normal">kcal</span>
              </div>
              <div className="font-mono text-[10px] text-text-tertiary tracking-wide mt-1.5">
                METs × poids × durée
              </div>
            </div>
          )}
        </div>

        {/* Toggle complété */}
        {session.type !== 'repos' && (
          <button
            onClick={handleToggle}
            className={`
              w-full py-4 mb-5 rounded-2xl transition-all flex items-center justify-center gap-3 press-down
              ${session.completed
                ? 'border border-success text-success'
                : 'text-text-secondary hover:border-heat-orange hover:text-heat-orange'
              }
            `}
            style={{
              background: session.completed ? 'rgba(0, 230, 118, 0.08)' : 'transparent',
              border: session.completed ? '1px solid #00E676' : '1px dashed rgba(255, 255, 255, 0.15)',
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{
                background: session.completed ? '#00E676' : 'transparent',
                border: session.completed ? 'none' : '2px solid currentColor',
              }}
            >
              {session.completed && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <span className="font-display font-bold text-sm uppercase tracking-[0.06em]">
              {session.completed ? 'Séance complétée' : 'Marquer comme faite'}
            </span>
          </button>
        )}

        {/* Durée réelle + notes */}
        {session.type !== 'repos' && (
          <>
            <div className="mb-4">
              <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-text-tertiary mb-1.5 block">
                Durée réelle (optionnel)
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={dureeReelle}
                onChange={(e) => setDureeReelle(e.target.value)}
                placeholder={`ex : ${session.duree_prevue_min || 45}`}
                className="w-full px-4 py-3 bg-bg-surface1 border border-subtle rounded-xl font-mono text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-heat-orange"
              />
            </div>

            <div className="mb-6">
              <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-text-tertiary mb-1.5 block">
                Notes (optionnel)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ressenti, météo, allures, charges..."
                rows={3}
                className="w-full px-4 py-3 bg-bg-surface1 border border-subtle rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-heat-orange resize-none"
              />
            </div>
          </>
        )}

        {/* Suppression */}
        <div className="mt-6 pt-6 border-t border-subtle">
          {!showDelete ? (
            <button
              onClick={() => setShowDelete(true)}
              className="w-full py-3 rounded-xl border border-subtle text-danger text-sm font-display font-bold uppercase tracking-[0.1em] hover:bg-[rgba(255,23,68,0.05)] transition-all"
            >
              Supprimer cette séance
            </button>
          ) : (
            <div className="p-4 rounded-xl border border-danger bg-[rgba(255,23,68,0.05)]">
              <p className="text-sm text-text-primary mb-3">
                Supprimer cette séance ? L'action est irréversible.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" fullWidth onClick={() => setShowDelete(false)}>
                  Annuler
                </Button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2 rounded-xl bg-danger text-white font-display font-bold text-xs uppercase tracking-[0.1em]"
                >
                  Supprimer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      {session.type !== 'repos' && (
        <div className="px-6 py-5 border-t border-subtle safe-pb">
          <Button fullWidth size="lg" onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      )}
    </div>
  );
}
