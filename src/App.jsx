import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { AuthProvider } from './hooks/useAuth';
import useBootstrap from './hooks/useBootstrap';
import JamraSymbol from './components/illustrations/JamraSymbol';
import Wordmark from './components/ui/Wordmark';

export default function App() {
  const { ready } = useBootstrap();

  if (!ready) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-6 animate-fade-in">
        <JamraSymbol size={80} />
        <Wordmark size="lg" />
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-text-tertiary">
          Chargement…
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
