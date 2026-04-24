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
      <div className="min-h-dvh flex flex-col items-center justify-center gap-6 animate-fade-in px-8">
        <div className="animate-pulse-ring">
          <JamraSymbol size={72} />
        </div>
        <div className="animate-fade-up" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
          <Wordmark size="lg" />
        </div>
        <div
          className="font-mono text-[10px] tracking-[0.3em] uppercase text-heat-amber font-bold animate-fade-up"
          style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}
        >
          Chargement…
        </div>
        <div
          className="mt-4 w-24 h-[2px] rounded-full overflow-hidden relative"
          style={{ background: 'rgba(255, 255, 255, 0.06)' }}
        >
          <div
            className="absolute inset-y-0 animate-spin-slow"
            style={{
              width: '33%',
              background: 'linear-gradient(90deg, transparent, #FFAA33, transparent)',
            }}
          />
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
