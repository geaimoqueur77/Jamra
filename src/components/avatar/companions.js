// Sprites compagnons — même système de canvas pixel art que JamraAvatar
// Exports : drawCompanion(ctx, type, expr, scale)
//           drawJamrMascot(ctx, state, t)

function P(g, x, y, c) {
  x = Math.round(x); y = Math.round(y);
  if (c && x >= 0 && x < 32 && y >= 0 && y < 64) g[y][x] = c;
}
function hspan(g, y, x0, x1, c) {
  for (let x = Math.round(x0); x <= Math.round(x1); x++) P(g, x, y, c);
}
function disc(g, cx, cy, r, c) {
  const R = Math.ceil(r);
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
    if (dx * dx + dy * dy <= r * r + 0.25) P(g, Math.round(cx) + dx, Math.round(cy) + dy, c);
  }
}
function limb(g, x0, y0, x1, y1, r, c) {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    disc(g, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r, c);
  }
}
function lerp(a, b, t) { return a + (b - a) * t; }

function mkgrid() {
  const g = [];
  for (let y = 0; y < 64; y++) g.push(new Array(32).fill(null));
  return g;
}

function outlineGrid(g) {
  const ol = '#1a0a00';
  const isFill = (x, y) => x >= 0 && x < 32 && y >= 0 && y < 64 && g[y][x];
  const out = [];
  for (let y = 0; y < 64; y++) for (let x = 0; x < 32; x++) {
    if (g[y][x]) continue;
    if (isFill(x-1,y)||isFill(x+1,y)||isFill(x,y-1)||isFill(x,y+1)) out.push([x,y]);
  }
  out.forEach(([x,y]) => g[y][x] = ol);
}

// ─── LE COACH — massif, bras croisés, bienveillant-exigeant ───
function buildCoach(fr, expr) {
  const g = mkgrid();
  const cx = 15.5;

  const SK = { b: '#d3915d', m: '#a46a3e', d: '#7c4a2c', h: '#f0b485' };
  const CL = { b: '#0a1422', m: '#060c16', d: '#030810' }; // tshirt sombre
  const HAIR = '#1a0e08';

  // LEGS
  for (let y = 43; y <= 61; y++) {
    hspan(g, y, cx - 4.8, cx - 0.8, CL.b); hspan(g, y, cx + 0.8, cx + 4.8, CL.b);
  }
  // Shoes
  for (let y = 60; y <= 63; y++) {
    hspan(g, y, cx - 5.2, cx - 0.4, '#151014'); hspan(g, y, cx + 0.4, cx + 5.2, '#151014');
  }
  hspan(g, 63, cx - 5.6, cx - 0.2, '#FF4D00'); hspan(g, 63, cx + 0.2, cx + 5.6, '#FF4D00');

  // Pelvis / ceinture
  for (let y = 39; y <= 43; y++) hspan(g, y, cx - 5.5, cx + 5.5, CL.m);

  // TORSO — large
  for (let y = 14; y <= 40; y++) {
    const hw = lerp(5.5, 6.5, Math.min(1, (y - 14) / 10));
    hspan(g, y, cx - hw, cx + hw, y % 3 === 0 ? CL.m : CL.b);
  }
  // Plis sur tshirt
  hspan(g, 20, cx - 4, cx - 1, CL.d); hspan(g, 24, cx + 1, cx + 4, CL.d);
  hspan(g, 28, cx - 3, cx + 3, CL.d);

  // BRAS CROISÉS
  // Avant-bras gauche
  limb(g, cx - 6, 26, cx + 4, 33, 2.4, CL.m);
  // Avant-bras droit par-dessus
  limb(g, cx + 5, 26, cx - 3, 32, 2.2, SK.b);
  // Mains
  disc(g, cx - 3, 32, 2.0, SK.b); disc(g, cx + 4, 33, 1.8, SK.m);

  // NECK — large
  for (let y = 12; y <= 15; y++) hspan(g, y, cx - 2.8, cx + 2.8, SK.m);

  // HEAD — plus carrée/massive
  for (let dy = -5; dy <= 5; dy++) {
    const hw = 5.2 - Math.abs(dy) * 0.2;
    hspan(g, 8 + dy, cx - hw, cx + hw, dy < 0 ? SK.h : dy > 2 ? SK.d : SK.b);
  }

  // HAIR ras (court) — dessus et côtés
  for (let dy = -4; dy <= -2; dy++) {
    const hw = 4.6 - Math.abs(dy + 3) * 0.5;
    hspan(g, 8 + dy, cx - hw, cx + hw, HAIR);
  }
  for (let y = 5; y <= 10; y++) { P(g, Math.round(cx - 5.4), y, HAIR); P(g, Math.round(cx + 5.4), y, HAIR); }

  outlineGrid(g);

  // FACE — expression bienveillant-exigeant
  const ey = 9, browY = 7;
  P(g, cx - 2, ey, '#0a0505'); P(g, cx + 2, ey, '#0a0505'); // yeux
  // Sourcils légèrement froncés (milieu plus bas)
  P(g, Math.round(cx - 3), browY, HAIR); P(g, Math.round(cx - 2), browY, HAIR);
  P(g, Math.round(cx - 1), browY + 1, HAIR);
  P(g, Math.round(cx + 1), browY + 1, HAIR);
  P(g, Math.round(cx + 2), browY, HAIR); P(g, Math.round(cx + 3), browY, HAIR);
  // Sourire discret
  hspan(g, 11, cx - 1.5, cx + 1.5, '#7a3b22');
  P(g, Math.round(cx - 2), 11, SK.d); P(g, Math.round(cx + 2), 11, SK.d);

  return g;
}

// ─── LE RIVAL — bodyState 3, tenue running, Garmin, regard de côté ───
function buildRival(fr, expr) {
  const g = mkgrid();
  const cx = 15.5;
  const t = 0.67; // bodyState 3 fixe

  const SK = { b: '#d3915d', m: '#a46a3e', d: '#7c4a2c', h: '#f0b485' };
  const RUN = { j0: '#1a2a44', j1: '#101a2e', j2: '#080f1c', s: '#0f1826', sa: '#FF6820' };
  const HAIR = '#1e1008';

  // Jambes running
  const ph = [0, 0.3, 0, -0.3][fr];
  const lHipX = cx - 1.6, rHipX = cx + 1.6;
  limb(g, lHipX, 43, lHipX + ph * 4, 58 - Math.abs(ph) * 2, 2.2, RUN.j1);
  limb(g, rHipX, 43, rHipX - ph * 4, 58 - Math.abs(ph) * 2, 2.2, RUN.j1);
  disc(g, lHipX + ph * 4 + 0.4, 60 - Math.abs(ph), 2.0, RUN.s); hspan(g, Math.round(62 - Math.abs(ph)), lHipX + ph * 4 - 0.6, lHipX + ph * 4 + 2.2, RUN.sa);
  disc(g, rHipX - ph * 4 + 0.4, 60 - Math.abs(ph), 2.0, RUN.s); hspan(g, Math.round(62 - Math.abs(ph)), rHipX - ph * 4 - 0.6, rHipX - ph * 4 + 2.2, RUN.sa);

  // Pelvis
  for (let y = 39; y <= 43; y++) hspan(g, y, cx - lerp(4.5, 3.8, t), cx + lerp(4.5, 3.8, t), RUN.j1);

  // Torso slim
  for (let y = 15; y <= 40; y++) {
    const hw = lerp(4.0, 3.2, Math.min(1, (y - 15) / 15));
    hspan(g, y, cx - hw, cx + hw, '#1c3060');
  }
  // Bande fluo sur le côté
  hspan(g, 20, cx - 4.2, cx - 3.8, RUN.sa); hspan(g, 25, cx - 4.2, cx - 3.8, RUN.sa);
  hspan(g, 30, cx - 4.2, cx - 3.8, RUN.sa);

  // Bras en mouvement
  const rArmPh = -ph;
  limb(g, cx + 3.8, 18, cx + 3.4 + rArmPh * 2, 28, 2.0, '#1c3060');
  limb(g, cx + 3.4 + rArmPh * 2, 28, cx + 2 + rArmPh * 3.5, lerp(35, 22, (rArmPh + 1) / 2), 1.7, SK.b);
  limb(g, cx - 3.8, 18, cx - 3.4 - rArmPh * 2, 28, 2.0, '#1c3060');
  limb(g, cx - 3.4 - rArmPh * 2, 28, cx - 2 - rArmPh * 3.5, lerp(35, 22, (-rArmPh + 1) / 2), 1.7, SK.b);

  // Garmin poignet gauche
  const gwx = Math.round(cx - 2 - rArmPh * 3.5);
  const gwy = Math.round(lerp(35, 22, (-rArmPh + 1) / 2));
  hspan(g, gwy, gwx - 1, gwx + 0.8, '#0c0c12');
  P(g, gwx, gwy, '#FFAA33');

  // Cou
  for (let y = 12; y <= 15; y++) hspan(g, y, cx - 2.2, cx + 2.2, SK.m);

  // HEAD
  for (let dy = -5; dy <= 5; dy++) {
    const hw = 4.3 * Math.sqrt(1 - (dy / 5.5) * (dy / 5.5));
    hspan(g, 8 + dy, cx - hw, cx + hw, dy < 0 ? SK.h : dy > 2 ? SK.d : SK.b);
  }

  // HAIR court
  for (let dy = -5; dy <= -1; dy++) {
    const hw = 3.8 * Math.sqrt(Math.max(0, 1 - (dy / 5.5) * (dy / 5.5)));
    hspan(g, 8 + dy, cx - hw, cx + hw, HAIR);
  }

  outlineGrid(g);

  // FACE — confiant, regard de côté
  const ey = 9;
  P(g, Math.round(cx - 1.5), ey, '#0a0505'); P(g, Math.round(cx + 2.5), ey, '#0a0505'); // regard légèrement décalé
  P(g, Math.round(cx - 2.5), 7, HAIR); P(g, Math.round(cx - 1.5), 7, HAIR);
  P(g, Math.round(cx + 1.5), 7, HAIR); P(g, Math.round(cx + 2.5), 7, HAIR);
  hspan(g, 11, cx, cx + 2, '#7a3b22'); // demi-sourire
  P(g, Math.round(cx + 2.5), 10, SK.d);

  return g;
}

// ─── JAMR LA MASCOTTE — 16×16 dans grille 32×64, centré ───
function buildJamr(state, t) {
  // state : 'idle' | 'happy' | 'sad'
  const g = mkgrid();

  const JO = '#FF4D00', JS = '#CC3300', JH = '#FF7040', JE = '#1a0800';
  const cx = 16, cy = 32;

  // Corps rond principal
  disc(g, cx, cy, 7, JO, null, null);
  // Override couleurs avec ombrage manuel
  for (let dy = -7; dy <= 7; dy++) for (let dx = -7; dx <= 7; dx++) {
    if (dx*dx+dy*dy <= 49.5) {
      const shade = (dx + dy) > 4 ? JS : (dx + dy) < -4 ? JH : JO;
      P(g, cx + dx, cy + dy, shade);
    }
  }

  // Oreilles
  disc(g, cx - 5, cy - 6, 2.2, JO, null, null);
  disc(g, cx + 5, cy - 6, 2.2, JO, null, null);
  P(g, cx - 5, cy - 6, JS); P(g, cx + 5, cy - 6, JS);

  // Ventre clair
  for (let dy = -2; dy <= 3; dy++) {
    const hw = 3.5 - Math.abs(dy) * 0.6;
    hspan(g, cy + dy, cx - hw, cx + hw, '#FEF3C7');
  }

  // Yeux
  if (state === 'happy' || (state === 'idle' && Math.floor(t / 1200) % 5 === 0)) {
    // Yeux fermés (content / clin d'œil idle)
    hspan(g, cy - 2, cx - 3, cx - 1.5, JE);
    hspan(g, cy - 2, cx + 1.5, cx + 3, JE);
  } else if (state === 'sad') {
    // Yeux larmoiants
    P(g, cx - 2, cy - 3, JE); P(g, cx + 2, cy - 3, JE);
    P(g, cx - 2, cy - 1, '#4FC3F7'); P(g, cx + 2, cy - 1, '#4FC3F7'); // larmes
  } else {
    // Yeux normaux
    disc(g, cx - 2, cy - 2, 1.2, JE, null, null);
    disc(g, cx + 2, cy - 2, 1.2, JE, null, null);
    P(g, cx - 1, cy - 3, '#fffdf8'); P(g, cx + 3, cy - 3, '#fffdf8'); // reflets
  }

  // Bouche
  if (state === 'happy') {
    hspan(g, cy + 2, cx - 2, cx + 2, JE);
    P(g, cx - 2, cy + 1, JE); P(g, cx + 2, cy + 1, JE);
  } else if (state === 'sad') {
    // Bouche triste
    hspan(g, cy + 3, cx - 2, cx + 2, JE);
    P(g, cx - 2, cy + 4, JE); P(g, cx + 2, cy + 4, JE);
    // Oreilles basses
    P(g, cx - 5, cy - 4, JS); P(g, cx + 5, cy - 4, JS);
    hspan(g, cy - 5, cx - 6, cx - 4, JS); hspan(g, cy - 5, cx + 4, cx + 6, JS);
  } else {
    hspan(g, cy + 2, cx - 1, cx + 1, JE);
  }

  // Pattes
  disc(g, cx - 5, cy + 5, 1.5, JS, null, null);
  disc(g, cx + 5, cy + 5, 1.5, JS, null, null);

  outlineGrid(g);
  return g;
}

// ─── Rendu générique sur canvas 2D ───
function renderGrid(ctx, g, dx, dy, pixelSize) {
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < 64; y++) for (let x = 0; x < 32; x++) {
    if (g[y][x]) {
      ctx.fillStyle = g[y][x];
      ctx.fillRect(dx + x * pixelSize, dy + y * pixelSize, pixelSize, pixelSize);
    }
  }
}

export function drawCompanion(ctx, type, expr = 'neutral', scale = 1.5, fr = 0) {
  let g;
  if (type === 'coach') g = buildCoach(fr, expr);
  else if (type === 'rival') g = buildRival(fr, expr);
  else return;
  const pixelSize = scale;
  renderGrid(ctx, g, 0, 0, pixelSize);
}

export function drawJamrMascot(ctx, state = 'idle', t = 0, pixelSize = 2) {
  const g = buildJamr(state, t);
  // Sauter si happy
  const jump = state === 'happy' ? -Math.abs(Math.sin(t / 300)) * 4 : 0;
  renderGrid(ctx, g, 0, jump, pixelSize);
}

// Composant React minimal pour intégration facile
export { buildCoach, buildRival, buildJamr };
