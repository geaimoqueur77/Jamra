/**
 * Wordmark Jamra — variante B validée (dégradé Heat)
 */

export default function Wordmark({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
    xl: 'text-7xl',
    '2xl': 'text-8xl',
  };

  return (
    <span className={`font-display font-black tracking-tight text-heat-gradient ${sizes[size]} ${className}`}>
      Jamra
    </span>
  );
}
