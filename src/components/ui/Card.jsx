export default function Card({
  variant = 'default',
  hover = false,
  children,
  className = '',
  ...props
}) {
  const base = 'rounded-2xl p-[18px] transition-all';

  const variants = {
    default: 'surface-card',
    raised:  'surface-raised',
    dashed:  'border border-dashed',
    heat:    'surface-featured',
  };

  const hoverCls = hover ? 'cursor-pointer hover-lift' : '';

  const dashedStyle = variant === 'dashed'
    ? { background: 'transparent', borderColor: 'rgba(255, 255, 255, 0.15)' }
    : {};

  return (
    <div
      className={`${base} ${variants[variant]} ${hoverCls} ${className}`}
      style={dashedStyle}
      {...props}
    >
      {children}
    </div>
  );
}
