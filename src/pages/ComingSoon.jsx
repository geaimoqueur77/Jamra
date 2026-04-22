import Header from '../components/layout/Header';
import JamraSymbol from '../components/illustrations/JamraSymbol';

/**
 * ComingSoon — écran "arrive bientôt" réutilisable
 * Utilisé pour Journal / Poids / Profil en Phase 1.A
 */

export default function ComingSoon({ title, phase = '1.B', description }) {
  return (
    <div>
      <Header variant="centered" title={title} />

      <div className="px-6 py-16 flex flex-col items-center text-center animate-fade-in">
        <div className="opacity-30">
          <JamraSymbol size={80} />
        </div>

        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-heat-orange mt-8 mb-2">
          Arrive en Phase {phase}
        </div>

        <h2 className="font-display font-black text-2xl uppercase tracking-tight mb-4">
          {title}
        </h2>

        <p className="text-text-secondary text-sm leading-relaxed max-w-sm">
          {description}
        </p>
      </div>
    </div>
  );
}
