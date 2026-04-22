import { useNavigate } from 'react-router-dom';

/**
 * Card d'insight contextuel, dismissable.
 */
export default function InsightCard({ insight, onDismiss }) {
  const navigate = useNavigate();
  const { id, type, icon, title, message, action } = insight;

  const borderClass =
    type === 'positive' ? 'border-success/40' :
    type === 'warning'  ? 'border-danger/40' :
                          'border-subtle';

  const bgClass =
    type === 'positive' ? 'bg-[rgba(0,230,118,0.04)]' :
    type === 'warning'  ? 'bg-[rgba(255,23,68,0.04)]' :
                          'bg-bg-surface1';

  const tagClass =
    type === 'positive' ? 'bg-[rgba(0,230,118,0.15)] text-success' :
    type === 'warning'  ? 'bg-[rgba(255,23,68,0.15)] text-danger' :
                          'bg-[rgba(255,170,51,0.15)] text-heat-amber';

  const tagLabel =
    type === 'positive' ? 'BRAVO' :
    type === 'warning'  ? 'ATTENTION' :
                          'INFO';

  return (
    <div className={`relative rounded-2xl border ${borderClass} ${bgClass} p-4 transition-all animate-fade-in`}>
      <button
        onClick={() => onDismiss(id)}
        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-bg-surface2 transition-colors"
        aria-label="Masquer"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="text-2xl leading-none pt-0.5">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded tracking-[0.1em] uppercase ${tagClass}`}>
              {tagLabel}
            </span>
            <div className="font-display font-bold text-sm uppercase tracking-[0.04em] text-text-primary">
              {title}
            </div>
          </div>
          <div className="font-body text-[13px] text-text-secondary leading-snug">
            {message}
          </div>
          {action && (
            <button
              onClick={() => navigate(action.route)}
              className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-heat-orange text-heat-orange hover:bg-[rgba(255,77,0,0.08)] font-display font-bold text-xs uppercase tracking-[0.1em] transition-colors"
            >
              {action.label} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Liste des insights à rendre sur le dashboard.
 */
export function InsightsRow({ insights, onDismiss }) {
  if (!insights || insights.length === 0) return null;
  return (
    <div className="px-6 pb-2 flex flex-col gap-2.5">
      {insights.map(i => (
        <InsightCard key={i.id} insight={i} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
