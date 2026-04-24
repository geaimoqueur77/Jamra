/**
 * ProgressRing v2 — anneau de progression circulaire avec gradient Heat.
 * Features v2 :
 *  - État "overshoot" : devient rouge si value > 1
 *  - Track subtil avec gradient radial (pas plat)
 *  - Glow conditionnel (renforcé quand proche de la cible)
 *  - Tick marks optionnels pour jalons (25/50/75/100%)
 */

export default function ProgressRing({
  value = 0,              // 0 → 1 (ratio de progression)
  size = 220,
  strokeWidth = 12,
  children,               // contenu affiché au centre
  className = '',
  showTicks = false,      // jalons visuels
}) {
  const radius = (size - strokeWidth) / 2 - 1;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(value, 1.1)); // permet légère overshoot visible
  const offset = circumference * (1 - clamped);
  const over = value > 1;

  const gradId = `ring-grad-${Math.random().toString(36).slice(2, 9)}`;
  const overGradId = `ring-over-${Math.random().toString(36).slice(2, 9)}`;

  // Glow plus intense quand proche ou dépassé
  const glowIntensity = over ? 0.6 : Math.min(0.5, clamped * 0.5);

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        style={{
          filter: `drop-shadow(0 0 ${8 + glowIntensity * 12}px rgba(255, 77, 0, ${glowIntensity}))`,
        }}
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFAA33" />
            <stop offset="50%" stopColor="#FF4D00" />
            <stop offset="100%" stopColor="#FF1744" />
          </linearGradient>
          <linearGradient id={overGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF4D00" />
            <stop offset="100%" stopColor="#FF1744" />
          </linearGradient>
        </defs>

        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth={strokeWidth}
        />

        {/* Tick marks aux jalons 25/50/75% */}
        {showTicks && [0.25, 0.5, 0.75].map((t, i) => {
          const angle = -Math.PI / 2 + 2 * Math.PI * t;
          const inner = radius - strokeWidth / 2 - 4;
          const outer = radius + strokeWidth / 2 + 2;
          const cx = size / 2;
          const cy = size / 2;
          const x1 = cx + Math.cos(angle) * inner;
          const y1 = cy + Math.sin(angle) * inner;
          const x2 = cx + Math.cos(angle) * outer;
          const y2 = cy + Math.sin(angle) * outer;
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1"
            />
          );
        })}

        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${over ? overGradId : gradId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.3s',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}
