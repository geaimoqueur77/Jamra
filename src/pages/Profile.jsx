import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { getProfile, resetAll, exportAll, toCSV } from '../db/database';
import { computeProfileMetrics, calculateBMI } from '../utils/calculations';
import { formatNumber, formatDateShort } from '../utils/format';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { getUserAchievements, useAchievements } from '../hooks/useAchievements';
import { AchievementToastLayer } from '../components/AchievementToast';
import Header from '../components/layout/Header';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Wordmark from '../components/ui/Wordmark';
import { generateAthleteCard } from '../utils/shareWeekly';
import { useAvatarState } from '../hooks/useAvatarState';
import { useAvatarCustomization } from '../hooks/useAvatarCustomization';
import { getLatestWeight } from '../db/database';

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

const STRAVA_CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID;
const STRAVA_REDIRECT_URI = `${window.location.origin}/strava/callback`;

function StravaSection({ userId }) {
  const [connection, setConnection] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('strava_connections')
      .select('firstname, lastname, last_synced_at')
      .eq('profile_id', userId)
      .maybeSingle()
      .then(({ data }) => setConnection(data));
  }, [userId]);

  const handleConnect = () => {
    if (!STRAVA_CLIENT_ID) {
      alert('VITE_STRAVA_CLIENT_ID non configuré dans .env.local');
      return;
    }
    const params = new URLSearchParams({
      client_id: STRAVA_CLIENT_ID,
      redirect_uri: STRAVA_REDIRECT_URI,
      response_type: 'code',
      approval_prompt: 'auto',
      scope: 'activity:read,activity:read_all',
    });
    window.location.href = `https://www.strava.com/oauth/authorize?${params}`;
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('strava-callback', {
        body: { action: 'sync' },
      });
      if (!error && data?.success) {
        setConnection(c => ({ ...c, last_synced_at: new Date().toISOString() }));
      }
    } catch (e) {
      console.error('Sync error', e);
    }
    setSyncing(false);
  };

  const handleDisconnect = async () => {
    await supabase.from('strava_connections').delete().eq('profile_id', userId);
    await supabase.from('profiles').update({ strava_connected: false }).eq('id', userId);
    setConnection(null);
  };

  const lastSync = connection?.last_synced_at
    ? (() => {
        const diff = Math.floor((Date.now() - new Date(connection.last_synced_at)) / 60000);
        if (diff < 1) return 'à l\'instant';
        if (diff < 60) return `il y a ${diff} min`;
        if (diff < 1440) return `il y a ${Math.floor(diff / 60)}h`;
        return new Date(connection.last_synced_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      })()
    : null;

  return (
    <Card>
      <div className="font-display font-bold text-xs uppercase tracking-[0.12em] text-text-tertiary mb-3">
        Strava
      </div>
      {connection ? (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#FC4C02]/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#FC4C02">
                <path d="M10 17.5L14.5 8.5L17 13H20L14.5 3L9 13H12L10 17.5Z" />
              </svg>
            </div>
            <div>
              <div className="font-body text-sm font-semibold text-text-primary">
                {connection.firstname} {connection.lastname}
              </div>
              {lastSync && (
                <div className="font-mono text-[10px] text-text-tertiary">Sync : {lastSync}</div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" fullWidth onClick={handleSync} disabled={syncing}>
              {syncing ? 'Sync...' : 'Synchroniser'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDisconnect}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <p className="font-body text-xs text-text-tertiary mb-3">
            Connecte ton compte Strava pour importer automatiquement tes activités (calories, allure, fréquence cardiaque).
          </p>
          <button
            onClick={handleConnect}
            className="w-full py-3 rounded-xl flex items-center justify-center gap-2.5 font-display font-bold text-[13px] uppercase tracking-wide text-white transition-opacity hover:opacity-90"
            style={{ background: '#FC4C02' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M10 17.5L14.5 8.5L17 13H20L14.5 3L9 13H12L10 17.5Z" />
            </svg>
            Connecter Strava
          </button>
        </div>
      )}
    </Card>
  );
}

const ALL_ACHIEVEMENTS = [
  { key: 'first_session', icon: '🏋️', label: 'Premier sang', description: 'Première séance de muscu loggée' },
  { key: 'first_pr', icon: '🔥', label: 'Nouveau record', description: 'Premier record personnel' },
  { key: 'streak_7', icon: '⚡', label: 'La veine', description: '7 jours consécutifs d\'activité' },
  { key: 'run_20km', icon: '🏃', label: 'Sub 4h', description: 'Sortie > 20 km' },
  { key: 'marathon_signed', icon: '🎽', label: 'Dossard', description: 'Inscrit à un marathon' },
  { key: 'minus_5kg', icon: '📉', label: 'Maillot de bain', description: '−5 kg depuis le départ' },
  { key: 'phase1_done', icon: '🎯', label: 'Phase 1', description: 'Poids < 89 kg' },
];

function AchievementsSection({ userId }) {
  const [unlocked, setUnlocked] = useState([]);

  useEffect(() => {
    if (!userId) return;
    getUserAchievements(userId).then(setUnlocked);
  }, [userId]);

  const unlockedKeys = new Set(unlocked.map(a => a.key));

  return (
    <Card>
      <div className="font-display font-bold text-xs uppercase tracking-[0.12em] text-text-tertiary mb-3">
        Succès
      </div>
      <div className="grid grid-cols-3 gap-2">
        {ALL_ACHIEVEMENTS.map(ach => {
          const done = unlockedKeys.has(ach.key);
          const ua = unlocked.find(u => u.key === ach.key);
          return (
            <div
              key={ach.key}
              className={`flex flex-col items-center text-center p-3 rounded-[14px] border transition-all ${done ? 'border-heat-orange/30 bg-heat-orange/5' : 'border-white/5 bg-bg-surface1 opacity-40'}`}
            >
              <span className="text-xl mb-1.5">{ach.icon}</span>
              <div className={`font-display font-bold text-[10px] uppercase tracking-wide leading-tight ${done ? 'text-heat-orange' : 'text-text-tertiary'}`}>
                {ach.label}
              </div>
              {done && ua?.unlocked_at ? (
                <div className="font-mono text-[8px] text-text-tertiary mt-1">
                  {new Date(ua.unlocked_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </div>
              ) : !done ? (
                <div className="font-mono text-[8px] text-text-muted mt-1">🔒</div>
              ) : null}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function usePushNotifications(userId) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('push_enabled');
    if (saved === 'true') setEnabled(true);
  }, []);

  const toggle = async () => {
    if (loading || !userId) return;
    setLoading(true);
    try {
      if (!enabled) {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') { setLoading(false); return; }
        const reg = await navigator.serviceWorker.ready;
        const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey,
        });
        await supabase.from('push_subscriptions').upsert({ user_id: userId, subscription: sub.toJSON() }, { onConflict: 'user_id' });
        localStorage.setItem('push_enabled', 'true');
        setEnabled(true);
      } else {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
        await supabase.from('push_subscriptions').delete().eq('user_id', userId);
        localStorage.setItem('push_enabled', 'false');
        setEnabled(false);
      }
    } catch { /* permission refusée ou non supporté */ }
    setLoading(false);
  };

  const supported = typeof window !== 'undefined' && 'PushManager' in window && 'serviceWorker' in navigator;
  return { enabled, loading, toggle, supported };
}

export default function Profile() {
  const navigate = useNavigate();
  const profile = useLiveQuery(getProfile);
  const latestWeight = useLiveQuery(getLatestWeight);
  const { user, signOut } = useAuth();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [generatingCard, setGeneratingCard] = useState(false);
  const { checkMarathonSigned, recentUnlocks } = useAchievements();
  const push = usePushNotifications(user?.id);
  const avatarState = useAvatarState();
  const { customization: avatarCustomization } = useAvatarCustomization();

  if (!profile) return null;

  const metrics = computeProfileMetrics(profile);
  const bmi = calculateBMI({ poids_kg: profile.poids_initial_kg, taille_cm: profile.taille_cm });

  const handleReset = async () => {
    await resetAll();
    navigate('/onboarding', { replace: true });
  };

  const handleDownloadCard = async () => {
    setGeneratingCard(true);
    try {
      const achievements = user ? await getUserAchievements(user.id) : [];
      const currentWeight = latestWeight?.poids_kg || profile?.poids_initial_kg;
      let phase = 1;
      if (currentWeight < 85) phase = 4;
      else if (currentWeight < 89) phase = 3;
      else if (currentWeight < 93) phase = 2;
      const userData = {
        nom: profile?.prenom || 'Athlète',
        poids: currentWeight,
        poids_cible: profile?.poids_cible_kg,
        phase,
        xp: 0,
      };
      const dataURL = await generateAthleteCard(userData, avatarState, avatarCustomization, achievements);
      const a = document.createElement('a');
      a.href = dataURL;
      a.download = 'jamra-carte-athlete.png';
      a.click();
    } catch (e) {
      console.error(e);
    }
    setGeneratingCard(false);
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

      <div className="px-4 py-4 flex flex-col gap-4">

        {/* Greeting */}
        <div className="py-2">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-tertiary mb-1">
            Bonjour
          </div>
          <div className="font-display font-bold text-3xl tracking-tight">
            {profile.prenom} 👋
          </div>
        </div>

        {/* Personnalisation avatar */}
        <button
          onClick={() => navigate('/personnalisation')}
          className="w-full flex items-center justify-between py-3.5 px-4 rounded-2xl border border-subtle bg-bg-surface1 hover:border-heat-orange/40 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-heat-orange/10 flex items-center justify-center text-heat-orange text-sm">
              🎨
            </div>
            <div className="text-left">
              <div className="font-display font-bold text-[13px] text-text-primary">Personnaliser mon avatar</div>
              <div className="font-mono text-[9px] text-text-tertiary uppercase tracking-wider">Tenue · Cheveux · Lunettes</div>
            </div>
          </div>
          <div className="font-mono text-text-muted text-[11px] group-hover:text-heat-orange transition-colors">→</div>
        </button>

        {/* Carte athlète */}
        <button
          onClick={handleDownloadCard}
          disabled={generatingCard}
          className="w-full flex items-center justify-between py-3.5 px-4 rounded-2xl border border-subtle bg-bg-surface1 hover:border-heat-amber/40 transition-colors group disabled:opacity-50"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-heat-amber/10 flex items-center justify-center text-heat-amber text-sm">
              🃏
            </div>
            <div className="text-left">
              <div className="font-display font-bold text-[13px] text-text-primary">Ma carte athlète</div>
              <div className="font-mono text-[9px] text-text-tertiary uppercase tracking-wider">
                {generatingCard ? 'Génération...' : '1080×1350 · Télécharger'}
              </div>
            </div>
          </div>
          <div className="font-mono text-text-muted text-[11px] group-hover:text-heat-amber transition-colors">↓</div>
        </button>

        {/* Notifications push */}
        {push.supported && (
          <button
            onClick={push.toggle}
            disabled={push.loading}
            className="w-full flex items-center justify-between py-3.5 px-4 rounded-2xl border border-subtle bg-bg-surface1 hover:border-heat-orange/40 transition-colors disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-heat-orange/10 flex items-center justify-center text-heat-orange text-sm">
                🔔
              </div>
              <div className="text-left">
                <div className="font-display font-bold text-[13px] text-text-primary">Notifications</div>
                <div className="font-mono text-[9px] text-text-tertiary uppercase tracking-wider">
                  {push.enabled ? 'Activées — rappel 18h + bilan dimanche' : 'Rappels séances · Bilan hebdo'}
                </div>
              </div>
            </div>
            <div className={`w-10 h-5 rounded-full transition-colors ${push.enabled ? 'bg-heat-orange' : 'bg-bg-surface2 border border-subtle'}`}>
              <div className={`w-4 h-4 rounded-full bg-white mt-0.5 transition-all ${push.enabled ? 'ml-5.5' : 'ml-0.5'}`} style={{ marginLeft: push.enabled ? '22px' : '2px' }} />
            </div>
          </button>
        )}

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

        {/* Strava */}
        <StravaSection userId={user?.id} />

        {/* Succès / Achievements */}
        <AchievementsSection userId={user?.id} />

        {/* Marathon signé — action manuelle */}
        <Card>
          <div className="font-display font-bold text-xs uppercase tracking-[0.12em] text-text-tertiary mb-3">
            Marathon de Paris 2027
          </div>
          <p className="font-body text-xs text-text-secondary mb-3">
            Confirme ton inscription au Marathon de Paris pour débloquer le succès "Dossard" (+400 XP).
          </p>
          <button
            onClick={() => checkMarathonSigned(user?.id)}
            className="w-full py-3 rounded-xl border border-[#f59e0b]/40 bg-[#f59e0b]/08 font-display font-bold text-[12px] uppercase tracking-wide text-[#f59e0b] hover:bg-[#f59e0b]/15 transition-colors"
          >
            🎽 Je suis inscrit au Marathon de Paris ✓
          </button>
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
      <AchievementToastLayer unlocks={recentUnlocks} onDismiss={() => {}} />
    </div>
  );
}
