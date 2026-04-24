/**
 * Skeleton primitifs pour les états de chargement.
 */

export function Skeleton({ className = '', style = {} }) {
  return <div className={`skeleton ${className}`} style={style} />;
}

export function SkeletonText({ width = '100%', className = '' }) {
  return <div className={`skeleton h-3 ${className}`} style={{ width }} />;
}

export function SkeletonCircle({ size = 40, className = '' }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width: size, height: size, borderRadius: '50%' }}
    />
  );
}

export function SkeletonCard({ rows = 3, className = '' }) {
  return (
    <div className={`surface-card rounded-2xl p-4 ${className}`}>
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonText key={i} width={i === 0 ? '70%' : i === rows - 1 ? '50%' : '100%'} />
        ))}
      </div>
    </div>
  );
}
