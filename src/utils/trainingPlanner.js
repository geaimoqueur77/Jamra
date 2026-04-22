/**
 * Jamra — Génération du planning hebdomadaire.
 *
 * À partir d'un plan (course_freq, muscu_freq), on génère une semaine
 * de séances en alternant intelligemment pour :
 *   - Ne pas mettre 2 courses consécutives
 *   - Alterner les intensités (récupération après intensité)
 *   - Garder au moins 1 jour de repos complet
 */

import { addDaysISO, dateFromISO } from './format';

// =====================================================================
// TYPES DE SÉANCES
// =====================================================================

/**
 * Rotations de type de course selon fréquence hebdo.
 * Les plus légères en début, la longue en fin (typiquement le weekend).
 */
function getRunningSessionTypes(freq, objectif = 'endurance') {
  const templates = {
    1: [{ sous_type: 'endurance', titre: 'Sortie endurance', duree: 40, intensite: 'moderee' }],
    2: [
      { sous_type: 'endurance', titre: 'Footing endurance', duree: 35, intensite: 'moderee' },
      { sous_type: 'longue', titre: 'Sortie longue', duree: 60, intensite: 'moderee' },
    ],
    3: [
      { sous_type: 'endurance', titre: 'Footing endurance', duree: 35, intensite: 'moderee' },
      { sous_type: 'fractionne', titre: 'Fractionné VMA', duree: 40, intensite: 'soutenue' },
      { sous_type: 'longue', titre: 'Sortie longue', duree: 70, intensite: 'moderee' },
    ],
    4: [
      { sous_type: 'endurance', titre: 'Footing récup', duree: 30, intensite: 'faible' },
      { sous_type: 'fractionne', titre: 'Fractionné VMA', duree: 45, intensite: 'soutenue' },
      { sous_type: 'seuil', titre: 'Sortie seuil', duree: 45, intensite: 'soutenue' },
      { sous_type: 'longue', titre: 'Sortie longue', duree: 80, intensite: 'moderee' },
    ],
    5: [
      { sous_type: 'endurance', titre: 'Footing récup', duree: 30, intensite: 'faible' },
      { sous_type: 'fractionne', titre: 'Fractionné VMA', duree: 45, intensite: 'soutenue' },
      { sous_type: 'endurance', titre: 'Footing endurance', duree: 40, intensite: 'moderee' },
      { sous_type: 'seuil', titre: 'Sortie seuil', duree: 50, intensite: 'soutenue' },
      { sous_type: 'longue', titre: 'Sortie longue', duree: 90, intensite: 'moderee' },
    ],
    6: [
      { sous_type: 'endurance', titre: 'Footing récup', duree: 30, intensite: 'faible' },
      { sous_type: 'fractionne', titre: 'Fractionné VMA', duree: 50, intensite: 'intense' },
      { sous_type: 'endurance', titre: 'Footing endurance', duree: 40, intensite: 'moderee' },
      { sous_type: 'seuil', titre: 'Sortie seuil', duree: 55, intensite: 'soutenue' },
      { sous_type: 'endurance', titre: 'Footing récup', duree: 30, intensite: 'faible' },
      { sous_type: 'longue', titre: 'Sortie longue', duree: 95, intensite: 'moderee' },
    ],
    7: [
      { sous_type: 'endurance', titre: 'Footing récup', duree: 30, intensite: 'faible' },
      { sous_type: 'fractionne', titre: 'Fractionné court', duree: 45, intensite: 'intense' },
      { sous_type: 'endurance', titre: 'Footing endurance', duree: 40, intensite: 'moderee' },
      { sous_type: 'seuil', titre: 'Sortie seuil', duree: 50, intensite: 'soutenue' },
      { sous_type: 'endurance', titre: 'Footing endurance', duree: 40, intensite: 'moderee' },
      { sous_type: 'fractionne', titre: 'Fractionné long', duree: 55, intensite: 'intense' },
      { sous_type: 'longue', titre: 'Sortie longue', duree: 100, intensite: 'moderee' },
    ],
  };

  const base = templates[Math.min(Math.max(freq, 0), 7)] || [];

  // Ajustement léger selon objectif
  if (objectif === 'forme' || objectif === 'maintien') {
    // On réduit les sessions intenses
    return base.map(s => {
      if (s.intensite === 'intense') return { ...s, intensite: 'soutenue' };
      return s;
    });
  }

  return base;
}

function getMusculationSessionTypes(freq, objectif = 'force') {
  const templates = {
    1: [{ sous_type: 'full_body', titre: 'Full body', duree: 60, intensite: 'soutenue' }],
    2: [
      { sous_type: 'haut', titre: 'Muscu haut du corps', duree: 55, intensite: 'soutenue' },
      { sous_type: 'bas', titre: 'Muscu bas du corps', duree: 55, intensite: 'soutenue' },
    ],
    3: [
      { sous_type: 'push', titre: 'Muscu push (pecs/épaules/triceps)', duree: 55, intensite: 'soutenue' },
      { sous_type: 'pull', titre: 'Muscu pull (dos/biceps)', duree: 55, intensite: 'soutenue' },
      { sous_type: 'legs', titre: 'Muscu jambes', duree: 60, intensite: 'soutenue' },
    ],
    4: [
      { sous_type: 'haut', titre: 'Muscu haut (force)', duree: 55, intensite: 'intense' },
      { sous_type: 'bas', titre: 'Muscu bas (force)', duree: 55, intensite: 'intense' },
      { sous_type: 'haut', titre: 'Muscu haut (volume)', duree: 50, intensite: 'soutenue' },
      { sous_type: 'bas', titre: 'Muscu bas (volume)', duree: 50, intensite: 'soutenue' },
    ],
    5: [
      { sous_type: 'push', titre: 'Muscu push', duree: 55, intensite: 'intense' },
      { sous_type: 'pull', titre: 'Muscu pull', duree: 55, intensite: 'soutenue' },
      { sous_type: 'legs', titre: 'Muscu jambes', duree: 60, intensite: 'intense' },
      { sous_type: 'haut', titre: 'Muscu haut volume', duree: 50, intensite: 'soutenue' },
      { sous_type: 'mobilite', titre: 'Mobilité + core', duree: 30, intensite: 'faible' },
    ],
    6: [
      { sous_type: 'push', titre: 'Muscu push', duree: 55, intensite: 'intense' },
      { sous_type: 'pull', titre: 'Muscu pull', duree: 55, intensite: 'soutenue' },
      { sous_type: 'legs', titre: 'Muscu jambes', duree: 60, intensite: 'intense' },
      { sous_type: 'push', titre: 'Muscu push volume', duree: 50, intensite: 'soutenue' },
      { sous_type: 'pull', titre: 'Muscu pull volume', duree: 50, intensite: 'soutenue' },
      { sous_type: 'legs', titre: 'Muscu jambes légère', duree: 45, intensite: 'moderee' },
    ],
    7: null, // on ne fait pas 7 jours de muscu
  };

  return templates[Math.min(Math.max(freq, 0), 6)] || [];
}

// =====================================================================
// DISTRIBUTION HEBDO
// =====================================================================

/**
 * Distribue les séances sur les 7 jours en alternant types et en évitant
 * les collisions difficiles (ex: muscu jambes suivie de course longue).
 *
 * Heuristique simple :
 *   - Si N course et M muscu : on place d'abord les courses (surtout la longue en fin)
 *   - Puis on glisse la muscu sur les jours libres ou compatibles
 *   - Le dimanche on privilégie la sortie longue
 *   - Si muscu jambes le même jour qu'une course difficile, on déplace
 *
 * Input : { course_freq, muscu_freq, objectif_course, objectif_muscu, startMonday }
 * Output : [{ dateISO, type, sous_type, titre, duree_prevue_min, intensite }]
 */
export function generateWeeklySchedule({
  course_freq,
  muscu_freq,
  objectif_course,
  objectif_muscu,
  startMonday, // date ISO du lundi de la semaine ciblée
}) {
  const runs = getRunningSessionTypes(course_freq, objectif_course);
  const lifts = getMusculationSessionTypes(muscu_freq, objectif_muscu);
  const totalSessions = runs.length + lifts.length;

  if (totalSessions === 0) return [];

  // Slots : 0..6 = lundi à dimanche
  // Contraintes générales :
  //   - Dimanche (6) préféré pour la sortie longue
  //   - Mercredi (2) souvent jour de repos "mid-week"
  //   - Lundi (0) reprise douce idéalement
  const week = [null, null, null, null, null, null, null];

  // 1. Place la sortie longue de course au dimanche si possible
  const longRunIndex = runs.findIndex(r => r.sous_type === 'longue');
  if (longRunIndex !== -1) {
    week[6] = { type: 'course', ...runs[longRunIndex] };
    runs.splice(longRunIndex, 1);
  }

  // 2. Ordre préféré de placement pour le reste :
  //    mardi, jeudi, samedi, lundi, vendredi, mercredi
  const preferredOrder = [1, 3, 5, 0, 4, 2];

  // Alterner course et muscu pour éviter doublons d'intensité
  const queue = [];
  const maxLen = Math.max(runs.length, lifts.length);
  for (let i = 0; i < maxLen; i++) {
    if (runs[i]) queue.push({ type: 'course', ...runs[i] });
    if (lifts[i]) queue.push({ type: 'muscu', ...lifts[i] });
  }

  // 3. Place en respectant preferredOrder
  for (const slot of preferredOrder) {
    if (!week[slot] && queue.length > 0) {
      week[slot] = queue.shift();
    }
  }

  // 4. Si reste des séances non placées (peu probable), les mettre sur les slots restants
  for (let i = 0; i < 7 && queue.length > 0; i++) {
    if (!week[i]) {
      week[i] = queue.shift();
    }
  }

  // 5. Remplir les jours vides par des jours de repos
  const sessions = [];
  for (let i = 0; i < 7; i++) {
    const dateISO = addDaysISO(startMonday, i);
    if (week[i]) {
      const s = week[i];
      sessions.push({
        date: dateISO,
        type: s.type,
        sous_type: s.sous_type,
        titre: s.titre,
        description: null,
        duree_prevue_min: s.duree,
        intensite: s.intensite,
        completed: false,
      });
    } else {
      sessions.push({
        date: dateISO,
        type: 'repos',
        sous_type: null,
        titre: 'Repos',
        description: 'Récupération active ou passive. Marche, étirements, mobilité légère.',
        duree_prevue_min: null,
        intensite: null,
        completed: false,
      });
    }
  }

  return sessions;
}

// =====================================================================
// HELPERS DATES
// =====================================================================

/**
 * Retourne le lundi (date ISO) de la semaine contenant la date donnée.
 */
export function getMondayOfWeek(dateISO) {
  const d = dateFromISO(dateISO);
  const day = d.getDay(); // 0 = dimanche, 1 = lundi, ..., 6 = samedi
  const diff = day === 0 ? -6 : 1 - day; // si dimanche, on recule de 6 jours
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const dd = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/**
 * Retourne les 7 dates ISO de la semaine contenant la date donnée (lundi → dimanche).
 */
export function getWeekDates(dateISO) {
  const monday = getMondayOfWeek(dateISO);
  return [0, 1, 2, 3, 4, 5, 6].map(i => addDaysISO(monday, i));
}

// =====================================================================
// ESTIMATION KCAL (METs simplifiés)
// =====================================================================

/**
 * Table METs simplifiée pour une estimation basique des kcal brûlées.
 * Formule : kcal = MET × poids_kg × (duree_min / 60)
 */
const METS = {
  course: {
    endurance: 8.5,
    fractionne: 11.5,
    seuil: 10.0,
    longue: 8.0,
  },
  muscu: {
    full_body: 5.5,
    haut: 5.0,
    bas: 6.0,
    push: 5.0,
    pull: 5.0,
    legs: 6.5,
    mobilite: 3.0,
  },
};

export function estimateSessionKcal({ type, sous_type, duree_min, poids_kg }) {
  if (!duree_min || !poids_kg || type === 'repos') return 0;
  const table = METS[type] || {};
  const met = table[sous_type] || (type === 'course' ? 8 : 5);
  return Math.round(met * poids_kg * (duree_min / 60));
}
