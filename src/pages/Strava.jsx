import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStrava from '../hooks/useStrava';
import { getActivitiesForDate, syncStravaActivities } from '../lib/strava';
import { supabase } from '../lib/supabase';
import { formatNumber, formatDateLong, dateFromISO, todayISO, addDaysISO } from '../utils/format';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

// Mapping Strava → emoji
const SPORT_EMOJI = {
  Run: '🏃',
  TrailRun: '🌲',
  Walk: '🚶',
  Ride: '🚴',
  VirtualRide: '🚴',
  Swim: '🏊',
  Hike: '🥾',
  WeightTraining: '💪',
  Workout: '🏋️',
  Yoga: '🧘',
  CrossFit: '💪',
  Crossfit: '💪',
  Rowing: '🚣',
};

function getEmoji(stravaType) {
  return SPORT_EMOJI[stravaType] || '⚡';
}

function formatDistance(m) {
  if (!m) return '—';
  const km = m / 1000;
  return km >= 10 ? `${km.toFixed(1)} km` : `${km.toFixed(2)} km`;
}

function formatDuration(sec) {
  if (!sec) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}`;
  return `${m} min`;
}

function formatPace(distMeters, timeSec) {
  if (!distMeters || !timeSec) return null;
  // pace min/km
  const paceSecPerKm = timeSec / (distMeters / 1000);
  const m = Math.floor(paceSecPerKm / 60);
  const s = Math.round(paceSecPerKm % 60);
  return `${m}:${String(s).padStart(2, '0')}/km`;
}

function ActivityCard({ activity }) {
  const dt = new Date(activity.start_date);
  const kcal = activity.calories ?? activity.kilojoules;
  const pace = formatPace(activity.distance_m, activity.moving_time_s);

  return (
    <div className="p-4 rounded-2xl border border-subtle bg-bg-surface1">
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">{getEmoji(activity.type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="font-display font-bold text-sm uppercase tracking-[0.04em] text-text-primary truncate">
              {activity.name}
            </div>
          </div>
          <div className="font-mono text-[10px] text-text-tertiary tracking-wider uppercase mb-2">
            {dt.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
            {' · '}
            {dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
            <span className="font-mono text-text-secondary">
              ⏱ {formatDuration(activity.moving_time_s)}
            </span>
            {activity.distance_m > 0 && (
              <span className="font-mono text-text-secondary">
                📏 {formatDistance(activity.distance_m)}
              </span>
            )}
            {pace && activity.type !== 'WeightTraining' && activity.type !== 'Workout' && (
              <span className="font-mono text-text-secondary">
                ⚡ {pace}
              </span>
            )}
            {activity.average_heartrate && (
              <span className="font-mono text-text-secondary">
                ♥ {Math.round(activity.average_heartrate)} bpm
              </span>
            )}
            {kcal && (
              <span className="font-mono text-heat-amber font-semibold">
                🔥 {formatNumber(Math.round(kcal))} kcal
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StravaPage() {
  const navigate = useNavigate();
  const { connection, isConnected, loading, syncing, error, connect, disconnect, sync } = useStrava();

  const [recentActivities, setRecentActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  // Charge les activités des 14 derniers jours
  useEffect(() => {
    if (!isConnected) return;
    setLoadingActivities(true);
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;
        const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
        const { data } = await supabase
          .from('strava_activities')
          .select('*')
          .eq('profile_id', userData.user.id)
          .gte('start_date', since)
          .order('start_date', { ascending: false });
        setRecentActivities(data || []);
      } finally {
        setLoadingActivities(false);
      }
    })();
  }, [isConnected, connection?.last_synced_at]);

  const handleSync = async () => {
    await sync({ days: 30 });
  };

  if (loading) {
    return (
      <div>
        <Header variant="title" title="Strava" onBack={() => navigate(-1)} />
        <div className="flex items-center justify-center py-20 text-text-tertiary font-mono text-sm">
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header variant="title" title="Strava" onBack={() => navigate(-1)} />

      <div className="px-6 py-4 flex flex-col gap-4">
        {!isConnected ? (
          // Onboarding connexion
          <Card>
            <div className="text-center py-4">
              <div className="text-5xl mb-3">🏃💪</div>
              <div className="font-display font-bold text-xl uppercase tracking-[0.02em] text-text-primary mb-3">
                Connecter Strava
              </div>
              <p className="text-text-secondary text-sm mb-5 max-w-xs mx-auto">
                Récupère automatiquement tes activités : course, muscu, vélo, natation, etc. Elles seront matchées avec tes séances planifiées.
              </p>
              <button
                onClick={connect}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#FC4C02] text-white font-display font-bold text-sm uppercase tracking-[0.08em] hover:bg-[#E04400] transition-colors"
              >
                Se connecter avec Strava
              </button>
              <div className="mt-4 font-mono text-[10px] text-text-tertiary tracking-wider uppercase">
                Autorisation en lecture seule
              </div>
            </div>
          </Card>
        ) : (
          <>
            {/* Statut connexion */}
            <Card>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-[#FC4C02] flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  S
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[10px] tracking-wider uppercase text-success">
                    ✓ Connecté
                  </div>
                  <div className="font-display font-bold text-base text-text-primary">
                    {connection.firstname} {connection.lastname}
                  </div>
                  <div className="font-mono text-[10px] text-text-tertiary tracking-wider uppercase mt-1">
                    {connection.last_synced_at
                      ? `Dernière sync ${new Date(connection.last_synced_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                      : 'Pas encore de sync'
                    }
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="md" fullWidth onClick={handleSync} disabled={syncing}>
                  {syncing ? 'Sync en cours...' : 'Synchroniser maintenant'}
                </Button>
              </div>
              {error && (
                <div className="mt-3 p-2 rounded-lg border border-danger bg-[rgba(255,23,68,0.05)] text-danger text-xs">
                  {error}
                </div>
              )}
            </Card>

            {/* Activités récentes */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="font-display font-bold text-[11px] uppercase tracking-[0.12em] text-text-tertiary">
                  Activités récentes
                </div>
                <div className="font-mono text-[10px] text-text-tertiary tracking-wider uppercase">
                  {recentActivities.length} / 14j
                </div>
              </div>

              {loadingActivities ? (
                <div className="text-center py-6 text-text-tertiary text-sm font-mono">
                  Chargement...
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="text-center py-8 rounded-2xl border border-dashed border-subtle">
                  <div className="text-3xl mb-2">📭</div>
                  <div className="text-sm text-text-secondary mb-1">Aucune activité récente</div>
                  <div className="font-mono text-[10px] text-text-tertiary tracking-wider uppercase">
                    Essaie "Synchroniser maintenant"
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {recentActivities.map(a => (
                    <ActivityCard key={a.id} activity={a} />
                  ))}
                </div>
              )}
            </div>

            {/* Déconnexion */}
            <Card>
              <div className="font-display font-bold text-xs uppercase tracking-[0.12em] text-text-tertiary mb-3">
                Compte Strava
              </div>
              {!confirmDisconnect ? (
                <>
                  <p className="text-text-secondary text-xs mb-3">
                    Déconnecter Strava arrête la synchronisation. Les activités déjà importées restent en base.
                  </p>
                  <Button variant="outline" size="md" fullWidth onClick={() => setConfirmDisconnect(true)}>
                    Déconnecter Strava
                  </Button>
                </>
              ) : (
                <div className="p-3 rounded-xl border border-danger bg-[rgba(255,23,68,0.05)]">
                  <p className="text-sm text-text-primary mb-3">
                    Confirmer la déconnexion de Strava ?
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" fullWidth onClick={() => setConfirmDisconnect(false)}>
                      Annuler
                    </Button>
                    <button
                      onClick={disconnect}
                      className="flex-1 py-2 rounded-xl bg-danger text-white font-display font-bold text-xs uppercase tracking-[0.1em]"
                    >
                      Déconnecter
                    </button>
                  </div>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
