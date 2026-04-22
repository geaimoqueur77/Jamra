import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AuthLayout from '../../components/auth/AuthLayout';
import Button from '../../components/ui/Button';

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    if (!nom.trim()) return 'Entre un prénom ou pseudo.';
    if (!email.includes('@')) return "L'email n'est pas valide.";
    if (password.length < 8) return 'Le mot de passe doit faire au moins 8 caractères.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data = await signUp({ email: email.trim(), password, nom: nom.trim() });
      // Si la confirmation email est désactivée dans Supabase, on a déjà une session
      if (data?.session) {
        navigate('/', { replace: true });
      } else {
        // Sinon il faut confirmer via email
        setSuccess(true);
      }
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout eyebrow="PRESQUE PRÊT" title="Vérifie ton email">
        <div className="p-5 bg-bg-surface1 border border-heat-orange rounded-2xl text-center">
          <div className="text-4xl mb-3">📬</div>
          <p className="text-text-primary mb-2">
            On vient d'envoyer un lien de confirmation à <span className="text-heat-amber font-bold">{email}</span>.
          </p>
          <p className="text-sm text-text-secondary">
            Clique sur le lien dans l'email pour activer ton compte, puis reviens ici pour te connecter.
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
      eyebrow="DÉMARRAGE"
      title="Créer un compte"
      footer={
        <div className="text-sm text-text-secondary">
          Déjà un compte ?{' '}
          <Link to="/auth/login" className="text-heat-amber font-semibold hover:underline">
            Se connecter
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-text-tertiary mb-1.5 block">
            Prénom ou pseudo
          </label>
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            autoComplete="given-name"
            required
            placeholder="Ghali"
            className="w-full px-4 py-3 bg-bg-surface1 border border-subtle rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-heat-orange transition-colors"
          />
        </div>
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
          <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-text-tertiary mb-1.5 block">
            Mot de passe
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            placeholder="Au moins 8 caractères"
            className="w-full px-4 py-3 bg-bg-surface1 border border-subtle rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-heat-orange transition-colors"
          />
        </div>
        {error && (
          <div className="p-3 rounded-xl border border-danger bg-[rgba(255,23,68,0.05)] text-danger text-sm">
            {error}
          </div>
        )}
        <Button type="submit" size="lg" fullWidth disabled={loading}>
          {loading ? 'Création...' : 'Créer mon compte'}
        </Button>
      </form>
    </AuthLayout>
  );
}

function mapAuthError(err) {
  const msg = err?.message || '';
  if (msg.includes('already registered') || msg.includes('already been registered')) {
    return 'Un compte existe déjà avec cet email.';
  }
  if (msg.includes('Password should be')) return 'Mot de passe trop faible (min. 8 caractères).';
  if (msg.includes('email')) return "L'email n'est pas valide.";
  return msg || 'Erreur inconnue';
}
