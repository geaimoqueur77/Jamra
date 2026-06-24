/**
 * Button — 3 variantes cohérentes avec la charte Heat Signature
 */

const base = 'inline-flex items-center justify-center gap-2 font-display font-bold uppercase tracking-[0.1em] transition-all duration-200 ease-out-quart disabled:opacity-40 disabled:cursor-not-allowed';

const variants = {
  primary:   'bg-heat-gradient text-white shadow-heat-glow hover:shadow-heat-strong active:translate-y-px',
  secondary: 'bg-bg-surface1 border border-heat-orange text-heat-orange hover:bg-heat-gradient hover:text-bg-base hover:border-transparent',
  outline:   'bg-transparent border border-strong text-text-secondary hover:border-heat-orange hover:text-heat-orange',
  ghost:     'bg-transparent text-text-secondary hover:text-text-primary',
};

const sizes = {
  sm: 'px-4 py-2 text-xs rounded-xl',
  md: 'px-6 py-3 text-sm rounded-xl',
  lg: 'px-7 py-4 text-base rounded-2xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className = '',
  ...props
}) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
