import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { getProfile, resetAll, exportAll, toCSV } from '../db/database';
import { computeProfileMetrics, calculateBMI } from '../utils/calculations';
import { formatNumber, formatDateShort } from '../utils/format';
import { useAuth } from '../hooks/useAuth';
import useSync from '../hooks/useSync';
import Header from '../components/layout/Header';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Wordmark from '../components/ui/Wordmark';

/**
 * Profile — affichage du profil et paramètres
 * Phase 1.A : lecture seule + reset pour recommencer
 * Phase 1.C : édition complète
 */

function StatRow({ label, value, sub }) {
  return (
    <div className="flex justify-between items-baseline py-2.5 border-t border-subtle first:border-t-0">
      <div className="font-body text-sm text-text-secondary">{label}</div>
      <div className="text-right">
        <div className="font-mono font-semibold text-sm text-text-primary">{value}</div>
        {sub && <div className="font-mono text-[10px] text-text-tertiary">{sub}</div>}
      </div>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const profile = useLiveQuery(getProfile);
  const { user, signOut } = useAuth();
  const sync = useSync();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [exporting, setExporting] = useState(false);

  if (!profile) return null;

  const metrics = computeProfileMetrics(profile);
  const bmi = calculateBMI({ poids_kg: profile.poids_initial_kg, taille_cm: profile.taille_cm });

  const handleReset = async () => {
    await resetAll();
    navigate('/onboarding', { replace: true });
  };

  const handleLogout = async () => {
    try {
      await signOut();
      // Le AuthGuard redirige automatiquement vers /auth/login
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const todayTag = new Date().toISOString().slice(0, 10);

  const handleExportJSON = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const data = await exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      triggerDownload(blob, `jamra-export-${todayTag}.json`);
    } catch (e) {
      console.error(e);
    }
    setExporting(false);
  };

  const handleExportCSV = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const data = await exportAll();
      const parts = [];
      parts.push('# PROFIL\n' + toCSV(data.profil));
      parts.push('# ALIMENTS PERSONNELS\n' + toCSV(data.aliments_personnels));
      parts.push('# CONSOMMATIONS\n' + toCSV(data.consommations));
      parts.push('# PESÉES\n' + toCSV(data.pesees));
      const content = parts.join('\n\n');
      const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' });
      triggerDownload(blob, `jamra-export-${todayTag}.csv`);
    } catch (e) {
      console.error(e);
    }
    setExporting(false);
  };

  return (
    <div>
      <Header variant="centered" title="Profil" />

      <div className="px-6 py-4 flex flex-col gap-4">

        {/* Greeting */}
        <div className="py-2">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-tertiary mb-1">
            Bonjour
          </div>
          <div className="font-display font-bold text-3xl tracking-tight">
            {profile.prenom} 👋
          </div>
        </div>

        {/* Profil */}
        <Card>
          <div className="font-display font-bold text-xs uppercase tracking-[0.12em] text-text-tertiary mb-3">
            Profil
          </div>
          <StatRow label="Âge" value={`${metrics.age} ans`} />
          <StatRow label="Sexe" value={profile.sexe === 'homme' ? 'Homme' : 'Femme'} />
          <StatRow label="Taille" value={`${profile.taille_cm} cm`} />
          <StatRow label="Poids initial" value={`${formatNumber(profile.poids_initial_kg, { decimals: 1 })} kg`} />
          <StatRow label="IMC" value={formatNumber(bmi, { decimals: 1 })} />
          <StatRow
            label="Niveau d'activité"
            value={{
              sedentaire: 'Sédentaire',
              leger: 'Léger',
              modere: 'Modéré',
              intense: 'Intense',
            }[profile.niveau_activite] || '—'}
          />
          <StatRow
            label="Sport principal"
            value={{
              course: 'Course à pied',
              muscu: 'Musculation',
              velo: 'Vélo',
              raquette: 'Sports de raquette',
              autre: 'Autre',
            }[profile.sport_principal] || '—'}
          />
        </Card>

        {/* Objectifs */}
        <Card>
          <div className="font-display font-bold text-xs uppercase tracking-[0.12em] text-text-tertiary mb-3">
            Objectifs
          </div>
          <StatRow
            label="Objectif"
            value={{
              perte_poids: 'Perte de poids',
              prise_muscle: 'Prise de muscle',
              performance: 'Performance',
              entretien: 'Entretien',
            }[profile.objectif] || '—'}
          />
          {profile.poids_cible_kg && profile.poids_cible_kg !== profile.poids_initial_kg && (
            <>
              <StatRow label="Poids cible" value={`${formatNumber(profile.poids_cible_kg, { decimals: 1 })} kg`} />
              {profile.date_cible && (
                <StatRow label="Date cible" value={formatDateShort(profile.date_cible)} />
              )}
            </>
          )}
        </Card>

        {/* Calibrage énergétique */}
        <Card>
          <div className="font-display font-bold text-xs uppercase tracking-[0.12em] text-text-tertiary mb-3">
            Calibrage énergétique
          </div>
          <StatRow label="Métabolisme de base" value={`${formatNumber(metrics.bmr)} kcal`} sub="MIFFLIN-ST JEOR" />
          <StatRow label="Dépense totale" value={`${formatNumber(metrics.tdee)} kcal`} sub="MAINTENANCE" />
          <StatRow label="Apport cible" value={`${formatNumber(metrics.target_kcal)} kcal`} sub="QUOTIDIEN" />
          <StatRow label="Déficit" value={`−${formatNumber(metrics.deficit_kcal)} kcal`} sub="PAR JOUR" />
        </Card>

        {/* Macros */}
        <Card>
          <div className="font-display font-bold text-xs uppercase tracking-[0.12em] text-text-tertiary mb-3">
            Macros cible
          </div>
          <StatRow label="Protéines" value={`${metrics.proteines_g} g`} sub={`${metrics.proteines_pct} %`} />
          <StatRow label="Lipides" value={`${metrics.lipides_g} g`} sub={`${metrics.lipides_pct} %`} />
          <StatRow label="Glucides" value={`${metrics.glucides_g} g`} sub={`${metrics.glucides_pct} %`} />
          <StatRow label="Fibres" value={`${metrics.fibres_g} g`} />
        </Card>

        {/* Compte (Phase 4) */}
        <Card>
          <div className="font-display font-bold text-xs uppercase tracking-[0.12em] text-text-tertiary mb-3">
            Compte
          </div>
          {user?.email && (
            <div className="mb-3 pb-3 border-b border-subtle">
              <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-text-tertiary mb-1">
                Connecté avec
              </div>
              <div className="font-body text-sm text-text-primary break-all">
                {user.email}
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="md" fullWidth onClick={() => navigate('/entrainement')}>
              🏃 Mon entraînement
            </Button>
            <Button variant="outline" size="md" fullWidth onClick={() => navigate('/foyer')}>
              🏠 Mon foyer
            </Button>
            <Button variant="outline" size="md" fullWidth onClick={handleLogout}>
              Se déconnecter
            </Button>
          </div>
        </Card>

        {/* Synchronisation (Phase 4.2) */}
        <Card>
          <div className="font-display font-bold text-xs uppercase tracking-[0.12em] text-text-tertiary mb-3">
            Synchronisation
          </div>
          <div className="flex items-center gap-3 mb-3">
            {sync.status === 'syncing' && (
              <>
                <div className="w-8 h-8 rounded-full border-2 border-heat-amber border-t-transparent animate-spin" />
                <div className="flex-1">
                  <div className="font-body text-sm text-text-primary">Synchronisation en cours...</div>
                  <div className="font-mono text-[10px] text-text-tertiary tracking-wider uppercase">Quelques secondes</div>
                </div>
              </>
            )}
            {sync.status === 'idle' && (
              <>
                <div className="w-8 h-8 rounded-full bg-[rgba(0,230,118,0.15)] flex items-center justify-center text-success">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-body text-sm text-text-primary">À jour</div>
                  <div className="font-mono text-[10px] text-text-tertiary tracking-wider uppercase">
                    {sync.lastSyncAt
                      ? `Dernière sync à ${new Date(sync.lastSyncAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                      : 'Jamais synchronisé'}
                  </div>
                </div>
              </>
            )}
            {sync.status === 'offline' && (
              <>
                <div className="w-8 h-8 rounded-full bg-[rgba(255,170,51,0.15)] flex items-center justify-center text-heat-amber">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
                    <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
                    <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
                    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
                    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                    <line x1="12" y1="20" x2="12.01" y2="20" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-body text-sm text-text-primary">Hors-ligne</div>
                  <div className="font-mono text-[10px] text-text-tertiary tracking-wider uppercase">
                    Les changements sont gardés localement
                  </div>
                </div>
              </>
            )}
            {sync.status === 'error' && (
              <>
                <div className="w-8 h-8 rounded-full bg-[rgba(255,23,68,0.15)] flex items-center justify-center text-danger">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-body text-sm text-text-primary">Erreur de sync</div>
                  <div className="font-mono text-[10px] text-danger tracking-wider uppercase break-words">
                    {sync.error || 'Inconnue'}
                  </div>
                </div>
              </>
            )}
          </div>

          {sync.pendingCount > 0 && (
            <div className="px-3 py-2 mb-3 rounded-lg bg-bg-surface2 flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-wider uppercase text-text-tertiary">
                En attente
              </span>
              <span className="font-display font-bold text-sm text-heat-amber">
                {sync.pendingCount} élément{sync.pendingCount > 1 ? 's' : ''}
              </span>
            </div>
          )}

          <Button
            variant="outline"
            size="md"
            fullWidth
            onClick={() => sync.forceSync()}
            disabled={sync.status === 'syncing'}
          >
            {sync.status === 'syncing' ? 'En cours...' : 'Synchroniser maintenant'}
          </Button>
        </Card>

        {/* Reset */}
        <Card>
          <div className="font-display font-bold text-xs uppercase tracking-[0.12em] text-text-tertiary mb-3">
            Mes données
          </div>
          <p className="text-text-secondary text-xs mb-3">
            Télécharge une copie de toutes tes données (profil, aliments persos, consommations, pesées).
            Les aliments Ciqual ne sont pas inclus (base fixe).
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="md" fullWidth onClick={handleExportJSON} disabled={exporting}>
              {exporting ? '...' : 'Export JSON'}
            </Button>
            <Button variant="outline" size="md" fullWidth onClick={handleExportCSV} disabled={exporting}>
              {exporting ? '...' : 'Export CSV'}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="font-display font-bold text-xs uppercase tracking-[0.12em] text-text-tertiary mb-3">
            Zone avancée
          </div>
          {!showResetConfirm ? (
            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={() => setShowResetConfirm(true)}
            >
              Recommencer l'onboarding
            </Button>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-text-secondary text-xs">
                Cette action supprime toutes tes données (profil, repas, pesées) et te redirige vers l'onboarding. Irréversible.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" fullWidth onClick={() => setShowResetConfirm(false)}>
                  Annuler
                </Button>
                <Button
                  size="sm"
                  fullWidth
                  onClick={handleReset}
                  className="bg-danger hover:bg-danger"
                >
                  Confirmer
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* À propos */}
        <div className="flex flex-col items-center py-6 opacity-60">
          <Wordmark size="sm" />
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-tertiary mt-1">
            v0.1.0 · Phase 1.E
          </div>
        </div>
      </div>
    </div>
  );
}
