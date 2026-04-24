/**
 * JAMRA — Calculs métier nutritionnels et sportifs
 *
 * MODÈLE SCIENTIFIQUE (Phase 6) — refonte basée sur les meilleures études
 * disponibles dans la littérature nutritionnelle et sportive actuelle.
 *
 * RÉFÉRENCES CLÉS :
 *  - Mifflin-St Jeor (1990) — formule BMR la plus précise en population générale
 *    Frankenfield et al. 2005 (JADA) : validation ±10% vs calorimétrie
 *  - Katch-McArdle — BMR plus précis avec masse maigre connue
 *  - FAO/OMS (2001) — coefficients PAL (activité) standardisés
 *  - Tanaka (2001) — FC Max plus précise que la formule de Fox (220-age)
 *    "Age-predicted maximal heart rate revisited" JACC
 *  - Coggan & Allen (2010) — zones de FC training
 *  - Hall & Chow (2015) — modèle dynamique de perte de poids
 *    "The calculation of energy expenditure in dietary weight loss"
 *  - Trexler et al. (2014) — metabolic adaptation et diet breaks
 *    "Metabolic adaptation to weight loss: implications for the athlete"
 *  - Helms et al. (2014) — protéines en déficit pour athlètes
 *    "Evidence-based recommendations for natural bodybuilding contest prep"
 *  - Morton et al. (2018) — méta-analyse protéines + training
 *  - Phillips (2016) — 2.3-3.1 g/kg masse maigre en déficit
 *  - OMS / Dietary Guidelines for Americans 2020-2025 — fibres 14g/1000kcal
 *  - Seiler (2010) — polarized training 80/20 (Z2 vs Z4-5)
 *  - Levine (2006) — NEAT vs exercise thermogenesis
 */

// ==========================================================================
// ACTIVITY FACTORS (PAL — Physical Activity Level, FAO/OMS 2001)
// ==========================================================================
// Ces coefficients n'incluent PAS l'exercice structuré (EAT).
// Ils couvrent uniquement l'activité non-exercise (NEAT) + activité professionnelle.
// L'exercice est comptabilisé séparément via Strava.
export const ACTIVITY_FACTORS = {
  sedentaire: 1.2,    // bureau, peu de marche, pas de sport structuré
  leger:      1.375,  // travail debout ou marche quotidienne régulière
  modere:     1.55,   // métier physique ou marche intensive (>10 000 pas)
  intense:    1.725,  // métier très physique (manutention, chantier)
};

// ==========================================================================
// SCENARIOS (déficit kcal/jour — basé sur % de TDEE, pas kg/sem fixe)
// ==========================================================================
// Source : Helms et al. 2014, Trexler 2014
// On raisonne en % de TDEE plutôt qu'en kg/sem car :
//  1. Plus personnalisé (un léger et un lourd ne perdent pas pareil)
//  2. Le rythme de perte diminue naturellement (adaptive thermogenesis)
//  3. Permet de savoir si on est en "mild / moderate / aggressive deficit"
export const SCENARIOS = {
  durable:      { label: 'Durable',      deficit_pct: 0.12, description: '~10-15% du TDEE' },
  modere:       { label: 'Modéré',       deficit_pct: 0.18, description: '~15-20% du TDEE' },
  intermediaire:{ label: 'Intermédiaire',deficit_pct: 0.22, description: '~20-25% du TDEE' },
  agressif:     { label: 'Agressif',     deficit_pct: 0.28, description: '~25-30% du TDEE, diet breaks requis' },
};

// Compatibilité : conversion kg/semaine approximative pour affichage UX
export const SCENARIO_KG_PER_WEEK = {
  durable:       0.5,
  modere:        0.7,
  intermediaire: 0.85,
  agressif:      1.0,
};

// ==========================================================================
// AGE
// ==========================================================================
export function calculateAge(dateNaissance) {
  if (!dateNaissance) return null;
  const birth = new Date(dateNaissance);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// ==========================================================================
// IMC
// ==========================================================================
export function calculateBMI({ poids_kg, taille_cm }) {
  if (!poids_kg || !taille_cm) return null;
  const m = taille_cm / 100;
  return Math.round((poids_kg / (m * m)) * 10) / 10;
}

// ==========================================================================
// MÉTABOLISME DE BASE
// ==========================================================================

/**
 * BMR Mifflin-St Jeor (1990)
 * Formule par défaut pour tous. Précision ±10% vs calorimétrie indirecte.
 *
 * ⚠️ IMPORTANT : utiliser le poids ACTUEL, pas le poids initial, sinon
 * le BMR ne diminue pas avec la perte de poids → plateau artificiel.
 */
export function calculateBMRMifflin({ sexe, poids_kg, taille_cm, age }) {
  if (!poids_kg || !taille_cm || !age) return null;
  const base = (10 * poids_kg) + (6.25 * taille_cm) - (5 * age);
  // Sexe accepté : 'homme'/'femme' (français app) ou 'h'/'f' (code SQL)
  const isMale = sexe === 'homme' || sexe === 'h' || sexe === 'male' || sexe === 'm';
  return Math.round(isMale ? base + 5 : base - 161);
}

/**
 * BMR Katch-McArdle — plus précis quand on connaît la masse maigre (FFM).
 * Recommandé pour sportifs ou personnes avec composition corporelle connue.
 * FFM = Fat-Free Mass (masse maigre) en kg.
 */
export function calculateBMRKatchMcArdle({ ffm_kg }) {
  if (!ffm_kg || ffm_kg <= 0) return null;
  return Math.round(370 + (21.6 * ffm_kg));
}

/**
 * BMR "auto" : utilise Katch-McArdle si FFM disponible, sinon Mifflin.
 */
export function calculateBMR(profile) {
  if (profile.ffm_kg && profile.ffm_kg > 0) {
    return calculateBMRKatchMcArdle({ ffm_kg: profile.ffm_kg });
  }
  return calculateBMRMifflin({
    sexe: profile.sexe,
    poids_kg: profile.poids_kg,
    taille_cm: profile.taille_cm,
    age: profile.age,
  });
}

// Compat descendant : certains endroits de l'app appellent encore l'ancienne signature
// { sexe, poids_kg, taille_cm, age }
export function calculateBMRLegacy({ sexe, poids_kg, taille_cm, age }) {
  return calculateBMRMifflin({ sexe, poids_kg, taille_cm, age });
}

// ==========================================================================
// TDEE — Dépense énergétique totale
// ==========================================================================

/**
 * TDEE "de base" = BMR × PAL (niveau d'activité non-sportive).
 * Ce nombre ne comprend PAS l'exercice structuré.
 * L'exercice est ajouté via addExerciseBurn() avec les données Strava.
 */
export function calculateTDEEBase(bmr, niveauActivite) {
  const factor = ACTIVITY_FACTORS[niveauActivite] ?? 1.2;
  return Math.round(bmr * factor);
}

/**
 * Ajoute la dépense exercice aux TDEE.
 * On ajoute 100% des kcal Strava (vraie mesure via FC ou calcul MET).
 * Pas de coefficient réducteur : c'est la beauté de séparer NEAT (inclus dans PAL)
 * et EAT (mesuré séparément par Strava).
 */
export function applyExerciseBurn(tdeeBase, extraKcalBurned = 0) {
  return Math.round(tdeeBase + (extraKcalBurned || 0));
}

// ==========================================================================
// ADAPTIVE THERMOGENESIS
// ==========================================================================

/**
 * Ajuste le TDEE pour tenir compte de l'adaptation métabolique observée.
 *
 * Principe (Hall 2011, Trexler 2014) : après plusieurs semaines de déficit,
 * le corps baisse son TDEE réel de 5 à 15% en plus de la baisse mécanique
 * liée à la perte de poids (down-regulation hormonale).
 *
 * Détection : si la pente observée de perte est < pente attendue, on
 * applique un ajustement à la baisse du TDEE.
 *
 * @param {number} tdeeTheoretical - TDEE calculé par les formules
 * @param {number} adaptationPct - ajustement en % (ex: -0.08 = -8%)
 * @returns {number} TDEE ajusté
 */
export function applyMetabolicAdaptation(tdeeTheoretical, adaptationPct = 0) {
  const adjustment = Math.max(-0.20, Math.min(0, adaptationPct)); // cap à -20%
  return Math.round(tdeeTheoretical * (1 + adjustment));
}

// ==========================================================================
// APPORT CIBLE selon scénario
// ==========================================================================

/**
 * Calcule la cible kcal quotidienne depuis le TDEE et le scénario.
 * On raisonne en % de TDEE plutôt qu'en kg/semaine absolu.
 */
export function calculateTargetCalories(tdee, scenario) {
  const scenarioConfig = SCENARIOS[scenario] ?? SCENARIOS.modere;
  const deficit = Math.round(tdee * scenarioConfig.deficit_pct);

  // Floor : ne jamais descendre sous 1200 kcal femmes / 1500 kcal hommes
  // (Valeurs de sécurité Academy of Nutrition and Dietetics)
  // TODO : pourrait dépendre du sexe une fois remonté ici
  const MIN_TARGET = 1500;
  const target = Math.max(tdee - deficit, MIN_TARGET);

  return {
    target,
    deficit: tdee - target,
    deficit_pct: scenarioConfig.deficit_pct,
  };
}

// ==========================================================================
// MACROS — répartition
// ==========================================================================

/**
 * Calcule la répartition des macros selon les dernières recos scientifiques.
 *
 * PROTÉINES (g/kg poids corporel) :
 *  - Maintien / sédentaire : 1.2 g/kg (FAO/OMS)
 *  - Sportif non déficit : 1.6-1.8 g/kg (Morton 2018)
 *  - Sportif en déficit modéré : 2.0 g/kg
 *  - Sportif en déficit agressif : 2.2-2.4 g/kg (Helms 2014)
 *
 * LIPIDES : minimum 0.8 g/kg (santé hormonale, absorption vitamines liposolubles)
 *  puis compléter pour atteindre 20-35% des kcal totales (AMDR WHO)
 *
 * GLUCIDES : le reste. Athlète endurance visera 4-6 g/kg si performance,
 *  ici on calcule le reliquat.
 *
 * FIBRES : 14 g / 1000 kcal (Dietary Guidelines 2020-2025)
 */
export function calculateMacros({ poids_kg, target_kcal, tdee, objectif, scenario }) {
  // Protéines
  const proteinPerKg = (() => {
    // Priorité au scénario de déficit car c'est le driver principal
    if (scenario === 'agressif')      return 2.3;
    if (scenario === 'intermediaire') return 2.1;
    if (scenario === 'modere')        return 2.0;
    if (scenario === 'durable')       return 1.8;
    // Sinon selon objectif
    switch (objectif) {
      case 'perte_poids':  return 2.0;
      case 'prise_muscle': return 2.0;
      case 'performance':  return 1.8;
      case 'entretien':    return 1.4;
      default:             return 1.8;
    }
  })();

  const proteinsG = Math.round(poids_kg * proteinPerKg);
  const proteinKcal = proteinsG * 4;

  // Lipides : 25-30% du target, minimum 0.8 g/kg
  const fatKcalTarget = Math.round(target_kcal * 0.27);
  const fatG = Math.max(Math.round(fatKcalTarget / 9), Math.round(poids_kg * 0.8));
  const fatKcal = fatG * 9;

  // Glucides : le reste
  const carbsKcal = Math.max(target_kcal - proteinKcal - fatKcal, 0);
  const carbsG = Math.round(carbsKcal / 4);

  // Fibres : scaling selon kcal consommées (14 g / 1000 kcal)
  const fiberG = Math.round(14 * (target_kcal / 1000));

  return {
    proteines_g: proteinsG,
    proteines_g_par_kg: proteinPerKg,
    lipides_g: fatG,
    glucides_g: carbsG,
    fibres_g: fiberG,
    proteines_pct: Math.round((proteinKcal / target_kcal) * 100),
    lipides_pct: Math.round((fatKcal / target_kcal) * 100),
    glucides_pct: Math.round((carbsKcal / target_kcal) * 100),
  };
}

// ==========================================================================
// CALCUL COMPLET à partir d'un profil
// ==========================================================================

/**
 * Calcul complet avec tout l'arsenal scientifique :
 *  - BMR Mifflin sur poids ACTUEL (pas initial)
 *  - TDEE base (PAL sans exercise) + ajustement métabolique si fourni
 *  - Ajout 100% Strava kcal pour la journée
 *  - Target kcal en % de TDEE (pas kg/sem fixe)
 *  - Macros selon scénario + poids actuel
 *
 * @param {object} profile - profil utilisateur
 * @param {object} opts - { extraKcalBurned, adaptationPct }
 */
export function computeProfileMetrics(profile, { extraKcalBurned = 0, adaptationPct = 0 } = {}) {
  if (!profile) return null;

  const age = calculateAge(profile.date_naissance);

  // ⚠️ Utilise poids ACTUEL (ou initial à défaut pour le jour 0)
  const poidsActuel = profile.poids_actuel_kg || profile.poids_initial_kg;

  const bmr = calculateBMRMifflin({
    sexe: profile.sexe,
    poids_kg: poidsActuel,
    taille_cm: profile.taille_cm,
    age,
  });
  if (!bmr) return { age };

  const tdeeTheoretical = calculateTDEEBase(bmr, profile.niveau_activite);

  // Ajustement adaptatif (par défaut 0, peut être -5% à -15% si détecté)
  const tdeeAdjusted = applyMetabolicAdaptation(tdeeTheoretical, adaptationPct);

  // + exercice mesuré Strava (100%, pas de double comptage car PAL=non-sport)
  const tdee = applyExerciseBurn(tdeeAdjusted, extraKcalBurned);

  const { target: target_kcal, deficit, deficit_pct } = calculateTargetCalories(tdee, profile.scenario);

  const macros = calculateMacros({
    poids_kg: poidsActuel,
    target_kcal,
    tdee,
    objectif: profile.objectif,
    scenario: profile.scenario,
  });

  return {
    age,
    poids_utilise_kg: poidsActuel,
    bmr,
    tdee_theoretical: tdeeTheoretical,
    tdee_adjusted: tdeeAdjusted,
    tdee,
    strava_adjustment: extraKcalBurned,
    adaptation_pct: adaptationPct,
    target_kcal,
    target_kcal_base: target_kcal - extraKcalBurned,
    deficit_kcal: deficit,
    deficit_pct: Math.round(deficit_pct * 100),
    ...macros,
  };
}

// ==========================================================================
// FRÉQUENCE CARDIAQUE — Zones de training
// ==========================================================================

/**
 * FC Max selon Tanaka (2001) — plus précise que Fox (220 - age).
 * Validée sur 514 études et 18 712 sujets.
 */
export function calculateHRMaxTanaka(age) {
  if (!age) return null;
  return Math.round(208 - 0.7 * age);
}

/**
 * HR Reserve (Karvonen) : FC_max - FC_repos
 */
export function calculateHRReserve(hrMax, hrRest) {
  if (!hrMax || !hrRest) return null;
  return hrMax - hrRest;
}

/**
 * Zones d'entraînement selon le modèle Coggan 5-zone basé sur %FCMax.
 * Note : le modèle original est en %FTP pour le vélo. En course, on utilise
 * les seuils approximatifs suivants validés par Seiler 2010 :
 *   Z1 récup active     : < 68% FC_max
 *   Z2 endurance        : 68-82% FC_max  ← la plus importante en volume (80/20)
 *   Z3 tempo            : 83-94% FC_max
 *   Z4 seuil (LT)       : 95-105% FC_LT ≈ 85-92% FC_max
 *   Z5 VO2max           : >92% FC_max
 *
 * Pour rester simple, on utilise la version % FC max qui est accessible sans
 * test de lactate.
 */
export function calculateHRZones(hrMax) {
  if (!hrMax) return null;
  return {
    z1: { min: 0, max: Math.round(hrMax * 0.68), label: 'Z1 Récupération', description: 'Très facile, conversation aisée' },
    z2: { min: Math.round(hrMax * 0.68) + 1, max: Math.round(hrMax * 0.82), label: 'Z2 Endurance fondamentale', description: 'Aérobie, phrases complètes possibles' },
    z3: { min: Math.round(hrMax * 0.82) + 1, max: Math.round(hrMax * 0.88), label: 'Z3 Tempo', description: 'Allure soutenue, respiration plus lourde' },
    z4: { min: Math.round(hrMax * 0.88) + 1, max: Math.round(hrMax * 0.94), label: 'Z4 Seuil', description: 'Seuil anaérobie, inconfortable' },
    z5: { min: Math.round(hrMax * 0.94) + 1, max: hrMax, label: 'Z5 VO2max', description: 'Effort maximal, soutenable qq minutes' },
  };
}

/**
 * Détermine dans quelle zone se trouve une FC moyenne de séance.
 */
export function detectZone(hr, hrMax) {
  if (!hr || !hrMax) return null;
  const pct = hr / hrMax;
  if (pct < 0.68) return 'z1';
  if (pct < 0.82) return 'z2';
  if (pct < 0.88) return 'z3';
  if (pct < 0.94) return 'z4';
  return 'z5';
}

// ==========================================================================
// PROJECTION DATE D'ATTEINTE D'OBJECTIF (modèle Hall 2011 simplifié)
// ==========================================================================

/**
 * Modèle logarithmique de perte de poids : la perte ralentit au fil du temps
 * car le BMR diminue avec le poids et adaptive thermogenesis s'installe.
 *
 * Simplification de Hall 2011 : on approche par un decay exponentiel calibré
 * sur la pente observée récente.
 *
 * @param {number} poidsActuel
 * @param {number} poidsCible
 * @param {number} slopePerWeekObserved - pente kg/sem observée sur les 2-4 dernières sem
 * @returns {Date|null}
 */
export function projectTargetDate({ poidsActuel, poidsCible, slopePerWeekObserved, scenario }) {
  if (!poidsActuel || !poidsCible) return null;
  const kgToLose = poidsActuel - poidsCible;
  if (kgToLose <= 0) return null;

  // Si on a une pente observée (au moins 3 pesées), on l'utilise
  let kgPerWeek = null;
  if (slopePerWeekObserved != null && slopePerWeekObserved < 0) {
    kgPerWeek = Math.abs(slopePerWeekObserved);
  } else {
    kgPerWeek = SCENARIO_KG_PER_WEEK[scenario] ?? 0.5;
  }

  // Modèle logarithmique simplifié : on suppose que le rythme diminue
  // de 10% par 3 kg perdus (adaptive thermogenesis cumulative)
  // Formule : weeks = -ln(1 - kgToLose * decayRate / kgPerWeek) / decayRate
  // Pour simplifier, on fait une estimation par simulation pas-à-pas hebdo.
  let remainingKg = kgToLose;
  let weeks = 0;
  let currentRate = kgPerWeek;
  const MAX_WEEKS = 520; // 10 ans max

  while (remainingKg > 0 && weeks < MAX_WEEKS) {
    remainingKg -= currentRate;
    weeks++;
    // Adaptive slowdown : -2% de rythme par semaine, plafonné à 50% du rythme initial
    currentRate = Math.max(kgPerWeek * 0.5, currentRate * 0.98);
  }

  if (weeks >= MAX_WEEKS) return null;

  const target = new Date();
  target.setDate(target.getDate() + weeks * 7);
  return target;
}

// ==========================================================================
// RÉGRESSION LINÉAIRE — tendance réelle des pesées
// ==========================================================================

export function linearRegression(points) {
  if (!points || points.length < 2) return null;
  const n = points.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
    sumYY += p.y * p.y;
  }
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return null;
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  const meanY = sumY / n;
  let ssRes = 0, ssTot = 0;
  for (const p of points) {
    const yPred = slope * p.x + intercept;
    ssRes += (p.y - yPred) ** 2;
    ssTot += (p.y - meanY) ** 2;
  }
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  return { slope, intercept, r2 };
}

/**
 * Calcule tendance de poids avec modèle Hall amélioré.
 * Retourne { slope, slopePerWeek, r2, projectedTargetDate, daysToTarget, ... }
 */
export function projectWeightTrend(weights, targetKg) {
  if (!weights || weights.length < 2) return null;

  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const firstDate = new Date(sorted[0].date);
  const points = sorted.map(w => ({
    x: (new Date(w.date) - firstDate) / (1000 * 60 * 60 * 24),
    y: w.poids_kg,
  }));

  const reg = linearRegression(points);
  if (!reg) return null;

  const { slope, intercept, r2 } = reg;
  const slopePerWeek = Math.round(slope * 7 * 100) / 100;

  const today = new Date();
  const daysFromStart = (today - firstDate) / (1000 * 60 * 60 * 24);
  const predictedToday = Math.round((slope * daysFromStart + intercept) * 10) / 10;

  let projectedTargetDate = null;
  let daysToTarget = null;
  if (targetKg != null && slope < 0) {
    const currentWeight = sorted[sorted.length - 1].poids_kg;
    // Utilisation du modèle Hall (logarithmique)
    projectedTargetDate = projectTargetDate({
      poidsActuel: currentWeight,
      poidsCible: targetKg,
      slopePerWeekObserved: slopePerWeek,
    });
    if (projectedTargetDate) {
      daysToTarget = Math.round((projectedTargetDate - Date.now()) / (1000 * 60 * 60 * 24));
    }
  }

  return {
    slope,
    slopePerWeek,
    r2: Math.round(r2 * 100) / 100,
    predictedToday,
    projectedTargetDate,
    daysToTarget,
    pointsCount: sorted.length,
    firstDate: sorted[0].date,
    lastDate: sorted[sorted.length - 1].date,
  };
}

// ==========================================================================
// DÉTECTION D'ADAPTIVE THERMOGENESIS
// ==========================================================================

/**
 * À partir de la pente observée et du déficit intake vs TDEE prédit,
 * calcule le pourcentage d'adaptation métabolique apparente.
 *
 * Logique :
 *   Si sur X semaines, on a un déficit moyen intake-TDEE de D kcal/jour,
 *   on devrait perdre D × X × 7 / 7700 kg.
 *   Si on perd moins, c'est que le TDEE réel est < TDEE prédit.
 *   L'écart donne l'adaptation.
 *
 * Requiert au moins 21 jours de données (3 semaines) pour être fiable.
 *
 * @param {object} params
 * @param {number} params.actualKgLost - kg perdus sur la période
 * @param {number} params.avgIntakeKcal - apport moyen kcal/jour sur la période
 * @param {number} params.avgTdeeTheoreticalKcal - TDEE théorique moyen kcal/jour
 * @param {number} params.days - nombre de jours
 * @returns {object} { adaptation_pct, detected }
 */
export function detectAdaptiveThermogenesis({ actualKgLost, avgIntakeKcal, avgTdeeTheoreticalKcal, days }) {
  if (!actualKgLost || !avgIntakeKcal || !avgTdeeTheoreticalKcal || !days || days < 21) {
    return { adaptation_pct: 0, detected: false, reason: 'données insuffisantes' };
  }

  const theoreticalDeficitKcalPerDay = avgTdeeTheoreticalKcal - avgIntakeKcal;
  if (theoreticalDeficitKcalPerDay < 100) {
    // Pas de vrai déficit, détection non applicable
    return { adaptation_pct: 0, detected: false, reason: 'déficit insuffisant' };
  }

  const theoreticalKgLost = (theoreticalDeficitKcalPerDay * days) / 7700;
  const actualVsTheoretical = actualKgLost / theoreticalKgLost;

  // Si on perd moins que prévu, TDEE réel < TDEE théorique
  // TDEE_reel = TDEE_theorique × ratio
  // adaptation = ratio - 1 (négatif si adaptation)
  if (actualVsTheoretical >= 0.95) {
    return { adaptation_pct: 0, detected: false, reason: 'pas d\'adaptation significative' };
  }

  // Calculer l'ajustement nécessaire pour expliquer la perte réelle
  const requiredDeficitForObserved = (actualKgLost * 7700) / days;
  const requiredTdee = avgIntakeKcal + requiredDeficitForObserved;
  const adaptation_pct = (requiredTdee / avgTdeeTheoreticalKcal) - 1;

  return {
    adaptation_pct: Math.max(-0.20, Math.min(0, adaptation_pct)), // cap
    detected: true,
    theoreticalKgLost: Math.round(theoreticalKgLost * 10) / 10,
    actualKgLost: Math.round(actualKgLost * 10) / 10,
    days,
  };
}

// ==========================================================================
// DIET BREAK SCHEDULER (Trexler 2014, Byrne 2018 MATADOR)
// ==========================================================================

/**
 * Détermine si l'utilisateur devrait faire un diet break.
 *
 * Règles (Trexler 2014) :
 *  - Déficit agressif > 4 semaines consécutives → recommande 1-2 sem à maintenance
 *  - Déficit modéré > 8 semaines consécutives → recommande 1 sem à maintenance
 *  - Plateau observé (< 0.2 kg perdu sur 2 semaines consécutives) → refeed/break
 *
 * @param {object} params
 * @param {string} params.scenario
 * @param {number} params.weeksInDeficit - nombre de semaines consécutives en déficit
 * @param {number} params.slopePerWeek - pente observée sur 2 dernières semaines
 * @returns {object} { shouldBreak, reason, recommendedWeeks }
 */
export function shouldRecommendDietBreak({ scenario, weeksInDeficit, slopePerWeek }) {
  if (!scenario || !weeksInDeficit) {
    return { shouldBreak: false };
  }

  // Plateau détecté
  if (slopePerWeek != null && Math.abs(slopePerWeek) < 0.1 && weeksInDeficit >= 3) {
    return {
      shouldBreak: true,
      reason: 'plateau',
      recommendedWeeks: 1,
      message: 'Ta courbe stagne depuis 2+ semaines. Un refeed à maintenance peut réactiver le métabolisme.',
    };
  }

  // Déficit agressif trop long
  if ((scenario === 'agressif' || scenario === 'intermediaire') && weeksInDeficit >= 4) {
    return {
      shouldBreak: true,
      reason: 'déficit agressif prolongé',
      recommendedWeeks: 2,
      message: `${weeksInDeficit} semaines consécutives en déficit agressif. Études MATADOR : 2 semaines de pause améliorent le résultat final.`,
    };
  }

  // Déficit modéré trop long
  if (scenario === 'modere' && weeksInDeficit >= 8) {
    return {
      shouldBreak: true,
      reason: 'déficit modéré prolongé',
      recommendedWeeks: 1,
      message: `${weeksInDeficit} semaines en déficit. Une semaine de maintenance aide à préserver le métabolisme.`,
    };
  }

  return { shouldBreak: false };
}

// ==========================================================================
// CALCUL kcal PAR ZONE (pour analyse de charge d'entraînement)
// ==========================================================================

/**
 * TRIMP (Training Impulse) — mesure de la charge d'une séance.
 * Banister 1975, révisé par Edwards 1993.
 *
 * TRIMP = sum over zones of (temps_zone × facteur_zone)
 * facteurs Edwards : Z1=1, Z2=2, Z3=3, Z4=4, Z5=5
 *
 * @param {object} zoneTimeSeconds { z1, z2, z3, z4, z5 } en secondes
 * @returns {number} TRIMP en points
 */
export function calculateTRIMP(zoneTimeSeconds) {
  const factors = { z1: 1, z2: 2, z3: 3, z4: 4, z5: 5 };
  let trimp = 0;
  for (const [zone, seconds] of Object.entries(zoneTimeSeconds || {})) {
    if (factors[zone]) {
      trimp += (seconds / 60) * factors[zone];
    }
  }
  return Math.round(trimp);
}

// ==========================================================================
// EXPORTS LEGACY COMPAT (utilisé dans les anciennes pages)
// ==========================================================================

/**
 * Wrapper pour rétrocompatibilité : calculateTDEE appelé avec niveau_activite.
 * Usage : calculateTDEE(bmr, 'modere')
 */
export function calculateTDEE(bmr, niveauActivite) {
  return calculateTDEEBase(bmr, niveauActivite);
}
