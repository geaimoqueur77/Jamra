import { dateFromISO } from '../../utils/format';

/**
 * Calcule la moyenne mobile sur une fenêtre donnée.
 * Retourne un tableau de la même longueur avec { ...weight, ma }
 */
function computeMovingAverage(weights, window = 7) {
  return weights.map((w, i) => {
    const slice = weights.slice(Math.max(0, i - window + 1), i + 1);
    const avg = slice.reduce((s, x) => s + x.poids_kg, 0) / slice.length;
    return { ...w, ma: Math.round(avg * 10) / 10 };
  });
}

/**
 * Courbe de poids avec moyenne mobile 7j.
 *
 * Props :
 *  - weights : [{ date, poids_kg }] triés par date asc
 *  - target  : poids cible (optionnel, ligne pointillée)
 */
export default function WeightLineChart({ weights, target }) {
  if (!weights || weights.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-text-tertiary font-mono text-xs tracking-wider">
        AUCUNE PESÉE
      </div>
    );
  }

  const width = 320;
  const height = 220;
  const padTop = 20;
  const padBottom = 32;
  const padLeft = 34;
  const padRight = 12;
  const innerWidth = width - padLeft - padRight;
  const innerHeight = height - padTop - padBottom;

  const weightsWithMA = computeMovingAverage(weights, 7);

  // Échelle Y
  const allVals = weights.map(w => w.poids_kg);
  if (target != null) allVals.push(target);
  let minY = Math.min(...allVals);
  let maxY = Math.max(...allVals);
  const rangeY = Math.max(1, maxY - minY);
  const marginY = rangeY * 0.15;
  minY = Math.floor(minY - marginY);
  maxY = Math.ceil(maxY + marginY);

  // Échelle X — indices
  const n = weights.length;
  const xAt = (i) => n === 1
    ? padLeft + innerWidth / 2
    : padLeft + (i / (n - 1)) * innerWidth;
  const yAt = (val) => padTop + innerHeight - ((val - minY) / (maxY - minY)) * innerHeight;

  // Ticks Y
  const tickCount = 4;
  const yTicks = [];
  for (let i = 0; i <= tickCount; i++) {
    const v = minY + (i / tickCount) * (maxY - minY);
    yTicks.push({ val: v, y: yAt(v) });
  }

  // Ligne de moyenne mobile (lissée)
  const maPath = weightsWithMA
    .map((w, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(w.ma).toFixed(1)}`)
    .join(' ');

  // Points bruts (reliés par une ligne très fine)
  const rawPath = weights
    .map((w, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(w.poids_kg).toFixed(1)}`)
    .join(' ');

  // Date labels : premier, milieu, dernier
  const dateLabels = n > 0
    ? [
        { i: 0, d: weights[0].date },
        ...(n >= 3 ? [{ i: Math.floor(n / 2), d: weights[Math.floor(n / 2)].date }] : []),
        ...(n > 1 ? [{ i: n - 1, d: weights[n - 1].date }] : []),
      ]
    : [];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" className="overflow-visible">
      <defs>
        <linearGradient id="weight-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFAA33" />
          <stop offset="100%" stopColor="#FF4D00" />
        </linearGradient>
      </defs>

      {/* Grid lines Y */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line
            x1={padLeft} y1={t.y}
            x2={width - padRight} y2={t.y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
          <text
            x={padLeft - 6} y={t.y + 3}
            textAnchor="end"
            fontSize="9"
            fontFamily="ui-monospace, monospace"
            fill="rgba(255,255,255,0.4)"
          >
            {Math.round(t.val * 10) / 10}
          </text>
        </g>
      ))}

      {/* Ligne cible */}
      {target != null && target >= minY && target <= maxY && (
        <>
          <line
            x1={padLeft} y1={yAt(target)}
            x2={width - padRight} y2={yAt(target)}
            stroke="#00E676"
            strokeOpacity="0.5"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <text
            x={width - padRight} y={yAt(target) - 4}
            textAnchor="end"
            fontSize="9"
            fontFamily="ui-monospace, monospace"
            fill="#00E676"
            style={{ letterSpacing: '0.1em' }}
          >
            OBJECTIF {target} kg
          </text>
        </>
      )}

      {/* Ligne brute (fine) */}
      {n > 1 && (
        <path
          d={rawPath}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1"
        />
      )}

      {/* Moyenne mobile (épaisse, gradient) */}
      {n > 1 && (
        <path
          d={maPath}
          fill="none"
          stroke="url(#weight-line)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Points bruts */}
      {weights.map((w, i) => (
        <circle
          key={w.id}
          cx={xAt(i)}
          cy={yAt(w.poids_kg)}
          r="3"
          fill="#FFAA33"
          stroke="#0F0F12"
          strokeWidth="1.5"
        />
      ))}

      {/* Labels X */}
      {dateLabels.map((d, i) => {
        const dt = dateFromISO(d.d);
        return (
          <text
            key={`lbl-${i}`}
            x={xAt(d.i)}
            y={height - 10}
            textAnchor="middle"
            fontSize="9"
            fontFamily="ui-monospace, monospace"
            fill="rgba(255,255,255,0.4)"
            style={{ letterSpacing: '0.1em' }}
          >
            {dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).replace('.', '').toUpperCase()}
          </text>
        );
      })}
    </svg>
  );
}
