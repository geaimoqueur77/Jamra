# Jamra

> Suivi nutritionnel et sportif · Phase 1.A (Fondations)

Application web progressive (PWA) de tracking nutritionnel et sportif.
Direction créative : **Heat Signature** — dark mode premium, dégradé orange-rouge, typographie athlétique.

---

## Stack technique

- **React 18** + **Vite** — framework moderne, hot-reload instantané
- **Tailwind CSS 3** — styles utilitaires avec tokens custom "Heat Signature"
- **Dexie 4** — base de données locale via IndexedDB
- **React Router 6** — navigation entre écrans

---

## Démarrage rapide

### Prérequis

- Node.js 18 ou 20 LTS ([télécharger](https://nodejs.org/))
- npm (inclus avec Node.js)

### Installation

```bash
# Installer les dépendances (uniquement la 1re fois)
npm install

# Lancer le serveur de développement
npm run dev
```

Puis ouvre **http://localhost:5173** dans ton navigateur.

### Tester sur ton téléphone (même réseau Wi-Fi)

Le serveur de dev écoute sur toutes les interfaces. Récupère l'IP locale de ton ordinateur
(ex : `192.168.1.20`) et ouvre `http://192.168.1.20:5173` dans Safari (iPhone) ou Chrome (Android).

### Build de production

```bash
npm run build       # produit un dossier dist/
npm run preview     # sert dist/ en local
```

---

## Structure du projet

```
src/
├── main.jsx                  # Point d'entrée React
├── App.jsx                   # Composant racine
├── router.jsx                # Routes + garde onboarding
│
├── styles/
│   └── globals.css           # Tailwind + keyframes Heat Signature
│
├── db/
│   └── database.js           # Dexie (6 tables) + helpers
│
├── utils/
│   ├── calculations.js       # Mifflin-St Jeor, TDEE, macros, projections
│   └── format.js             # Formattage nombres/dates FR
│
├── components/
│   ├── illustrations/
│   │   ├── JamraSymbol.jsx          # Symbole arc validé
│   │   └── MealIllustrations.jsx    # 4 SVG repas (sunrise/noon/moon/spark)
│   │
│   ├── ui/
│   │   ├── Button.jsx, Card.jsx, IconButton.jsx
│   │   ├── ProgressRing.jsx, ProgressBar.jsx
│   │   ├── FAB.jsx, TextField.jsx, SelectCard.jsx
│   │   └── Wordmark.jsx
│   │
│   └── layout/
│       ├── Header.jsx              # 3 variantes (greeting/title/centered)
│       ├── BottomNav.jsx           # Navigation 4 onglets
│       └── AppShell.jsx            # Layout app + FAB + nav
│
└── pages/
    ├── onboarding/                 # Wizard 5 étapes
    │   ├── OnboardingWizard.jsx
    │   ├── StepWelcome.jsx         # 1. Bienvenue
    │   ├── StepPersonal.jsx        # 2. Prénom, âge, sexe, taille
    │   ├── StepCurrent.jsx         # 3. Poids actuel, activité, sport
    │   ├── StepGoal.jsx            # 4. Objectif, cible, scénario
    │   └── StepRecap.jsx           # 5. Récap + validation
    │
    ├── Home.jsx                    # Dashboard du jour (P1.A: empty state)
    ├── Journal.jsx                 # Vue semaine (P1.C)
    ├── Weight.jsx                  # Courbe poids (P1.C)
    ├── Profile.jsx                 # Profil + reset (P1.A: lecture seule)
    ├── Add.jsx                     # Ajout aliment (P1.B)
    └── ComingSoon.jsx              # Placeholder réutilisable
```

---

## Feuille de route

| Phase | Contenu | Statut |
|---|---|---|
| **1.A** | Fondations : profil, onboarding, calculs, design system | ✅ Livré |
| **1.B** | Nutrition : Ciqual, recherche, saisie repas, dashboard vivant | À venir |
| **1.C** | Journal hebdo, suivi poids, repas-types, aliments persos | À venir |
| **1.D** | OpenFoodFacts, scan code-barres, PWA install | À venir |
| **2** | Intégration Garmin, suivi sportif | Plus tard |
| **3** | Coaching adaptatif, recommandations | Plus tard |
| **4** | Ouverture familiale (Supabase) | Plus tard |

---

## Ce qui marche en Phase 1.A

✅ Onboarding complet 5 étapes (données personnelles, situation, objectif, récap)
✅ Sauvegarde locale en IndexedDB (tes données restent sur ton appareil)
✅ Calculs automatiques : MB, TDEE, apport cible, répartition macros, projection
✅ Dashboard avec anneau calorique animé + barres macros (affichage des cibles)
✅ Profil consultable + bouton reset
✅ Navigation entre 4 sections (Accueil / Journal / Poids / Profil)
✅ Design Heat Signature appliqué partout
✅ Animations d'entrée (ring fill, bar grow, fade in)
✅ Responsive mobile + desktop

## Ce qui ne marche pas encore (volontairement, arrive après)

❌ Saisie de repas (Phase 1.B)
❌ Recherche d'aliments (Phase 1.B)
❌ Scan code-barres (Phase 1.D)
❌ Historique et graphiques hebdo (Phase 1.C)
❌ Suivi de poids avec courbe (Phase 1.C)
❌ Installation PWA sur écran d'accueil (Phase 1.D)

---

## Licence

Usage personnel / familial. Tous droits réservés.
