/**
 * JAMRA - Calculs métier nutritionnels
 *
 * Formules utilisées :
 *  - Métabolisme de Base (MB) : Mifflin-St Jeor
 *  - Dépense Énergétique Totale (DET / TDEE) : MB × facteur d'activité
 *  - Déficit selon scénario : conversion 1 kg = 7700 kcal
 *  - Répartition macros : basée sur protéines g/kg + répartition lipides/glucides
 */

// ==========================================================================
// ACTIVITY FACTORS (standard nutrition research)
// ==========================================================================
export const ACTIVITY_FACTORS = {
  sedentaire: 1.2,   // bureau, très peu d'activité
  leger: 1.375,      // marche quotidienne, 1-2 séances/sem
  modere: 1.55,      // 3-4 séances/sem
  intense: 1.725,    // 5+ séances/sem
};

// ==========================================================================
// SCENARIOS (deficit pour perte de poids)
// ==========================================================================
// 1 kg de masse grasse ≈ 7700 kcal
// Rythmes recommandés : 0.5 à 1% du poids corporel par semaine
export const SCENARIOS = {
  durable:       { label: 'Durable',       kg_par_semaine: 0.5 },
  modere:        { label: 'Modéré',        kg_par_semaine: 0.7 },
  intermediaire: { label: 'Intermédiaire', kg_par_semaine: 0.8 },
  agressif:      { label: 'Agressif',      kg_par_semaine: 1.0 },
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
// MÉTABOLISME DE BASE (Mifflin-St Jeor)
// ==========================================================================
export function calculateBMR({ sexe, poids_kg, taille_cm, age }) {
  if (!poids_kg || !taille_cm || !age) return null;

  // Mifflin-St Jeor :
  // Homme : 10W + 6.25H - 5A + 5
  // Femme : 10W + 6.25H - 5A - 161
  const base = (10 * poids_kg) + (6.25 * taille_cm) - (5 * age);
  return Math.round(sexe === 'homme' ? base + 5 : base - 161);
}

// ==========================================================================
// TDEE — Dépense énergétique totale
// ==========================================================================
export function calculateTDEE(bmr, niveauActivite) {
  const factor = ACTIVITY_FACTORS[niveauActivite] ?? 1.2;
  return Math.round(bmr * factor);
}

// ==========================================================================
// APPORT CIBLE selon scénario
// ==========================================================================
export function calculateTargetCalories(tdee, scenario) {
  const kgPerWeek = SCENARIOS[scenario]?.kg_par_semaine ?? 0.5;
  const kcalDeficitPerDay = Math.round((kgPerWeek * 7700) / 7);
  return {
    target: tdee - kcalDeficitPerDay,
    deficit: kcalDeficitPerDay,
  };
}

// ==========================================================================
// RÉPARTITION MACROS
// ==========================================================================
export function calculateMacros({ poids_kg, target_kcal, objectif }) {
  // Protéines selon objectif (g/kg de poids corporel)
  const proteinPerKg = (() => {
    switch (objectif) {
      case 'perte_poids':   return 1.8;  // préservation masse maigre en déficit
      case 'prise_muscle':  return 2.0;
      case 'performance':   return 1.8;
      case 'entretien':     return 1.4;
      default:              return 1.6;
    }
  })();

  const proteinsG = Math.round(poids_kg * proteinPerKg);
  const proteinKcal = proteinsG * 4;

  // Lipides : 30% des kcal restantes (minimum 0.8 g/kg pour santé hormonale)
  const fatKcalTarget = Math.round(target_kcal * 0.30);
  const fatG = Math.max(Math.round(fatKcalTarget / 9), Math.round(poids_kg * 0.8));
  const fatKcal = fatG * 9;

  // Glucides : le reste
  const carbsKcal = Math.max(target_kcal - proteinKcal - fatKcal, 0);
  const carbsG = Math.round(carbsKcal / 4);

  // Fibres cible : 25-30 g (on vise 28 g)
  const fiberG = 28;

  return {
    proteines_g: proteinsG,
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
export function computeProfileMetrics(profile, { extraKcalBurned = 0 } = {}) {
  if (!profile) return null;

  const age = calculateAge(profile.date_naissance);
  const bmr = calculateBMR({
    sexe: profile.sexe,
    poids_kg: profile.poids_initial_kg,
    taille_cm: profile.taille_cm,
    age,
  });
  if (!bmr) return { age };

  const tdeeBase = calculateTDEE(bmr, profile.niveau_activite);
  // Le niveau d'activité déclaré dans l'onboarding inclut déjà une estimation
  // d'activité sportive moyenne. Pour éviter la double comptabilisation, on ne
  // rajoute qu'une partie (70%) des kcal brûlées réelles via Strava.
  // 70% est un compromis : ça reconnaît l'effort réel tout en gardant une
  // pression modérée sur le déficit.
  const strava_adjustment = Math.round(extraKcalBurned * 0.7);
  const tdee = tdeeBase + strava_adjustment;

  const { target: target_kcal, deficit } = calculateTargetCalories(tdee, profile.scenario);
  const macros = calculateMacros({
    poids_kg: profile.poids_initial_kg,
    target_kcal,
    objectif: profile.objectif,
  });

  return {
    age,
    bmr,
    tdee_base: tdeeBase,
    tdee,
    strava_adjustment,
    target_kcal,
    target_kcal_base: target_kcal - strava_adjustment,
    deficit_kcal: deficit,
    ...macros,
  };
}

// ==========================================================================
// PROJECTION DATE D'ATTEINTE D'OBJECTIF
// ==========================================================================
export function projectTargetDate({ poids_actuel_kg, poids_cible_kg, scenario, date_debut }) {
  if (!poids_actuel_kg || !poids_cible_kg) return null;
  const kgToLose = poids_actuel_kg - poids_cible_kg;
  if (kgToLose <= 0) return null;

  const kgPerWeek = SCENARIOS[scenario]?.kg_par_semaine ?? 0.5;
  const weeks = Math.ceil(kgToLose / kgPerWeek);

  const start = date_debut ? new Date(date_debut) : new Date();
  const target = new Date(start);
  target.setDate(target.getDate() + weeks * 7);
  return target;
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
// RÉGRESSION LINÉAIRE — tendance réelle des pesées
// ==========================================================================

/**
 * Régression linéaire sur un tableau de points { x, y }.
 * Retourne { slope, intercept, r2 } ou null si < 2 points.
 */
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
  // Coefficient de détermination R²
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
 * À partir d'une liste de pesées { date, poids_kg }, calcule :
 *  - la pente (kg / jour)
 *  - la pente hebdo (kg / semaine)
 *  - la date projetée d'atteinte du poids cible
 *  - le poids prédit aujourd'hui selon la tendance
 *
 * Points transformés : x = jours depuis la première pesée, y = poids
 * Minimum 2 pesées requises.
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
  const slopePerWeek = slope * 7;

  // Aujourd'hui
  const today = new Date();
  const daysFromStart = (today - firstDate) / (1000 * 60 * 60 * 24);
  const predictedToday = Math.round((slope * daysFromStart + intercept) * 10) / 10;

  // Date projetée d'atteinte du target
  let projectedTargetDate = null;
  let daysToTarget = null;
  if (targetKg != null && slope !== 0) {
    const currentWeight = sorted[sorted.length - 1].poids_kg;
    const daysNeeded = (targetKg - currentWeight) / slope;
    if (daysNeeded > 0 && daysNeeded < 3650) {
      const d = new Date(sorted[sorted.length - 1].date);
      d.setDate(d.getDate() + Math.round(daysNeeded));
      projectedTargetDate = d;
      daysToTarget = Math.round(daysNeeded);
    }
  }

  return {
    slope,
    slopePerWeek: Math.round(slopePerWeek * 100) / 100,
    r2: Math.round(r2 * 100) / 100,
    predictedToday,
    projectedTargetDate,
    daysToTarget,
    pointsCount: sorted.length,
    firstDate: sorted[0].date,
    lastDate: sorted[sorted.length - 1].date,
  };
}
