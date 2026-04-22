import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AuthLayout from '../../components/auth/AuthLayout';
import Button from '../../components/ui/Button';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      await signIn({ email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="BIENVENUE"
      title="Connexion"
      footer={
        <div className="text-sm text-text-secondary">
          Pas encore de compte ?{' '}
          <Link to="/auth/signup" className="text-heat-amber font-semibold hover:underline">
            Créer un compte
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-text-tertiary mb-1.5 block">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            placeholder="toi@exemple.com"
            className="w-full px-4 py-3 bg-bg-surface1 border border-subtle rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-heat-orange transition-colors"
          />
        </div>
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-text-tertiary">
              Mot de passe
            </label>
            <Link
              to="/auth/mot-de-passe-oublie"
              className="font-mono text-[10px] tracking-wider uppercase text-heat-amber hover:underline"
            >
              Oublié ?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="w-full px-4 py-3 bg-bg-surface1 border border-subtle rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-heat-orange transition-colors"
          />
        </div>
        {error && (
          <div className="p-3 rounded-xl border border-danger bg-[rgba(255,23,68,0.05)] text-danger text-sm">
            {error}
          </div>
        )}
        <Button type="submit" size="lg" fullWidth disabled={loading}>
          {loading ? 'Connexion...' : 'Me connecter'}
        </Button>
      </form>
    </AuthLayout>
  );
}

function mapAuthError(err) {
  const msg = err?.message || '';
  if (msg.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect.';
  if (msg.includes('Email not confirmed')) return "Email pas encore confirmé. Vérifie ta boîte mail.";
  if (msg.includes('network')) return 'Erreur réseau, réessaye.';
  return msg || 'Erreur inconnue';
}
