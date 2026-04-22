/**
 * TextField — champ de saisie stylé Heat Signature
 */

export default function TextField({
  label,
  eyebrow,
  error,
  suffix,
  className = '',
  ...props
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {eyebrow && (
        <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-tertiary">
          {eyebrow}
        </div>
      )}
      {label && (
        <label className="font-body font-semibold text-sm text-text-primary">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          className={`
            w-full px-4 py-3.5
            bg-bg-surface1 border border-subtle rounded-xl
            text-text-primary font-body text-base
            placeholder:text-text-tertiary
            focus:outline-none focus:border-heat-orange
            transition-colors duration-200
            ${suffix ? 'pr-14' : ''}
            ${error ? 'border-danger' : ''}
          `}
          {...props}
        />
        {suffix && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-sm text-text-tertiary">
            {suffix}
          </div>
        )}
      </div>
      {error && (
        <div className="font-mono text-xs text-danger">{error}</div>
      )}
    </div>
  );
}
