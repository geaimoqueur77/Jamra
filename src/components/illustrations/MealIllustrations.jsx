/**
 * Illustrations de repas — SVG duotone custom
 * Validées en phase design (sunrise / sun-plate / moon-dome / sparkle-nut)
 */

const randomId = () => Math.random().toString(36).slice(2, 9);

export function BreakfastIllustration({ size = 32 }) {
  const g = `bg-${randomId()}`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={g} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFAA33" />
          <stop offset="100%" stopColor="#FF4D00" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="22" r="7" fill={`url(#${g})`} />
      <line x1="24" y1="8" x2="24" y2="11" stroke="#FFAA33" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="13" y1="11" x2="15" y2="13.5" stroke="#FFAA33" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="35" y1="11" x2="33" y2="13.5" stroke="#FFAA33" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="6" y1="28" x2="42" y2="28" stroke="#A8A29E" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 32 L14 36 Q14 41 24 41 Q34 41 34 36 L34 32 Z" fill="#252220" stroke="#A8A29E" strokeWidth="1.8" strokeLinejoin="round" />
      <ellipse cx="24" cy="32" rx="10" ry="1.8" fill="none" stroke="#A8A29E" strokeWidth="1.8" />
    </svg>
  );
}

export function LunchIllustration({ size = 32 }) {
  const g = `lg-${randomId()}`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={g} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFAA33" />
          <stop offset="100%" stopColor="#FF4D00" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="14" r="4.5" fill={`url(#${g})`} />
      <g stroke="#FFAA33" strokeWidth="1.8" strokeLinecap="round">
        <line x1="24" y1="4" x2="24" y2="6.5" />
        <line x1="14.5" y1="14" x2="17" y2="14" />
        <line x1="33.5" y1="14" x2="31" y2="14" />
        <line x1="17" y1="7" x2="18.5" y2="8.8" />
        <line x1="31" y1="7" x2="29.5" y2="8.8" />
      </g>
      <circle cx="24" cy="34" r="11" fill="#1C1918" stroke="#A8A29E" strokeWidth="1.8" />
      <circle cx="24" cy="34" r="7.5" fill="none" stroke="#A8A29E" strokeWidth="1.2" opacity="0.7" />
      <line x1="15" y1="28" x2="18" y2="38" stroke="#A8A29E" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="33" y1="28" x2="30" y2="38" stroke="#A8A29E" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function DinnerIllustration({ size = 32 }) {
  const g = `dg-${randomId()}`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={g} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFAA33" />
          <stop offset="100%" stopColor="#FF1744" />
        </linearGradient>
      </defs>
      <path d="M30 14 a9 9 0 1 0 0 14 a7 7 0 0 1 0 -14 Z" fill={`url(#${g})`} />
      <circle cx="15" cy="12" r="1" fill="#FFAA33" />
      <circle cx="11" cy="22" r="0.8" fill="#FFAA33" />
      <path d="M14 38 Q14 32 24 32 Q34 32 34 38" fill="none" stroke="#A8A29E" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="10" y1="38" x2="38" y2="38" stroke="#A8A29E" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function SnackIllustration({ size = 32 }) {
  const g = `sg-${randomId()}`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={g} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFAA33" />
          <stop offset="100%" stopColor="#FF4D00" />
        </linearGradient>
      </defs>
      <ellipse cx="22" cy="28" rx="9" ry="13" transform="rotate(-20 22 28)" fill="#1C1918" stroke="#A8A29E" strokeWidth="1.8" />
      <path d="M22 18 Q18 28 22 38" stroke="#A8A29E" strokeWidth="1.2" fill="none" opacity="0.7" transform="rotate(-20 22 28)" />
      <path d="M36 14 L37.5 18 L41.5 19.5 L37.5 21 L36 25 L34.5 21 L30.5 19.5 L34.5 18 Z" fill={`url(#${g})`} />
      <circle cx="12" cy="14" r="1.5" fill="#FFAA33" />
    </svg>
  );
}

export const MEAL_ILLUSTRATIONS = {
  petit_dej: BreakfastIllustration,
  dejeuner:  LunchIllustration,
  diner:     DinnerIllustration,
  collation: SnackIllustration,
};

export const MEAL_LABELS = {
  petit_dej: 'Petit-déjeuner',
  dejeuner:  'Déjeuner',
  diner:     'Dîner',
  collation: 'Collations',
};
