export default function Card({
  variant = 'default',
  hover = false,
  children,
  className = '',
  ...props
}) {
  const base = 'rounded-2xl p-[18px] transition-all duration-200 ease-out-quart';

  const variants = {
    default: 'bg-bg-surface1 border border-subtle',
    dashed:  'bg-transparent border-[1.5px] border-dashed border-strong',
    heat:    'bg-gradient-to-br from-[rgba(255,170,51,0.08)] to-[rgba(255,23,68,0.08)] border border-[rgba(255,77,0,0.25)]',
  };

  const hoverCls = hover
    ? variant === 'dashed'
      ? 'cursor-pointer hover:border-heat-orange hover:bg-[rgba(255,77,0,0.04)]'
      : 'cursor-pointer hover:border-strong hover:-translate-y-px'
    : '';

  return (
    <div className={`${base} ${variants[variant]} ${hoverCls} ${className}`} {...props}>
      {children}
    </div>
  );
}
