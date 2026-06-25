import { useRef, useEffect, useMemo, useState } from 'react';
import { buildGrid } from './JamraAvatar';

const HEAT_PALETTE = ['#FF4D00', '#FFAA33', '#FFD166', '#FF6820'];

function computeBodyState(weightKg) {
  if (!weightKg) return 1;
  if (weightKg < 85) return 4;
  if (weightKg < 89) return 3;
  if (weightKg < 93) return 2;
  return 1;
}

function AvatarTile({ weightKg, date, isGoal, isFirst, customization = {}, onClick }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const bodyState = isGoal ? 4 : computeBodyState(weightKg);
  const expr = isGoal ? 'fier' : (bodyState >= 3 ? 'satisfait' : 'neutral');
  const PS = 3; // 32×3=96 wide, 64×3=192 tall

  useEffect(() => {
    const t0 = performance.now();
    const loop = (now) => {
      const canvas = canvasRef.current;
      if (!canvas) { rafRef.current = requestAnimationFrame(loop); return; }
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      const W = canvas.width, H = canvas.height;
      const t = now - t0;

      ctx.fillStyle = '#070405';
      ctx.fillRect(0, 0, W, H);

      // Aura pulsante pour isGoal
      if (isGoal) {
        const pulse = 0.15 + 0.08 * Math.sin(t / 400);
        const ag = ctx.createRadialGradient(W / 2, H * .55, 0, W / 2, H * .55, W * .65);
        ag.addColorStop(0, `rgba(255,77,0,${pulse})`);
        ag.addColorStop(0.5, `rgba(255,170,51,${pulse * .4})`);
        ag.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = ag; ctx.fillRect(0, 0, W, H);
        // Particules Heat Signature
        for (let i = 0; i < 8; i++) {
          const seed = i * 137.5;
          const px = (Math.sin(seed + t * .002) * .35 + .5) * W;
          const py = ((t * .0004 + seed * .01) % 1) * H;
          const alpha = Math.max(0, .6 - ((t * .0004 + seed * .01) % 1));
          const [r, g, b] = [[255, 77, 0], [255, 170, 51], [255, 209, 102]][i % 3];
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx.fillRect(px, py, 2, 2);
        }
      }

      const fr = Math.floor(t / 300) % 4;
      const g = buildGrid(bodyState, fr, expr, false, 'idle', customization);
      const cw = 32 * PS, ch = 64 * PS;
      const dx = Math.round((W - cw) / 2);
      const dy = Math.round(H - ch - H * .04 + Math.sin(t / 600) * 1.5);

      for (let y = 0; y < 64; y++) for (let x = 0; x < 32; x++) {
        if (g[y][x]) { ctx.fillStyle = g[y][x]; ctx.fillRect(dx + x * PS, dy + y * PS, PS, PS); }
      }

      // Badge étoile sur Goal
      if (isGoal) {
        ctx.fillStyle = '#FFAA33';
        ctx.font = `${W * .14}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('✦', W / 2, W * .16);
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [bodyState, expr, customization, isGoal]);

  const tileW = 32 * PS + 16; // canvas width + padding
  const tileH = 64 * PS + 20; // canvas height + label space

  const dateStr = date
    ? new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    : null;

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 flex flex-col items-center gap-1 px-1 py-2 rounded-xl transition-all duration-150 active:scale-95"
      style={{ scrollSnapAlign: 'start' }}
    >
      <canvas
        ref={canvasRef}
        width={tileW}
        height={tileH}
        style={{ imageRendering: 'pixelated', display: 'block', borderRadius: 8 }}
      />
      {isGoal ? (
        <div className="font-mono text-[8px] text-heat-amber font-bold uppercase tracking-wide">Objectif</div>
      ) : (
        <>
          <div className="font-mono text-[8px] text-text-muted">{dateStr}</div>
          {weightKg && (
            <div className="font-mono text-[9px] text-heat-orange font-bold">{weightKg}kg</div>
          )}
        </>
      )}
    </button>
  );
}

export default function TransformTimeline({ weights = [], profile, customization = {} }) {
  const [tooltip, setTooltip] = useState(null);

  // Sélectionner les points clés (max 8 pesées) + le premier point
  const tiles = useMemo(() => {
    if (!weights.length) return [];
    const sorted = [...weights].sort((a, b) => a.date?.localeCompare(b.date) || 0);
    if (sorted.length <= 8) return sorted;
    const step = Math.floor(sorted.length / 7);
    const result = [sorted[0]];
    for (let i = step; i < sorted.length - 1; i += step) {
      if (result.length < 7) result.push(sorted[i]);
    }
    result.push(sorted[sorted.length - 1]);
    return result;
  }, [weights]);

  if (tiles.length === 0) return null;

  return (
    <div className="px-6 pb-5">
      <div className="font-display font-bold text-[13px] uppercase tracking-[0.12em] text-text-secondary mb-3">
        Timeline de transformation
      </div>
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
      >
        {tiles.map((w, i) => (
          <AvatarTile
            key={w.date || i}
            weightKg={w.poids_kg}
            date={w.date}
            isFirst={i === 0}
            customization={customization}
            onClick={() => setTooltip(tooltip?.i === i ? null : { i, w })}
          />
        ))}
        {/* Connecteurs entre tiles */}
        {/* Arrow entre tiles — rendu en CSS dans le parent via flex gap */}
        <AvatarTile
          key="goal"
          weightKg={profile?.poids_cible_kg}
          date={null}
          isGoal
          customization={customization}
          onClick={() => setTooltip(null)}
        />
      </div>
    </div>
  );
}
