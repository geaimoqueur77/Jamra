import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { getProfile, resetAll, exportAll, toCSV } from '../db/database';
import { computeProfileMetrics, calculateBMI } from '../utils/calculations';
import { formatNumber, formatDateShort } from '../utils/format';
import { useAuth } from '../hooks/useAuth';
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
          <Button variant="outline" size="md" fullWidth onClick={handleLogout}>
            Se déconnecter
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
