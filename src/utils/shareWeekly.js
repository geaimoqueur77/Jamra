import { buildGrid } from '../components/JamraAvatar';

function drawPixelChar(ctx, grid, dx, dy, pixelSize) {
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < 64; y++) for (let x = 0; x < 32; x++) {
    if (grid[y][x]) {
      ctx.fillStyle = grid[y][x];
      ctx.fillRect(dx + x * pixelSize, dy + y * pixelSize, pixelSize, pixelSize);
    }
  }
}

function drawNoise(ctx, W, H) {
  const imgd = ctx.createImageData(W, H);
  for (let i = 0; i < imgd.data.length; i += 4) {
    const v = (Math.random() > 0.5 ? 255 : 0);
    imgd.data[i] = imgd.data[i+1] = imgd.data[i+2] = v;
    imgd.data[i+3] = Math.random() > 0.97 ? 20 : 0;
  }
  ctx.putImageData(imgd, 0, 0);
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return [r,g,b];
}

/**
 * Génère un canvas 1080×1080 partageable (format Instagram)
 * @param {Object} weekData - { poids, poidsPrec, graisseBrulee, seances, kmZone2, streak, weekLabel }
 * @param {Object} avatarState - { bodyState, expression, scene }
 * @param {Object} avatarCustomization - { skin, hair, ... }
 * @param {string} coachQuote - citation coach IA (max 80 chars)
 * @returns {string} dataURL PNG
 */
export async function generateWeeklyShareImage(weekData, avatarState, avatarCustomization, coachQuote) {
  const W = 1080, H = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ── Fond dégradé sombre ──
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#100808'); bg.addColorStop(0.5, '#07070a'); bg.addColorStop(1, '#050406');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // Grain
  drawNoise(ctx, W, H);

  // Aura orangée centrée-gauche (là où sera l'avatar)
  const aura = ctx.createRadialGradient(W * 0.28, H * 0.52, 0, W * 0.28, H * 0.52, W * 0.38);
  aura.addColorStop(0, 'rgba(255,77,0,0.22)'); aura.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = aura; ctx.fillRect(0, 0, W, H);

  // ── Logo JAMRA en haut ──
  ctx.fillStyle = '#FF4D00';
  ctx.font = 'bold 64px "Big Shoulders Display", sans-serif';
  ctx.letterSpacing = '8px';
  ctx.fillText('JAMRA', 60, 90);
  ctx.font = '28px "JetBrains Mono", monospace';
  ctx.fillStyle = '#8f7468';
  ctx.letterSpacing = '2px';
  ctx.fillText(weekData.weekLabel || 'Bilan de semaine', 60, 130);

  // Ligne séparatrice
  ctx.strokeStyle = '#FF4D00'; ctx.lineWidth = 2; ctx.globalAlpha = 0.4;
  ctx.beginPath(); ctx.moveTo(60, 152); ctx.lineTo(W - 60, 152); ctx.stroke();
  ctx.globalAlpha = 1;

  // ── Avatar × 6 (192×384px) côté gauche ──
  const avatarPixelSize = 6; // 32×6=192px large, 64×6=384px haut
  const avatarX = 80, avatarY = 200;
  const grid = buildGrid(
    avatarState?.bodyState || 2,
    0,
    avatarState?.expression || 'fier',
    false,
    'idle',
    avatarCustomization || {}
  );
  drawPixelChar(ctx, grid, avatarX, avatarY, avatarPixelSize);

  // ── Stats côté droit ──
  const statsX = 420, statsStartY = 220;
  const lineH = 110;
  const stats = [
    { label: 'POIDS', value: weekData.poids != null ? `${weekData.poids} kg` : '—', delta: weekData.poidsPrec != null && weekData.poids != null ? `${(weekData.poids - weekData.poidsPrec) > 0 ? '+' : ''}${(weekData.poids - weekData.poidsPrec).toFixed(1)}` : null, color: '#FF4D00' },
    { label: 'GRAISSE', value: weekData.graisseBrulee != null ? `${weekData.graisseBrulee.toFixed(1)} kg MG` : '—', delta: null, color: '#FFAA33' },
    { label: 'SÉANCES', value: weekData.seances != null ? `${weekData.seances} séances` : '—', delta: null, color: '#10b981' },
    { label: 'KM ZONE 2', value: weekData.kmZone2 != null ? `${weekData.kmZone2} km` : '—', delta: null, color: '#4f8df9' },
    { label: 'STREAK', value: weekData.streak != null ? `🔥 ${weekData.streak} jours` : '🔥 —', delta: null, color: '#f59e0b' },
  ];

  stats.forEach((stat, i) => {
    const y = statsStartY + i * lineH;

    // Label
    ctx.font = '22px "JetBrains Mono", monospace';
    ctx.fillStyle = '#5a4a48';
    ctx.letterSpacing = '3px';
    ctx.fillText(stat.label, statsX, y);

    // Valeur principale
    ctx.font = 'bold 52px "Big Shoulders Display", sans-serif';
    ctx.fillStyle = stat.color;
    ctx.letterSpacing = '1px';
    ctx.fillText(stat.value, statsX, y + 55);

    // Delta poids
    if (stat.delta != null) {
      ctx.font = 'bold 28px "JetBrains Mono", monospace';
      ctx.fillStyle = parseFloat(stat.delta) <= 0 ? '#10b981' : '#ef4444';
      ctx.fillText(stat.delta + ' kg', statsX + 280, y + 55);
    }

    // Séparateur fin
    if (i < stats.length - 1) {
      ctx.strokeStyle = '#2a1a18'; ctx.lineWidth = 1; ctx.globalAlpha = 0.6;
      ctx.beginPath(); ctx.moveTo(statsX, y + 72); ctx.lineTo(W - 60, y + 72); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  });

  // ── Citation coach ──
  const quoteY = H - 180;
  ctx.fillStyle = 'rgba(42,26,24,0.6)';
  ctx.beginPath();
  ctx.roundRect(60, quoteY - 30, W - 120, 100, 12);
  ctx.fill();

  ctx.font = 'italic 30px "Manrope", sans-serif';
  ctx.fillStyle = '#c8a89c';
  ctx.letterSpacing = '0.5px';
  const quote = (coachQuote || 'Continue comme ça.').slice(0, 80);
  ctx.fillText(`"${quote}"`, 80, quoteY + 20);

  // ── Filigrane ──
  ctx.font = '22px "JetBrains Mono", monospace';
  ctx.fillStyle = '#3a2419';
  ctx.letterSpacing = '2px';
  ctx.fillText('jamra.app', W - 200, H - 40);

  return canvas.toDataURL('image/png');
}

/**
 * Partage ou télécharge l'image hebdo
 */
export async function shareOrDownloadWeekly(weekData, avatarState, avatarCustomization, coachQuote) {
  const dataURL = await generateWeeklyShareImage(weekData, avatarState, avatarCustomization, coachQuote);

  // Essaie navigator.share (mobile)
  if (navigator.canShare) {
    try {
      const res = await fetch(dataURL);
      const blob = await res.blob();
      const file = new File([blob], 'jamra-semaine.png', { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Mon bilan Jamra' });
        return;
      }
    } catch { /* fallback */ }
  }

  // Fallback : téléchargement direct
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = 'jamra-semaine.png';
  a.click();
}
