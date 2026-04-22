# Jamra

> Suivi nutritionnel et sportif — une app pensée comme une braise qu'on entretient jour après jour.

## Concept

Jamra ("braise" en arabe) est une application web progressive (PWA) de suivi nutritionnel et sportif, conçue pour un usage familial. L'architecture est **offline-first** : toute l'expérience tourne en local (IndexedDB), avec une synchronisation cloud transparente via Supabase.

Design inspiré par la métaphore de la braise : un dégradé orange → rouge ("Heat Signature") sur fond sombre, typographie industrielle (Big Shoulders Display + Manrope + JetBrains Mono).

## Features

### Nutrition
- Base de **260 aliments français** embarquée (valeurs Ciqual-like)
- Scan de code-barres **OpenFoodFacts** (via `BarcodeDetector` natif + saisie manuelle)
- Création d'aliments personnalisés
- Duplication rapide d'un repas d'un jour passé

### Suivi
- Dashboard temps réel avec anneau de progression
- Journal avec carrousel 7 jours + tendances 7/14/30j
- Suivi du poids avec courbe + moyenne mobile 7j + projection linéaire
- Insights contextuels (cards douces, non intrusives)

### Tech
- **React 18** + **Vite 5** + **Tailwind CSS**
- **Dexie** (IndexedDB) pour le local-first
- **Supabase** (Postgres + Auth + RLS) pour le cloud
- **PWA** installable avec service worker custom
- Graphiques SVG maison (pas de dépendance charting)

## Getting started

### Prérequis
- Node.js 18+
- Un projet Supabase avec le schéma Jamra appliqué

### Installation

```bash
git clone https://github.com/geaimoqueur77/jamra.git
cd jamra
npm install

# Configurer les variables d'environnement
cp .env.local.example .env.local
# Éditer .env.local avec les vraies URL et anon key Supabase

# Lancer en dev
npm run dev

# Build prod
npm run build
npm run preview
```

### Variables d'environnement

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxx
```

⚠️ Ne jamais committer `.env.local` ni la `service_role` key.

## Roadmap

- [x] Phase 1 — Local-first complet (onboarding, nutrition, journal, poids, PWA)
- [x] Phase 3 — Coaching léger (tendances, projection, insights)
- [ ] Phase 4 — Cloud + famille (en cours)
  - [x] 4.1 — Auth Supabase + écrans login/signup
  - [ ] 4.2 — Sync offline-first IndexedDB ↔ Supabase
  - [ ] 4.3 — Backfill des données existantes
  - [ ] 4.4 — Déploiement Vercel
  - [ ] 4.B — Multi-profil famille via invitations
  - [ ] 4.C — Partage d'aliments et repas types
- [ ] Phase 2 — Intégration Garmin Connect (après 4.4)

## Design system

- **Palette** : dark background `#0F0F12` + dégradé Heat `#FFAA33 → #FF4D00 → #FF1744`
- **Typo display** : Big Shoulders Display
- **Typo body** : Manrope
- **Typo data** : JetBrains Mono
- **Tonalité** : sobre, encourageante, jamais culpabilisante

## Licence

Projet personnel. Tous droits réservés sauf autorisation explicite.
