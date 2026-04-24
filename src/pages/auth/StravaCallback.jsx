import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { completeStravaOAuth } from '../../lib/strava';
import JamraSymbol from '../../components/illustrations/JamraSymbol';

/**
 * Page de retour de l'OAuth Strava.
 * URL : /strava-callback?code=XXX&scope=YYY
 * Ou en cas d'erreur : /strava-callback?error=access_denied
 */
export default function StravaCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [status, setStatus] = useState('processing'); // processing | success | error
  const [error, setError] = useState(null);

  useEffect(() => {
    const code = params.get('code');
    const errParam = params.get('error');

    if (errParam) {
      setStatus('error');
      setError(errParam === 'access_denied'
        ? 'Tu as refusé la connexion Strava.'
        : errParam);
      return;
    }

    if (!code) {
      setStatus('error');
      setError('Aucun code reçu depuis Strava.');
      return;
    }

    completeStravaOAuth(code)
      .then(() => {
        setStatus('success');
        setTimeout(() => navigate('/strava', { replace: true }), 1500);
      })
      .catch(err => {
        setStatus('error');
        setError(err.message || 'Erreur lors de la connexion');
      });
  }, [params, navigate]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-6 px-6 text-center animate-fade-in">
      <JamraSymbol size={80} />

      {status === 'processing' && (
        <>
          <div className="font-display font-bold text-xl uppercase tracking-[0.02em] text-text-primary">
            Connexion Strava...
          </div>
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-tertiary">
            Récupération du token
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-heat-amber border-t-transparent animate-spin" />
        </>
      )}

      {status === 'success' && (
        <>
          <div className="text-5xl">✅</div>
          <div className="font-display font-bold text-xl uppercase tracking-[0.02em] text-success">
            Connecté à Strava !
          </div>
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-tertiary">
            Redirection...
          </div>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="text-5xl">⚠️</div>
          <div className="font-display font-bold text-xl uppercase tracking-[0.02em] text-danger">
            Connexion échouée
          </div>
          <div className="text-sm text-text-secondary max-w-xs">{error}</div>
          <button
            onClick={() => navigate('/strava', { replace: true })}
            className="px-4 py-2 rounded-lg border border-subtle text-text-secondary hover:text-heat-orange hover:border-heat-orange text-sm font-display font-bold uppercase tracking-[0.1em]"
          >
            Retour
          </button>
        </>
      )}
    </div>
  );
}
