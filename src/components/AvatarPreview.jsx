import { useRef, useEffect } from 'react';
import { buildGrid } from './JamraAvatar';

export default function AvatarPreview({ bodyState = 2, customization = {}, size = 120 }) {
  const canvasRef = useRef(null);
  const offRef = useRef(null);
  const rafRef = useRef(null);
  const t0Ref = useRef(null);

  useEffect(() => {
    const off = document.createElement('canvas');
    off.width = 32; off.height = 64;
    offRef.current = off;
    t0Ref.current = performance.now();

    const loop = (now) => {
      const fr = Math.floor((now - t0Ref.current) / 300) % 4;
      const g = buildGrid(bodyState, fr, 'satisfait', false, 'idle', customization);

      const offCtx = off.getContext('2d');
      offCtx.clearRect(0, 0, 32, 64);
      for (let y = 0; y < 64; y++) for (let x = 0; x < 32; x++) {
        if (g[y][x]) { offCtx.fillStyle = g[y][x]; offCtx.fillRect(x, y, 1, 1); }
      }

      const canvas = canvasRef.current;
      if (!canvas) { rafRef.current = requestAnimationFrame(loop); return; }
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      const S = canvas.width / 32;
      ctx.fillStyle = '#070405';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Aura subtile
      const aura = ctx.createRadialGradient(canvas.width / 2, canvas.height * 0.6, 0, canvas.width / 2, canvas.height * 0.6, canvas.width * 0.55);
      aura.addColorStop(0, 'rgba(255,77,0,0.18)'); aura.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = aura; ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Ombre au sol
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.ellipse(canvas.width / 2, canvas.height * 0.97, canvas.width * 0.22, canvas.height * 0.04, 0, 0, Math.PI * 2); ctx.fill();

      // Personnage centré — ph = 90% canvas.height pour laisser 5% haut + 5% bas (ombre)
      const bounce = Math.sin(now / 600) * 1.5;
      const ph = Math.round(canvas.height * 0.90);
      const pw = Math.round(ph / 2); // ratio 1:2 sprite
      const px = Math.round((canvas.width - pw) / 2);
      const py = Math.round(canvas.height - ph - canvas.height * 0.05 + bounce);
      ctx.drawImage(off, 0, 0, 32, 64, px, py, pw, ph);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [bodyState, customization]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size * 2}
      style={{ display: 'block', imageRendering: 'pixelated', borderRadius: 12 }}
    />
  );
}
