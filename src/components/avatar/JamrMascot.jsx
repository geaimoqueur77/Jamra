import { useRef, useEffect } from 'react';
import { drawJamrMascot } from './companions';

export default function JamrMascot({ state = 'idle', size = 32 }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const t0Ref = useRef(null);

  useEffect(() => {
    t0Ref.current = performance.now();

    const loop = (now) => {
      const canvas = canvasRef.current;
      if (!canvas) { rafRef.current = requestAnimationFrame(loop); return; }
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const pixelSize = canvas.width / 32;
      drawJamrMascot(ctx, state, now - t0Ref.current, pixelSize);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [state]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ display: 'block', imageRendering: 'pixelated' }}
    />
  );
}
