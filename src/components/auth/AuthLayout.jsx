import JamraSymbol from '../illustrations/JamraSymbol';
import Wordmark from '../ui/Wordmark';

/**
 * Layout commun aux écrans d'auth : symbole + wordmark + contenu centré.
 */
export default function AuthLayout({ title, eyebrow, children, footer }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <JamraSymbol size={64} />
          <div className="mt-4">
            <Wordmark size="lg" />
          </div>
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-text-tertiary mt-2">
            Suivi nutritionnel
          </div>
        </div>

        {/* Titre */}
        <div className="w-full max-w-sm mb-6 text-center">
          {eyebrow && (
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-heat-amber mb-1">
              {eyebrow}
            </div>
          )}
          <h1 className="font-display font-bold text-2xl text-text-primary uppercase tracking-[0.02em]">
            {title}
          </h1>
        </div>

        {/* Formulaire */}
        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>

      {/* Footer (liens optionnels) */}
      {footer && (
        <div className="px-6 py-5 border-t border-subtle text-center safe-pb">
          {footer}
        </div>
      )}
    </div>
  );
}
