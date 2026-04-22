export default function IconButton({
  children,
  size = 40,
  className = '',
  ...props
}) {
  return (
    <button
      className={`rounded-full bg-bg-surface1 border border-subtle flex items-center justify-center text-text-secondary hover:bg-bg-surface2 hover:text-text-primary transition-all duration-200 ${className}`}
      style={{ width: size, height: size }}
      {...props}
    >
      {children}
    </button>
  );
}
