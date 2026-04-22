/**
 * JAMRA - Base de données locale (IndexedDB via Dexie)
 *
 * Modèle de données Phase 1 — 6 entités
 */

import Dexie from 'dexie';
import { FOODS_DATASET } from './foodsDataset';

export const db = new Dexie('jamra_db');

db.version(1).stores({
  profil: '++id',
  aliments: '++id, source, source_id, nom, code_barres, is_favori, dernier_usage, nombre_usages, categorie',
  consommations: '++id, date, type_repas, aliment_id, [date+type_repas]',
  pesees: '++id, &date',
  repasTypes: '++id, nom, nombre_usages',
  repasTypeItems: '++id, repas_type_id, aliment_id',
});

// ==========================================================================
// PROFIL
// ==========================================================================

export async function getProfile() {
  return await db.profil.get(1);
}

export async function saveProfile(profile) {
  const now = new Date().toISOString();
  const existing = await db.profil.get(1);
  if (existing) {
    await db.profil.update(1, { ...profile, updated_at: now });
  } else {
    await db.profil.add({
      id: 1,
      ...profile,
      created_at: now,
      updated_at: now,
    });
  }
  return await db.profil.get(1);
}

export async function isOnboarded() {
  const profile = await getProfile();
  return !!profile?.date_naissance;
}

// ==========================================================================
// IMPORT dataset (au premier lancement)
// ==========================================================================

/**
 * Importe le dataset d'aliments dans IndexedDB si ce n'est pas déjà fait.
 */
export async function importFoodsIfNeeded() {
  const DATASET_VERSION = 1;
  const versionKey = 'jamra_foods_imported_version';

  const currentVersion = Number(localStorage.getItem(versionKey) || 0);
  const existingCount = await db.aliments.where('source').equals('ciqual').count();

  if (currentVersion === DATASET_VERSION && existingCount > 0) {
    return { imported: false, count: existingCount };
  }

  if (existingCount > 0) {
    await db.aliments.where('source').equals('ciqual').delete();
  }

  const now = new Date().toISOString();
  const items = FOODS_DATASET.map(f => ({
    source: 'ciqual',
    source_id: f.id,
    nom: f.nom,
    marque: null,
    code_barres: null,
    categorie: f.categorie,
    kcal_100g: f.kcal,
    proteines_100g: f.p,
    glucides_100g: f.g,
    sucres_100g: f.s,
    lipides_100g: f.l,
    satures_100g: f.sa,
    fibres_100g: f.f,
    sel_100g: f.se,
    portion_defaut_g: f.pd,
    portion_defaut_nom: f.pn,
    is_favori: false,
    dernier_usage: null,
    nombre_usages: 0,
    created_at: now,
  }));

  await db.aliments.bulkAdd(items);
  localStorage.setItem(versionKey, String(DATASET_VERSION));
  return { imported: true, count: items.length };
}

// ==========================================================================
// ALIMENTS
// ==========================================================================

export async function getFood(id) {
  return await db.aliments.get(Number(id));
}

/**
 * Recherche d'aliments par nom (fuzzy matching simple).
 */
export async function searchFoods(query, limit = 50) {
  const q = (query || '').toLowerCase().trim();
  const normalized = normalize(q);

  const allFoods = await db.aliments.toArray();

  if (!normalized) return [];

  return allFoods
    .filter(f => normalize(f.nom).includes(normalized))
    .sort((a, b) => {
      if (a.is_favori && !b.is_favori) return -1;
      if (!a.is_favori && b.is_favori) return 1;
      const aStarts = normalize(a.nom).startsWith(normalized);
      const bStarts = normalize(b.nom).startsWith(normalized);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      const aUsage = a.nombre_usages || 0;
      const bUsage = b.nombre_usages || 0;
      if (aUsage !== bUsage) return bUsage - aUsage;
      return a.nom.localeCompare(b.nom, 'fr');
    })
    .slice(0, limit);
}

export async function getFavoriteFoods(limit = 20) {
  const all = await db.aliments.filter(f => f.is_favori === true).toArray();
  return all
    .sort((a, b) => (b.nombre_usages || 0) - (a.nombre_usages || 0) || a.nom.localeCompare(b.nom, 'fr'))
    .slice(0, limit);
}

export async function getRecentFoods(limit = 20) {
  const all = await db.aliments.filter(f => !!f.dernier_usage).toArray();
  return all
    .sort((a, b) => (b.dernier_usage || '').localeCompare(a.dernier_usage || ''))
    .slice(0, limit);
}

export async function getFoodsByCategory(categorie, limit = 100) {
  return await db.aliments
    .where('categorie').equals(categorie)
    .limit(limit)
    .toArray();
}

export async function toggleFavorite(foodId) {
  const food = await db.aliments.get(Number(foodId));
  if (!food) return;
  await db.aliments.update(Number(foodId), { is_favori: !food.is_favori });
}

export async function createCustomFood(data) {
  const now = new Date().toISOString();
  return await db.aliments.add({
    source: 'perso',
    source_id: null,
    nom: data.nom,
    marque: data.marque || null,
    code_barres: null,
    categorie: data.categorie || 'Autre',
    kcal_100g: data.kcal_100g,
    proteines_100g: data.proteines_100g,
    glucides_100g: data.glucides_100g,
    sucres_100g: data.sucres_100g,
    lipides_100g: data.lipides_100g,
    satures_100g: data.satures_100g,
    fibres_100g: data.fibres_100g,
    sel_100g: data.sel_100g,
    portion_defaut_g: data.portion_defaut_g || null,
    portion_defaut_nom: data.portion_defaut_nom || null,
    is_favori: false,
    dernier_usage: null,
    nombre_usages: 0,
    created_at: now,
  });
}

// ==========================================================================
// OPENFOODFACTS
// ==========================================================================

/**
 * Cherche un aliment par code-barres.
 * 1. D'abord en local (déjà scanné auparavant)
 * 2. Sinon, fetch OpenFoodFacts et crée l'aliment en base
 *
 * Retourne { food, source: 'local'|'off'|null, error? }
 */
export async function findFoodByBarcode(code) {
  const cleanCode = String(code || '').trim();
  if (!cleanCode) return { food: null, source: null, error: 'Code vide' };

  // 1. Recherche locale
  const existing = await db.aliments.where('code_barres').equals(cleanCode).first();
  if (existing) {
    return { food: existing, source: 'local' };
  }

  // 2. Fetch OpenFoodFacts
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanCode)}.json?fields=product_name,product_name_fr,brands,nutriments,serving_size,categories_tags,categories_tags_fr`;
    const res = await fetch(url);
    if (!res.ok) {
      return { food: null, source: null, error: `Erreur ${res.status}` };
    }
    const data = await res.json();
    if (data.status !== 1 || !data.product) {
      return { food: null, source: null, error: 'not_found' };
    }

    const id = await createFoodFromOFF(data.product, cleanCode);
    const food = await db.aliments.get(id);
    return { food, source: 'off' };
  } catch (e) {
    return { food: null, source: null, error: e.message || 'Erreur réseau' };
  }
}

/**
 * Crée un aliment à partir d'un produit OpenFoodFacts.
 */
async function createFoodFromOFF(offProduct, barcode) {
  const n = offProduct.nutriments || {};
  const tags = offProduct.categories_tags_fr || offProduct.categories_tags || [];
  const categorie = guessCategoryFromOFF(tags);

  // Énergie : priorité kcal, sinon convert kJ
  let kcal = n['energy-kcal_100g'];
  if (kcal == null && n['energy_100g'] != null) {
    kcal = Math.round(n['energy_100g'] / 4.184);
  }
  kcal = kcal != null ? Math.round(kcal) : 0;

  // Sel : si absent mais sodium présent, convertir
  let sel = n['salt_100g'];
  if (sel == null && n['sodium_100g'] != null) {
    sel = Math.round(n['sodium_100g'] * 2.5 * 100) / 100;
  }

  const now = new Date().toISOString();
  const nom = offProduct.product_name_fr || offProduct.product_name || `Produit ${barcode}`;
  const marque = offProduct.brands ? offProduct.brands.split(',')[0].trim() : null;
  const displayName = marque ? `${nom} — ${marque}` : nom;

  return await db.aliments.add({
    source: 'openfoodfacts',
    source_id: barcode,
    code_barres: barcode,
    nom: displayName.slice(0, 120),
    marque,
    categorie,
    kcal_100g: kcal,
    proteines_100g: round1(n['proteins_100g'] ?? 0),
    glucides_100g: round1(n['carbohydrates_100g'] ?? 0),
    sucres_100g: n['sugars_100g'] != null ? round1(n['sugars_100g']) : null,
    lipides_100g: round1(n['fat_100g'] ?? 0),
    satures_100g: n['saturated-fat_100g'] != null ? round1(n['saturated-fat_100g']) : null,
    fibres_100g: n['fiber_100g'] != null ? round1(n['fiber_100g']) : null,
    sel_100g: sel != null ? round2(sel) : null,
    portion_defaut_g: null,
    portion_defaut_nom: null,
    is_favori: false,
    dernier_usage: null,
    nombre_usages: 0,
    created_at: now,
  });
}

/**
 * Devine la catégorie Jamra à partir des tags OpenFoodFacts.
 */
function guessCategoryFromOFF(tags) {
  const joined = (tags || []).join(' ').toLowerCase();
  const map = [
    [/(pain|viennoiserie|cereal|biscotte|muesli|flocon)/, 'Boulangerie & céréales'],
    [/(biscuit|chocolat|bonbon|glace|sorbet|dessert|confiserie|gateau|patisserie|tarte)/, 'Sucreries & desserts'],
    [/(yaourt|fromage-blanc|petit-suisse|skyr|lait|creme|beurre|margarine|boisson-vegetale)/, 'Produits laitiers'],
    [/(fromage|camembert|emmental|mozzarella|feta|parmesan|chevre)/, 'Fromages'],
    [/(viande|charcuterie|jambon|saucis|poulet|boeuf|porc|dinde|agneau|veau|lardon|merguez|chorizo)/, 'Viandes'],
    [/(poisson|saumon|thon|maquereau|sardine|cabillaud|truite|crevette|moule|huitre)/, 'Poissons & fruits de mer'],
    [/(legume|carotte|tomate|courgette|salade|brocoli|haricot|epinard|poivron|oignon)/, 'Légumes'],
    [/(fruit|pomme|banane|orange|fraise|raisin|kiwi|ananas|peche)/, 'Fruits'],
    [/(noix|amande|noisette|cajou|pistache|cacahuete|graine)/, 'Fruits secs & oléagineux'],
    [/(legumineuse|lentille|pois-chiche|haricot-rouge|tofu|tempeh|houmous)/, 'Légumineuses'],
    [/(huile|graisse)/, 'Matières grasses'],
    [/(sauce|mayonnaise|moutarde|ketchup|vinaigrette|condiment|miel|confiture|tartiner)/, 'Condiments & sauces'],
    [/(boisson|jus|soda|eau|the|cafe|biere|vin|champagne)/, 'Boissons'],
    [/(pizza|burger|sandwich|hot-dog|quiche|sushi|chips|snack|plat-prepare)/, 'Plats préparés & snacks'],
    [/(oeuf|omelette)/, 'Œufs'],
  ];
  for (const [regex, cat] of map) {
    if (regex.test(joined)) return cat;
  }
  return 'Plats préparés & snacks';
}

// ==========================================================================
// CONSOMMATIONS
// ==========================================================================

export async function addMealEntry({ date, type_repas, aliment_id, quantite_g }) {
  const food = await db.aliments.get(Number(aliment_id));
  if (!food) throw new Error('Aliment introuvable');

  const now = new Date().toISOString();
  const factor = quantite_g / 100;

  const entry = {
    date,
    type_repas,
    aliment_id: food.id,
    aliment_nom_snapshot: food.nom,
    quantite_g,
    kcal_snapshot: Math.round(food.kcal_100g * factor),
    proteines_snapshot: round1(food.proteines_100g * factor),
    glucides_snapshot: round1(food.glucides_100g * factor),
    sucres_snapshot: food.sucres_100g != null ? round1(food.sucres_100g * factor) : null,
    lipides_snapshot: round1(food.lipides_100g * factor),
    satures_snapshot: food.satures_100g != null ? round1(food.satures_100g * factor) : null,
    fibres_snapshot: food.fibres_100g != null ? round1(food.fibres_100g * factor) : null,
    sel_snapshot: food.sel_100g != null ? round2(food.sel_100g * factor) : null,
    position: 0,
    created_at: now,
  };

  const id = await db.consommations.add(entry);

  await db.aliments.update(food.id, {
    dernier_usage: now,
    nombre_usages: (food.nombre_usages || 0) + 1,
  });

  return id;
}

export async function updateMealEntry(entryId, { quantite_g, type_repas }) {
  const entry = await db.consommations.get(Number(entryId));
  if (!entry) throw new Error('Entrée introuvable');

  const food = await db.aliments.get(entry.aliment_id);
  if (!food) throw new Error('Aliment introuvable');

  const factor = quantite_g / 100;
  const updates = {
    quantite_g,
    kcal_snapshot: Math.round(food.kcal_100g * factor),
    proteines_snapshot: round1(food.proteines_100g * factor),
    glucides_snapshot: round1(food.glucides_100g * factor),
    sucres_snapshot: food.sucres_100g != null ? round1(food.sucres_100g * factor) : null,
    lipides_snapshot: round1(food.lipides_100g * factor),
    satures_snapshot: food.satures_100g != null ? round1(food.satures_100g * factor) : null,
    fibres_snapshot: food.fibres_100g != null ? round1(food.fibres_100g * factor) : null,
    sel_snapshot: food.sel_100g != null ? round2(food.sel_100g * factor) : null,
  };
  if (type_repas) updates.type_repas = type_repas;

  await db.consommations.update(Number(entryId), updates);
}

export async function deleteMealEntry(entryId) {
  await db.consommations.delete(Number(entryId));
}

export async function getMealEntry(entryId) {
  return await db.consommations.get(Number(entryId));
}

export async function getMealsForDate(date) {
  const entries = await db.consommations.where('date').equals(date).toArray();
  const grouped = {
    petit_dej: [],
    dejeuner: [],
    diner: [],
    collation: [],
  };
  for (const e of entries) {
    if (grouped[e.type_repas]) grouped[e.type_repas].push(e);
  }
  return grouped;
}

export async function getDailyTotals(date) {
  const entries = await db.consommations.where('date').equals(date).toArray();
  const totals = {
    kcal: 0, proteines: 0, glucides: 0, sucres: 0,
    lipides: 0, satures: 0, fibres: 0, sel: 0,
    count: entries.length,
    byMeal: {
      petit_dej: { kcal: 0, count: 0 },
      dejeuner:  { kcal: 0, count: 0 },
      diner:     { kcal: 0, count: 0 },
      collation: { kcal: 0, count: 0 },
    },
  };

  for (const e of entries) {
    totals.kcal      += e.kcal_snapshot || 0;
    totals.proteines += e.proteines_snapshot || 0;
    totals.glucides  += e.glucides_snapshot || 0;
    totals.sucres    += e.sucres_snapshot || 0;
    totals.lipides   += e.lipides_snapshot || 0;
    totals.satures   += e.satures_snapshot || 0;
    totals.fibres    += e.fibres_snapshot || 0;
    totals.sel       += e.sel_snapshot || 0;
    if (totals.byMeal[e.type_repas]) {
      totals.byMeal[e.type_repas].kcal  += e.kcal_snapshot || 0;
      totals.byMeal[e.type_repas].count += 1;
    }
  }

  totals.proteines = round1(totals.proteines);
  totals.glucides  = round1(totals.glucides);
  totals.sucres    = round1(totals.sucres);
  totals.lipides   = round1(totals.lipides);
  totals.satures   = round1(totals.satures);
  totals.fibres    = round1(totals.fibres);
  totals.sel       = round2(totals.sel);

  return totals;
}

// ==========================================================================
// PESÉES
// ==========================================================================

/**
 * Ajoute ou remplace la pesée du jour donné.
 * Si c'est la pesée la plus récente, le profil (poids_actuel_kg) est synchronisé.
 */
export async function addOrUpdateWeight({ date, poids_kg }) {
  const now = new Date().toISOString();
  const existing = await db.pesees.where('date').equals(date).first();

  if (existing) {
    await db.pesees.update(existing.id, { poids_kg, updated_at: now });
  } else {
    await db.pesees.add({
      date,
      poids_kg,
      created_at: now,
      updated_at: now,
    });
  }

  // Synchronise le profil avec la pesée la plus récente
  const latest = await getLatestWeight();
  if (latest) {
    await db.profil.update(1, {
      poids_actuel_kg: latest.poids_kg,
      updated_at: now,
    });
  }
}

export async function deleteWeight(id) {
  await db.pesees.delete(Number(id));
  const latest = await getLatestWeight();
  if (latest) {
    await db.profil.update(1, { poids_actuel_kg: latest.poids_kg, updated_at: new Date().toISOString() });
  }
}

export async function getAllWeights() {
  const all = await db.pesees.toArray();
  return all.sort((a, b) => a.date.localeCompare(b.date));
}

export async function getLatestWeight() {
  const all = await db.pesees.toArray();
  if (all.length === 0) return null;
  all.sort((a, b) => b.date.localeCompare(a.date));
  return all[0];
}

export async function getWeightOnDate(date) {
  return await db.pesees.where('date').equals(date).first();
}

/**
 * Récupère les pesées sur une plage [startIso, endIso] inclusive.
 */
export async function getWeightsRange(startIso, endIso) {
  return await db.pesees
    .where('date').between(startIso, endIso, true, true)
    .sortBy('date');
}

// ==========================================================================
// JOURNAL - Plages
// ==========================================================================

/**
 * Récupère les totaux journaliers sur plusieurs dates en parallèle.
 * Retourne { [isoDate]: totals }
 */
export async function getDailyTotalsRange(isoDates) {
  const result = {};
  await Promise.all(isoDates.map(async (d) => {
    result[d] = await getDailyTotals(d);
  }));
  return result;
}

/**
 * Stats agrégées sur une plage [startIso, endIso] inclusive.
 * Retourne moyennes, jours saisis, streak, répartition vs cible.
 */
export async function getStatsOverRange(startIso, endIso, targetKcal) {
  const entries = await db.consommations
    .where('date').between(startIso, endIso, true, true)
    .toArray();

  const byDate = {};
  for (const e of entries) {
    if (!byDate[e.date]) {
      byDate[e.date] = { kcal: 0, p: 0, g: 0, l: 0, f: 0 };
    }
    byDate[e.date].kcal += e.kcal_snapshot || 0;
    byDate[e.date].p += e.proteines_snapshot || 0;
    byDate[e.date].g += e.glucides_snapshot || 0;
    byDate[e.date].l += e.lipides_snapshot || 0;
    byDate[e.date].f += e.fibres_snapshot || 0;
  }

  const loggedDates = Object.keys(byDate).sort();
  const daysLogged = loggedDates.length;

  // Compte nombre total de jours dans la plage
  const start = new Date(startIso);
  const end = new Date(endIso);
  const daysTotal = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;

  let totalKcal = 0, totalP = 0, totalG = 0, totalL = 0, totalF = 0;
  let inTarget = 0, over = 0, under = 0;
  const tolerance = 0.1;

  for (const d of loggedDates) {
    const row = byDate[d];
    totalKcal += row.kcal;
    totalP += row.p;
    totalG += row.g;
    totalL += row.l;
    totalF += row.f;
    if (targetKcal) {
      const ratio = row.kcal / targetKcal;
      if (ratio > 1 + tolerance) over++;
      else if (ratio < 1 - tolerance) under++;
      else inTarget++;
    }
  }

  const avgKcal = daysLogged > 0 ? Math.round(totalKcal / daysLogged) : 0;
  const avgP = daysLogged > 0 ? Math.round((totalP / daysLogged) * 10) / 10 : 0;
  const avgG = daysLogged > 0 ? Math.round((totalG / daysLogged) * 10) / 10 : 0;
  const avgL = daysLogged > 0 ? Math.round((totalL / daysLogged) * 10) / 10 : 0;
  const avgF = daysLogged > 0 ? Math.round((totalF / daysLogged) * 10) / 10 : 0;

  // Écart-type
  let stdKcal = 0;
  if (daysLogged > 1) {
    const variance = loggedDates.reduce((s, d) => s + (byDate[d].kcal - avgKcal) ** 2, 0) / daysLogged;
    stdKcal = Math.round(Math.sqrt(variance));
  }

  // Streak : jours consécutifs saisis se terminant à endIso
  let streak = 0;
  const cursor = new Date(endIso);
  while (true) {
    const iso = cursor.toISOString().slice(0, 10);
    if (byDate[iso]) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    daysTotal,
    daysLogged,
    loggedDates,
    avgKcal,
    avgP,
    avgG,
    avgL,
    avgF,
    stdKcal,
    totalKcal,
    inTarget,
    over,
    under,
    streak,
    byDate,
  };
}

// ==========================================================================
// DUPLICATION DE REPAS
// ==========================================================================

/**
 * Copie les entrées d'un repas source vers un repas destination.
 * Retourne le nombre d'entrées copiées.
 */
export async function copyMealEntries({ srcDate, srcMeal, destDate, destMeal }) {
  const srcEntries = await db.consommations
    .where('[date+type_repas]')
    .equals([srcDate, srcMeal])
    .toArray();

  if (srcEntries.length === 0) return 0;

  const now = new Date().toISOString();
  const newEntries = srcEntries.map(e => ({
    date: destDate,
    type_repas: destMeal,
    aliment_id: e.aliment_id,
    aliment_nom_snapshot: e.aliment_nom_snapshot,
    quantite_g: e.quantite_g,
    kcal_snapshot: e.kcal_snapshot,
    proteines_snapshot: e.proteines_snapshot,
    glucides_snapshot: e.glucides_snapshot,
    sucres_snapshot: e.sucres_snapshot,
    lipides_snapshot: e.lipides_snapshot,
    satures_snapshot: e.satures_snapshot,
    fibres_snapshot: e.fibres_snapshot,
    sel_snapshot: e.sel_snapshot,
    position: 0,
    created_at: now,
  }));

  await db.consommations.bulkAdd(newEntries);

  // Mettre à jour compteurs d'usage
  for (const e of newEntries) {
    const food = await db.aliments.get(e.aliment_id);
    if (food) {
      await db.aliments.update(e.aliment_id, {
        dernier_usage: now,
        nombre_usages: (food.nombre_usages || 0) + 1,
      });
    }
  }

  return newEntries.length;
}

/**
 * Retourne les dates (ISO) des 14 derniers jours où au moins un repas a été saisi.
 * Utile pour le sélecteur de date source en duplication.
 */
export async function getRecentLoggedDates(limit = 14) {
  const all = await db.consommations.toArray();
  const dates = [...new Set(all.map(e => e.date))].sort().reverse();
  return dates.slice(0, limit);
}

// ==========================================================================
// ÉDITION / SUPPRESSION ALIMENT PERSO
// ==========================================================================

export async function updateCustomFood(id, data) {
  const existing = await db.aliments.get(Number(id));
  if (!existing) throw new Error('Aliment introuvable');
  if (existing.source !== 'perso') throw new Error('Seuls les aliments persos sont éditables');

  await db.aliments.update(Number(id), {
    nom: data.nom,
    marque: data.marque || null,
    categorie: data.categorie || existing.categorie,
    kcal_100g: data.kcal_100g,
    proteines_100g: data.proteines_100g,
    glucides_100g: data.glucides_100g,
    sucres_100g: data.sucres_100g,
    lipides_100g: data.lipides_100g,
    satures_100g: data.satures_100g,
    fibres_100g: data.fibres_100g,
    sel_100g: data.sel_100g,
    portion_defaut_g: data.portion_defaut_g || null,
    portion_defaut_nom: data.portion_defaut_nom || null,
  });
  // NB : les snapshots des consommations passées ne sont pas modifiés (historique figé).
}

export async function deleteCustomFood(id) {
  const food = await db.aliments.get(Number(id));
  if (!food || food.source !== 'perso') {
    throw new Error('Seuls les aliments persos peuvent être supprimés');
  }
  await db.aliments.delete(Number(id));
}

// ==========================================================================
// EXPORT
// ==========================================================================

/**
 * Exporte toutes les données utilisateur au format JSON.
 * Les aliments Ciqual ne sont pas inclus (base fixe, inutile de les dupliquer).
 */
export async function exportAll() {
  const [profil, aliments, consommations, pesees] = await Promise.all([
    db.profil.toArray(),
    db.aliments.where('source').notEqual('ciqual').toArray(),
    db.consommations.toArray(),
    db.pesees.toArray(),
  ]);

  return {
    jamra_export_version: 1,
    exported_at: new Date().toISOString(),
    profil,
    aliments_personnels: aliments,
    consommations,
    pesees,
  };
}

/**
 * Convertit un tableau d'objets en CSV (UTF-8, séparateur virgule).
 */
export function toCSV(rows, columns) {
  if (!rows || rows.length === 0) return '';
  const cols = columns || Object.keys(rows[0]);
  const escape = (v) => {
    if (v == null) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const header = cols.join(',');
  const lines = rows.map(r => cols.map(c => escape(r[c])).join(','));
  return [header, ...lines].join('\n');
}

// ==========================================================================
// RESET
// ==========================================================================

export async function resetAll() {
  await db.profil.clear();
  await db.aliments.clear();
  await db.consommations.clear();
  await db.pesees.clear();
  await db.repasTypes.clear();
  await db.repasTypeItems.clear();
  localStorage.removeItem('jamra_foods_imported_version');
}

// ==========================================================================
// HELPERS
// ==========================================================================

function round1(n) { return Math.round(n * 10) / 10; }
function round2(n) { return Math.round(n * 100) / 100; }

function normalize(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
