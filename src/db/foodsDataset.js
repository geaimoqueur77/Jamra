/**
 * Jamra — Base d'aliments courants
 *
 * Dataset curaté de ~300 aliments représentatifs de l'alimentation française courante.
 * Valeurs nutritionnelles pour 100 g, alignées avec les moyennes Ciqual (ANSES).
 *
 * Champs :
 *  - id             : slug unique
 *  - nom            : nom affiché
 *  - categorie      : regroupement pour navigation
 *  - kcal           : énergie (kcal / 100 g)
 *  - p              : protéines (g / 100 g)
 *  - g              : glucides totaux (g / 100 g)
 *  - s              : sucres (g / 100 g) — nullable
 *  - l              : lipides totaux (g / 100 g)
 *  - sa             : acides gras saturés (g / 100 g) — nullable
 *  - f              : fibres (g / 100 g) — nullable
 *  - se             : sel (g / 100 g) — nullable
 *  - pd             : portion par défaut (g) — nullable
 *  - pn             : nom portion par défaut — nullable
 */

export const FOODS_DATASET = [
  // =====================================================================
  // BOULANGERIE & CÉRÉALES
  // =====================================================================
  { id: 'baguette', nom: 'Baguette de pain blanc', categorie: 'Boulangerie & céréales', kcal: 260, p: 8.5, g: 55.0, s: 2.5, l: 1.5, sa: 0.3, f: 2.5, se: 1.4, pd: 60, pn: '1/4 baguette' },
  { id: 'pain-complet', nom: 'Pain complet', categorie: 'Boulangerie & céréales', kcal: 243, p: 9.0, g: 45.0, s: 3.0, l: 2.8, sa: 0.5, f: 7.0, se: 1.3, pd: 35, pn: '1 tranche' },
  { id: 'pain-de-mie', nom: 'Pain de mie', categorie: 'Boulangerie & céréales', kcal: 275, p: 8.5, g: 50.0, s: 5.0, l: 4.0, sa: 0.7, f: 3.0, se: 1.2, pd: 30, pn: '1 tranche' },
  { id: 'pain-cereales', nom: 'Pain aux céréales', categorie: 'Boulangerie & céréales', kcal: 259, p: 10.0, g: 43.0, s: 3.0, l: 4.5, sa: 0.7, f: 6.5, se: 1.2, pd: 35, pn: '1 tranche' },
  { id: 'croissant', nom: 'Croissant au beurre', categorie: 'Boulangerie & céréales', kcal: 443, p: 8.0, g: 43.0, s: 9.0, l: 26.0, sa: 16.0, f: 2.0, se: 0.8, pd: 60, pn: '1 croissant' },
  { id: 'pain-au-chocolat', nom: 'Pain au chocolat', categorie: 'Boulangerie & céréales', kcal: 414, p: 7.0, g: 48.0, s: 15.0, l: 21.0, sa: 13.0, f: 2.5, se: 0.7, pd: 70, pn: '1 pain au chocolat' },
  { id: 'brioche', nom: 'Brioche', categorie: 'Boulangerie & céréales', kcal: 365, p: 8.5, g: 50.0, s: 15.0, l: 14.0, sa: 8.0, f: 2.0, se: 0.7, pd: 40, pn: '1 tranche' },
  { id: 'biscotte', nom: 'Biscotte', categorie: 'Boulangerie & céréales', kcal: 385, p: 11.0, g: 73.0, s: 5.0, l: 5.5, sa: 1.0, f: 4.0, se: 1.2, pd: 10, pn: '1 biscotte' },
  { id: 'riz-blanc-cuit', nom: 'Riz blanc, cuit', categorie: 'Boulangerie & céréales', kcal: 130, p: 2.7, g: 28.0, s: 0.1, l: 0.3, sa: 0.1, f: 0.5, se: 0.01, pd: null, pn: null },
  { id: 'riz-basmati-cuit', nom: 'Riz basmati, cuit', categorie: 'Boulangerie & céréales', kcal: 130, p: 2.7, g: 28.0, s: 0.1, l: 0.3, sa: 0.1, f: 0.5, se: 0.01, pd: null, pn: null },
  { id: 'riz-complet-cuit', nom: 'Riz complet, cuit', categorie: 'Boulangerie & céréales', kcal: 123, p: 2.6, g: 25.0, s: 0.4, l: 0.9, sa: 0.2, f: 2.0, se: 0.01, pd: null, pn: null },
  { id: 'pates-cuites', nom: 'Pâtes, cuites', categorie: 'Boulangerie & céréales', kcal: 131, p: 5.0, g: 26.0, s: 0.6, l: 1.1, sa: 0.2, f: 1.6, se: 0.01, pd: null, pn: null },
  { id: 'pates-completes-cuites', nom: 'Pâtes complètes, cuites', categorie: 'Boulangerie & céréales', kcal: 124, p: 5.3, g: 24.0, s: 0.8, l: 1.0, sa: 0.2, f: 3.8, se: 0.01, pd: null, pn: null },
  { id: 'semoule-cuite', nom: 'Semoule de blé, cuite', categorie: 'Boulangerie & céréales', kcal: 112, p: 3.8, g: 23.0, s: 0.2, l: 0.3, sa: 0.05, f: 1.4, se: 0.01, pd: null, pn: null },
  { id: 'quinoa-cuit', nom: 'Quinoa, cuit', categorie: 'Boulangerie & céréales', kcal: 120, p: 4.4, g: 21.0, s: 0.9, l: 1.9, sa: 0.2, f: 2.8, se: 0.01, pd: null, pn: null },
  { id: 'boulgour-cuit', nom: 'Boulgour, cuit', categorie: 'Boulangerie & céréales', kcal: 115, p: 3.7, g: 23.0, s: 0.2, l: 0.5, sa: 0.1, f: 4.5, se: 0.01, pd: null, pn: null },
  { id: 'flocons-avoine', nom: 'Flocons d\'avoine', categorie: 'Boulangerie & céréales', kcal: 377, p: 13.0, g: 58.0, s: 1.0, l: 7.5, sa: 1.3, f: 10.0, se: 0.02, pd: 40, pn: '1 bol' },
  { id: 'muesli', nom: 'Muesli (type classique)', categorie: 'Boulangerie & céréales', kcal: 370, p: 9.5, g: 62.0, s: 14.0, l: 7.5, sa: 1.3, f: 7.0, se: 0.3, pd: 50, pn: '1 bol' },
  { id: 'corn-flakes', nom: 'Corn flakes', categorie: 'Boulangerie & céréales', kcal: 378, p: 7.0, g: 82.0, s: 9.0, l: 1.0, sa: 0.2, f: 3.0, se: 1.1, pd: 30, pn: '1 bol' },
  { id: 'cereales-chocolatees', nom: 'Céréales chocolatées', categorie: 'Boulangerie & céréales', kcal: 393, p: 7.5, g: 75.0, s: 30.0, l: 6.0, sa: 2.0, f: 5.0, se: 0.6, pd: 30, pn: '1 bol' },

  // =====================================================================
  // VIANDES
  // =====================================================================
  { id: 'poulet-blanc-cuit', nom: 'Blanc de poulet, cuit', categorie: 'Viandes', kcal: 168, p: 32.0, g: 0, s: 0, l: 4.0, sa: 1.1, f: 0, se: 0.15, pd: null, pn: null },
  { id: 'poulet-cuisse-cuite', nom: 'Cuisse de poulet, cuite', categorie: 'Viandes', kcal: 220, p: 28.0, g: 0, s: 0, l: 12.0, sa: 3.5, f: 0, se: 0.2, pd: null, pn: null },
  { id: 'poulet-roti', nom: 'Poulet rôti (mix)', categorie: 'Viandes', kcal: 196, p: 29.0, g: 0, s: 0, l: 8.5, sa: 2.4, f: 0, se: 0.2, pd: null, pn: null },
  { id: 'dinde-escalope', nom: 'Escalope de dinde, cuite', categorie: 'Viandes', kcal: 135, p: 29.0, g: 0, s: 0, l: 2.0, sa: 0.6, f: 0, se: 0.2, pd: 120, pn: '1 escalope' },
  { id: 'boeuf-steak-5', nom: 'Steak haché 5 %, cuit', categorie: 'Viandes', kcal: 175, p: 28.0, g: 0, s: 0, l: 7.0, sa: 3.2, f: 0, se: 0.1, pd: 125, pn: '1 steak' },
  { id: 'boeuf-steak-15', nom: 'Steak haché 15 %, cuit', categorie: 'Viandes', kcal: 230, p: 25.0, g: 0, s: 0, l: 15.0, sa: 7.0, f: 0, se: 0.1, pd: 125, pn: '1 steak' },
  { id: 'boeuf-entrecote', nom: 'Entrecôte de bœuf, cuite', categorie: 'Viandes', kcal: 220, p: 26.0, g: 0, s: 0, l: 13.0, sa: 5.5, f: 0, se: 0.15, pd: null, pn: null },
  { id: 'boeuf-faux-filet', nom: 'Faux-filet de bœuf, cuit', categorie: 'Viandes', kcal: 205, p: 28.0, g: 0, s: 0, l: 10.5, sa: 4.5, f: 0, se: 0.15, pd: null, pn: null },
  { id: 'porc-filet-mignon', nom: 'Filet mignon de porc, cuit', categorie: 'Viandes', kcal: 166, p: 28.0, g: 0, s: 0, l: 6.0, sa: 2.0, f: 0, se: 0.15, pd: null, pn: null },
  { id: 'porc-cote', nom: 'Côte de porc, cuite', categorie: 'Viandes', kcal: 245, p: 26.0, g: 0, s: 0, l: 16.0, sa: 5.8, f: 0, se: 0.15, pd: null, pn: null },
  { id: 'agneau-cotelettes', nom: 'Côtelettes d\'agneau, cuites', categorie: 'Viandes', kcal: 278, p: 24.0, g: 0, s: 0, l: 20.0, sa: 9.0, f: 0, se: 0.15, pd: null, pn: null },
  { id: 'veau-escalope', nom: 'Escalope de veau, cuite', categorie: 'Viandes', kcal: 170, p: 30.0, g: 0, s: 0, l: 5.5, sa: 2.0, f: 0, se: 0.15, pd: null, pn: null },
  { id: 'jambon-cru', nom: 'Jambon cru (séché)', categorie: 'Viandes', kcal: 235, p: 27.0, g: 0.5, s: 0.2, l: 14.0, sa: 5.0, f: 0, se: 5.5, pd: 30, pn: '1 tranche' },
  { id: 'jambon-blanc', nom: 'Jambon blanc cuit', categorie: 'Viandes', kcal: 120, p: 20.0, g: 1.0, s: 0.5, l: 4.0, sa: 1.5, f: 0, se: 2.2, pd: 40, pn: '1 tranche' },
  { id: 'jambon-dinde', nom: 'Jambon de dinde', categorie: 'Viandes', kcal: 105, p: 18.5, g: 1.0, s: 0.5, l: 3.0, sa: 1.0, f: 0, se: 2.0, pd: 40, pn: '1 tranche' },
  { id: 'saucisson-sec', nom: 'Saucisson sec', categorie: 'Viandes', kcal: 420, p: 25.0, g: 1.5, s: 1.0, l: 35.0, sa: 13.0, f: 0, se: 4.5, pd: 30, pn: '5 tranches' },
  { id: 'chorizo', nom: 'Chorizo', categorie: 'Viandes', kcal: 455, p: 24.0, g: 2.0, s: 1.0, l: 39.0, sa: 14.0, f: 0, se: 4.0, pd: 25, pn: '5 tranches' },
  { id: 'lardons-fumes', nom: 'Lardons fumés', categorie: 'Viandes', kcal: 320, p: 18.0, g: 0.5, s: 0.3, l: 27.0, sa: 10.0, f: 0, se: 3.0, pd: null, pn: null },
  { id: 'saucisse-toulouse', nom: 'Saucisse de Toulouse', categorie: 'Viandes', kcal: 290, p: 17.0, g: 1.5, s: 0.5, l: 24.0, sa: 9.0, f: 0, se: 1.8, pd: 90, pn: '1 saucisse' },
  { id: 'merguez', nom: 'Merguez', categorie: 'Viandes', kcal: 285, p: 16.0, g: 1.0, s: 0.5, l: 24.0, sa: 9.5, f: 0, se: 2.0, pd: 70, pn: '1 merguez' },
  { id: 'lapin-cuit', nom: 'Lapin, cuit', categorie: 'Viandes', kcal: 175, p: 30.0, g: 0, s: 0, l: 6.0, sa: 1.8, f: 0, se: 0.1, pd: null, pn: null },
  { id: 'canard-magret', nom: 'Magret de canard, cuit', categorie: 'Viandes', kcal: 250, p: 27.0, g: 0, s: 0, l: 16.0, sa: 4.5, f: 0, se: 0.15, pd: null, pn: null },

  // =====================================================================
  // POISSONS & FRUITS DE MER
  // =====================================================================
  { id: 'saumon-cuit', nom: 'Saumon, cuit', categorie: 'Poissons & fruits de mer', kcal: 210, p: 24.0, g: 0, s: 0, l: 13.0, sa: 2.5, f: 0, se: 0.15, pd: 130, pn: '1 pavé' },
  { id: 'saumon-fume', nom: 'Saumon fumé', categorie: 'Poissons & fruits de mer', kcal: 182, p: 22.0, g: 0, s: 0, l: 10.0, sa: 1.7, f: 0, se: 2.5, pd: 40, pn: '2 tranches' },
  { id: 'truite-cuite', nom: 'Truite, cuite', categorie: 'Poissons & fruits de mer', kcal: 150, p: 22.0, g: 0, s: 0, l: 7.0, sa: 1.3, f: 0, se: 0.1, pd: 130, pn: '1 filet' },
  { id: 'cabillaud-cuit', nom: 'Cabillaud, cuit', categorie: 'Poissons & fruits de mer', kcal: 95, p: 22.0, g: 0, s: 0, l: 0.8, sa: 0.2, f: 0, se: 0.2, pd: 130, pn: '1 filet' },
  { id: 'colin-cuit', nom: 'Colin (lieu noir), cuit', categorie: 'Poissons & fruits de mer', kcal: 85, p: 20.0, g: 0, s: 0, l: 0.6, sa: 0.15, f: 0, se: 0.2, pd: 130, pn: '1 filet' },
  { id: 'dorade-cuite', nom: 'Dorade, cuite', categorie: 'Poissons & fruits de mer', kcal: 120, p: 23.0, g: 0, s: 0, l: 3.0, sa: 0.8, f: 0, se: 0.15, pd: 130, pn: '1 filet' },
  { id: 'bar-cuit', nom: 'Bar, cuit', categorie: 'Poissons & fruits de mer', kcal: 110, p: 22.0, g: 0, s: 0, l: 2.5, sa: 0.6, f: 0, se: 0.15, pd: 130, pn: '1 filet' },
  { id: 'sole-cuite', nom: 'Sole, cuite', categorie: 'Poissons & fruits de mer', kcal: 95, p: 21.0, g: 0, s: 0, l: 1.0, sa: 0.2, f: 0, se: 0.2, pd: 130, pn: '1 filet' },
  { id: 'merlu-cuit', nom: 'Merlu, cuit', categorie: 'Poissons & fruits de mer', kcal: 90, p: 20.5, g: 0, s: 0, l: 1.0, sa: 0.2, f: 0, se: 0.2, pd: 130, pn: '1 filet' },
  { id: 'thon-naturel', nom: 'Thon au naturel (boîte)', categorie: 'Poissons & fruits de mer', kcal: 115, p: 26.0, g: 0, s: 0, l: 1.5, sa: 0.4, f: 0, se: 0.9, pd: 80, pn: '1 boîte' },
  { id: 'thon-huile', nom: 'Thon à l\'huile d\'olive (égoutté)', categorie: 'Poissons & fruits de mer', kcal: 200, p: 24.0, g: 0, s: 0, l: 12.0, sa: 2.0, f: 0, se: 0.9, pd: 80, pn: '1 boîte' },
  { id: 'sardines-huile', nom: 'Sardines à l\'huile (égouttées)', categorie: 'Poissons & fruits de mer', kcal: 220, p: 24.0, g: 0, s: 0, l: 14.0, sa: 2.5, f: 0, se: 0.9, pd: 90, pn: '1 boîte' },
  { id: 'maquereau-cuit', nom: 'Maquereau, cuit', categorie: 'Poissons & fruits de mer', kcal: 250, p: 22.0, g: 0, s: 0, l: 18.0, sa: 4.5, f: 0, se: 0.2, pd: 130, pn: '1 filet' },
  { id: 'crevettes-cuites', nom: 'Crevettes roses, cuites', categorie: 'Poissons & fruits de mer', kcal: 95, p: 20.0, g: 0, s: 0, l: 1.5, sa: 0.3, f: 0, se: 1.5, pd: null, pn: null },
  { id: 'moules-cuites', nom: 'Moules, cuites', categorie: 'Poissons & fruits de mer', kcal: 110, p: 17.0, g: 4.0, s: 0.5, l: 3.0, sa: 0.5, f: 0, se: 1.1, pd: 200, pn: '1 assiette' },
  { id: 'huitres', nom: 'Huîtres creuses', categorie: 'Poissons & fruits de mer', kcal: 80, p: 10.0, g: 3.0, s: 0.5, l: 2.5, sa: 0.5, f: 0, se: 1.2, pd: 60, pn: '6 huîtres' },
  { id: 'noix-saint-jacques', nom: 'Noix de Saint-Jacques, cuites', categorie: 'Poissons & fruits de mer', kcal: 110, p: 22.0, g: 3.0, s: 0, l: 1.0, sa: 0.2, f: 0, se: 0.6, pd: null, pn: null },
  { id: 'calamars-cuits', nom: 'Calamars, cuits', categorie: 'Poissons & fruits de mer', kcal: 110, p: 19.0, g: 3.0, s: 0, l: 2.0, sa: 0.5, f: 0, se: 0.8, pd: null, pn: null },
  { id: 'surimi', nom: 'Surimi (bâtonnets)', categorie: 'Poissons & fruits de mer', kcal: 100, p: 10.0, g: 14.0, s: 4.0, l: 0.8, sa: 0.2, f: 0, se: 1.5, pd: 20, pn: '1 bâtonnet' },

  // =====================================================================
  // ŒUFS
  // =====================================================================
  { id: 'oeuf-poule', nom: 'Œuf de poule (entier, cru)', categorie: 'Œufs', kcal: 143, p: 12.6, g: 0.7, s: 0.3, l: 9.5, sa: 2.7, f: 0, se: 0.3, pd: 55, pn: '1 œuf moyen' },
  { id: 'oeuf-dur', nom: 'Œuf dur', categorie: 'Œufs', kcal: 155, p: 13.0, g: 1.0, s: 0.4, l: 10.5, sa: 3.0, f: 0, se: 0.3, pd: 55, pn: '1 œuf' },
  { id: 'oeuf-brouille', nom: 'Œufs brouillés', categorie: 'Œufs', kcal: 145, p: 10.0, g: 1.0, s: 0.5, l: 11.0, sa: 3.5, f: 0, se: 0.7, pd: null, pn: null },
  { id: 'omelette', nom: 'Omelette nature', categorie: 'Œufs', kcal: 160, p: 13.0, g: 1.0, s: 0.5, l: 12.0, sa: 3.8, f: 0, se: 0.5, pd: 120, pn: '2 œufs' },
  { id: 'blanc-oeuf', nom: 'Blanc d\'œuf', categorie: 'Œufs', kcal: 50, p: 11.0, g: 0.7, s: 0.7, l: 0.2, sa: 0, f: 0, se: 0.4, pd: 35, pn: '1 blanc' },

  // =====================================================================
  // PRODUITS LAITIERS
  // =====================================================================
  { id: 'lait-entier', nom: 'Lait entier', categorie: 'Produits laitiers', kcal: 64, p: 3.2, g: 4.8, s: 4.8, l: 3.5, sa: 2.1, f: 0, se: 0.1, pd: 250, pn: '1 verre' },
  { id: 'lait-demi-ecreme', nom: 'Lait demi-écrémé', categorie: 'Produits laitiers', kcal: 46, p: 3.2, g: 4.8, s: 4.8, l: 1.5, sa: 1.0, f: 0, se: 0.1, pd: 250, pn: '1 verre' },
  { id: 'lait-ecreme', nom: 'Lait écrémé', categorie: 'Produits laitiers', kcal: 33, p: 3.3, g: 4.9, s: 4.9, l: 0.1, sa: 0.05, f: 0, se: 0.1, pd: 250, pn: '1 verre' },
  { id: 'boisson-amande', nom: 'Boisson d\'amande non sucrée', categorie: 'Produits laitiers', kcal: 22, p: 0.5, g: 0.3, s: 0.1, l: 1.5, sa: 0.1, f: 0.3, se: 0.1, pd: 250, pn: '1 verre' },
  { id: 'boisson-soja', nom: 'Boisson de soja non sucrée', categorie: 'Produits laitiers', kcal: 35, p: 3.5, g: 0.5, s: 0.3, l: 2.0, sa: 0.3, f: 0.5, se: 0.1, pd: 250, pn: '1 verre' },
  { id: 'boisson-avoine', nom: 'Boisson d\'avoine', categorie: 'Produits laitiers', kcal: 45, p: 1.0, g: 6.5, s: 4.0, l: 1.5, sa: 0.2, f: 0.8, se: 0.1, pd: 250, pn: '1 verre' },
  { id: 'yaourt-nature', nom: 'Yaourt nature', categorie: 'Produits laitiers', kcal: 55, p: 4.0, g: 5.0, s: 5.0, l: 1.5, sa: 1.0, f: 0, se: 0.1, pd: 125, pn: '1 yaourt' },
  { id: 'yaourt-0', nom: 'Yaourt nature 0 %', categorie: 'Produits laitiers', kcal: 38, p: 4.3, g: 4.8, s: 4.8, l: 0.1, sa: 0.05, f: 0, se: 0.1, pd: 125, pn: '1 yaourt' },
  { id: 'yaourt-grec', nom: 'Yaourt à la grecque', categorie: 'Produits laitiers', kcal: 115, p: 5.0, g: 4.0, s: 4.0, l: 9.0, sa: 6.0, f: 0, se: 0.1, pd: 150, pn: '1 pot' },
  { id: 'yaourt-sucre-fruit', nom: 'Yaourt aux fruits sucré', categorie: 'Produits laitiers', kcal: 95, p: 3.5, g: 14.0, s: 13.0, l: 2.5, sa: 1.5, f: 0.3, se: 0.1, pd: 125, pn: '1 yaourt' },
  { id: 'fromage-blanc-0', nom: 'Fromage blanc 0 %', categorie: 'Produits laitiers', kcal: 45, p: 8.0, g: 3.5, s: 3.5, l: 0.2, sa: 0.1, f: 0, se: 0.05, pd: 100, pn: '1 portion' },
  { id: 'fromage-blanc-20', nom: 'Fromage blanc 20 %', categorie: 'Produits laitiers', kcal: 80, p: 7.5, g: 3.5, s: 3.5, l: 4.0, sa: 2.8, f: 0, se: 0.05, pd: 100, pn: '1 portion' },
  { id: 'petit-suisse', nom: 'Petit-suisse 40 %', categorie: 'Produits laitiers', kcal: 165, p: 10.0, g: 3.0, s: 3.0, l: 12.0, sa: 8.0, f: 0, se: 0.05, pd: 60, pn: '1 pot' },
  { id: 'skyr', nom: 'Skyr nature', categorie: 'Produits laitiers', kcal: 62, p: 11.0, g: 4.0, s: 4.0, l: 0.2, sa: 0.1, f: 0, se: 0.05, pd: 150, pn: '1 pot' },
  { id: 'creme-30', nom: 'Crème fraîche 30 %', categorie: 'Produits laitiers', kcal: 295, p: 2.0, g: 3.0, s: 3.0, l: 30.0, sa: 20.0, f: 0, se: 0.1, pd: null, pn: null },
  { id: 'creme-15', nom: 'Crème fraîche légère 15 %', categorie: 'Produits laitiers', kcal: 165, p: 2.5, g: 4.0, s: 4.0, l: 15.0, sa: 10.0, f: 0, se: 0.1, pd: null, pn: null },
  { id: 'creme-soja', nom: 'Crème de soja', categorie: 'Produits laitiers', kcal: 160, p: 2.5, g: 2.5, s: 1.0, l: 15.0, sa: 2.5, f: 0.5, se: 0.1, pd: null, pn: null },
  { id: 'beurre', nom: 'Beurre (doux)', categorie: 'Produits laitiers', kcal: 743, p: 0.5, g: 0.5, s: 0.5, l: 82.0, sa: 54.0, f: 0, se: 0.02, pd: 10, pn: '1 noisette' },
  { id: 'beurre-demisel', nom: 'Beurre demi-sel', categorie: 'Produits laitiers', kcal: 743, p: 0.6, g: 0.5, s: 0.5, l: 82.0, sa: 54.0, f: 0, se: 2.0, pd: 10, pn: '1 noisette' },
  { id: 'margarine', nom: 'Margarine', categorie: 'Produits laitiers', kcal: 706, p: 0.2, g: 0.5, s: 0.5, l: 78.0, sa: 20.0, f: 0, se: 1.0, pd: null, pn: null },

  // =====================================================================
  // FROMAGES
  // =====================================================================
  { id: 'emmental', nom: 'Emmental', categorie: 'Fromages', kcal: 381, p: 28.0, g: 1.0, s: 0.5, l: 30.0, sa: 19.5, f: 0, se: 0.7, pd: 30, pn: '1 portion' },
  { id: 'comte', nom: 'Comté', categorie: 'Fromages', kcal: 410, p: 27.0, g: 0.5, s: 0.5, l: 34.0, sa: 22.0, f: 0, se: 0.8, pd: 30, pn: '1 portion' },
  { id: 'camembert', nom: 'Camembert', categorie: 'Fromages', kcal: 295, p: 20.0, g: 0.5, s: 0.5, l: 24.0, sa: 15.0, f: 0, se: 1.7, pd: 30, pn: '1 portion' },
  { id: 'brie', nom: 'Brie', categorie: 'Fromages', kcal: 335, p: 20.0, g: 0.5, s: 0.5, l: 28.0, sa: 18.0, f: 0, se: 1.8, pd: 30, pn: '1 portion' },
  { id: 'roquefort', nom: 'Roquefort', categorie: 'Fromages', kcal: 370, p: 19.0, g: 1.0, s: 0.5, l: 33.0, sa: 20.0, f: 0, se: 3.8, pd: 30, pn: '1 portion' },
  { id: 'bleu', nom: 'Bleu d\'Auvergne', categorie: 'Fromages', kcal: 355, p: 20.0, g: 1.0, s: 0.5, l: 30.0, sa: 20.0, f: 0, se: 3.5, pd: 30, pn: '1 portion' },
  { id: 'chevre-frais', nom: 'Chèvre frais', categorie: 'Fromages', kcal: 205, p: 15.0, g: 2.0, s: 2.0, l: 16.0, sa: 10.0, f: 0, se: 1.2, pd: 30, pn: '1 portion' },
  { id: 'chevre-sec', nom: 'Chèvre sec (crottin)', categorie: 'Fromages', kcal: 370, p: 25.0, g: 1.0, s: 0.5, l: 30.0, sa: 20.0, f: 0, se: 2.0, pd: 30, pn: '1 portion' },
  { id: 'mozzarella', nom: 'Mozzarella', categorie: 'Fromages', kcal: 245, p: 19.0, g: 2.0, s: 1.0, l: 18.0, sa: 12.0, f: 0, se: 0.6, pd: 30, pn: '1 portion' },
  { id: 'mozzarella-di-bufala', nom: 'Mozzarella di bufala', categorie: 'Fromages', kcal: 285, p: 16.0, g: 0.5, s: 0.5, l: 24.0, sa: 16.0, f: 0, se: 0.6, pd: 30, pn: '1 portion' },
  { id: 'feta', nom: 'Feta', categorie: 'Fromages', kcal: 265, p: 14.0, g: 4.0, s: 4.0, l: 21.0, sa: 14.0, f: 0, se: 3.5, pd: 30, pn: '1 portion' },
  { id: 'parmesan', nom: 'Parmesan', categorie: 'Fromages', kcal: 395, p: 36.0, g: 0, s: 0, l: 28.0, sa: 18.0, f: 0, se: 1.5, pd: 10, pn: '1 cuillère' },
  { id: 'reblochon', nom: 'Reblochon', categorie: 'Fromages', kcal: 340, p: 20.0, g: 0.5, s: 0.5, l: 28.0, sa: 18.0, f: 0, se: 1.3, pd: 30, pn: '1 portion' },
  { id: 'munster', nom: 'Munster', categorie: 'Fromages', kcal: 330, p: 21.0, g: 0.5, s: 0.5, l: 27.0, sa: 18.0, f: 0, se: 2.0, pd: 30, pn: '1 portion' },
  { id: 'raclette', nom: 'Fromage à raclette', categorie: 'Fromages', kcal: 355, p: 24.0, g: 1.0, s: 1.0, l: 28.0, sa: 18.0, f: 0, se: 1.6, pd: null, pn: null },
  { id: 'ricotta', nom: 'Ricotta', categorie: 'Fromages', kcal: 155, p: 8.0, g: 3.5, s: 3.5, l: 12.0, sa: 8.0, f: 0, se: 0.2, pd: null, pn: null },
  { id: 'cottage-cheese', nom: 'Fromage cottage', categorie: 'Fromages', kcal: 100, p: 12.5, g: 3.5, s: 3.5, l: 4.5, sa: 3.0, f: 0, se: 0.5, pd: 100, pn: '1 portion' },
  { id: 'cancoillotte', nom: 'Cancoillotte', categorie: 'Fromages', kcal: 135, p: 13.0, g: 1.5, s: 1.0, l: 9.0, sa: 6.0, f: 0, se: 2.0, pd: 30, pn: '1 portion' },
  { id: 'vache-qui-rit', nom: 'Portion type Vache qui rit', categorie: 'Fromages', kcal: 275, p: 10.0, g: 6.0, s: 6.0, l: 23.0, sa: 16.0, f: 0, se: 2.0, pd: 20, pn: '1 portion' },

  // =====================================================================
  // LÉGUMES
  // =====================================================================
  { id: 'tomate-crue', nom: 'Tomate crue', categorie: 'Légumes', kcal: 18, p: 0.9, g: 3.0, s: 2.6, l: 0.2, sa: 0.05, f: 1.4, se: 0.01, pd: 125, pn: '1 tomate' },
  { id: 'tomate-cerise', nom: 'Tomate cerise', categorie: 'Légumes', kcal: 19, p: 0.9, g: 3.1, s: 2.7, l: 0.2, sa: 0.05, f: 1.3, se: 0.01, pd: 15, pn: '1 tomate' },
  { id: 'concombre', nom: 'Concombre', categorie: 'Légumes', kcal: 15, p: 0.7, g: 2.0, s: 1.7, l: 0.2, sa: 0.05, f: 0.7, se: 0.01, pd: 150, pn: '1/2 concombre' },
  { id: 'carotte-crue', nom: 'Carotte crue', categorie: 'Légumes', kcal: 36, p: 0.8, g: 6.7, s: 5.7, l: 0.2, sa: 0.05, f: 2.9, se: 0.07, pd: 80, pn: '1 carotte' },
  { id: 'carotte-cuite', nom: 'Carotte cuite', categorie: 'Légumes', kcal: 25, p: 0.6, g: 4.0, s: 3.5, l: 0.3, sa: 0.05, f: 2.5, se: 0.07, pd: null, pn: null },
  { id: 'courgette-cuite', nom: 'Courgette cuite', categorie: 'Légumes', kcal: 15, p: 1.1, g: 1.5, s: 1.3, l: 0.3, sa: 0.1, f: 1.1, se: 0.01, pd: null, pn: null },
  { id: 'poivron-cru', nom: 'Poivron cru', categorie: 'Légumes', kcal: 26, p: 1.0, g: 4.0, s: 3.5, l: 0.3, sa: 0.05, f: 1.9, se: 0.01, pd: 150, pn: '1 poivron' },
  { id: 'oignon', nom: 'Oignon', categorie: 'Légumes', kcal: 36, p: 1.2, g: 7.0, s: 4.5, l: 0.2, sa: 0.05, f: 1.7, se: 0.01, pd: 100, pn: '1 oignon' },
  { id: 'ail', nom: 'Ail', categorie: 'Légumes', kcal: 135, p: 6.0, g: 27.0, s: 1.0, l: 0.5, sa: 0.1, f: 2.0, se: 0.05, pd: 5, pn: '1 gousse' },
  { id: 'echalote', nom: 'Échalote', categorie: 'Légumes', kcal: 75, p: 2.5, g: 15.0, s: 7.0, l: 0.1, sa: 0.05, f: 3.0, se: 0.03, pd: 25, pn: '1 échalote' },
  { id: 'pomme-de-terre-cuite', nom: 'Pomme de terre cuite (nature)', categorie: 'Légumes', kcal: 85, p: 2.0, g: 18.0, s: 0.8, l: 0.1, sa: 0.03, f: 1.8, se: 0.01, pd: 150, pn: '1 pomme de terre' },
  { id: 'pdt-vapeur', nom: 'Pomme de terre vapeur', categorie: 'Légumes', kcal: 85, p: 2.0, g: 18.0, s: 0.8, l: 0.1, sa: 0.03, f: 1.8, se: 0.01, pd: null, pn: null },
  { id: 'puree', nom: 'Purée de pommes de terre (lait+beurre)', categorie: 'Légumes', kcal: 100, p: 2.0, g: 15.0, s: 1.5, l: 3.5, sa: 2.0, f: 1.5, se: 0.5, pd: null, pn: null },
  { id: 'frites', nom: 'Frites (friteuse)', categorie: 'Légumes', kcal: 295, p: 4.0, g: 35.0, s: 0.5, l: 15.0, sa: 2.0, f: 3.5, se: 0.5, pd: 150, pn: '1 portion' },
  { id: 'frites-four', nom: 'Frites (au four, surgelées)', categorie: 'Légumes', kcal: 170, p: 2.5, g: 26.0, s: 0.5, l: 6.0, sa: 0.8, f: 3.0, se: 0.3, pd: 150, pn: '1 portion' },
  { id: 'patate-douce', nom: 'Patate douce cuite', categorie: 'Légumes', kcal: 90, p: 1.6, g: 20.0, s: 6.5, l: 0.1, sa: 0.03, f: 3.0, se: 0.03, pd: 150, pn: '1 patate' },
  { id: 'salade-verte', nom: 'Laitue / salade verte', categorie: 'Légumes', kcal: 15, p: 1.4, g: 1.5, s: 1.0, l: 0.2, sa: 0.05, f: 1.5, se: 0.02, pd: 50, pn: '1 bol' },
  { id: 'epinards-cuits', nom: 'Épinards cuits', categorie: 'Légumes', kcal: 23, p: 3.0, g: 0.8, s: 0.5, l: 0.5, sa: 0.1, f: 3.0, se: 0.08, pd: null, pn: null },
  { id: 'brocoli-cuit', nom: 'Brocoli cuit', categorie: 'Légumes', kcal: 28, p: 2.8, g: 2.5, s: 1.5, l: 0.5, sa: 0.1, f: 3.0, se: 0.03, pd: null, pn: null },
  { id: 'chou-fleur-cuit', nom: 'Chou-fleur cuit', categorie: 'Légumes', kcal: 23, p: 2.0, g: 2.0, s: 1.8, l: 0.4, sa: 0.1, f: 2.3, se: 0.02, pd: null, pn: null },
  { id: 'haricots-verts-cuits', nom: 'Haricots verts cuits', categorie: 'Légumes', kcal: 30, p: 2.0, g: 3.5, s: 2.0, l: 0.3, sa: 0.1, f: 3.0, se: 0.01, pd: null, pn: null },
  { id: 'petits-pois-cuits', nom: 'Petits pois cuits', categorie: 'Légumes', kcal: 80, p: 5.0, g: 10.0, s: 3.0, l: 0.5, sa: 0.1, f: 5.5, se: 0.01, pd: null, pn: null },
  { id: 'mais-doux', nom: 'Maïs doux (en boîte)', categorie: 'Légumes', kcal: 95, p: 3.0, g: 18.0, s: 4.0, l: 1.0, sa: 0.2, f: 2.0, se: 0.3, pd: null, pn: null },
  { id: 'champignon-paris', nom: 'Champignons de Paris crus', categorie: 'Légumes', kcal: 24, p: 3.0, g: 1.0, s: 1.0, l: 0.4, sa: 0.1, f: 2.0, se: 0.01, pd: null, pn: null },
  { id: 'aubergine-cuite', nom: 'Aubergine cuite', categorie: 'Légumes', kcal: 30, p: 1.0, g: 3.0, s: 2.5, l: 0.5, sa: 0.1, f: 3.0, se: 0.01, pd: null, pn: null },
  { id: 'poireau-cuit', nom: 'Poireau cuit', categorie: 'Légumes', kcal: 25, p: 1.2, g: 3.0, s: 2.0, l: 0.3, sa: 0.05, f: 2.0, se: 0.02, pd: null, pn: null },
  { id: 'chou-rouge-cru', nom: 'Chou rouge cru', categorie: 'Légumes', kcal: 30, p: 1.5, g: 4.5, s: 3.8, l: 0.2, sa: 0.05, f: 2.0, se: 0.03, pd: null, pn: null },
  { id: 'chou-blanc-cru', nom: 'Chou blanc cru', categorie: 'Légumes', kcal: 22, p: 1.3, g: 3.0, s: 2.8, l: 0.2, sa: 0.05, f: 2.5, se: 0.02, pd: null, pn: null },
  { id: 'endive-crue', nom: 'Endive crue', categorie: 'Légumes', kcal: 17, p: 1.0, g: 1.5, s: 0.8, l: 0.2, sa: 0.05, f: 3.1, se: 0.01, pd: 120, pn: '1 endive' },
  { id: 'avocat', nom: 'Avocat', categorie: 'Légumes', kcal: 160, p: 2.0, g: 2.0, s: 0.5, l: 15.0, sa: 2.1, f: 6.7, se: 0.02, pd: 100, pn: '1/2 avocat' },
  { id: 'olives-vertes', nom: 'Olives vertes', categorie: 'Légumes', kcal: 145, p: 1.0, g: 3.5, s: 0.5, l: 15.0, sa: 2.0, f: 3.0, se: 4.5, pd: null, pn: null },
  { id: 'olives-noires', nom: 'Olives noires', categorie: 'Légumes', kcal: 195, p: 1.4, g: 4.0, s: 0.5, l: 21.0, sa: 2.8, f: 3.5, se: 5.0, pd: null, pn: null },
  { id: 'radis', nom: 'Radis cru', categorie: 'Légumes', kcal: 15, p: 0.8, g: 2.0, s: 1.8, l: 0.1, sa: 0.03, f: 1.5, se: 0.05, pd: null, pn: null },
  { id: 'betterave-cuite', nom: 'Betterave cuite', categorie: 'Légumes', kcal: 50, p: 1.7, g: 9.0, s: 7.5, l: 0.2, sa: 0.05, f: 2.5, se: 0.3, pd: null, pn: null },
  { id: 'ratatouille', nom: 'Ratatouille', categorie: 'Légumes', kcal: 50, p: 1.3, g: 5.0, s: 3.5, l: 2.5, sa: 0.4, f: 2.0, se: 0.4, pd: 200, pn: '1 assiette' },

  // =====================================================================
  // FRUITS
  // =====================================================================
  { id: 'pomme', nom: 'Pomme', categorie: 'Fruits', kcal: 54, p: 0.3, g: 12.5, s: 10.5, l: 0.2, sa: 0.05, f: 2.4, se: 0, pd: 150, pn: '1 pomme' },
  { id: 'banane', nom: 'Banane', categorie: 'Fruits', kcal: 95, p: 1.3, g: 20.0, s: 15.0, l: 0.3, sa: 0.1, f: 2.5, se: 0, pd: 120, pn: '1 banane' },
  { id: 'orange', nom: 'Orange', categorie: 'Fruits', kcal: 45, p: 1.0, g: 9.0, s: 8.5, l: 0.1, sa: 0.02, f: 2.0, se: 0, pd: 150, pn: '1 orange' },
  { id: 'clementine', nom: 'Clémentine', categorie: 'Fruits', kcal: 47, p: 0.9, g: 9.0, s: 9.0, l: 0.2, sa: 0.03, f: 2.0, se: 0, pd: 70, pn: '1 clémentine' },
  { id: 'poire', nom: 'Poire', categorie: 'Fruits', kcal: 57, p: 0.4, g: 12.0, s: 10.0, l: 0.2, sa: 0.05, f: 3.0, se: 0, pd: 150, pn: '1 poire' },
  { id: 'raisin', nom: 'Raisin', categorie: 'Fruits', kcal: 72, p: 0.7, g: 16.0, s: 16.0, l: 0.2, sa: 0.05, f: 1.0, se: 0, pd: null, pn: null },
  { id: 'kiwi', nom: 'Kiwi', categorie: 'Fruits', kcal: 60, p: 1.2, g: 12.0, s: 9.0, l: 0.5, sa: 0.05, f: 2.0, se: 0, pd: 80, pn: '1 kiwi' },
  { id: 'fraise', nom: 'Fraise', categorie: 'Fruits', kcal: 33, p: 0.7, g: 6.0, s: 4.5, l: 0.3, sa: 0.03, f: 2.0, se: 0, pd: null, pn: null },
  { id: 'framboise', nom: 'Framboise', categorie: 'Fruits', kcal: 40, p: 1.2, g: 5.0, s: 4.5, l: 0.7, sa: 0.05, f: 6.5, se: 0, pd: null, pn: null },
  { id: 'myrtille', nom: 'Myrtille', categorie: 'Fruits', kcal: 55, p: 0.7, g: 11.0, s: 10.0, l: 0.4, sa: 0.05, f: 2.5, se: 0, pd: null, pn: null },
  { id: 'cerise', nom: 'Cerise', categorie: 'Fruits', kcal: 63, p: 1.1, g: 13.0, s: 12.5, l: 0.2, sa: 0.05, f: 2.0, se: 0, pd: null, pn: null },
  { id: 'peche', nom: 'Pêche', categorie: 'Fruits', kcal: 42, p: 0.9, g: 8.5, s: 8.0, l: 0.3, sa: 0.05, f: 2.0, se: 0, pd: 130, pn: '1 pêche' },
  { id: 'abricot', nom: 'Abricot', categorie: 'Fruits', kcal: 47, p: 0.9, g: 9.0, s: 8.5, l: 0.2, sa: 0.05, f: 2.0, se: 0, pd: 40, pn: '1 abricot' },
  { id: 'pruneau', nom: 'Pruneau (sec)', categorie: 'Fruits', kcal: 240, p: 2.5, g: 55.0, s: 35.0, l: 0.5, sa: 0.05, f: 7.0, se: 0, pd: 10, pn: '1 pruneau' },
  { id: 'prune', nom: 'Prune', categorie: 'Fruits', kcal: 48, p: 0.8, g: 10.0, s: 9.5, l: 0.2, sa: 0.05, f: 1.8, se: 0, pd: null, pn: null },
  { id: 'mangue', nom: 'Mangue', categorie: 'Fruits', kcal: 64, p: 0.8, g: 14.0, s: 13.5, l: 0.4, sa: 0.1, f: 1.8, se: 0, pd: null, pn: null },
  { id: 'ananas', nom: 'Ananas', categorie: 'Fruits', kcal: 50, p: 0.5, g: 11.0, s: 10.0, l: 0.2, sa: 0.05, f: 1.5, se: 0, pd: null, pn: null },
  { id: 'pamplemousse', nom: 'Pamplemousse', categorie: 'Fruits', kcal: 38, p: 0.8, g: 7.5, s: 7.0, l: 0.1, sa: 0.02, f: 1.5, se: 0, pd: 200, pn: '1/2 pamplemousse' },
  { id: 'citron', nom: 'Citron', categorie: 'Fruits', kcal: 29, p: 1.0, g: 3.0, s: 2.5, l: 0.3, sa: 0.05, f: 1.9, se: 0, pd: null, pn: null },
  { id: 'pasteque', nom: 'Pastèque', categorie: 'Fruits', kcal: 30, p: 0.6, g: 7.0, s: 6.5, l: 0.2, sa: 0.05, f: 0.4, se: 0, pd: null, pn: null },
  { id: 'melon', nom: 'Melon charentais', categorie: 'Fruits', kcal: 34, p: 0.8, g: 7.5, s: 7.5, l: 0.2, sa: 0.05, f: 0.9, se: 0, pd: 200, pn: '1/4 melon' },
  { id: 'figue', nom: 'Figue fraîche', categorie: 'Fruits', kcal: 66, p: 0.8, g: 14.0, s: 14.0, l: 0.3, sa: 0.05, f: 3.0, se: 0, pd: 50, pn: '1 figue' },
  { id: 'grenade', nom: 'Grenade', categorie: 'Fruits', kcal: 68, p: 1.5, g: 14.0, s: 13.0, l: 1.0, sa: 0.2, f: 4.0, se: 0, pd: null, pn: null },
  { id: 'datte', nom: 'Datte (séchée)', categorie: 'Fruits', kcal: 275, p: 2.5, g: 65.0, s: 60.0, l: 0.4, sa: 0.05, f: 7.0, se: 0, pd: 8, pn: '1 datte' },

  // =====================================================================
  // FRUITS SECS & OLÉAGINEUX
  // =====================================================================
  { id: 'amandes', nom: 'Amandes', categorie: 'Fruits secs & oléagineux', kcal: 580, p: 21.0, g: 10.0, s: 5.0, l: 50.0, sa: 3.8, f: 12.0, se: 0.01, pd: 30, pn: '1 poignée' },
  { id: 'noix', nom: 'Noix', categorie: 'Fruits secs & oléagineux', kcal: 690, p: 15.0, g: 7.0, s: 2.5, l: 65.0, sa: 6.0, f: 6.5, se: 0.01, pd: 30, pn: '1 poignée' },
  { id: 'noisettes', nom: 'Noisettes', categorie: 'Fruits secs & oléagineux', kcal: 625, p: 14.0, g: 10.0, s: 4.3, l: 60.0, sa: 4.4, f: 9.7, se: 0, pd: 30, pn: '1 poignée' },
  { id: 'cajou', nom: 'Noix de cajou', categorie: 'Fruits secs & oléagineux', kcal: 575, p: 18.0, g: 26.0, s: 5.9, l: 44.0, sa: 8.0, f: 3.3, se: 0.03, pd: 30, pn: '1 poignée' },
  { id: 'pistaches', nom: 'Pistaches (décortiquées)', categorie: 'Fruits secs & oléagineux', kcal: 580, p: 21.0, g: 18.0, s: 7.5, l: 45.0, sa: 5.5, f: 10.0, se: 0.01, pd: 30, pn: '1 poignée' },
  { id: 'cacahuetes', nom: 'Cacahuètes grillées salées', categorie: 'Fruits secs & oléagineux', kcal: 590, p: 25.0, g: 10.0, s: 4.0, l: 49.0, sa: 8.5, f: 8.0, se: 1.1, pd: 30, pn: '1 poignée' },
  { id: 'graines-courge', nom: 'Graines de courge', categorie: 'Fruits secs & oléagineux', kcal: 560, p: 30.0, g: 11.0, s: 1.5, l: 49.0, sa: 8.7, f: 6.0, se: 0.02, pd: 20, pn: '1 poignée' },
  { id: 'graines-tournesol', nom: 'Graines de tournesol', categorie: 'Fruits secs & oléagineux', kcal: 585, p: 21.0, g: 20.0, s: 2.6, l: 51.0, sa: 4.5, f: 8.6, se: 0.02, pd: 20, pn: '1 poignée' },
  { id: 'graines-chia', nom: 'Graines de chia', categorie: 'Fruits secs & oléagineux', kcal: 490, p: 17.0, g: 8.0, s: 0, l: 31.0, sa: 3.3, f: 34.0, se: 0.04, pd: 10, pn: '1 c. à soupe' },
  { id: 'graines-lin', nom: 'Graines de lin', categorie: 'Fruits secs & oléagineux', kcal: 535, p: 18.0, g: 29.0, s: 1.5, l: 42.0, sa: 3.7, f: 27.0, se: 0.08, pd: 10, pn: '1 c. à soupe' },
  { id: 'raisins-secs', nom: 'Raisins secs', categorie: 'Fruits secs & oléagineux', kcal: 305, p: 3.0, g: 65.0, s: 65.0, l: 0.5, sa: 0.1, f: 3.5, se: 0.1, pd: 20, pn: '1 poignée' },
  { id: 'abricots-secs', nom: 'Abricots secs', categorie: 'Fruits secs & oléagineux', kcal: 250, p: 3.5, g: 55.0, s: 50.0, l: 0.5, sa: 0.05, f: 7.0, se: 0.02, pd: 25, pn: '3 abricots' },

  // =====================================================================
  // LÉGUMINEUSES
  // =====================================================================
  { id: 'lentilles-cuites', nom: 'Lentilles vertes cuites', categorie: 'Légumineuses', kcal: 115, p: 9.0, g: 17.0, s: 1.5, l: 0.5, sa: 0.05, f: 6.0, se: 0.01, pd: null, pn: null },
  { id: 'pois-chiches-cuits', nom: 'Pois chiches cuits', categorie: 'Légumineuses', kcal: 140, p: 8.0, g: 21.0, s: 4.0, l: 2.5, sa: 0.3, f: 6.0, se: 0.01, pd: null, pn: null },
  { id: 'haricots-rouges-cuits', nom: 'Haricots rouges cuits', categorie: 'Légumineuses', kcal: 115, p: 8.5, g: 17.0, s: 1.5, l: 0.5, sa: 0.1, f: 6.5, se: 0.01, pd: null, pn: null },
  { id: 'haricots-blancs-cuits', nom: 'Haricots blancs cuits', categorie: 'Légumineuses', kcal: 120, p: 8.0, g: 18.0, s: 2.0, l: 0.5, sa: 0.1, f: 6.5, se: 0.01, pd: null, pn: null },
  { id: 'pois-casses-cuits', nom: 'Pois cassés cuits', categorie: 'Légumineuses', kcal: 125, p: 8.5, g: 20.0, s: 2.5, l: 0.4, sa: 0.05, f: 8.0, se: 0.01, pd: null, pn: null },
  { id: 'feves-cuites', nom: 'Fèves cuites', categorie: 'Légumineuses', kcal: 85, p: 7.5, g: 10.0, s: 1.5, l: 0.5, sa: 0.1, f: 6.0, se: 0.01, pd: null, pn: null },
  { id: 'tofu', nom: 'Tofu nature', categorie: 'Légumineuses', kcal: 120, p: 14.0, g: 1.0, s: 0.7, l: 7.0, sa: 1.0, f: 1.0, se: 0.01, pd: 100, pn: '1 portion' },
  { id: 'tempeh', nom: 'Tempeh', categorie: 'Légumineuses', kcal: 195, p: 20.0, g: 8.0, s: 0, l: 11.0, sa: 2.2, f: 7.0, se: 0.01, pd: null, pn: null },
  { id: 'houmous', nom: 'Houmous', categorie: 'Légumineuses', kcal: 240, p: 7.5, g: 12.0, s: 1.5, l: 17.0, sa: 2.3, f: 4.0, se: 1.2, pd: null, pn: null },

  // =====================================================================
  // MATIÈRES GRASSES
  // =====================================================================
  { id: 'huile-olive', nom: 'Huile d\'olive', categorie: 'Matières grasses', kcal: 899, p: 0, g: 0, s: 0, l: 100.0, sa: 15.0, f: 0, se: 0, pd: 10, pn: '1 c. à soupe' },
  { id: 'huile-colza', nom: 'Huile de colza', categorie: 'Matières grasses', kcal: 899, p: 0, g: 0, s: 0, l: 100.0, sa: 7.5, f: 0, se: 0, pd: 10, pn: '1 c. à soupe' },
  { id: 'huile-tournesol', nom: 'Huile de tournesol', categorie: 'Matières grasses', kcal: 899, p: 0, g: 0, s: 0, l: 100.0, sa: 11.0, f: 0, se: 0, pd: 10, pn: '1 c. à soupe' },
  { id: 'huile-noix', nom: 'Huile de noix', categorie: 'Matières grasses', kcal: 899, p: 0, g: 0, s: 0, l: 100.0, sa: 9.5, f: 0, se: 0, pd: 10, pn: '1 c. à soupe' },
  { id: 'huile-sesame', nom: 'Huile de sésame', categorie: 'Matières grasses', kcal: 899, p: 0, g: 0, s: 0, l: 100.0, sa: 14.0, f: 0, se: 0, pd: 10, pn: '1 c. à soupe' },

  // =====================================================================
  // CONDIMENTS & SAUCES
  // =====================================================================
  { id: 'mayonnaise', nom: 'Mayonnaise', categorie: 'Condiments & sauces', kcal: 680, p: 1.0, g: 2.0, s: 2.0, l: 75.0, sa: 6.0, f: 0, se: 1.0, pd: 15, pn: '1 c. à soupe' },
  { id: 'mayo-legere', nom: 'Mayonnaise légère', categorie: 'Condiments & sauces', kcal: 320, p: 1.0, g: 7.0, s: 4.0, l: 33.0, sa: 2.8, f: 0.3, se: 1.5, pd: 15, pn: '1 c. à soupe' },
  { id: 'moutarde', nom: 'Moutarde de Dijon', categorie: 'Condiments & sauces', kcal: 110, p: 6.0, g: 4.0, s: 3.0, l: 7.0, sa: 0.5, f: 2.0, se: 5.5, pd: 5, pn: '1 c. à café' },
  { id: 'ketchup', nom: 'Ketchup', categorie: 'Condiments & sauces', kcal: 110, p: 1.5, g: 25.0, s: 22.0, l: 0.2, sa: 0.05, f: 0.5, se: 2.1, pd: 15, pn: '1 c. à soupe' },
  { id: 'vinaigrette', nom: 'Vinaigrette maison (3/1)', categorie: 'Condiments & sauces', kcal: 575, p: 0.2, g: 1.5, s: 1.0, l: 63.0, sa: 9.5, f: 0, se: 2.0, pd: 15, pn: '1 c. à soupe' },
  { id: 'sauce-tomate', nom: 'Sauce tomate nature', categorie: 'Condiments & sauces', kcal: 40, p: 1.5, g: 6.0, s: 5.0, l: 1.0, sa: 0.2, f: 1.5, se: 0.7, pd: null, pn: null },
  { id: 'sauce-bolognaise', nom: 'Sauce bolognaise', categorie: 'Condiments & sauces', kcal: 100, p: 6.5, g: 7.0, s: 4.5, l: 5.5, sa: 2.0, f: 1.5, se: 0.8, pd: null, pn: null },
  { id: 'pesto', nom: 'Pesto (classique)', categorie: 'Condiments & sauces', kcal: 430, p: 5.5, g: 4.0, s: 1.5, l: 43.0, sa: 7.0, f: 1.5, se: 2.0, pd: 20, pn: '1 c. à soupe' },
  { id: 'sauce-soja', nom: 'Sauce soja', categorie: 'Condiments & sauces', kcal: 55, p: 8.0, g: 6.0, s: 0.5, l: 0.1, sa: 0.02, f: 0.8, se: 16.0, pd: 5, pn: '1 c. à café' },
  { id: 'sel', nom: 'Sel', categorie: 'Condiments & sauces', kcal: 0, p: 0, g: 0, s: 0, l: 0, sa: 0, f: 0, se: 100, pd: 1, pn: '1 pincée' },
  { id: 'sucre', nom: 'Sucre blanc', categorie: 'Condiments & sauces', kcal: 400, p: 0, g: 100, s: 100, l: 0, sa: 0, f: 0, se: 0, pd: 5, pn: '1 c. à café' },
  { id: 'miel', nom: 'Miel', categorie: 'Condiments & sauces', kcal: 320, p: 0.3, g: 80.0, s: 80.0, l: 0, sa: 0, f: 0.2, se: 0, pd: 10, pn: '1 c. à café' },
  { id: 'confiture', nom: 'Confiture (standard)', categorie: 'Condiments & sauces', kcal: 280, p: 0.5, g: 68.0, s: 65.0, l: 0.1, sa: 0.03, f: 1.0, se: 0.02, pd: 15, pn: '1 c. à soupe' },
  { id: 'pate-tartiner', nom: 'Pâte à tartiner type Nutella', categorie: 'Condiments & sauces', kcal: 540, p: 6.0, g: 58.0, s: 55.0, l: 31.0, sa: 11.0, f: 0, se: 0.1, pd: 15, pn: '1 c. à soupe' },
  { id: 'beurre-cacahuete', nom: 'Beurre de cacahuète', categorie: 'Condiments & sauces', kcal: 620, p: 25.0, g: 15.0, s: 7.0, l: 50.0, sa: 10.0, f: 6.0, se: 0.5, pd: 15, pn: '1 c. à soupe' },
  { id: 'tahin', nom: 'Purée de sésame (tahin)', categorie: 'Condiments & sauces', kcal: 600, p: 18.0, g: 10.0, s: 0.5, l: 55.0, sa: 8.0, f: 9.0, se: 0.1, pd: 15, pn: '1 c. à soupe' },

  // =====================================================================
  // PLATS PRÉPARÉS & SNACKS
  // =====================================================================
  { id: 'pizza-margherita', nom: 'Pizza margherita', categorie: 'Plats préparés & snacks', kcal: 245, p: 11.0, g: 32.0, s: 3.0, l: 8.0, sa: 3.5, f: 2.5, se: 1.4, pd: 400, pn: '1 pizza' },
  { id: 'pizza-reine', nom: 'Pizza reine (jambon/champ.)', categorie: 'Plats préparés & snacks', kcal: 240, p: 12.0, g: 28.0, s: 3.0, l: 9.0, sa: 4.0, f: 2.0, se: 1.5, pd: 400, pn: '1 pizza' },
  { id: 'quiche-lorraine', nom: 'Quiche lorraine', categorie: 'Plats préparés & snacks', kcal: 300, p: 10.0, g: 18.0, s: 2.0, l: 21.0, sa: 10.0, f: 1.0, se: 1.2, pd: 150, pn: '1 part' },
  { id: 'sandwich-jambon-beurre', nom: 'Sandwich jambon-beurre', categorie: 'Plats préparés & snacks', kcal: 270, p: 11.0, g: 36.0, s: 2.0, l: 9.0, sa: 5.0, f: 2.0, se: 1.5, pd: 200, pn: '1 sandwich' },
  { id: 'hamburger', nom: 'Hamburger classique', categorie: 'Plats préparés & snacks', kcal: 255, p: 13.0, g: 24.0, s: 4.0, l: 12.0, sa: 5.0, f: 2.0, se: 1.2, pd: 220, pn: '1 burger' },
  { id: 'nuggets', nom: 'Nuggets de poulet', categorie: 'Plats préparés & snacks', kcal: 265, p: 15.0, g: 18.0, s: 0.5, l: 15.0, sa: 2.5, f: 1.0, se: 1.4, pd: 100, pn: '5 nuggets' },
  { id: 'hot-dog', nom: 'Hot dog', categorie: 'Plats préparés & snacks', kcal: 275, p: 10.0, g: 22.0, s: 4.0, l: 16.0, sa: 6.0, f: 1.5, se: 1.5, pd: 120, pn: '1 hot dog' },
  { id: 'lasagnes', nom: 'Lasagnes à la bolognaise', categorie: 'Plats préparés & snacks', kcal: 155, p: 8.0, g: 16.0, s: 3.5, l: 6.5, sa: 3.0, f: 1.5, se: 0.8, pd: 300, pn: '1 part' },
  { id: 'spaghetti-bolo', nom: 'Spaghetti bolognaise', categorie: 'Plats préparés & snacks', kcal: 140, p: 6.5, g: 17.5, s: 3.0, l: 4.5, sa: 1.8, f: 1.8, se: 0.7, pd: 300, pn: '1 assiette' },
  { id: 'couscous', nom: 'Couscous au mouton/merguez', categorie: 'Plats préparés & snacks', kcal: 155, p: 9.0, g: 20.0, s: 2.5, l: 5.0, sa: 1.5, f: 2.5, se: 0.6, pd: 350, pn: '1 assiette' },
  { id: 'tajine-poulet', nom: 'Tajine de poulet aux légumes', categorie: 'Plats préparés & snacks', kcal: 130, p: 10.0, g: 10.0, s: 4.0, l: 5.5, sa: 1.5, f: 2.0, se: 0.6, pd: 350, pn: '1 assiette' },
  { id: 'salade-cesar', nom: 'Salade César au poulet', categorie: 'Plats préparés & snacks', kcal: 180, p: 11.0, g: 6.0, s: 2.0, l: 12.0, sa: 3.0, f: 1.2, se: 0.9, pd: 300, pn: '1 salade' },
  { id: 'ramen-nature', nom: 'Ramen nature (bouillon + nouilles)', categorie: 'Plats préparés & snacks', kcal: 90, p: 3.5, g: 14.0, s: 1.0, l: 2.5, sa: 0.6, f: 1.0, se: 1.4, pd: 400, pn: '1 bol' },
  { id: 'sushi-saumon', nom: 'Sushi (saumon, moyenne)', categorie: 'Plats préparés & snacks', kcal: 145, p: 7.0, g: 22.0, s: 2.0, l: 3.0, sa: 0.7, f: 0.8, se: 0.8, pd: 25, pn: '1 sushi' },
  { id: 'chips-nature', nom: 'Chips nature', categorie: 'Plats préparés & snacks', kcal: 540, p: 6.0, g: 50.0, s: 0.5, l: 34.0, sa: 3.2, f: 4.5, se: 1.2, pd: 30, pn: '1 poignée' },
  { id: 'biscuits-aperitif', nom: 'Biscuits apéritif salés', categorie: 'Plats préparés & snacks', kcal: 500, p: 9.0, g: 60.0, s: 4.0, l: 25.0, sa: 3.0, f: 3.0, se: 2.5, pd: 30, pn: '1 poignée' },
  { id: 'saucisson-apero', nom: 'Saucisson sec apéritif', categorie: 'Plats préparés & snacks', kcal: 420, p: 25.0, g: 1.5, s: 1.0, l: 35.0, sa: 13.0, f: 0, se: 4.5, pd: 30, pn: '5 tranches' },

  // =====================================================================
  // BOISSONS
  // =====================================================================
  { id: 'eau', nom: 'Eau', categorie: 'Boissons', kcal: 0, p: 0, g: 0, s: 0, l: 0, sa: 0, f: 0, se: 0, pd: 250, pn: '1 verre' },
  { id: 'eau-gazeuse', nom: 'Eau gazeuse', categorie: 'Boissons', kcal: 0, p: 0, g: 0, s: 0, l: 0, sa: 0, f: 0, se: 0.03, pd: 250, pn: '1 verre' },
  { id: 'cafe', nom: 'Café noir (expresso)', categorie: 'Boissons', kcal: 2, p: 0.2, g: 0, s: 0, l: 0, sa: 0, f: 0, se: 0, pd: 30, pn: '1 expresso' },
  { id: 'cafe-allonge', nom: 'Café allongé', categorie: 'Boissons', kcal: 2, p: 0.1, g: 0, s: 0, l: 0, sa: 0, f: 0, se: 0, pd: 150, pn: '1 tasse' },
  { id: 'cafe-lait', nom: 'Café au lait (avec lait demi-écrémé)', categorie: 'Boissons', kcal: 36, p: 2.2, g: 3.3, s: 3.3, l: 1.3, sa: 0.8, f: 0, se: 0.07, pd: 200, pn: '1 tasse' },
  { id: 'the', nom: 'Thé (infusé)', categorie: 'Boissons', kcal: 1, p: 0, g: 0, s: 0, l: 0, sa: 0, f: 0, se: 0, pd: 250, pn: '1 tasse' },
  { id: 'tisane', nom: 'Tisane / infusion', categorie: 'Boissons', kcal: 1, p: 0, g: 0, s: 0, l: 0, sa: 0, f: 0, se: 0, pd: 250, pn: '1 tasse' },
  { id: 'jus-orange', nom: 'Jus d\'orange (100 %)', categorie: 'Boissons', kcal: 45, p: 0.7, g: 10.0, s: 8.5, l: 0.2, sa: 0.05, f: 0.2, se: 0, pd: 200, pn: '1 verre' },
  { id: 'jus-pomme', nom: 'Jus de pomme', categorie: 'Boissons', kcal: 47, p: 0.1, g: 11.0, s: 10.5, l: 0, sa: 0, f: 0.1, se: 0, pd: 200, pn: '1 verre' },
  { id: 'jus-raisin', nom: 'Jus de raisin', categorie: 'Boissons', kcal: 65, p: 0.4, g: 15.5, s: 15.0, l: 0.1, sa: 0.02, f: 0.2, se: 0, pd: 200, pn: '1 verre' },
  { id: 'coca', nom: 'Coca-Cola', categorie: 'Boissons', kcal: 42, p: 0, g: 10.6, s: 10.6, l: 0, sa: 0, f: 0, se: 0, pd: 330, pn: '1 canette' },
  { id: 'coca-zero', nom: 'Coca-Cola Zero', categorie: 'Boissons', kcal: 0, p: 0, g: 0, s: 0, l: 0, sa: 0, f: 0, se: 0, pd: 330, pn: '1 canette' },
  { id: 'soda-citron', nom: 'Limonade / soda citron', categorie: 'Boissons', kcal: 40, p: 0, g: 10.0, s: 10.0, l: 0, sa: 0, f: 0, se: 0, pd: 330, pn: '1 canette' },
  { id: 'biere', nom: 'Bière blonde (5 %)', categorie: 'Boissons', kcal: 43, p: 0.3, g: 3.2, s: 0, l: 0, sa: 0, f: 0, se: 0.01, pd: 250, pn: '1 demi' },
  { id: 'biere-forte', nom: 'Bière forte (8 %)', categorie: 'Boissons', kcal: 72, p: 0.4, g: 4.0, s: 0.1, l: 0, sa: 0, f: 0, se: 0.01, pd: 330, pn: '1 canette' },
  { id: 'vin-rouge', nom: 'Vin rouge', categorie: 'Boissons', kcal: 82, p: 0.1, g: 0.5, s: 0.5, l: 0, sa: 0, f: 0, se: 0.01, pd: 125, pn: '1 verre' },
  { id: 'vin-blanc', nom: 'Vin blanc sec', categorie: 'Boissons', kcal: 75, p: 0.1, g: 0.5, s: 0.5, l: 0, sa: 0, f: 0, se: 0.01, pd: 125, pn: '1 verre' },
  { id: 'champagne', nom: 'Champagne', categorie: 'Boissons', kcal: 85, p: 0.1, g: 1.5, s: 1.0, l: 0, sa: 0, f: 0, se: 0.01, pd: 100, pn: '1 coupe' },
  { id: 'whisky', nom: 'Whisky', categorie: 'Boissons', kcal: 240, p: 0, g: 0, s: 0, l: 0, sa: 0, f: 0, se: 0, pd: 30, pn: '1 dose' },

  // =====================================================================
  // SUCRERIES & DESSERTS
  // =====================================================================
  { id: 'chocolat-noir', nom: 'Chocolat noir 70 %', categorie: 'Sucreries & desserts', kcal: 550, p: 7.5, g: 35.0, s: 30.0, l: 40.0, sa: 24.0, f: 10.0, se: 0.05, pd: 20, pn: '2 carrés' },
  { id: 'chocolat-noir-90', nom: 'Chocolat noir 90 %', categorie: 'Sucreries & desserts', kcal: 610, p: 10.0, g: 14.0, s: 7.0, l: 55.0, sa: 33.0, f: 14.0, se: 0.03, pd: 20, pn: '2 carrés' },
  { id: 'chocolat-lait', nom: 'Chocolat au lait', categorie: 'Sucreries & desserts', kcal: 545, p: 8.0, g: 55.0, s: 53.0, l: 31.0, sa: 19.0, f: 3.0, se: 0.2, pd: 20, pn: '2 carrés' },
  { id: 'chocolat-blanc', nom: 'Chocolat blanc', categorie: 'Sucreries & desserts', kcal: 560, p: 7.0, g: 60.0, s: 59.0, l: 32.0, sa: 20.0, f: 0, se: 0.2, pd: 20, pn: '2 carrés' },
  { id: 'biscuit-chocolat', nom: 'Biscuit au chocolat (type Prince)', categorie: 'Sucreries & desserts', kcal: 475, p: 6.0, g: 68.0, s: 32.0, l: 20.0, sa: 10.0, f: 3.0, se: 0.7, pd: 25, pn: '2 biscuits' },
  { id: 'sable', nom: 'Sablé nature', categorie: 'Sucreries & desserts', kcal: 475, p: 6.0, g: 70.0, s: 22.0, l: 18.0, sa: 10.0, f: 1.5, se: 0.7, pd: 12, pn: '1 biscuit' },
  { id: 'madeleine', nom: 'Madeleine', categorie: 'Sucreries & desserts', kcal: 420, p: 6.5, g: 55.0, s: 28.0, l: 19.0, sa: 6.5, f: 1.0, se: 0.6, pd: 25, pn: '1 madeleine' },
  { id: 'gaufre', nom: 'Gaufre (nature)', categorie: 'Sucreries & desserts', kcal: 420, p: 7.0, g: 46.0, s: 14.0, l: 22.0, sa: 6.0, f: 1.5, se: 1.0, pd: 50, pn: '1 gaufre' },
  { id: 'crepe-sucree', nom: 'Crêpe sucrée (nature)', categorie: 'Sucreries & desserts', kcal: 200, p: 6.0, g: 30.0, s: 8.0, l: 6.0, sa: 2.5, f: 1.0, se: 0.5, pd: 60, pn: '1 crêpe' },
  { id: 'tarte-pommes', nom: 'Tarte aux pommes', categorie: 'Sucreries & desserts', kcal: 235, p: 3.0, g: 33.0, s: 16.0, l: 10.0, sa: 5.0, f: 2.0, se: 0.3, pd: 120, pn: '1 part' },
  { id: 'fondant-chocolat', nom: 'Fondant au chocolat', categorie: 'Sucreries & desserts', kcal: 400, p: 6.0, g: 40.0, s: 30.0, l: 24.0, sa: 14.0, f: 2.5, se: 0.2, pd: 90, pn: '1 part' },
  { id: 'mousse-chocolat', nom: 'Mousse au chocolat', categorie: 'Sucreries & desserts', kcal: 245, p: 5.5, g: 24.0, s: 22.0, l: 14.0, sa: 8.0, f: 1.5, se: 0.1, pd: 90, pn: '1 ramequin' },
  { id: 'creme-brulee', nom: 'Crème brûlée', categorie: 'Sucreries & desserts', kcal: 300, p: 4.0, g: 20.0, s: 19.0, l: 22.0, sa: 13.0, f: 0, se: 0.1, pd: 120, pn: '1 portion' },
  { id: 'glace-vanille', nom: 'Glace à la vanille', categorie: 'Sucreries & desserts', kcal: 215, p: 3.5, g: 25.0, s: 24.0, l: 11.0, sa: 7.0, f: 0.5, se: 0.1, pd: 60, pn: '1 boule' },
  { id: 'sorbet', nom: 'Sorbet aux fruits', categorie: 'Sucreries & desserts', kcal: 130, p: 0.5, g: 31.0, s: 29.0, l: 0.2, sa: 0.1, f: 0.5, se: 0.02, pd: 60, pn: '1 boule' },
  { id: 'riz-au-lait', nom: 'Riz au lait', categorie: 'Sucreries & desserts', kcal: 115, p: 3.0, g: 18.0, s: 9.0, l: 3.0, sa: 2.0, f: 0.2, se: 0.1, pd: 130, pn: '1 pot' },
  { id: 'compote-pomme', nom: 'Compote de pomme (sans sucres ajoutés)', categorie: 'Sucreries & desserts', kcal: 52, p: 0.3, g: 12.0, s: 11.0, l: 0.1, sa: 0.03, f: 1.5, se: 0.01, pd: 100, pn: '1 gourde' },
  { id: 'bonbons', nom: 'Bonbons gélifiés', categorie: 'Sucreries & desserts', kcal: 340, p: 6.0, g: 77.0, s: 47.0, l: 0.5, sa: 0.1, f: 0, se: 0.1, pd: 30, pn: '1 poignée' },
];

/**
 * Catégories dans l'ordre d'affichage
 */
export const FOOD_CATEGORIES = [
  'Boulangerie & céréales',
  'Viandes',
  'Poissons & fruits de mer',
  'Œufs',
  'Produits laitiers',
  'Fromages',
  'Légumes',
  'Fruits',
  'Fruits secs & oléagineux',
  'Légumineuses',
  'Matières grasses',
  'Condiments & sauces',
  'Plats préparés & snacks',
  'Boissons',
  'Sucreries & desserts',
];

export const CATEGORY_ICONS = {
  'Boulangerie & céréales': '🥖',
  'Viandes': '🍖',
  'Poissons & fruits de mer': '🐟',
  'Œufs': '🥚',
  'Produits laitiers': '🥛',
  'Fromages': '🧀',
  'Légumes': '🥦',
  'Fruits': '🍎',
  'Fruits secs & oléagineux': '🥜',
  'Légumineuses': '🫘',
  'Matières grasses': '🫒',
  'Condiments & sauces': '🥫',
  'Plats préparés & snacks': '🍕',
  'Boissons': '🥤',
  'Sucreries & desserts': '🍫',
};
