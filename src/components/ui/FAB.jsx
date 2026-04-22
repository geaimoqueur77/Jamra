/**
 * FAB — Floating Action Button central (ajout de repas)
 */

export default function FAB({ onClick, icon, ariaLabel = 'Action', className = '' }) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`
        fixed bottom-[78px] left-1/2 -translate-x-1/2 z-40
        w-[58px] h-[58px] rounded-full
        bg-heat-gradient
        flex items-center justify-center
        shadow-heat-strong
        transition-transform duration-200 ease-spring
        hover:-translate-x-1/2 hover:scale-110
        active:scale-95
        ${className}
      `}
      style={{
        boxShadow: '0 4px 20px rgba(255, 77, 0, 0.5), 0 0 0 4px #0A0908, inset 0 1px 0 rgba(255, 255, 255, 0.2)',
      }}
    >
      {icon || (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      )}
    </button>
  );
}
