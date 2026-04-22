import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { isOnboarded } from './db/database';
import { useAuth } from './hooks/useAuth';

import AppShell from './components/layout/AppShell';
import OnboardingWizard from './pages/onboarding/OnboardingWizard';
import Home from './pages/Home';
import Journal from './pages/Journal';
import Weight from './pages/Weight';
import Profile from './pages/Profile';
import Add from './pages/Add';
import FoodDetail from './pages/FoodDetail';
import EditEntry from './pages/EditEntry';
import BarcodeScanner from './pages/BarcodeScanner';
import CreateCustomFood from './pages/CreateCustomFood';
import CopyMeal from './pages/CopyMeal';
import Workspace from './pages/Workspace';
import Training from './pages/Training';
import TrainingPlanEditor from './pages/TrainingPlanEditor';
import SessionDetail from './pages/SessionDetail';

import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';

/**
 * Router — gestion des routes avec 3 niveaux de protection :
 *  1. AuthGuard : redirige vers /auth/login si pas connecté
 *  2. OnboardingGuard : redirige vers /onboarding si profil vide
 *  3. OnboardingRoute : inversé, redirige vers / si déjà onboardé
 */

function AuthGuard() {
  const { loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-text-tertiary">
          Connexion en cours...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

function GuestOnly() {
  // Les écrans d'auth : on redirige vers / si déjà connecté
  const { loading, isAuthenticated } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <Outlet />;
}

function OnboardingGuard() {
  const onboarded = useLiveQuery(isOnboarded);
  if (onboarded === undefined) return null;
  if (!onboarded) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

function OnboardingRoute() {
  const onboarded = useLiveQuery(isOnboarded);
  if (onboarded === undefined) return null;
  if (onboarded) return <Navigate to="/" replace />;
  return <OnboardingWizard />;
}

export const router = createBrowserRouter([
  // Routes publiques (auth)
  {
    element: <GuestOnly />,
    children: [
      { path: '/auth/login', element: <Login /> },
      { path: '/auth/signup', element: <Signup /> },
      { path: '/auth/mot-de-passe-oublie', element: <ForgotPassword /> },
    ],
  },

  // Routes protégées par auth
  {
    element: <AuthGuard />,
    children: [
      { path: '/onboarding', element: <OnboardingRoute /> },
      {
        element: <OnboardingGuard />,
        children: [
          {
            element: <AppShell />,
            children: [
              { path: '/', element: <Home /> },
              { path: '/journal', element: <Journal /> },
              { path: '/poids', element: <Weight /> },
              { path: '/profil', element: <Profile /> },
            ],
          },
          // Routes full-screen (sans AppShell)
          { path: '/ajout', element: <Add /> },
          { path: '/aliment/:id', element: <FoodDetail /> },
          { path: '/edit/:id', element: <EditEntry /> },
          { path: '/scanner', element: <BarcodeScanner /> },
          { path: '/creer-aliment', element: <CreateCustomFood /> },
          { path: '/copier-repas', element: <CopyMeal /> },
          { path: '/foyer', element: <Workspace /> },
          // Training (Phase 5.B)
          { path: '/entrainement', element: <Training /> },
          { path: '/entrainement/config', element: <TrainingPlanEditor /> },
          { path: '/entrainement/seance/:id', element: <SessionDetail /> },
        ],
      },
    ],
  },
]);
