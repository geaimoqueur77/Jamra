/**
 * Barre de zones FC pour une séance ou une période.
 * 5 segments (Z1-Z5) proportionnels au temps passé dans chaque zone.
 */

const ZONE_COLORS = {
  z1: '#33AAFF',
  z2: '#00E676',
  z3: '#FFAA33',
  z4: '#FF4D00',
  z5: '#FF1744',
};

const ZONE_TEXT_COLORS = {
  z1: '#042C53',
  z2: '#04341A',
  z3: '#412402',
  z4: '#4A1B0C',
  z5: '#4B1528',
};

/**
 * @param {object} props
 * @param {object} props.distribution - {z1: pct, z2: pct, ...} - somme à 100
 * @param {object} props.times - {z1: seconds, ...} (optionnel, pour les labels)
 * @param {boolean} props.showLabels
 * @param {string} props.dominantZone - la zone à mettre en valeur (affichée visible dans le segment)
 * @param {number} props.height
 */
export default function HRZoneBar({
  distribution,
  times,
  showLabels = true,
  dominantZone = null,
  height = 28,
}) {
  const zones = ['z1', 'z2', 'z3', 'z4', 'z5'];
  const dominant = dominantZone || zones.reduce(
    (best, z) => (distribution?.[z] > (distribution?.[best] || 0) ? z : best),
    'z1'
  );

  const fmtTime = (secs) => {
    if (!secs) return null;
    const m = Math.round(secs / 60);
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem ? `${h}h${String(rem).padStart(2, '0')}` : `${h}h`;
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex rounded-md overflow-hidden gap-px"
        style={{ height: `${height}px` }}
      >
        {zones.map(z => {
          const pct = distribution?.[z] || 0;
          if (pct === 0) return null;
          const isDominant = z === dominant && pct >= 20;
          return (
            <div
              key={z}
              className="flex items-center justify-center transition-all"
              style={{
                flex: pct,
                background: ZONE_COLORS[z],
                opacity: pct < 5 ? 0.4 : 1,
              }}
            >
              {isDominant && showLabels && (
                <span
                  className="font-display font-bold uppercase"
                  style={{
                    fontSize: '10px',
                    color: ZONE_TEXT_COLORS[z],
                    letterSpacing: '0.06em',
                  }}
                >
                  {z.toUpperCase()}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {showLabels && (
        <div className="flex justify-between font-mono text-[9px] text-text-tertiary uppercase tracking-wider tabular">
          {zones.map(z => {
            const pct = distribution?.[z] || 0;
            const time = times?.[z];
            return (
              <div key={z} className="flex flex-col items-start" style={{ flex: 1 }}>
                <span style={{ color: pct > 0 ? ZONE_COLORS[z] : 'rgba(255,255,255,0.3)' }}>
                  {z.toUpperCase()}
                </span>
                {time != null && time > 0 && (
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '8px' }}>
                    {fmtTime(time)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { ZONE_COLORS };
