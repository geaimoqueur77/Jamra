import { useRef, useEffect } from 'react';
import { buildGrid } from './JamraAvatar';
import { drawJamrMascot } from './avatar/companions';

const MILESTONE_TEXTS = {
  phase1_done:     ['PHASE 1', 'ACCOMPLIE !'],
  minus_5kg:       ['-5 KG', 'PERDUS !'],
  marathon_signed: ['MARATHON', 'INSCRIT !'],
};

function drawPixelGrid(ctx, grid, dx, dy, ps, rows = 64, cols = 32) {
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (grid[y]?.[x]) { ctx.fillStyle = grid[y][x]; ctx.fillRect(dx + x * ps, dy + y * ps, ps, ps); }
  }
}

export default function MilestoneAnimation({ milestone, avatarState, avatarCustomization, onDismiss }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const t0Ref = useRef(performance.now());

  // Auto-dismiss après 4s
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const loop = (now) => {
      const c = canvasRef.current;
      if (!c) return;
      const t = now - t0Ref.current;
      const W = c.width, H = c.height;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      // Fond sombre semi-transparent
      ctx.fillStyle = 'rgba(4,2,6,0.94)';
      ctx.fillRect(0, 0, W, H);

      // Particules Heat Signature montantes
      const PARTS = 80;
      for (let i = 0; i < PARTS; i++) {
        const seed = i * 137.508;
        const px = (Math.sin(seed) * .5 + .5) * W;
        const py = ((t * .0004 + seed * .01) % 1.2 - .1) * H;
        const prog = (t * .0004 + seed * .01) % 1.2;
        const alpha = Math.max(0, .8 - prog);
        const cols = [[255,77,0],[255,170,51],[255,209,102],[255,104,32]];
        const [r, g, b] = cols[i % 4];
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fillRect(px, py, 3, 3);
      }

      // Aura centrale pulsante
      const auraSize = .35 + .04 * Math.sin(t / 300);
      const ag = ctx.createRadialGradient(W*.5, H*.38, 0, W*.5, H*.38, W*auraSize);
      ag.addColorStop(0, 'rgba(255,77,0,0.28)'); ag.addColorStop(.5, 'rgba(255,170,51,0.1)'); ag.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ag; ctx.fillRect(0, 0, W, H);

      // Avatar principal × 8 — centré
      const APS = 8;
      const aW = 32 * APS, aH = 64 * APS;
      const ax = (W - aW) / 2;
      const ay = H * .04 + Math.sin(t / 600) * 6;
      const fr = Math.floor(t / 240) % 4;
      const grid = buildGrid(
        avatarState?.bodyState || 2, fr, 'fier', false, 'celebrate',
        avatarCustomization || {}
      );
      drawPixelGrid(ctx, grid, ax, ay, APS);

      // Jamr mascot — rebondit à droite
      const JPS = 5;
      const jx = W * .72;
      const jy = H * .5 + Math.abs(Math.sin(t / 380)) * -28 - 16 * JPS;
      drawJamrMascot(ctx, 'happy', t, JPS);

      // Texte milestones
      const lines = MILESTONE_TEXTS[milestone?.key] || [milestone?.label?.toUpperCase() || 'BRAVO !'];
      const textAlpha = Math.min(1, t / 250);
      ctx.globalAlpha = textAlpha;
      ctx.textAlign = 'center';
      const fontSize = Math.round(W * .1);
      lines.forEach((line, i) => {
        ctx.font = `bold ${fontSize}px "Big Shoulders Display", system-ui, sans-serif`;
        ctx.fillStyle = i === 0 ? '#FF4D00' : '#FFAA33';
        ctx.fillText(line, W / 2, H * .68 + i * fontSize * 1.15);
      });
      ctx.globalAlpha = 1;

      // XP counter montant
      if (milestone?.xp > 0) {
        const xpProgress = Math.min(1, t / 300);
        const xpAlpha = xpProgress * Math.max(0, 1 - (t - 2800) / 800);
        const xpY = H * .86 - (t / 4000) * H * .05;
        ctx.globalAlpha = xpAlpha;
        ctx.font = `bold ${Math.round(W * .065)}px monospace`;
        ctx.fillStyle = '#FFAA33';
        ctx.textAlign = 'center';
        ctx.fillText(`+${Math.round(milestone.xp * xpProgress)} XP`, W / 2, xpY);
        ctx.globalAlpha = 1;
      }

      // Hint dismiss
      if (t > 1500) {
        const hintAlpha = Math.min(1, (t - 1500) / 500) * .5;
        ctx.globalAlpha = hintAlpha;
        ctx.font = `${Math.round(W * .035)}px monospace`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('Appuyer pour fermer', W / 2, H * .94);
        ctx.globalAlpha = 1;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [milestone, avatarState, avatarCustomization]);

  return (
    <div className="fixed inset-0 z-50" onClick={onDismiss}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100vw', height: '100vh', imageRendering: 'pixelated' }}
      />
    </div>
  );
}
