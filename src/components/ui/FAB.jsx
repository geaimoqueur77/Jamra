/**
 * FAB v2 — Floating Action Button central premium :
 *  - Halo pulsé subtil pour attirer l'œil
 *  - Inner highlight pour effet "bouton bombé"
 *  - Press spring (scale + rotate)
 *  - Centered + safe-area aware
 */

export default function FAB({ onClick, icon, ariaLabel = 'Action', className = '' }) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`
        fixed left-1/2 z-40
        w-[60px] h-[60px] rounded-full
        flex items-center justify-center
        press-down
        ${className}
      `}
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 64px)',
        transform: 'translateX(-50%)',
        background: 'linear-gradient(135deg, #FFAA33 0%, #FF4D00 55%, #FF1744 100%)',
        boxShadow: `
          0 4px 24px rgba(255, 77, 0, 0.55),
          0 0 0 4px #0A0908,
          inset 0 1px 0 rgba(255, 255, 255, 0.25),
          inset 0 -2px 0 rgba(0, 0, 0, 0.1)
        `,
      }}
    >
      {icon || (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      )}
    </button>
  );
}
