import { useNavigate } from 'react-router-dom';

/**
 * InsightCard v2 — Card contextuelle raffinée.
 * Design plus sobre avec left-accent bar de couleur selon le type.
 */

const TYPE_CONFIG = {
  positive: {
    accent: '#00E676',
    bg: 'rgba(0,230,118,0.04)',
    border: 'rgba(0,230,118,0.22)',
    tagBg: 'rgba(0,230,118,0.14)',
    tagText: '#00E676',
    tagLabel: 'Bravo',
  },
  warning: {
    accent: '#FF1744',
    bg: 'rgba(255,23,68,0.04)',
    border: 'rgba(255,23,68,0.22)',
    tagBg: 'rgba(255,23,68,0.14)',
    tagText: '#FF5C7C',
    tagLabel: 'Attention',
  },
  info: {
    accent: '#FFAA33',
    bg: 'rgba(255,170,51,0.04)',
    border: 'rgba(255,170,51,0.18)',
    tagBg: 'rgba(255,170,51,0.12)',
    tagText: '#FFAA33',
    tagLabel: 'Info',
  },
};

export default function InsightCard({ insight, onDismiss }) {
  const navigate = useNavigate();
  const { id, type, icon, title, message, action } = insight;
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.info;

  return (
    <div
      className="relative rounded-2xl p-4 transition-all animate-scale-in press-down"
      style={{
        background: config.bg,
        border: `0.5px solid ${config.border}`,
      }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(id); }}
        className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center transition-colors press-down"
        style={{
          color: 'rgba(255, 255, 255, 0.35)',
          background: 'transparent',
        }}
        aria-label="Masquer"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
          style={{ background: config.tagBg }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="font-mono text-[9px] tracking-[0.15em] uppercase font-bold"
              style={{ color: config.tagText }}
            >
              {config.tagLabel}
            </span>
            <div
              className="w-1 h-1 rounded-full"
              style={{ background: config.tagText, opacity: 0.4 }}
            />
            <div className="font-display font-bold text-[13px] uppercase tracking-[0.02em] text-text-primary">
              {title}
            </div>
          </div>
          <div className="font-body text-[13px] text-text-secondary leading-snug">
            {message}
          </div>
          {action && (
            <button
              onClick={() => navigate(action.route)}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-bold uppercase tracking-[0.1em] transition-all press-down"
              style={{
                border: `1px solid ${config.accent}`,
                color: config.accent,
                background: 'transparent',
              }}
            >
              {action.label} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function InsightsRow({ insights, onDismiss }) {
  if (!insights || insights.length === 0) return null;
  return (
    <div className="px-6 pb-3 flex flex-col gap-2.5 stagger-1">
      {insights.map(i => (
        <InsightCard key={i.id} insight={i} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
