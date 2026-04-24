import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActivitiesForDate, getKcalBurnedForDate } from '../../lib/strava';
import { formatNumber } from '../../utils/format';

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
  Rowing: '🚣',
};

function getEmoji(stravaType) {
  return SPORT_EMOJI[stravaType] || '⚡';
}

function formatDuration(sec) {
  if (!sec) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}`;
  return `${m} min`;
}

function formatDistance(m) {
  if (!m || m === 0) return null;
  const km = m / 1000;
  return km >= 10 ? `${km.toFixed(1)} km` : `${km.toFixed(2)} km`;
}

/**
 * Carte "Activité du jour" affichée sur le dashboard.
 * Montre les activités Strava du jour + total kcal brûlées.
 * Invisible si aucune activité ce jour-là.
 *
 * Props :
 *  - date : ISO date string (ex: today)
 *  - isStravaConnected : bool
 */
export default function TodayActivityCard({ date, isStravaConnected }) {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [totalKcal, setTotalKcal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isStravaConnected) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      getActivitiesForDate(date),
      getKcalBurnedForDate(date),
    ])
      .then(([acts, kcal]) => {
        setActivities(acts);
        setTotalKcal(kcal);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [date, isStravaConnected]);

  // Pas connecté ou aucune activité : on ne rend rien
  if (!isStravaConnected || loading || activities.length === 0) return null;

  return (
    <div className="px-6 pb-4">
      <button
        onClick={() => navigate('/strava')}
        className="w-full p-4 rounded-2xl border border-[#FC4C02]/40 bg-gradient-to-br from-[rgba(252,76,2,0.05)] to-[rgba(255,23,68,0.04)] text-left transition-all hover:border-[#FC4C02]"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#FC4C02]">S</span>
            <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-text-tertiary">
              Activité du jour
            </span>
          </div>
          <div className="text-right">
            <span className="font-display font-extrabold text-2xl text-heat-gradient">
              {formatNumber(totalKcal)}
            </span>
            <span className="font-mono text-[10px] text-text-tertiary ml-1 tracking-wider uppercase">
              kcal brûlées
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {activities.map(a => {
            const dist = formatDistance(a.distance_m);
            return (
              <div key={a.id} className="flex items-center gap-2 py-1 border-t border-subtle first:border-t-0 pt-2 first:pt-0">
                <span className="text-xl flex-shrink-0">{getEmoji(a.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-body text-sm text-text-primary truncate">
                    {a.name}
                  </div>
                  <div className="font-mono text-[10px] text-text-tertiary tracking-wider">
                    {formatDuration(a.moving_time_s)}
                    {dist && ` · ${dist}`}
                    {a.average_heartrate && ` · ${Math.round(a.average_heartrate)} bpm`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </button>
    </div>
  );
}
