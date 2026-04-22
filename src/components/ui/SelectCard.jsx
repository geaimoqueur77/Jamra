/**
 * SelectCard — carte cliquable à sélection unique (radio)
 * Utilisée dans l'onboarding pour les choix d'objectif, niveau d'activité, sport, etc.
 */

export default function SelectCard({
  selected = false,
  title,
  description,
  icon,
  onClick,
  className = '',
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left
        rounded-2xl p-4 border transition-all duration-200 ease-out-quart
        ${selected
          ? 'border-heat-orange bg-gradient-to-br from-[rgba(255,170,51,0.08)] to-[rgba(255,23,68,0.08)]'
          : 'border-subtle bg-bg-surface1 hover:border-strong'
        }
        ${className}
      `}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
            ${selected ? 'bg-heat-gradient text-white' : 'bg-bg-surface2 text-text-secondary'}
          `}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className={`font-display font-bold uppercase tracking-[0.06em] text-sm ${selected ? 'text-text-primary' : 'text-text-primary'}`}>
            {title}
          </div>
          {description && (
            <div className="font-body text-xs text-text-secondary mt-1 leading-relaxed">
              {description}
            </div>
          )}
        </div>
        {selected && (
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-heat-gradient flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
      </div>
    </button>
  );
}
