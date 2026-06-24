import Button from '../../components/ui/Button';
import Wordmark from '../../components/ui/Wordmark';
import JamraSymbol from '../../components/illustrations/JamraSymbol';

/**
 * Étape 1 — Bienvenue
 */

export default function StepWelcome({ onNext }) {
  return (
    <div className="flex-1 flex flex-col justify-between px-6 py-10 animate-fade-in">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <JamraSymbol size={96} />

        <div className="mt-10 mb-3">
          <Wordmark size="xl" />
        </div>

        <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-heat-orange mb-8">
          Suivi nutritionnel · Phase 1
        </div>

        <p className="text-text-secondary text-base leading-relaxed max-w-sm">
          L'effort se mesure.
          La progression se cultive.
          <br />
          <span className="text-text-primary font-semibold mt-4 inline-block">
            Prêt à entretenir la braise ?
          </span>
        </p>
      </div>

      <div className="flex flex-col gap-3">
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
