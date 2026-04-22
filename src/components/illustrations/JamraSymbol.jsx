/**
 * Symbole Jamra — arc de progression (Symbole 3 validé)
 * Usage : favicon, splash, petits accents dans l'app
 */

export default function JamraSymbol({ size = 48, className = '' }) {
  const id = `jamra-grad-${Math.random().toString(36).slice(2, 9)}`;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} aria-label="Jamra">
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFAA33" />
          <stop offset="50%" stopColor="#FF4D00" />
          <stop offset="100%" stopColor="#FF1744" />
        </linearGradient>
      </defs>
      <circle
        cx="60" cy="60" r="38"
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray="179 239"
        transform="rotate(-135 60 60)"
      />
      <circle cx="60" cy="60" r="10" fill={`url(#${id})`} />
    </svg>
  );
}
