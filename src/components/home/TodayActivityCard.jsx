import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActivitiesForDate } from '../../lib/strava';
import { formatNumber } from '../../utils/format';
import { useLiveQuery } from 'dexie-react-hooks';
import { getProfile } from '../../db/database';
import { detectZone, calculateHRMaxTanaka, calculateAge } from '../../utils/calculations';

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

const getEmoji = (t) => SPORT_EMOJI[t] || '⚡';
const formatDistance = (m) => {
  if (!m || m === 0) return null;
  const km = m / 1000;
  return km >= 10 ? `${km.toFixed(1)} km` : `${km.toFixed(2)} km`;
};
const formatDuration = (sec) => {
  if (!sec) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}`;
  return `${m} min`;
};

function ZoneBadgeStrip({ zone }) {
  // Affichage mini de l'activité dominante + 5 segments avec focus sur l'active
  const zones = ['z1', 'z2', 'z3', 'z4', 'z5'];
  const colors = {
    z1: '#33AAFF',
    z2: '#00E676',
    z3: '#FFAA33',
    z4: '#FF4D00',
    z5: '#FF1744',
  };
  const labels = {
    z1: 'Z1 · Récup',
    z2: 'Z2 · Endurance',
    z3: 'Z3 · Tempo',
    z4: 'Z4 · Seuil',
    z5: 'Z5 · VO2max',
  };
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1 flex-1">
        {zones.map(z => (
          <div
            key={z}
            className="flex-1 h-[3px] rounded-full transition-all"
            style={{
              background: zone === z ? colors[z] : 'rgba(255,255,255,0.08)',
              boxShadow: zone === z ? `0 0 6px ${colors[z]}80` : 'none',
            }}
          />
        ))}
      </div>
      {zone && (
        <span
          className="font-mono text-[9px] tracking-[0.08em] uppercase font-bold"
          style={{ color: colors[zone] }}
        >
          {labels[zone]}
        </span>
      )}
    </div>
  );
}

export default function TodayActivityCard({ date, isStravaConnected }) {
  const navigate = useNavigate();
  const profile = useLiveQuery(getProfile);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isStravaConnected) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getActivitiesForDate(date)
      .then(setActivities)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [date, isStravaConnected]);

  if (!isStravaConnected || loading || activities.length === 0) return null;

  const main = activities[0];
  const totalKcal = activities.reduce((s, a) => s + (a.calories ?? a.kilojoules ?? 0), 0);
  const age = profile?.date_naissance ? calculateAge(profile.date_naissance) : null;
  const hrMax = age ? calculateHRMaxTanaka(age) : null;
  const zone = hrMax && main.average_heartrate ? detectZone(main.average_heartrate, hrMax) : null;
  const distance = formatDistance(main.distance_m);
  const duration = formatDuration(main.moving_time_s);

  return (
    <div className="px-6 pb-4 animate-fade-up" style={{ animationDelay: '80ms', animationFillMode: 'backwards' }}>
      <button
        onClick={() => navigate('/strava')}
        className="w-full p-4 rounded-2xl text-left press-down transition-all"
        style={{
          background: 'linear-gradient(180deg, rgba(252,76,2,0.07) 0%, rgba(252,76,2,0.02) 60%)',
          border: '0.5px solid rgba(252, 76, 2, 0.28)',
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#FC4C02' }}
          >
            <span className="font-display font-bold text-white text-lg">S</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[9px] tracking-[0.15em] uppercase text-text-tertiary font-bold mb-0.5">
              Activité du jour · {getEmoji(main.type)}
            </div>
            <div className="font-display font-bold text-sm uppercase tracking-[0.04em] text-text-primary truncate">
              {main.name}
              {distance && <span className="font-mono text-[11px] text-text-secondary ml-1.5 tabular normal-case tracking-normal">· {distance}</span>}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="font-display font-bold text-xl leading-none tabular text-heat-amber" style={{ letterSpacing: '-0.02em' }}>
              {formatNumber(Math.round(totalKcal))}
            </div>
            <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-tertiary mt-1 font-bold">
              kcal
            </div>
          </div>
        </div>

        {/* Zone + durée */}
        <div className="flex items-center gap-2 pt-1">
          <ZoneBadgeStrip zone={zone} />
        </div>
        <div className="flex items-center gap-3 mt-2 font-mono text-[10px] text-text-tertiary tracking-wide tabular">
          <span>⏱ {duration}</span>
          {main.average_heartrate && (
            <span>♥ {Math.round(main.average_heartrate)} bpm</span>
          )}
          {activities.length > 1 && (
            <span className="ml-auto text-heat-amber">+{activities.length - 1} autre{activities.length > 2 ? 's' : ''}</span>
          )}
        </div>
      </button>
    </div>
  );
}
