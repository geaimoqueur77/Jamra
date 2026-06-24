import { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getProfile, getAllWeights, getDailyTotals, todayISO } from '../db/database';
import { addDaysISO } from '../utils/format';
import { computeProfileMetrics } from '../utils/calculations';
import { supabase } from '../lib/supabase';

// 1g de graisse ≈ 9 kcal
const KCAL_PER_GRAM_FAT = 9;
// Part attribuée à la perte de graisse lors d'une perte de poids en recomposition
const FAT_LOSS_RATIO = 0.85;

function FlammeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-heat-orange">
      <path d="M12 2c0 4-3 6-3 9a3 3 0 0 0 6 0c0-3-3-5-3-9z" />
      <path d="M9 16.5c-.5 1.5.5 2.5 3 2.5s3.5-1 3-2.5" />
    </svg>
  );
}

function AnimatedBar({ value }) {
  const pct = Math.min(Math.max(value, 0), 1) * 100;
  return (
    <div className="w-full h-2 rounded-full bg-bg-surface2 overflow-hidden">
      <div
        className="h-full rounded-full animate-bar-fill"
        style={{
          width: `${pct}%`,
          background: 'linear-gradient(90deg, #FFAA33 0%, #FF4D00 60%, #FF1744 100%)',
          transformOrigin: 'left center',
        }}
      />
    </div>
  );
}

export default function FatBurnWidget() {
  const profile = useLiveQuery(getProfile);
  const weights = useLiveQuery(getAllWeights) || [];
  const today = todayISO();
  const todayTotals = useLiveQuery(() => getDailyTotals(today), [today]);
  const [stravaKcalToday, setStravaKcalToday] = useState(0);
  const [stravaKcalWeek, setStravaKcalWeek] = useState(0);

  const userIdRef = useRef(null);

  const fetchStravaKcal = async (uid) => {
    const weekStart = addDaysISO(today, -6);
    const { data } = await supabase
      .from('strava_activities')
      .select('start_date, calories')
      .eq('profile_id', uid)
      .gte('start_date', weekStart)
      .lte('start_date', today + 'T23:59:59');
    if (!data) return;
    setStravaKcalToday(data.filter(a => a.start_date?.startsWith(today)).reduce((s, a) => s + (a.calories || 0), 0));
    setStravaKcalWeek(data.reduce((s, a) => s + (a.calories || 0), 0));
  };

  // Fetch Strava kcal + subscription Realtime pour refresh post-sync
  useEffect(() => {
    let channel;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      userIdRef.current = user.id;
      fetchStravaKcal(user.id);

      channel = supabase
        .channel('fat-burn-strava')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'strava_activities',
          filter: `profile_id=eq.${user.id}`,
        }, () => fetchStravaKcal(user.id))
        .subscribe();
    });
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [today]);

  if (!profile) return null;

  const poidsDepart = profile.poids_initial_kg || 100;
  const mgDepart = profile.mg_depart_pct || 30;
  const poidsActuel = weights.length > 0 ? weights[weights.length - 1].poids_kg : poidsDepart;

  // Grammes de graisse
  const grasDepart = poidsDepart * (mgDepart / 100) * 1000; // en grammes
  const grasObjectif = 8000; // 8 kg en grammes (essentiel + fonctionnel)
  const grasAPerdre = grasDepart - grasObjectif; // grammes à perdre au total

  // Estimation graisse perdue depuis le départ (basée sur la perte de poids)
  const pertePoids = Math.max(0, poidsDepart - poidsActuel);
  const grasPerduEstime = pertePoids * FAT_LOSS_RATIO * 1000; // grammes

  // Déficit calorique d'aujourd'hui
  const targetKcal = profile.scenario
    ? (() => {
        const SCENARIOS = { durable: 500, modere: 700, intermediaire: 800, agressif: 1000 };
        return SCENARIOS[profile.scenario] || 600;
      })()
    : 650;

  const kcalConsumedToday = todayTotals?.kcal || 0;
  const metrics = computeProfileMetrics(profile);
  const tdeeApprox = metrics?.tdee || 2800;
  const deficitToday = Math.max(0, tdeeApprox - kcalConsumedToday + stravaKcalToday);
  const grasPerduAujourdhui = deficitToday / KCAL_PER_GRAM_FAT;

  // Déficit cette semaine (7 jours de déficit × moyenne)
  // Approximation : déficit moyen journalier × 7
  const deficitSemaine = Math.max(0, targetKcal * 7 + stravaKcalWeek);
  const grasPerduSemaine = deficitSemaine / KCAL_PER_GRAM_FAT;

  const ratio = grasAPerdre > 0 ? Math.min(grasPerduEstime / grasAPerdre, 1) : 0;

  const formatGras = (g) => {
    if (g < 1000) return `${Math.round(g)} g`;
    return `${(g / 1000).toFixed(1)} kg`;
  };

  return (
    <div className="rounded-2xl border border-subtle bg-bg-surface1 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FlammeIcon />
          <div className="font-display font-bold text-[11px] uppercase tracking-[0.14em] text-text-secondary">
            Fonte
          </div>
        </div>
        <div className="font-mono text-[10px] text-text-tertiary">
          {Math.round(ratio * 100)}%
        </div>
      </div>

      {/* Chiffre principal */}
      <div className="mb-3">
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="font-display font-extrabold text-[36px] leading-none text-heat-gradient">
            {formatGras(grasPerduEstime)}
          </span>
          <span className="font-mono text-[11px] text-text-tertiary">
            sur {formatGras(grasAPerdre)}
          </span>
        </div>
        <div className="font-mono text-[9px] text-text-tertiary uppercase tracking-wider">
          graisse brûlée estimée
        </div>
      </div>

      {/* Barre de progression */}
      <AnimatedBar value={ratio} />
      <div className="flex justify-between mt-1 mb-4">
        <div className="font-mono text-[9px] text-text-tertiary">0</div>
        <div className="font-mono text-[9px] text-text-tertiary">objectif {(grasObjectif / 1000).toFixed(0)} kg MG</div>
      </div>

      {/* Stats semaine / jour */}
      <div className="flex gap-3 pt-3 border-t border-subtle">
        <div className="flex-1">
          <div className="font-mono text-[11px] font-bold text-heat-amber">
            ~{formatGras(grasPerduSemaine)}
          </div>
          <div className="font-mono text-[9px] text-text-tertiary uppercase tracking-wider mt-0.5">
            Cette semaine
          </div>
        </div>
        <div className="w-px bg-subtle" />
        <div className="flex-1">
          <div className="font-mono text-[11px] font-bold text-text-primary">
            ~{formatGras(grasPerduAujourdhui)}
          </div>
          <div className="font-mono text-[9px] text-text-tertiary uppercase tracking-wider mt-0.5">
            Aujourd'hui
          </div>
        </div>
        <div className="w-px bg-subtle" />
        <div className="flex-1">
          <div className="font-mono text-[10px] text-text-tertiary leading-tight">
            déficit<br />+ Strava
          </div>
        </div>
      </div>
    </div>
  );
}
