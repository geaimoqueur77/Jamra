import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AuthLayout from '../../components/auth/AuthLayout';
import Button from '../../components/ui/Button';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err?.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout eyebrow="VÉRIFIE TES MAILS" title="Lien envoyé">
        <div className="p-5 bg-bg-surface1 border border-heat-orange rounded-2xl text-center">
          <div className="text-4xl mb-3">✉️</div>
          <p className="text-text-primary mb-2">
            Si un compte existe pour <span className="text-heat-amber font-bold">{email}</span>, tu vas recevoir un lien de réinitialisation.
          </p>
        </div>
        <div className="mt-5 text-center">
          <Link to="/auth/login" className="font-display font-bold text-xs uppercase tracking-[0.1em] text-heat-amber hover:underline">
            Retour à la connexion
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="RÉINITIALISATION"
      title="Mot de passe oublié"
      footer={
        <Link to="/auth/login" className="font-display font-bold text-xs uppercase tracking-[0.1em] text-heat-amber hover:underline">
          Retour à la connexion
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-text-secondary text-sm mb-2">
          Entre ton email, on t'envoie un lien pour choisir un nouveau mot de passe.
        </p>
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
        {error && (
          <div className="p-3 rounded-xl border border-danger bg-[rgba(255,23,68,0.05)] text-danger text-sm">
            {error}
          </div>
        )}
        <Button type="submit" size="lg" fullWidth disabled={loading}>
          {loading ? 'Envoi...' : 'Envoyer le lien'}
        </Button>
      </form>
    </AuthLayout>
  );
}
