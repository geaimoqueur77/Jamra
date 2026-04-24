/**
 * Jamra — Analyse des zones de FC des activités Strava
 *
 * Pour chaque activité avec FC moyenne remontée, on détermine la zone
 * dominante selon le modèle Coggan 5-zone basé sur %FCMax.
 *
 * Limitation : Strava remonte uniquement FC moyenne et max, pas la time-in-zone.
 * Pour une vraie analyse polarized (Seiler 80/20), il faudrait parser les
 * streams Strava (endpoint activités/streams). On fait l'approximation basée
 * sur la FC moyenne pour l'instant, ce qui donne déjà une bonne indication.
 */

import { calculateHRZones, calculateHRMaxTanaka, detectZone, calculateAge } from './calculations';

const ZONE_INFO = {
  z1: { label: 'Z1 Récup', color: '#33AAFF', emoji: '😌', order: 1 },
  z2: { label: 'Z2 Endurance', color: '#00E676', emoji: '🏃', order: 2 },
  z3: { label: 'Z3 Tempo', color: '#FFAA33', emoji: '🔥', order: 3 },
  z4: { label: 'Z4 Seuil', color: '#FF4D00', emoji: '💥', order: 4 },
  z5: { label: 'Z5 VO2max', color: '#FF1744', emoji: '⚡', order: 5 },
};

/**
 * Enrichit une activité Strava avec son info de zone.
 */
export function enrichActivityWithZone(activity, profile) {
  if (!activity) return activity;
  if (!activity.average_heartrate || !profile?.date_naissance) {
    return { ...activity, zone: null, zone_info: null };
  }

  const age = calculateAge(profile.date_naissance);
  const hrMax = calculateHRMaxTanaka(age);
  const zone = detectZone(activity.average_heartrate, hrMax);

  return {
    ...activity,
    zone,
    zone_info: zone ? ZONE_INFO[zone] : null,
    hr_max_used: hrMax,
    hr_pct: Math.round((activity.average_heartrate / hrMax) * 100),
  };
}

/**
 * Analyse une liste d'activités et retourne la répartition par zones.
 * Utile pour vérifier l'équilibre polarisé (Z2 devrait représenter 75-85% du temps).
 *
 * Pondère par moving_time_s pour des stats "en temps d'effort" plutôt que par séance.
 */
export function analyzeZoneDistribution(activities, profile) {
  if (!activities || activities.length === 0 || !profile?.date_naissance) {
    return null;
  }

  const age = calculateAge(profile.date_naissance);
  const hrMax = calculateHRMaxTanaka(age);

  const timeByZone = { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 };
  const countByZone = { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 };
  let totalTime = 0;

  for (const a of activities) {
    if (!a.average_heartrate) continue;
    const zone = detectZone(a.average_heartrate, hrMax);
    if (!zone) continue;
    const time = a.moving_time_s || 0;
    timeByZone[zone] += time;
    countByZone[zone] += 1;
    totalTime += time;
  }

  if (totalTime === 0) return null;

  const pctByZone = {};
  for (const z of ['z1', 'z2', 'z3', 'z4', 'z5']) {
    pctByZone[z] = Math.round((timeByZone[z] / totalTime) * 100);
  }

  // Analyse polarized (Seiler 80/20) :
  // Idéalement : 75-85% en Z1+Z2 (facile), 15-20% en Z4+Z5 (dur), et très peu en Z3 (zone grise)
  const easyPct = pctByZone.z1 + pctByZone.z2;
  const hardPct = pctByZone.z4 + pctByZone.z5;
  const greyPct = pctByZone.z3;

  let polarizationStatus = 'balanced';
  let polarizationMessage = '';
  if (easyPct < 60) {
    polarizationStatus = 'too_hard';
    polarizationMessage = 'Trop d\'intensité ! Plus de sorties Z2 pour construire l\'aérobie.';
  } else if (easyPct >= 75 && hardPct >= 10) {
    polarizationStatus = 'polarized';
    polarizationMessage = 'Distribution polarisée idéale (Seiler 80/20).';
  } else if (greyPct > 30) {
    polarizationStatus = 'grey_zone';
    polarizationMessage = 'Trop de Z3 (zone grise). Soit plus dur, soit plus facile.';
  } else if (easyPct > 90) {
    polarizationStatus = 'too_easy';
    polarizationMessage = 'Beaucoup de Z2 sans intensité. Ajoute un fractionné ou un seuil pour progresser.';
  }

  return {
    totalActivities: activities.length,
    totalTimeSeconds: totalTime,
    totalTimeMinutes: Math.round(totalTime / 60),
    timeByZone,
    countByZone,
    pctByZone,
    easyPct,
    hardPct,
    greyPct,
    polarizationStatus,
    polarizationMessage,
    hrMax,
    zones: calculateHRZones(hrMax),
  };
}

export { ZONE_INFO };
