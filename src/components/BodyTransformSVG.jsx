// Dérivé de JamraAvatar makeProfile — mêmes points de contrôle C1/C4

function lerp(a, b, t) { return a + (b - a) * t; }

const C1 = [[15, 6.2], [17, 7.4], [21, 9.0], [26, 10.2], [31, 10.7], [35, 10.0], [39, 8.6]];
const C4 = [[15, 10.8], [17, 10.6], [21, 9.3], [26, 7.2], [31, 6.0], [35, 5.8], [39, 6.4]];

function makeW(t) {
  const cps = C1.map((p, i) => [p[0], lerp(p[1], C4[i][1], t)]);
  return (y) => {
    if (y <= cps[0][0]) return cps[0][1];
    for (let i = 0; i < cps.length - 1; i++) {
      const [a, wa] = cps[i], [b, wb] = cps[i + 1];
      if (y >= a && y <= b) return lerp(wa, wb, (y - a) / (b - a));
    }
    return cps[cps.length - 1][1];
  };
}

function n(v) { return parseFloat(v).toFixed(1); }

function buildPath(state) {
  const t = (state - 1) / 3;
  const W = makeW(t);
  const cx = 16;
  const legGap = 2.0;
  const legHalf = lerp(2.8, 2.5, t);
  const nk = lerp(2.2, 2.7, t);

  const sh = W(15);
  const ch = W(21);
  const wt = W(31);
  const hp = W(39);
  const pe = legGap + legHalf + 0.4;

  // Right side going down, crotch, left side going up — smooth bezier curves
  return [
    // neck → shoulder → chest → waist → hip → pelvis edge
    `M ${n(cx + nk)} 13`,
    `C ${n(cx + sh + 0.6)} 14.5, ${n(cx + sh + 0.4)} 16, ${n(cx + ch)} 21`,
    `C ${n(cx + ch + 0.3)} 25, ${n(cx + wt + 0.2)} 28, ${n(cx + wt)} 31`,
    `C ${n(cx + wt - 0.1)} 34.5, ${n(cx + hp + 0.4)} 37, ${n(cx + hp)} 39`,
    `C ${n(cx + hp - 0.2)} 41, ${n(cx + pe)} 42.5, ${n(cx + pe)} 44`,
    // right leg
    `L ${n(cx + pe)} 65`,
    `L ${n(cx + legGap - legHalf)} 65`,
    `L ${n(cx + legGap - legHalf)} 44`,
    // crotch arch
    `Q ${n(cx)} 46 ${n(cx - legGap + legHalf)} 44`,
    // left leg
    `L ${n(cx - legGap + legHalf)} 65`,
    `L ${n(cx - pe)} 65`,
    `L ${n(cx - pe)} 44`,
    // left pelvis → hip → waist → chest → shoulder → neck
    `C ${n(cx - pe)} 42.5, ${n(cx - hp + 0.2)} 41, ${n(cx - hp)} 39`,
    `C ${n(cx - hp - 0.4)} 37, ${n(cx - wt - 0.1)} 34.5, ${n(cx - wt)} 31`,
    `C ${n(cx - wt + 0.2)} 28, ${n(cx - ch - 0.3)} 25, ${n(cx - ch)} 21`,
    `C ${n(cx - sh - 0.4)} 16, ${n(cx - sh - 0.6)} 14.5, ${n(cx - nk)} 13`,
    'Z',
  ].join(' ');
}

const STATE_META = [
  { label: 'Départ',    phase: null },
  { label: 'Phase 1',  phase: 1 },
  { label: 'Phase 2',  phase: 2 },
  { label: 'Objectif', phase: 3 },
];

const PHASE_COLORS = {
  null: '#FF4D00',
  1: '#4f8df9',
  2: '#10b981',
  3: '#f59e0b',
};

// cx = 16, head center y=7.5, head rx=4.3 ry=5.2
const HEAD_CY = 7.5, HEAD_RX = 4.3, HEAD_RY = 5.2;
const CX = 16;

function Silhouette({ state, active, color }) {
  const t = (state - 1) / 3;
  const nk = lerp(2.2, 2.7, t);
  const hryBot = HEAD_CY + HEAD_RY;

  return (
    <g>
      {/* Head */}
      <ellipse cx={CX} cy={HEAD_CY} rx={HEAD_RX} ry={HEAD_RY}
        fill={color} opacity={active ? 1 : 0.55} />
      {/* Neck connector */}
      <rect
        x={n(CX - nk)} y={n(hryBot - 0.3)}
        width={n(nk * 2)} height={n(13 - hryBot + 0.3)}
        fill={color} opacity={active ? 1 : 0.55}
      />
      {/* Body */}
      <path d={buildPath(state)} fill={color} opacity={active ? 1 : 0.55} />
    </g>
  );
}

export default function BodyTransformSVG({ currentPhase = 1, poidsDepart, poidsCible, poidsActuel }) {
  // Map phase → state: départ=1, phase1=2, phase2=3, objectif=4
  // currentPhase 1 → active state 2, phase 2 → state 3, phase 3 → state 4
  const activeState = currentPhase >= 3 ? 4 : currentPhase + 1;

  return (
    <div className="rounded-2xl border border-subtle bg-bg-surface1 p-4">
      <div className="font-display font-bold text-[11px] uppercase tracking-[0.14em] text-text-tertiary mb-3">
        Transformation
      </div>

      <div className="flex items-end justify-around gap-1">
        {[1, 2, 3, 4].map((state) => {
          const meta = STATE_META[state - 1];
          const active = state === activeState;
          const color = active
            ? PHASE_COLORS[meta.phase]
            : '#3a2419';

          // Afficher le poids sous la silhouette pertinente
          let weightLabel = null;
          if (state === 1 && poidsDepart) weightLabel = `${poidsDepart} kg`;
          else if (state === activeState && poidsActuel) weightLabel = `${poidsActuel} kg`;
          else if (state === 4 && poidsCible) weightLabel = `${poidsCible} kg`;

          return (
            <div key={state} className="flex flex-col items-center gap-1 flex-1">
              <svg
                viewBox="0 0 32 70"
                style={{ width: '100%', maxWidth: 64, height: 'auto' }}
                xmlns="http://www.w3.org/2000/svg"
              >
                <Silhouette state={state} active={active} color={color} />
              </svg>

              <div className={`font-mono text-[8px] uppercase tracking-[0.15em] leading-tight text-center ${active ? 'text-text-primary' : 'text-text-muted'}`}>
                {meta.label}
              </div>

              {weightLabel && (
                <div className={`font-mono text-[9px] font-bold ${active ? 'text-heat-orange' : 'text-text-tertiary'}`}>
                  {weightLabel}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Flèche de progression */}
      <div className="mt-3 flex items-center gap-1 px-1">
        {[1, 2, 3, 4].map((state, i) => {
          const done = state < activeState;
          const current = state === activeState;
          const meta = STATE_META[state - 1];
          const color = current
            ? PHASE_COLORS[meta.phase]
            : done ? '#FF4D00' : '#3a2419';
          return (
            <div key={state} className="flex items-center flex-1">
              <div
                className="h-1.5 rounded-full flex-1 transition-all duration-500"
                style={{ background: color, opacity: done || current ? 1 : 0.3 }}
              />
              {i < 3 && (
                <div
                  className="w-1.5 h-1.5 rounded-full mx-0.5 shrink-0"
                  style={{ background: color, opacity: done || current ? 1 : 0.2 }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
