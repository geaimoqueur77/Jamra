import Button from '../../components/ui/Button';
import Wordmark from '../../components/ui/Wordmark';
import JamraSymbol from '../../components/illustrations/JamraSymbol';

/**
 * Étape 1 — Bienvenue v2 avec entrée soignée
 */

export default function StepWelcome({ onNext }) {
  return (
    <div className="flex-1 flex flex-col justify-between px-6 py-10">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="animate-scale-in">
          <JamraSymbol size={96} />
        </div>

        <div className="mt-10 mb-3 animate-fade-up" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
          <Wordmark size="xl" />
        </div>

        <div
          className="font-mono text-[11px] tracking-[0.3em] uppercase text-heat-orange mb-8 animate-fade-up font-bold"
          style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}
        >
          Suivi nutritionnel et sportif
        </div>

        <p
          className="text-text-secondary text-[15px] leading-relaxed max-w-sm animate-fade-up"
          style={{ animationDelay: '600ms', animationFillMode: 'backwards' }}
        >
          L'effort se mesure.
          <br/>
          La progression se cultive.
          <br/><br/>
          <span className="text-text-primary font-semibold">
            Prêt à entretenir la braise ?
          </span>
        </p>
      </div>

      <div
        className="flex flex-col gap-3 animate-slide-up"
        style={{ animationDelay: '800ms', animationFillMode: 'backwards' }}
      >
        <Button onClick={onNext} size="lg" fullWidth>
          Commencer
        </Button>
        <div className="font-mono text-[10px] text-text-tertiary text-center tracking-[0.1em] uppercase">
          ~ 2 minutes · 4 étapes
        </div>
      </div>
    </div>
  );
}
