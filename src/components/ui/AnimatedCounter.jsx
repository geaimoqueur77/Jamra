import { useEffect, useRef, useState } from 'react';

/**
 * Compteur animé. Interpolation spring entre la valeur précédente et la nouvelle.
 * Utilisé pour les kcal, macros, etc. pour donner vie aux chiffres.
 */
export default function AnimatedCounter({
  value,
  duration = 800,
  decimals = 0,
  className = '',
  locale = 'fr-FR',
  formatter,
}) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const startRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    fromRef.current = display;
    startRef.current = performance.now();

    const animate = (now) => {
      const elapsed = now - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const interp = fromRef.current + (value - fromRef.current) * eased;
      setDisplay(interp);
      if (t < 1) rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  const rounded = decimals === 0 ? Math.round(display) : Number(display.toFixed(decimals));
  const formatted = formatter
    ? formatter(rounded)
    : rounded.toLocaleString(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });

  return <span className={`tabular ${className}`}>{formatted}</span>;
}
