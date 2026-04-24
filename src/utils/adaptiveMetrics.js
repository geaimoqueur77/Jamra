/**
 * Jamra — Adaptive Metrics
 *
 * Analyse longitudinale des données utilisateur (apport + pesées) pour
 * détecter l'adaptation métabolique réelle et recommander des ajustements.
 *
 * Principe scientifique :
 *   Sur une période de 14-28 jours, on compare le poids attendu (selon BMR
 *   théorique et intake observé) au poids réellement mesuré. L'écart indique
 *   l'ampleur de l'adaptative thermogenesis.
 *
 * Références : Hall & Chow 2015, Trexler 2014, Müller 2016, MacLean 2017.
 */

import { db } from '../db/database';
import {
  calculateBMRMifflin,
  calculateTDEEBase,
  calculateAge,
  detectAdaptiveThermogenesis,
  shouldRecommendDietBreak,
  projectWeightTrend,
} from './calculations';

const ANALYSIS_WINDOW_DAYS = 28; // 4 semaines : bon compromis signal/bruit

/**
 * Récupère et analyse les données des N derniers jours pour calculer
 * l'adaptation métabolique et produire des recommandations.
 *
 * @param {object} profile - profil utilisateur
 * @returns {Promise<object>} analyse complète
 */
export async function analyzeAdaptation(profile, days = ANALYSIS_WINDOW_DAYS) {
  if (!profile || !profile.date_naissance || !profile.taille_cm) {
    return { ready: false, reason: 'profil incomplet' };
  }

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - days);
  const startIso = startDate.toISOString().slice(0, 10);
  const endIso = today.toISOString().slice(0, 10);

  // Récupérer les pesées de la période
  const weights = await db.pesees
    .where('date').between(startIso, endIso, true, true)
    .toArray();

  if (weights.length < 3) {
    return {
      ready: false,
      reason: `${weights.length} pesées sur ${days} jours (minimum 3 requis)`,
      weightsCount: weights.length,
    };
  }

  // Récupérer les consommations de la période
  const consommations = await db.consommations
    .where('date').between(startIso, endIso, true, true)
    .toArray();

  if (consommations.length < 10) {
    return {
      ready: false,
      reason: `${consommations.length} entrées alimentaires (minimum 10 requis)`,
    };
  }

  // Agréger les kcal par jour
  const kcalByDate = {};
  for (const e of consommations) {
    kcalByDate[e.date] = (kcalByDate[e.date] || 0) + (e.kcal_snapshot || 0);
  }
  const loggedDays = Object.keys(kcalByDate).length;
  if (loggedDays < Math.max(7, days / 3)) {
    return {
      ready: false,
      reason: `Seulement ${loggedDays} jours loggés sur ${days}`,
    };
  }

  const totalIntake = Object.values(kcalByDate).reduce((s, v) => s + v, 0);
  const avgIntake = totalIntake / loggedDays;

  // Calculer le poids moyen au début et à la fin (lissage bruit)
  // Début : 3 premières pesées
  // Fin : 3 dernières pesées
  const sortedWeights = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const firstThree = sortedWeights.slice(0, 3);
  const lastThree = sortedWeights.slice(-3);
  const avgWeightStart = firstThree.reduce((s, w) => s + w.poids_kg, 0) / firstThree.length;
  const avgWeightEnd = lastThree.reduce((s, w) => s + w.poids_kg, 0) / lastThree.length;

  const actualKgLost = avgWeightStart - avgWeightEnd;

  // Calculer le TDEE théorique moyen (sur le poids moyen de la période)
  const avgWeight = (avgWeightStart + avgWeightEnd) / 2;
  const age = calculateAge(profile.date_naissance);
  const avgBmr = calculateBMRMifflin({
    sexe: profile.sexe,
    poids_kg: avgWeight,
    taille_cm: profile.taille_cm,
    age,
  });
  const avgTdeeBase = calculateTDEEBase(avgBmr, profile.niveau_activite);

  // Ajouter l'exercice moyen Strava sur la période (si connecté)
  let avgStravaKcalPerDay = 0;
  try {
    const { supabase } = await import('../lib/supabase');
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      const { data: activities } = await supabase
        .from('strava_activities')
        .select('start_date, calories, kilojoules')
        .eq('profile_id', userData.user.id)
        .gte('start_date', startIso);
      if (activities && activities.length > 0) {
        const totalStrava = activities.reduce((s, a) => s + (a.calories ?? a.kilojoules ?? 0), 0);
        avgStravaKcalPerDay = totalStrava / days;
      }
    }
  } catch (_) {}

  const avgTdeeTheoretical = avgTdeeBase + avgStravaKcalPerDay;

  // Détection adaptation
  const adaptation = detectAdaptiveThermogenesis({
    actualKgLost,
    avgIntakeKcal: avgIntake,
    avgTdeeTheoreticalKcal: avgTdeeTheoretical,
    days,
  });

  // Calcul du trend (pour diet break)
  const trend = projectWeightTrend(weights, profile.poids_cible_kg);

  // Nombre de semaines consécutives en déficit (simplifié : on compte les semaines où avg intake < avgTdee)
  // Ici on approxime en comptant les semaines depuis le début observé
  const weeksInDeficit = Math.floor(days / 7);

  const dietBreak = shouldRecommendDietBreak({
    scenario: profile.scenario,
    weeksInDeficit,
    slopePerWeek: trend?.slopePerWeek,
  });

  return {
    ready: true,
    period: { startIso, endIso, days, loggedDays },
    weight: {
      start: Math.round(avgWeightStart * 10) / 10,
      end: Math.round(avgWeightEnd * 10) / 10,
      lost: Math.round(actualKgLost * 100) / 100,
      slopePerWeek: trend?.slopePerWeek ?? null,
    },
    intake: {
      avgKcalPerDay: Math.round(avgIntake),
      totalKcal: Math.round(totalIntake),
    },
    tdee: {
      bmr: avgBmr,
      tdeeBase: avgTdeeBase,
      avgStravaKcalPerDay: Math.round(avgStravaKcalPerDay),
      tdeeTheoretical: Math.round(avgTdeeTheoretical),
      tdeeEstimatedReal: Math.round(avgTdeeTheoretical * (1 + adaptation.adaptation_pct)),
    },
    adaptation,
    dietBreak,
    trend,
  };
}
