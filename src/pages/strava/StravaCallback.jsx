import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function StravaCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !code) {
      setStatus('error');
      setErrorMsg(error === 'access_denied' ? 'Connexion refusée.' : 'Code OAuth manquant.');
      return;
    }

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setStatus('error');
        setErrorMsg('Session expirée. Reconnecte-toi.');
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke('strava-callback', {
        body: { code },
      });

      if (fnError || data?.error) {
        setStatus('error');
        setErrorMsg(data?.error || fnError?.message || 'Erreur inconnue');
        return;
      }

      setStatus('success');
      setTimeout(() => navigate('/profil', { replace: true }), 2000);
    })();
  }, []);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 gap-6" style={{ background: '#0A0908' }}>
      {status === 'loading' && (
        <>
          <StravaLogo />
          <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-text-tertiary animate-pulse">
            Connexion en cours...
          </div>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-16 h-16 rounded-full bg-heat-orange/10 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF4D00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <div className="font-display font-bold text-xl text-text-primary text-center mb-1">Strava connecté</div>
            <div className="font-mono text-[11px] text-text-tertiary text-center tracking-wider">Activités synchronisées</div>
          </div>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <div>
            <div className="font-display font-bold text-xl text-text-primary text-center mb-1">Échec de connexion</div>
            <div className="font-mono text-[11px] text-text-tertiary text-center tracking-wider">{errorMsg}</div>
          </div>
          <button
            onClick={() => navigate('/profil', { replace: true })}
            className="px-6 py-3 rounded-xl border border-subtle text-text-secondary font-display font-bold text-[12px] uppercase tracking-wider hover:border-strong transition-colors"
          >
            Retour profil
          </button>
        </>
      )}
    </div>
  );
}

function StravaLogo() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
      <path d="M10 17.5L14.5 8.5L17 13H20L14.5 3L9 13H12L10 17.5Z" fill="#FC4C02" />
      <path d="M14.5 17.5L17 13H20L14.5 22L9 13H12L14.5 17.5Z" fill="#FC4C02" opacity="0.6" />
    </svg>
  );
}
