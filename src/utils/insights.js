/**
 * Jamra — Insights engine
 *
 * Calcule les cards contextuelles à afficher sur le dashboard en fonction de l'état actuel
 * de l'utilisateur (saisie, pesées, tendance). Chaque insight a :
 *   - id (stable, pour dismissal)
 *   - type : 'positive' | 'info' | 'warning'
 *   - icon (emoji)
 *   - title
 *   - message
 *   - priority (entier, plus haut = plus important)
 *   - action (optionnel : { label, route })
 *
 * Principe : rester doux et encourageant, ne jamais culpabiliser.
 * Maximum 2 cards affichées à la fois (tri par priorité).
 */

import { todayISO } from '../db/database';
import { projectWeightTrend } from './calculations';

export function computeInsights({
  profile,
  targetKcal,
  today,
  todayTotals,
  stats7d,
  stats14d,
  weights,
  dismissals = {},
}) {
  const insights = [];
  const hoursIntoDay = new Date().getHours();

  // --- RÈGLE 1 : Saisie du jour en cours (après 14h, aucun repas)
  if (hoursIntoDay >= 14 && hoursIntoDay < 23 && todayTotals.count === 0) {
    insights.push({
      id: 'today-not-logged',
      type: 'info',
      icon: '📝',
      title: "Rien de saisi aujourd'hui",
      message: "Un petit tracking rapide pour rester au clair ?",
      priority: 80,
      action: { label: 'Ajouter', route: `/ajout?meal=dejeuner&date=${today}` },
    });
  }

  // --- RÈGLE 2 : Streak positif (>= 3 jours saisis consécutifs)
  if (stats7d.streak >= 3 && todayTotals.count > 0) {
    insights.push({
      id: `streak-${stats7d.streak}`,
      type: 'positive',
      icon: '🔥',
      title: `Série de ${stats7d.streak} jours`,
      message: stats7d.streak >= 7
        ? 'Une semaine complète de tracking, bravo pour la régularité.'
        : 'Continue comme ça, la régularité paie.',
      priority: 50,
    });
  }

  // --- RÈGLE 3 : Jours dans la cible (sur les 7 derniers)
  if (stats7d.daysLogged >= 4 && targetKcal) {
    const ratio = stats7d.inTarget / stats7d.daysLogged;
    if (ratio >= 0.7 && stats7d.inTarget >= 3) {
      insights.push({
        id: `in-target-week-${stats7d.inTarget}`,
        type: 'positive',
        icon: '🎯',
        title: `${stats7d.inTarget} jours dans ta cible`,
        message: 'Ta semaine est bien calibrée, le déficit tient.',
        priority: 60,
      });
    }
  }

  // --- RÈGLE 4 : Dépassements répétés (2+ jours consécutifs récents au-dessus)
  if (stats7d.daysLogged >= 2 && targetKcal) {
    const recent = stats7d.loggedDates.slice(-3);
    let consecutiveOver = 0;
    for (const d of recent.reverse()) {
      const kcal = stats7d.byDate[d]?.kcal || 0;
      if (kcal > targetKcal * 1.1) consecutiveOver++;
      else break;
    }
    if (consecutiveOver >= 2) {
      insights.push({
        id: `over-streak-${consecutiveOver}`,
        type: 'warning',
        icon: '⚠️',
        title: `${consecutiveOver} jours au-dessus de ta cible`,
        message: 'Pas grave, mais un jour plus léger aiderait à revenir sur la trajectoire.',
        priority: 70,
      });
    }
  }

  // --- RÈGLE 5 : Pesée absente depuis > 5 jours
  if (weights && weights.length > 0) {
    const latestDate = weights[weights.length - 1].date;
    const daysSince = Math.round(
      (new Date(today) - new Date(latestDate)) / (1000 * 60 * 60 * 24)
    );
    if (daysSince >= 5) {
      insights.push({
        id: `no-weight-${daysSince}`,
        type: 'info',
        icon: '⚖️',
        title: `Pas de pesée depuis ${daysSince} jours`,
        message: 'Une pesée régulière aide à ajuster la trajectoire.',
        priority: 55,
        action: { label: 'Me peser', route: '/poids' },
      });
    }
  } else if (!weights || weights.length === 0) {
    // Aucune pesée enregistrée
    insights.push({
      id: 'no-weight-ever',
      type: 'info',
      icon: '⚖️',
      title: 'Enregistre ta première pesée',
      message: 'Pour que la courbe de poids démarre et que la projection soit possible.',
      priority: 75,
      action: { label: 'Me peser', route: '/poids' },
    });
  }

  // --- RÈGLE 6 : Projection on-track
  if (weights && weights.length >= 3 && profile?.poids_cible_kg) {
    const trend = projectWeightTrend(weights, profile.poids_cible_kg);
    if (trend && trend.slopePerWeek < 0 && trend.daysToTarget && trend.daysToTarget < 365) {
      // On descend vers la cible : insight motivant
      const weeksToGo = Math.round(trend.daysToTarget / 7);
      insights.push({
        id: `on-track-${weeksToGo}`,
        type: 'positive',
        icon: '📉',
        title: 'Trajectoire descendante',
        message: `À ce rythme, tu atteins ta cible dans ${weeksToGo} semaine${weeksToGo > 1 ? 's' : ''}.`,
        priority: 40,
      });
    } else if (trend && trend.slopePerWeek > 0.2) {
      // On remonte significativement
      insights.push({
        id: 'trend-up',
        type: 'warning',
        icon: '📈',
        title: 'Courbe remontante',
        message: `Ta tendance récente est de +${trend.slopePerWeek.toFixed(1)} kg/semaine. Regarde ton déficit.`,
        priority: 65,
      });
    }
  }

  // --- RÈGLE 7 : Bienvenue / onboarding doux (aucune saisie sur 7j)
  if (stats7d.daysLogged === 0) {
    insights.push({
      id: 'welcome-empty',
      type: 'info',
      icon: '🌱',
      title: 'Démarre en douceur',
      message: 'Ajoute un seul repas pour voir l\'app prendre vie.',
      priority: 90,
      action: { label: 'Ajouter', route: `/ajout?meal=collation&date=${today}` },
    });
  }

  // Filtre les dismissals actifs aujourd'hui
  const activeDismissals = Object.entries(dismissals)
    .filter(([_, date]) => date === today)
    .map(([id]) => id);

  const visible = insights.filter(i => !activeDismissals.includes(i.id));

  // Tri par priorité descendante, max 2 visibles
  visible.sort((a, b) => b.priority - a.priority);
  return visible.slice(0, 2);
}

// ==========================================================================
// DISMISSAL (stocké en localStorage)
// ==========================================================================

const DISMISS_KEY = 'jamra_insight_dismissals';

export function getDismissals() {
  try {
    return JSON.parse(localStorage.getItem(DISMISS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function dismissInsight(id) {
  const dismissals = getDismissals();
  dismissals[id] = todayISO();
  localStorage.setItem(DISMISS_KEY, JSON.stringify(dismissals));
  return dismissals;
}

export function clearOldDismissals() {
  const today = todayISO();
  const dismissals = getDismissals();
  const fresh = {};
  for (const [id, date] of Object.entries(dismissals)) {
    if (date === today) fresh[id] = date;
  }
  localStorage.setItem(DISMISS_KEY, JSON.stringify(fresh));
}
