/**
 * Courbe de progression d'un exercice : charge max par séance dans le temps.
 * SVG natif, même pattern que WeightLineChart.
 */
export default function ExerciseProgressChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-text-tertiary font-mono text-[10px] tracking-[0.2em] uppercase">
        Aucune donnée
      </div>
    );
  }

  const W = 320, H = 160;
  const padTop = 16, padBottom = 28, padLeft = 36, padRight = 12;
  const iW = W - padLeft - padRight;
  const iH = H - padTop - padBottom;

  const vals = data.map(d => d.max_weight);
  let minY = Math.floor(Math.min(...vals) * 0.92);
  let maxY = Math.ceil(Math.max(...vals) * 1.06);
  if (maxY === minY) { minY -= 5; maxY += 5; }

  const n = data.length;
  const xAt = i => n === 1 ? padLeft + iW / 2 : padLeft + (i / (n - 1)) * iW;
  const yAt = v => padTop + iH - ((v - minY) / (maxY - minY)) * iH;

  // Ticks Y
  const ticks = [];
  for (let i = 0; i <= 3; i++) {
    const v = minY + (i / 3) * (maxY - minY);
    ticks.push({ v: Math.round(v), y: yAt(Math.round(v)) });
  }

  // Ligne principale
  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(d.max_weight).toFixed(1)}`).join(' ');

  // Labels X : premier, milieu, dernier
  const xLabels = n > 0 ? [
    { i: 0, label: fmtDate(data[0].date) },
    ...(n >= 3 ? [{ i: Math.floor(n / 2), label: fmtDate(data[Math.floor(n / 2)].date) }] : []),
    ...(n > 1 ? [{ i: n - 1, label: fmtDate(data[n - 1].date) }] : []),
  ] : [];

  // PR = dernier point qui est un max historique jusqu'à ce point
  const prPoints = data.reduce((acc, d, i) => {
    const prevMax = acc.length > 0 ? Math.max(...acc.map(p => data[p.i].max_weight)) : -Infinity;
    if (d.max_weight > prevMax) acc.push({ i, max_weight: d.max_weight });
    return acc;
  }, []);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="overflow-visible">
      <defs>
        <linearGradient id={`ex-grad-${data[0]?.exercise}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFAA33" />
          <stop offset="100%" stopColor="#FF4D00" />
        </linearGradient>
      </defs>

      {/* Grid */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padLeft} y1={t.y} x2={W - padRight} y2={t.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <text x={padLeft - 5} y={t.y + 3} textAnchor="end" fontSize="9" fontFamily="ui-monospace,monospace" fill="rgba(255,255,255,0.35)">
            {t.v}
          </text>
        </g>
      ))}

      {/* Ligne */}
      {n > 1 && (
        <path
          d={path} fill="none"
          stroke={`url(#ex-grad-${data[0]?.exercise})`}
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        />
      )}

      {/* Points */}
      {data.map((d, i) => (
        <circle
          key={i}
          cx={xAt(i)} cy={yAt(d.max_weight)}
          r="3.5"
          fill="#FFAA33"
          stroke="#0A0908"
          strokeWidth="1.5"
        />
      ))}

      {/* Badge PR sur les points record */}
      {prPoints.slice(-1).map(p => (
        <g key={p.i}>
          <text
            x={xAt(p.i)}
            y={yAt(p.max_weight) - 8}
            textAnchor="middle"
            fontSize="8"
            fontFamily="ui-monospace,monospace"
            fill="#FF4D00"
            fontWeight="bold"
          >
            {p.max_weight}kg
          </text>
        </g>
      ))}

      {/* Labels X */}
      {xLabels.map((l, i) => (
        <text
          key={i}
          x={xAt(l.i)} y={H - 6}
          textAnchor="middle"
          fontSize="8"
          fontFamily="ui-monospace,monospace"
          fill="rgba(255,255,255,0.35)"
          style={{ letterSpacing: '0.05em' }}
        >
          {l.label}
        </text>
      ))}
    </svg>
  );
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    .replace('.', '').toUpperCase().slice(0, 6);
}
