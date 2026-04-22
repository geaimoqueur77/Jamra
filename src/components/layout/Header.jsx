import IconButton from '../ui/IconButton';

/**
 * Header — en-tête de page
 * 3 variantes :
 *  - 'greeting'  : eyebrow + date/titre principal à gauche, action à droite
 *  - 'title'     : bouton back + titre centré + action optionnelle
 *  - 'centered'  : titre centré simple
 */

export default function Header({
  variant = 'greeting',
  eyebrow,
  title,
  onBack,
  action,
}) {
  if (variant === 'title') {
    return (
      <div className="flex items-center justify-center px-6 py-4 relative safe-pt">
        {onBack && (
          <IconButton
            onClick={onBack}
            aria-label="Retour"
            className="absolute left-6"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </IconButton>
        )}
        <div className="font-display font-bold text-lg uppercase tracking-[0.08em]">
          {title}
        </div>
        {action && (
          <div className="absolute right-6">{action}</div>
        )}
      </div>
    );
  }

  if (variant === 'centered') {
    return (
      <div className="flex items-center justify-center px-6 py-4 safe-pt">
        <div className="font-display font-bold text-lg uppercase tracking-[0.08em]">
          {title}
        </div>
      </div>
    );
  }

  // greeting (default)
  return (
    <div className="flex justify-between items-center px-6 py-4 safe-pt">
      <div className="flex flex-col gap-0.5">
        {eyebrow && (
          <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-text-tertiary">
            {eyebrow}
          </div>
        )}
        <div className="font-display font-bold text-[22px] tracking-tight">
          {title}
        </div>
      </div>
      {action}
    </div>
  );
}
