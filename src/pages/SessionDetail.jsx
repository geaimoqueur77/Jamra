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

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* Hero */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{config.emoji}</div>
          <div className={`font-mono text-[10px] tracking-[0.2em] uppercase ${config.color} mb-1`}>
            {config.label}
          </div>
          <div className="font-display font-bold text-xl uppercase tracking-[0.02em] text-text-primary px-2">
            {session.titre}
          </div>
          <div className="font-mono text-[10px] text-text-tertiary tracking-wider mt-2">
            {formatDateLong(dt)}
          </div>
        </div>

        {/* Description */}
        {session.description && (
          <div className="mb-5 p-4 bg-bg-surface1 border border-subtle rounded-xl">
            <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-text-tertiary mb-2">
              Description
            </div>
            <p className="text-sm text-text-secondary">{session.description}</p>
          </div>
        )}

        {/* Paramètres */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          {session.duree_prevue_min != null && (
            <div className="p-3 bg-bg-surface1 border border-subtle rounded-xl">
              <div className="font-mono text-[10px] tracking-wider uppercase text-text-tertiary">
                Durée prévue
              </div>
              <div className="font-display font-bold text-xl text-text-primary mt-1">
                {session.duree_prevue_min} <span className="font-mono text-xs text-text-tertiary">min</span>
              </div>
            </div>
          )}
          {session.intensite && (
            <div className="p-3 bg-bg-surface1 border border-subtle rounded-xl">
              <div className="font-mono text-[10px] tracking-wider uppercase text-text-tertiary">
                Intensité
              </div>
              <div className="font-display font-bold text-xl text-heat-amber mt-1">
                {INTENSITE_LABELS[session.intensite] || session.intensite}
              </div>
            </div>
          )}
          {kcalEstimees > 0 && (
            <div className="p-3 bg-bg-surface1 border border-subtle rounded-xl col-span-2">
              <div className="font-mono text-[10px] tracking-wider uppercase text-text-tertiary">
                Kcal estimées
              </div>
              <div className="font-display font-bold text-xl text-heat-gradient mt-1">
                {formatNumber(kcalEstimees)} kcal
              </div>
              <div className="font-mono text-[10px] text-text-tertiary tracking-wider mt-1">
                Calcul METs × poids × durée
              </div>
            </div>
          )}
        </div>

        {/* Toggle complété */}
        {session.type !== 'repos' && (
          <button
            onClick={handleToggle}
            className={`
              w-full py-4 mb-5 rounded-2xl border-2 transition-all flex items-center justify-center gap-3
              ${session.completed
                ? 'bg-[rgba(0,230,118,0.08)] border-success text-success'
                : 'border-subtle text-text-secondary hover:border-heat-orange hover:text-heat-orange'
              }
            `}
          >
            <div className={`
              w-8 h-8 rounded-full border-2 flex items-center justify-center
              ${session.completed ? 'bg-success border-success text-white' : 'border-current'}
            `}>
              {session.completed && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <span className="font-display font-bold text-sm uppercase tracking-[0.06em]">
              {session.completed ? 'Séance complétée ✓' : 'Marquer comme faite'}
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
