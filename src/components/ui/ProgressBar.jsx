/**
 * ProgressBar — barre à dégradé Heat pour les macros
 */

export default function ProgressBar({
  value = 0,                   // 0 → 1 (ratio)
  variant = 'heat',            // 'heat' | 'success' | 'warning'
  delay = 0,                   // délai d'animation (ms)
  height = 6,
  className = '',
}) {
  const clamped = Math.max(0, Math.min(value, 1));

  const fills = {
    heat:    'linear-gradient(90deg, #FFAA33, #FF4D00, #FF1744)',
    success: 'linear-gradient(90deg, #FFAA33, #00E676)',
    warning: 'linear-gradient(90deg, #FF4D00, #FFB300)',
  };

  return (
    <div
      className={`relative bg-bg-surface2 rounded-full overflow-hidden ${className}`}
      style={{ height }}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full animate-bar-fill"
        style={{
          width: `${clamped * 100}%`,
          background: fills[variant],
          animationDelay: `${delay}ms`,
        }}
      />
    </div>
  );
}
