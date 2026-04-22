import { dateFromISO, formatDayAbbrev } from '../../utils/format';

/**
 * Bar chart SVG des kcal consommées sur 7 jours, avec ligne de cible.
 *
 * Props :
 *  - days : [{ iso, kcal }]
 *  - target : kcal cible journalière
 *  - selectedIso : jour actuellement sélectionné (mis en évidence)
 *  - onSelectDay : (iso) => void
 */
export default function KcalBarChart({ days, target, selectedIso, onSelectDay }) {
  const width = 320;
  const height = 180;
  const padTop = 16;
  const padBottom = 32;
  const padLeft = 8;
  const padRight = 8;
  const innerWidth = width - padLeft - padRight;
  const innerHeight = height - padTop - padBottom;

  // Max pour l'échelle : au moins 120 % de la cible pour qu'on voit le dépassement
  const maxVal = Math.max(
    target * 1.3,
    ...days.map(d => d.kcal || 0),
  );

  const barWidth = (innerWidth - 6 * 8) / 7; // 6 gaps de 8px
  const targetY = padTop + innerHeight - (target / maxVal) * innerHeight;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" className="overflow-visible">
      <defs>
        <linearGradient id="bar-heat" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#FF4D00" />
          <stop offset="100%" stopColor="#FFAA33" />
        </linearGradient>
        <linearGradient id="bar-heat-over" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#FF1744" />
          <stop offset="100%" stopColor="#FF4D00" />
        </linearGradient>
      </defs>

      {/* Ligne de cible */}
      {target > 0 && (
        <>
          <line
            x1={padLeft} y1={targetY}
            x2={width - padRight} y2={targetY}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <text
            x={width - padRight} y={targetY - 4}
            textAnchor="end"
            fontSize="9"
            fontFamily="ui-monospace, monospace"
            fill="rgba(255,255,255,0.4)"
            style={{ letterSpacing: '0.1em' }}
          >
            CIBLE {target}
          </text>
        </>
      )}

      {days.map((d, i) => {
        const kcal = d.kcal || 0;
        const barHeight = kcal > 0 ? (kcal / maxVal) * innerHeight : 0;
        const x = padLeft + i * (barWidth + 8);
        const y = padTop + innerHeight - barHeight;
        const over = kcal > target;
        const isSelected = d.iso === selectedIso;
        const dt = dateFromISO(d.iso);

        return (
          <g
            key={d.iso}
            onClick={() => onSelectDay?.(d.iso)}
            style={{ cursor: 'pointer' }}
          >
            {/* Halo de sélection */}
            {isSelected && (
              <rect
                x={x - 2} y={padTop - 2}
                width={barWidth + 4} height={innerHeight + 4}
                fill="rgba(255,170,51,0.08)"
                rx="4"
              />
            )}
            {/* Barre */}
            {kcal > 0 ? (
              <rect
                x={x} y={y}
                width={barWidth} height={barHeight}
                fill={over ? 'url(#bar-heat-over)' : 'url(#bar-heat)'}
                rx="3"
              />
            ) : (
              <rect
                x={x} y={padTop + innerHeight - 2}
                width={barWidth} height={2}
                fill="rgba(255,255,255,0.1)"
                rx="1"
              />
            )}
            {/* Label jour */}
            <text
              x={x + barWidth / 2}
              y={height - 14}
              textAnchor="middle"
              fontSize="9"
              fontFamily="ui-monospace, monospace"
              fill={isSelected ? '#FFAA33' : 'rgba(255,255,255,0.5)'}
              style={{ letterSpacing: '0.1em', fontWeight: isSelected ? 700 : 500 }}
            >
              {formatDayAbbrev(dt)}
            </text>
            {/* Date */}
            <text
              x={x + barWidth / 2}
              y={height - 3}
              textAnchor="middle"
              fontSize="9"
              fontFamily="ui-monospace, monospace"
              fill={isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.35)'}
              style={{ fontWeight: isSelected ? 700 : 500 }}
            >
              {dt.getDate()}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
