/**
 * Button v2 — 4 variantes avec press-down spring + typo raffinée
 */

const base = 'inline-flex items-center justify-center gap-2 font-display font-bold uppercase tracking-[0.1em] transition-all disabled:opacity-40 disabled:cursor-not-allowed press-down';

const variants = {
  primary:   'text-white',
  secondary: 'border border-heat-orange text-heat-orange hover:text-white',
  outline:   'border border-strong text-text-secondary hover:border-heat-orange hover:text-heat-orange',
  ghost:     'bg-transparent text-text-secondary hover:text-text-primary',
};

const primaryStyle = {
  background: 'linear-gradient(135deg, #FFAA33 0%, #FF4D00 50%, #FF1744 100%)',
  boxShadow: '0 2px 16px rgba(255, 77, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.08)',
};

const secondaryStyle = {
  background: 'rgba(255, 77, 0, 0.04)',
};

const sizes = {
  sm: 'px-4 py-2 text-xs rounded-xl',
  md: 'px-6 py-3 text-sm rounded-xl',
  lg: 'px-7 py-4 text-[15px] rounded-2xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className = '',
  ...props
}) {
  const style = variant === 'primary' ? primaryStyle : variant === 'secondary' ? secondaryStyle : undefined;
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
}
