import { createBrowserRouter, Navigate, Outlet, useLocation, Suspense, lazy } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { isOnboarded } from './db/database';
import { useAuth } from './hooks/useAuth';

import AppShell from './components/layout/AppShell';
import Home from './pages/Home';

// Lazy-loaded pages — split into separate chunks for faster initial load
const Journal = lazy(() => import('./pages/Journal'));
const Weight = lazy(() => import('./pages/Weight'));
const Profile = lazy(() => import('./pages/Profile'));
const Sport = lazy(() => import('./pages/Sport'));
const Corps = lazy(() => import('./pages/Corps'));
const Add = lazy(() => import('./pages/Add'));
const FoodDetail = lazy(() => import('./pages/FoodDetail'));
const EditEntry = lazy(() => import('./pages/EditEntry'));
const BarcodeScanner = lazy(() => import('./pages/BarcodeScanner'));
const CreateCustomFood = lazy(() => import('./pages/CreateCustomFood'));
const CopyMeal = lazy(() => import('./pages/CopyMeal'));
const StravaCallback = lazy(() => import('./pages/strava/StravaCallback'));
const OnboardingWizard = lazy(() => import('./pages/onboarding/OnboardingWizard'));

const Login = lazy(() => import('./pages/auth/Login'));
const Signup = lazy(() => import('./pages/auth/Signup'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));

function PageLoader() {
  return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-heat-orange/30 border-t-heat-orange animate-spin" />
    </div>
  );
}

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
  return (
    <Suspense fallback={<PageLoader />}>
      <OnboardingWizard />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  // Routes publiques (auth)
  {
    element: <GuestOnly />,
    children: [
      { path: '/auth/login', element: <Suspense fallback={<PageLoader />}><Login /></Suspense> },
      { path: '/auth/signup', element: <Suspense fallback={<PageLoader />}><Signup /></Suspense> },
      { path: '/auth/mot-de-passe-oublie', element: <Suspense fallback={<PageLoader />}><ForgotPassword /></Suspense> },
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
              { path: '/sport', element: <Suspense fallback={<PageLoader />}><Sport /></Suspense> },
              { path: '/corps', element: <Suspense fallback={<PageLoader />}><Corps /></Suspense> },
              { path: '/profil', element: <Suspense fallback={<PageLoader />}><Profile /></Suspense> },
            ],
          },
          // Routes full-screen (sans AppShell)
          { path: '/journal', element: <Suspense fallback={<PageLoader />}><Journal /></Suspense> },
          { path: '/poids', element: <Suspense fallback={<PageLoader />}><Weight /></Suspense> },
          { path: '/ajout', element: <Suspense fallback={<PageLoader />}><Add /></Suspense> },
          { path: '/aliment/:id', element: <Suspense fallback={<PageLoader />}><FoodDetail /></Suspense> },
          { path: '/edit/:id', element: <Suspense fallback={<PageLoader />}><EditEntry /></Suspense> },
          { path: '/scanner', element: <Suspense fallback={<PageLoader />}><BarcodeScanner /></Suspense> },
          { path: '/creer-aliment', element: <Suspense fallback={<PageLoader />}><CreateCustomFood /></Suspense> },
          { path: '/copier-repas', element: <Suspense fallback={<PageLoader />}><CopyMeal /></Suspense> },
          { path: '/strava/callback', element: <Suspense fallback={<PageLoader />}><StravaCallback /></Suspense> },
        ],
      },
    ],
  },
]);
