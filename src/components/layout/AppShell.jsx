import { Outlet, useNavigate } from 'react-router-dom';
import BottomNav from './BottomNav';
import FAB from '../ui/FAB';

/**
 * AppShell — layout principal de l'application
 * Contient : contenu + BottomNav + FAB
 * Utilisé pour toutes les pages hors onboarding
 */

export default function AppShell() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh flex flex-col relative">
      <main className="flex-1 pb-[110px]">
        <Outlet />
      </main>
      <FAB onClick={() => navigate('/ajout')} ariaLabel="Ajouter un repas" />
      <BottomNav />
    </div>
  );
}
