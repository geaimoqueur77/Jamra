import { useRef, useEffect } from 'react';

// ─────────────────────────────────────────────
//  Palette Heat Signature (valeurs non-customisables)
// ─────────────────────────────────────────────
const PAL = {
  ol: '#1a0a00',
  sk0: '#f0b485', sk1: '#d3915d', sk2: '#a46a3e', sk3: '#7c4a2c',
  ha1: '#4a3327', ha0: '#251812',
  sh0: '#3a2419', sh1: '#281610', sh2: '#160b07',
  acc: '#FF4D00', acc2: '#FFAA33',
  jo0: '#2c2c38', jo1: '#1a1a22', jo2: '#101016',
  so: '#15111a', soa: '#FF4D00',
  gs: '#0c0c12', gsc: '#FFAA33',
  eye: '#120a0a', gl: '#5a4750', mo: '#7a3b22',
};

// ─────────────────────────────────────────────
//  Palettes de personnalisation
// ─────────────────────────────────────────────
const SKIN_TONES = {
  medium: { sk0: '#f0b485', sk1: '#d3915d', sk2: '#a46a3e', sk3: '#7c4a2c' },
  light:  { sk0: '#fad4a8', sk1: '#f0b07a', sk2: '#d4885a', sk3: '#b06842' },
  dark:   { sk0: '#c87840', sk1: '#9e5828', sk2: '#7a3c18', sk3: '#5c2c0e' },
};

const OUTFIT_PALS = {
  default:     { jo0: '#2c2c38', jo1: '#1a1a22', jo2: '#101016', so: '#15111a', soa: '#FF4D00' },
  gym:         { jo0: '#0a1828', jo1: '#060e18', jo2: '#030810', so: '#0c0a14', soa: '#FF4D00' },
  running:     { jo0: '#1a2a44', jo1: '#101a2e', jo2: '#080f1c', so: '#0f1826', soa: '#FF6820' },
  competition: { jo0: '#a01010', jo1: '#700808', jo2: '#480404', so: '#0c0a14', soa: '#FFD040' },
  rest:        { jo0: '#2c1a2c', jo1: '#1e1020', jo2: '#120814', so: '#1a1014', soa: '#c87030' },
};

export const CUSTOMIZATION_OPTIONS = {
  skin: [
    { id: 'medium',      label: 'Mate',        default: true },
    { id: 'light',       label: 'Claire',       unlockAt: 0 },
    { id: 'dark',        label: 'Foncée',       unlockAt: 0 },
  ],
  hair: [
    { id: 'short_dark',  label: 'Court foncé',  default: true },
    { id: 'fade',        label: 'Dégradé',      unlockAt: 0 },
    { id: 'curly',       label: 'Bouclé',       unlockAt: 500 },
    { id: 'shaved',      label: 'Rasé',         unlockAt: 1000 },
  ],
  glasses: [
    { id: 'none',        label: 'Aucune',       default: true },
    { id: 'round',       label: 'Rondes',       unlockAt: 0 },
    { id: 'sport',       label: 'Sport',        unlockAt: 300 },
  ],
  outfit: [
    { id: 'default',     label: 'Jogger + tee', default: true },
    { id: 'gym',         label: 'Tenue salle',  unlockAt: 20 },
    { id: 'running',     label: 'Tenue run',    unlockAt: 5 },
    { id: 'competition', label: 'Compétition',  unlockAt: 'marathon_signed' },
    { id: 'rest',        label: 'Détente',      unlockAt: 'streak_7' },
  ],
  shoes: [
    { id: 'default',     label: 'Baskets',      default: true },
    { id: 'running',     label: 'Running',      unlockAt: 10 },
  ],
};

// ─────────────────────────────────────────────
//  Drawing primitives
// ─────────────────────────────────────────────
function mkgrid() {
  const g = [];
  for (let y = 0; y < 64; y++) g.push(new Array(32).fill(null));
  return g;
}

function P(g, x, y, c) {
  x = Math.round(x); y = Math.round(y);
  if (c && x >= 0 && x < 32 && y >= 0 && y < 64) g[y][x] = c;
}

function hspan(g, y, x0, x1, c) {
  for (let x = Math.round(x0); x <= Math.round(x1); x++) P(g, x, y, c);
}

function lerp(a, b, t) { return a + (b - a) * t; }

function shadeRow(g, y, cx, half, base, sh, hi, bottom) {
  const x0 = Math.round(cx - half), x1 = Math.round(cx + half);
  for (let x = x0; x <= x1; x++) {
    const u = (x - cx) / Math.max(half, 0.001);
    let c = base;
    if (u > 0.42) c = sh; else if (u < -0.48) c = hi;
    if (bottom) c = sh;
    P(g, x, y, c);
  }
}

function disc(g, cx, cy, r, base, sh, hi) {
  const R = Math.ceil(r);
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
    if (dx * dx + dy * dy <= r * r + 0.25) {
      const u = dx / Math.max(r, 0.001);
      let c = base;
      if (u > 0.4) c = sh; else if (u < -0.5) c = hi;
      P(g, Math.round(cx) + dx, Math.round(cy) + dy, c);
    }
  }
}

function limb(g, x0, y0, x1, y1, r, base, sh, hi) {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  for (let i = 0; i <= n; i++) {
    const tt = i / n;
    disc(g, x0 + (x1 - x0) * tt, y0 + (y1 - y0) * tt, r, base, sh, hi);
  }
}

// ─────────────────────────────────────────────
//  Body profile curve
// ─────────────────────────────────────────────
function makeProfile(state) {
  const t = (state - 1) / 3;
  const c1 = [[15, 6.2], [17, 7.4], [21, 9.0], [26, 10.2], [31, 10.7], [35, 10.0], [39, 8.6]];
  const c4 = [[15, 10.8], [17, 10.6], [21, 9.3], [26, 7.2], [31, 6.0], [35, 5.8], [39, 6.4]];
  const cps = c1.map((p, i) => [p[0], lerp(p[1], c4[i][1], t)]);
  return (y) => {
    if (y <= cps[0][0]) return cps[0][1];
    for (let i = 0; i < cps.length - 1; i++) {
      const [a, wa] = cps[i], [b, wb] = cps[i + 1];
      if (y >= a && y <= b) return lerp(wa, wb, (y - a) / (b - a));
    }
    return cps[cps.length - 1][1];
  };
}

// ─────────────────────────────────────────────
//  Face features — acceptent SK pour la peau
// ─────────────────────────────────────────────
function drawFaceFeatures(g, cx, hcy, expr, SK) {
  const ex = Math.round(cx);
  const eyeY = Math.round(hcy) + 1;
  const browY = eyeY - 2, my = eyeY + 2;
  const B = PAL.ha0, M = PAL.mo, S = SK.sk2, H = SK.sk0;
  P(g, ex, eyeY + 1, S);
  P(g, ex + 3, eyeY, S);
  if (expr === 'satisfait') {
    P(g, ex - 3, browY, B); P(g, ex - 2, browY, B); P(g, ex + 2, browY, B); P(g, ex + 3, browY, B);
    P(g, ex - 2, my - 1, M); hspan(g, my, ex - 1, ex + 1, M); P(g, ex + 2, my - 1, M);
  } else if (expr === 'fatigue') {
    P(g, ex - 3, browY + 1, B); P(g, ex - 2, browY, B); P(g, ex + 2, browY, B); P(g, ex + 3, browY + 1, B);
    hspan(g, my, ex - 1, ex + 1, M); P(g, ex, my + 1, PAL.eye);
  } else if (expr === 'fier') {
    P(g, ex - 3, browY - 1, B); P(g, ex - 2, browY - 1, B); P(g, ex - 1, browY - 1, B);
    P(g, ex + 1, browY - 1, B); P(g, ex + 2, browY - 1, B); P(g, ex + 3, browY - 1, B);
    hspan(g, my, ex - 2, ex + 2, M); P(g, ex - 3, my - 1, M); P(g, ex + 3, my - 1, M);
    P(g, ex - 1, my, H); P(g, ex, my, H); P(g, ex + 1, my, H);
  } else if (expr === 'coupable') {
    P(g, ex - 3, browY + 1, B); P(g, ex - 2, browY, B); P(g, ex + 2, browY, B); P(g, ex + 3, browY + 1, B);
    P(g, ex - 1, my + 1, M); P(g, ex, my, M); P(g, ex + 1, my, M);
    P(g, ex + 4, browY + 1, PAL.gsc);
  } else if (expr === 'wink') {
    P(g, ex - 3, browY, B); P(g, ex - 2, browY, B);
    P(g, ex + 2, browY + 1, B); P(g, ex + 3, browY, B);
    P(g, ex - 2, my - 1, M); hspan(g, my, ex - 1, ex + 1, M); P(g, ex + 2, my - 1, M);
  } else {
    P(g, ex - 3, browY, B); P(g, ex - 2, browY, B); P(g, ex + 2, browY, B); P(g, ex + 3, browY, B);
    hspan(g, my, ex - 1, ex + 1, M);
  }
}

function drawEyes(g, cx, hcy, expr, SK) {
  const ex = Math.round(cx), eyeY = Math.round(hcy) + 1;
  const lx = ex - 2, rx = ex + 2, E = PAL.eye;
  if (expr === 'fatigue') {
    hspan(g, eyeY, lx - 1, lx + 1, SK.sk3); hspan(g, eyeY, rx - 1, rx + 1, SK.sk3);
    P(g, lx, eyeY, E); P(g, rx, eyeY, E);
  } else if (expr === 'satisfait') {
    P(g, lx, eyeY, E); P(g, rx, eyeY, E);
    P(g, lx, eyeY + 1, SK.sk2); P(g, rx, eyeY + 1, SK.sk2);
  } else if (expr === 'fier') {
    P(g, lx - 1, eyeY, SK.sk0); P(g, lx + 1, eyeY, SK.sk0); P(g, rx - 1, eyeY, SK.sk0); P(g, rx + 1, eyeY, SK.sk0);
    P(g, lx, eyeY, E); P(g, rx, eyeY, E);
  } else if (expr === 'coupable') {
    P(g, lx, eyeY, SK.sk0); P(g, rx, eyeY, SK.sk0);
    P(g, lx, eyeY + 1, E); P(g, rx, eyeY + 1, E);
  } else if (expr === 'wink') {
    P(g, lx, eyeY, E);
    hspan(g, eyeY, rx - 1, rx + 1, SK.sk3);
  } else {
    P(g, lx, eyeY, E); P(g, rx, eyeY, E);
  }
}

function drawTorsoDetail(g, cx, prof, state, t, topY) {
  const w = (y) => prof(y);
  for (let y = topY; y <= topY + 3; y++) {
    if (t > 0.35) { P(g, Math.round(cx - w(y) + 1.5), y, PAL.sh0); P(g, Math.round(cx + w(y) - 1.5), y, PAL.sh0); }
  }
  if (state >= 3) {
    P(g, Math.round(cx - w(topY + 2) + 1.5), topY + 3, PAL.sh2); P(g, Math.round(cx + w(topY + 2) - 1.5), topY + 3, PAL.sh2);
    hspan(g, 19, cx - 3.2, cx - 1, PAL.sh0); hspan(g, 19, cx + 1, cx + 3.2, PAL.sh0);
    hspan(g, 20, cx - 3.4, cx - 1.2, PAL.sh1); hspan(g, 20, cx + 1.2, cx + 3.4, PAL.sh1);
    P(g, cx, 18, PAL.sh2); P(g, cx, 19, PAL.sh2); P(g, cx, 20, PAL.sh2);
    hspan(g, 22, cx - 3.2, cx - 1, PAL.sh2); hspan(g, 22, cx + 1, cx + 3.2, PAL.sh2);
    P(g, cx, 24, PAL.sh2);
    for (let r = 0; r < 3; r++) {
      const ay = 25 + r * 3;
      hspan(g, ay, cx - 2.2, cx - 0.6, PAL.sh0); hspan(g, ay, cx + 0.6, cx + 2.2, PAL.sh0);
      hspan(g, ay + 1, cx - 2.4, cx + 2.4, PAL.sh2);
      P(g, cx, ay, PAL.sh2);
    }
    if (state >= 4) {
      P(g, Math.round(cx - w(27) + 1.5), 27, PAL.sh2); P(g, Math.round(cx + w(27) - 1.5), 27, PAL.sh2);
      P(g, Math.round(cx - w(34) + 1), 33, PAL.sh2); P(g, Math.round(cx + w(34) - 1), 33, PAL.sh2);
      P(g, Math.round(cx - w(35) + 1.5), 35, PAL.sh2); P(g, Math.round(cx + w(35) - 1.5), 35, PAL.sh2);
    }
  } else {
    hspan(g, 25, cx - 2.4, cx + 1.6, PAL.sh0);
    hspan(g, 28, cx - 2.6, cx + 1.2, PAL.sh0); hspan(g, 29, cx - 3, cx + 1.6, PAL.sh0);
    P(g, Math.round(cx - 0.5), 31, PAL.sh2);
    hspan(g, 34, cx - w(34) + 2, cx + w(34) - 2, PAL.sh2);
    if (state <= 1) {
      hspan(g, 36, cx - w(36) + 1.5, cx + w(36) - 1.5, PAL.sh2);
      P(g, Math.round(cx - w(33) + 1), 33, PAL.sh2); P(g, Math.round(cx + w(33) - 1), 33, PAL.sh2);
    }
  }
}

// ─────────────────────────────────────────────
//  Hair — styles : short_dark | fade | curly | shaved
// ─────────────────────────────────────────────
function drawHair(g, cx, hcy, hrx, hry, style) {
  if (style === 'shaved') {
    hspan(g, Math.round(hcy - hry + 0.6), cx - 2, cx + 2, PAL.ha0);
    hspan(g, Math.round(hcy - hry - 0.2), cx - 1.5, cx + 1.5, PAL.ha0);
    return;
  }
  if (style === 'fade') {
    for (let y = hcy - hry - 1.5; y <= hcy - 2.4; y++) {
      const ry = (y - hcy) / (hry + 0.9);
      const half = (hrx + 0.6) * Math.sqrt(Math.max(0, 1 - ry * ry)) * 0.68;
      shadeRow(g, y, cx - 0.2, half, PAL.ha0, PAL.ha0, PAL.ha1, false);
    }
    hspan(g, Math.round(hcy - hry + 0.5), cx - 3.2, cx - 1, PAL.ha0);
    hspan(g, Math.round(hcy - hry + 0.5), cx + 1, cx + 3, PAL.ha0);
    return;
  }
  if (style === 'curly') {
    for (let y = hcy - hry - 3; y <= hcy - 1.2; y++) {
      const ry = (y - hcy) / (hry + 2);
      const half = (hrx + 2.4) * Math.sqrt(Math.max(0, 1 - ry * ry));
      shadeRow(g, y, cx - 0.2, half, PAL.ha0, PAL.ha0, PAL.ha1, false);
    }
    P(g, Math.round(cx - 4.8), Math.round(hcy - hry - 0.8), PAL.ha1);
    P(g, Math.round(cx + 4.2), Math.round(hcy - hry - 1.0), PAL.ha1);
    P(g, Math.round(cx - 1.8), Math.round(hcy - hry - 3.2), PAL.ha1);
    P(g, Math.round(cx + 1.4), Math.round(hcy - hry - 3.6), PAL.ha1);
    P(g, Math.round(cx + 3.0), Math.round(hcy - hry - 2.6), PAL.ha1);
    for (let y = Math.round(hcy - 1); y <= Math.round(hcy + 3); y++) {
      P(g, Math.round(cx - hrx - 0.4), y, PAL.ha0); P(g, Math.round(cx + hrx + 0.4), y, PAL.ha0);
    }
    P(g, Math.round(cx - hrx - 0.7), Math.round(hcy + 3), PAL.ha0);
    P(g, Math.round(cx + hrx + 0.6), Math.round(hcy + 3.4), PAL.ha0);
    return;
  }
  // default: short_dark
  for (let y = hcy - hry - 1.5; y <= hcy - 1.6; y++) {
    const ry = (y - hcy) / (hry + 0.9);
    const half = (hrx + 0.9) * Math.sqrt(Math.max(0, 1 - ry * ry));
    shadeRow(g, y, cx - 0.2, half, PAL.ha0, PAL.ha0, PAL.ha1, false);
  }
  P(g, Math.round(cx - 3.6), Math.round(hcy - hry + 0.3), PAL.ha0);
  P(g, Math.round(cx + 3.4), Math.round(hcy - hry + 0.6), PAL.ha0);
  P(g, Math.round(cx + 2), Math.round(hcy - hry - 1.3), PAL.ha0);
  P(g, Math.round(cx - 2), Math.round(hcy - hry - 1.5), PAL.ha0);
  P(g, Math.round(cx - 2), Math.round(hcy - 2.2), PAL.ha0);
  P(g, Math.round(cx - 1), Math.round(hcy - 2.6), PAL.ha0);
  P(g, Math.round(cx + 1), Math.round(hcy - 2.4), PAL.ha0);
  P(g, Math.round(cx + 2.4), Math.round(hcy - 1.8), PAL.ha0);
  for (let y = Math.round(hcy - 1); y <= Math.round(hcy + 3); y++) {
    P(g, Math.round(cx - hrx - 0.4), y, PAL.ha0); P(g, Math.round(cx + hrx + 0.4), y, PAL.ha0);
  }
  P(g, Math.round(cx - hrx - 0.7), Math.round(hcy + 3), PAL.ha0);
  P(g, Math.round(cx + hrx + 0.6), Math.round(hcy + 3.4), PAL.ha0);
  P(g, Math.round(cx - 2), Math.round(hcy - hry - 0.6), PAL.ha1);
  P(g, Math.round(cx - 1), Math.round(hcy - hry - 0.9), PAL.ha1);
}

// ─────────────────────────────────────────────
//  Glasses — styles : none | round | sport | default
// ─────────────────────────────────────────────
function drawGlasses(g, cx, hcy, style) {
  if (style === 'none') return;
  const gy0 = Math.round(hcy) + 1, gl = PAL.gl;
  if (style === 'round') {
    const lx = Math.round(cx - 2.5), rx = Math.round(cx + 2.5);
    hspan(g, gy0 - 1, lx - 1, lx + 1, gl); hspan(g, gy0 - 1, rx - 1, rx + 1, gl);
    P(g, lx - 2, gy0, gl); P(g, lx + 2, gy0, gl); P(g, rx - 2, gy0, gl); P(g, rx + 2, gy0, gl);
    hspan(g, gy0 + 1, lx - 1, lx + 1, gl); hspan(g, gy0 + 1, rx - 1, rx + 1, gl);
    P(g, Math.round(cx), gy0, gl);
    P(g, lx - 3, gy0 - 1, gl); P(g, rx + 3, gy0 - 1, gl);
    return;
  }
  if (style === 'sport') {
    hspan(g, gy0 - 1, cx - 5, cx + 5, gl);
    hspan(g, gy0, cx - 5.2, cx - 0.8, gl); hspan(g, gy0, cx + 0.8, cx + 5.2, gl);
    hspan(g, gy0 + 1, cx - 4.6, cx + 4.6, gl);
    P(g, Math.round(cx), gy0 - 1, gl);
    P(g, Math.round(cx - 5.6), gy0 - 1, gl); P(g, Math.round(cx + 5.6), gy0 - 1, gl);
    return;
  }
  // default rectangular
  hspan(g, gy0 - 1, cx - 4, cx - 1, gl); hspan(g, gy0 - 1, cx + 1, cx + 4, gl);
  hspan(g, gy0 + 1, cx - 3.8, cx - 1.2, gl); hspan(g, gy0 + 1, cx + 1.2, cx + 3.8, gl);
  P(g, Math.round(cx - 4), gy0, gl); P(g, Math.round(cx + 4), gy0, gl);
  P(g, Math.round(cx - 1), gy0, gl); P(g, Math.round(cx + 1), gy0, gl);
  P(g, Math.round(cx), gy0 - 1, gl);
  P(g, Math.round(cx - 4.6), gy0 - 1, gl); P(g, Math.round(cx + 4.6), gy0 - 1, gl);
  P(g, Math.round(cx - 2), gy0 - 1, PAL.gsc);
}

// ─────────────────────────────────────────────
//  Build full character grid (avec customisation)
// ─────────────────────────────────────────────
export function buildGrid(state, fr, expr, garminGlow, pose, custom = {}) {
  const g = mkgrid();
  const cx = 15.5, t = (state - 1) / 3;
  const prof = makeProfile(state);
  const breath = [0, 0, 1, 1][fr];
  const shrug = [0, 1, 1, 0][fr];
  const slouch = Math.round((1 - t) * 1);

  // Résolution des palettes de personnalisation
  const SK = SKIN_TONES[custom?.skin] || SKIN_TONES.medium;
  const OF_base = OUTFIT_PALS[custom?.outfit] || OUTFIT_PALS.default;
  const OF = custom?.shoes === 'running'
    ? { ...OF_base, so: '#1e1c2c', soa: '#FF8040' }
    : OF_base;
  const hairStyle = custom?.hair || 'short_dark';
  const glassesStyle = custom?.glasses ?? 'none';

  // LEGS
  const legGap = 2.0, legHalf = lerp(2.8, 2.5, t);
  const lcx = cx - legGap, rcx = cx + legGap;
  if (pose === 'run') {
    const ph = [1, 0.25, -1, -0.25][fr];
    const hipY = 43, lHipX = cx - 1.7, rHipX = cx + 1.7;
    const lAnkX = lHipX + ph * 4.6, lAnkY = 59 - Math.max(0, ph) * 2, lKnX = lHipX + ph * 2.6, lKnY = 51;
    limb(g, lHipX, hipY, lKnX, lKnY, 2.3, OF.jo1, OF.jo2, OF.jo0);
    limb(g, lKnX, lKnY, lAnkX, lAnkY, 2.0, OF.jo1, OF.jo2, OF.jo0);
    const rAnkX = rHipX - ph * 4.6, rAnkY = 59 - Math.max(0, -ph) * 2, rKnX = rHipX - ph * 2.6, rKnY = 51;
    limb(g, rHipX, hipY, rKnX, rKnY, 2.3, OF.jo1, OF.jo2, OF.jo0);
    limb(g, rKnX, rKnY, rAnkX, rAnkY, 2.0, OF.jo1, OF.jo2, OF.jo0);
    disc(g, lAnkX + 0.6, lAnkY + 1, 2.1, OF.so, '#0c0810', OF.jo0); hspan(g, Math.round(lAnkY) + 2, lAnkX - 0.8, lAnkX + 2.2, OF.soa);
    disc(g, rAnkX + 0.6, rAnkY + 1, 2.1, OF.so, '#0c0810', OF.jo0); hspan(g, Math.round(rAnkY) + 2, rAnkX - 0.8, rAnkX + 2.2, OF.soa);
  } else if (pose === 'sit') {
    limb(g, cx - 1.7, 44, cx - 5, 50, 2.2, OF.jo1, OF.jo2, OF.jo0); limb(g, cx - 5, 50, cx - 4, 58, 1.9, OF.jo1, OF.jo2, OF.jo0);
    limb(g, cx + 1.7, 44, cx + 5, 50, 2.2, OF.jo1, OF.jo2, OF.jo0); limb(g, cx + 5, 50, cx + 4, 58, 1.9, OF.jo1, OF.jo2, OF.jo0);
    disc(g, cx - 4, 59, 2.1, OF.so, '#0c0810', OF.jo0); hspan(g, 60, cx - 6.4, cx - 1.8, OF.soa);
    disc(g, cx + 4, 59, 2.1, OF.so, '#0c0810', OF.jo0); hspan(g, 60, cx + 1.8, cx + 6.4, OF.soa);
  } else if (pose === 'slump') {
    limb(g, cx - 1.7, 46, cx - 7, 51, 2.2, OF.jo1, OF.jo2, OF.jo0); limb(g, cx - 7, 51, cx - 7, 59, 1.9, OF.jo1, OF.jo2, OF.jo0);
    limb(g, cx + 1.7, 46, cx + 7, 51, 2.2, OF.jo1, OF.jo2, OF.jo0); limb(g, cx + 7, 51, cx + 7, 59, 1.9, OF.jo1, OF.jo2, OF.jo0);
    disc(g, cx - 7, 60, 2.1, OF.so, '#0c0810', OF.jo0); hspan(g, 61, cx - 9.4, cx - 4.8, OF.soa);
    disc(g, cx + 7, 60, 2.1, OF.so, '#0c0810', OF.jo0); hspan(g, 61, cx + 4.8, cx + 9.4, OF.soa);
  } else if (pose === 'celebrate') {
    const cls = lcx - 0.5, crs = rcx + 0.5;
    for (let y = 43; y <= 61; y++) { shadeRow(g, y, cls, legHalf, OF.jo1, OF.jo2, OF.jo0, false); shadeRow(g, y, crs, legHalf, OF.jo1, OF.jo2, OF.jo0, false); }
    for (let y = 60; y <= 63; y++) { shadeRow(g, y, cls, legHalf + 0.5, OF.so, '#0c0810', OF.jo0, false); shadeRow(g, y, crs, legHalf + 0.5, OF.so, '#0c0810', OF.jo0, false); }
    hspan(g, 63, cls - 0.6, cls + legHalf + 0.7, OF.soa); hspan(g, 63, crs - 0.6, crs + legHalf + 0.7, OF.soa);
  } else {
    for (let y = 43; y <= 61; y++) { shadeRow(g, y, lcx, legHalf, OF.jo1, OF.jo2, OF.jo0, false); shadeRow(g, y, rcx, legHalf, OF.jo1, OF.jo2, OF.jo0, false); }
    if (state >= 4) { for (let y = 45; y <= 55; y++) { P(g, Math.round(lcx - 1), y, OF.jo0); P(g, Math.round(rcx - 1), y, OF.jo0); } }
    for (let y = 60; y <= 63; y++) { shadeRow(g, y, lcx, legHalf + 0.5, OF.so, '#0c0810', OF.jo0, false); shadeRow(g, y, rcx, legHalf + 0.5, OF.so, '#0c0810', OF.jo0, false); }
    hspan(g, 63, lcx - 0.6, lcx + legHalf + 0.7, OF.soa); hspan(g, 63, rcx - 0.6, rcx + legHalf + 0.7, OF.soa);
  }
  // pelvis
  for (let y = 39; y <= 44; y++) { const h = lerp(prof(39), legGap + legHalf + 0.6, (y - 39) / 6) + 0.5; shadeRow(g, y, cx, h, OF.jo1, OF.jo2, OF.jo0, y > 43); }

  // TORSO
  const topY = 16 - slouch;
  for (let y = topY; y <= 40; y++) {
    let half = prof(y);
    if (y >= 26 && y <= 36) half += breath * 0.5;
    if (y >= topY && y <= topY + 2) half -= shrug * 0.4;
    shadeRow(g, y, cx, half, PAL.sh1, PAL.sh2, PAL.sh0, false);
  }
  hspan(g, topY, cx - prof(topY) + 1.5, cx + prof(topY) - 1.5, PAL.sh0);
  drawTorsoDetail(g, cx, prof, state, t, topY);
  P(g, cx - 3.4, 22, PAL.acc); P(g, cx - 2.4, 22, PAL.acc2);
  // Dossard pour tenue compétition
  if (custom?.outfit === 'competition') {
    hspan(g, 20, cx - 3.5, cx + 3.5, '#f0e8d0'); hspan(g, 21, cx - 3.5, cx + 3.5, '#f0e8d0');
    hspan(g, 22, cx - 3.5, cx + 3.5, '#f0e8d0'); hspan(g, 23, cx - 3.5, cx + 3.5, '#f0e8d0');
    hspan(g, 24, cx - 3.5, cx + 3.5, '#f0e8d0');
    P(g, Math.round(cx - 1), 22, PAL.sh2); P(g, Math.round(cx), 22, PAL.sh2); P(g, Math.round(cx + 1), 22, PAL.sh2);
  }

  // ARMS
  const armHalf = lerp(2.9, 2.4, t);
  const edgeAt = (y) => { if (y <= 40) return prof(Math.min(40, Math.max(15, y))); return lerp(prof(40), legGap + legHalf + 0.6, (y - 40) / 5) + 0.5; };
  const sleeveY = Math.round(lerp(25, 23, t));

  const drapeArm = (side) => {
    const aTop = topY + 1, aBot = 40;
    const wrist = [cx + side * (edgeAt(37) + armHalf - 0.8), 37];
    for (let y = aTop; y <= aBot; y++) {
      let ah = armHalf * (1 - (y - aTop) / (aBot - aTop) * 0.16);
      if (state >= 3 && y >= sleeveY + 1 && y <= sleeveY + 4) ah += lerp(0.2, 0.7, t);
      const off = edgeAt(y) + ah - 0.8; const X = cx + side * off; const isSkin = y > sleeveY;
      const base = isSkin ? SK.sk1 : PAL.sh1, sh = isSkin ? SK.sk2 : PAL.sh2, hi = isSkin ? SK.sk0 : PAL.sh0;
      shadeRow(g, y, X, ah, base, sh, hi, false);
      P(g, Math.round(X - side * ah), y, isSkin ? SK.sk2 : PAL.sh2);
      if (state >= 3 && isSkin && y >= sleeveY + 1 && y <= sleeveY + 4) { P(g, Math.round(X - side * (armHalf - 1)), y, SK.sk0); if (y >= sleeveY + 2) P(g, Math.round(X + side), y, SK.sk3); }
    }
    shadeRow(g, aBot, cx + side * (edgeAt(aBot) + armHalf - 0.8), armHalf - 0.2, SK.sk1, SK.sk2, SK.sk0, false);
    const slOff = edgeAt(sleeveY) + armHalf - 0.8; hspan(g, sleeveY, cx + side * slOff - armHalf + 0.6, cx + side * slOff + armHalf - 0.6, PAL.acc);
    return wrist;
  };

  const bentArm = (shX, shY, elX, elY, haX, haY, r, dumb) => {
    limb(g, shX, shY, elX, elY, r + 0.2, PAL.sh1, PAL.sh2, PAL.sh0);
    P(g, Math.round(lerp(shX, elX, 0.66)), Math.round(lerp(shY, elY, 0.66)), PAL.acc);
    limb(g, elX, elY, haX, haY, r - 0.2, SK.sk1, SK.sk2, SK.sk0);
    if (state >= 3) { disc(g, lerp(elX, haX, 0.45), lerp(elY, haY, 0.45), r * 0.5, SK.sk0, SK.sk1, SK.sk0); }
    disc(g, haX, haY, r - 0.3, SK.sk1, SK.sk2, SK.sk0);
    if (dumb) { const dw = state >= 4 ? 1.7 : 1.3; disc(g, haX, haY - 2.1, dw, PAL.gs, '#070409', OF.jo0); disc(g, haX, haY + 2.1, dw, PAL.gs, '#070409', OF.jo0); P(g, Math.round(haX), Math.round(haY), OF.jo2); }
  };

  let leftWrist;
  if (pose === 'run') {
    const ph = [1, 0.25, -1, -0.25][fr];
    const lShX = cx - prof(topY + 1) - 0.2, rShX = cx + prof(topY + 1) + 0.2, shY = topY + 2, r = armHalf - 0.1;
    const ls = -ph, rs = ph;
    const lHa = [lerp(cx - 3.6, cx - 0.4, (ls + 1) / 2), lerp(30, 21, (ls + 1) / 2)];
    bentArm(lShX, shY, cx - 3.2 + ls * 0.6, 27, lHa[0], lHa[1], r, false); leftWrist = lHa;
    const rHa = [lerp(cx + 3.6, cx + 0.4, (rs + 1) / 2), lerp(30, 21, (rs + 1) / 2)];
    bentArm(rShX, shY, cx + 3.2 + rs * 0.6, 27, rHa[0], rHa[1], r, false);
  } else if (pose === 'lift') {
    leftWrist = drapeArm(-1);
    const rShX = cx + prof(topY + 1) + 0.2, shY = topY + 2, r = armHalf;
    const curl = [0, 0.5, 1, 0.5][fr];
    const elX = cx + edgeAt(31) + 0.1, elY = 31;
    const haX = lerp(elX + 0.4, cx + 2.6, curl), haY = lerp(35, 22, curl);
    bentArm(rShX, shY, elX, elY, haX, haY, r, true);
  } else if (pose === 'sit') {
    const lShX = cx - prof(topY + 1) - 0.2, rShX = cx + prof(topY + 1) + 0.2, shY = topY + 2, r = armHalf - 0.2;
    bentArm(lShX, shY, cx - 3, 38, cx - 4.5, 49, r, false); leftWrist = [cx - 4.5, 49];
    bentArm(rShX, shY, cx + 3, 38, cx + 4.5, 49, r, false);
  } else if (pose === 'slump') {
    const lShX = cx - prof(topY + 1) - 0.2, rShX = cx + prof(topY + 1) + 0.2, shY = topY + 2, r = armHalf - 0.2;
    leftWrist = drapeArm(-1);
    bentArm(rShX, shY, cx + 4, 33, cx + 3.5, 45, r, false);
    const px = Math.round(cx + 3.5), py = 44;
    hspan(g, py - 1, px - 1, px + 1, '#d8d0c0'); hspan(g, py, px - 1, px + 1, PAL.gsc); hspan(g, py + 1, px - 1, px + 1, '#d8d0c0');
  } else if (pose === 'celebrate') {
    const lShX = cx - prof(topY + 1) - 0.2, rShX = cx + prof(topY + 1) + 0.2, shY = topY + 2, r = armHalf;
    bentArm(lShX, shY, cx - 5.5, shY - 3, cx - 5.8, shY - 8, r, false);
    bentArm(rShX, shY, cx + 5.5, shY - 3, cx + 5.8, shY - 8, r, false);
    leftWrist = [Math.round(cx - 5.8), Math.round(shY - 8)];
  } else {
    leftWrist = drapeArm(-1); drapeArm(1);
  }

  // NECK
  const neckHalf = lerp(2.2, 2.7, t);
  for (let y = 13; y <= 15 - slouch; y++) shadeRow(g, y, cx, neckHalf, SK.sk1, SK.sk2, SK.sk0, y > 13);
  if (state >= 3) { P(g, Math.round(cx - neckHalf - 1), 15 - slouch, SK.sk2); P(g, Math.round(cx + neckHalf + 1), 15 - slouch, SK.sk2); }

  // HEAD
  const hcy = 8 - slouch, hrx = 4.7, hry = 5.7;
  const jaw = (y) => y > 1 ? lerp(1.0, 0.84, t) * (1 - (y - 1) / hry * 0.16) : 1;
  for (let y = -Math.ceil(hry); y <= Math.ceil(hry); y++) {
    const ry = y / hry; if (Math.abs(ry) > 1) continue;
    const half = hrx * Math.sqrt(1 - ry * ry) * jaw(y);
    shadeRow(g, hcy + y, cx, half, SK.sk1, SK.sk2, SK.sk0, false);
  }
  P(g, cx - hrx, hcy + 1, SK.sk2); P(g, cx + hrx, hcy + 1, SK.sk2);
  for (let y = Math.round(hcy + 2); y <= Math.round(hcy + hry); y++) {
    const ry = (y - hcy) / hry; const half = hrx * Math.sqrt(Math.max(0, 1 - ry * ry)) * jaw(y);
    P(g, Math.round(cx - half + 0.4), y, SK.sk3); P(g, Math.round(cx + half - 0.4), y, SK.sk3);
  }
  hspan(g, Math.round(hcy + hry - 0.3), cx - 2.4, cx + 2.4, SK.sk3);
  P(g, Math.round(cx - 1.6), Math.round(hcy + 2.7), SK.sk3); P(g, Math.round(cx + 1.6), Math.round(hcy + 2.7), SK.sk3);
  if (state <= 1) { hspan(g, Math.round(hcy + hry + 0.4), cx - 2, cx + 2, SK.sk2); }
  if (state >= 3) { P(g, Math.round(cx - 3.2), Math.round(hcy + 2.6), SK.sk2); P(g, Math.round(cx + 3.2), Math.round(hcy + 2.6), SK.sk2); }

  // HAIR
  drawHair(g, cx, hcy, hrx, hry, hairStyle);

  // OUTLINE
  const isFill = (x, y) => x >= 0 && x < 32 && y >= 0 && y < 64 && g[y][x];
  const out = [];
  for (let y = 0; y < 64; y++) for (let x = 0; x < 32; x++) {
    if (g[y][x]) continue;
    if (isFill(x - 1, y) || isFill(x + 1, y) || isFill(x, y - 1) || isFill(x, y + 1)) out.push([x, y]);
  }
  out.forEach(([x, y]) => g[y][x] = PAL.ol);

  // FACE
  drawFaceFeatures(g, cx, hcy, expr, SK);

  // GLASSES
  drawGlasses(g, cx, hcy, glassesStyle);

  // EYES
  drawEyes(g, cx, hcy, expr, SK);

  // GARMIN
  const gw = Math.round(leftWrist[0]), gyy = Math.round(leftWrist[1]);
  for (let yy = gyy - 1; yy <= gyy + 1; yy++) hspan(g, yy, gw - 1.3, gw + 0.8, PAL.gs);
  P(g, gw, gyy, garminGlow ? PAL.gsc : '#3a2a10');

  return g;
}

// ─────────────────────────────────────────────
//  Scene rendering (640×360 hero canvas) — inchangé
// ─────────────────────────────────────────────
function R(ctx, x, y, w, h, S) { ctx.fillRect(Math.round(x * S), Math.round(y * S), Math.round(w * S), Math.round(h * S)); }

function drawScene(ctx, scene, S, t) {
  const W = 320 * S, H = 180 * S;
  if (scene === 'gym') {
    let g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#160c0c'); g.addColorStop(.55, '#0d0708'); g.addColorStop(1, '#070405');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    let rg = ctx.createRadialGradient(W * .5, 0, 0, W * .5, 0, H * 1.05);
    rg.addColorStop(0, 'rgba(255,120,40,.18)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#0c090d'; R(ctx, 34, 24, 252, 96, S);
    ctx.fillStyle = 'rgba(255,160,80,.05)'; R(ctx, 44, 30, 10, 84, S); R(ctx, 72, 30, 5, 84, S);
    ctx.fillStyle = '#1f0f12'; R(ctx, 34, 24, 252, 2, S); R(ctx, 34, 118, 252, 2, S);
    rack(ctx, 16, 52, S); rack(ctx, 288, 52, S);
    ctx.fillStyle = '#0a0608'; R(ctx, 0, 150, 320, 30, S);
    ctx.fillStyle = '#0f0a0c'; R(ctx, 0, 150, 320, 2, S);
    ctx.fillStyle = 'rgba(255,90,30,.07)'; R(ctx, 128, 156, 64, 22, S);
  } else if (scene === 'route') {
    let g = ctx.createLinearGradient(0, 0, 0, H * .62);
    g.addColorStop(0, '#0a0812'); g.addColorStop(.5, '#2a1208'); g.addColorStop(.85, '#7a2a06'); g.addColorStop(1, '#FF4D00');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * .62);
    let rg = ctx.createRadialGradient(W * .5, H * .56, 0, W * .5, H * .56, W * .5);
    rg.addColorStop(0, 'rgba(255,140,40,.5)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H * .7);
    ctx.fillStyle = 'rgba(255,220,180,.5)';
    [[40, 18], [90, 30], [150, 14], [210, 26], [265, 16], [300, 34]].forEach(p => R(ctx, p[0], p[1], 1, 1, S));
    ctx.fillStyle = '#0a0608';
    [[0, 86, 30, 12], [28, 78, 18, 20], [44, 90, 22, 8], [64, 72, 14, 26], [76, 84, 26, 14], [100, 80, 16, 18], [150, 70, 10, 28], [158, 82, 30, 16], [300, 76, 20, 22], [280, 88, 22, 10], [260, 84, 18, 14]].forEach(b => R(ctx, b[0], b[1], b[2], b[3] + 90 - b[1], S));
    ctx.fillStyle = '#FFAA33';
    [[68, 76], [154, 74], [284, 90]].forEach(p => R(ctx, p[0], p[1], 1, 1, S));
    ctx.fillStyle = '#070608'; R(ctx, 0, 112, 320, 68, S);
    ctx.fillStyle = '#0c0a0c'; R(ctx, 0, 112, 320, 2, S);
    ctx.fillStyle = 'rgba(255,160,60,.4)';
    for (let i = 0; i < 5; i++) { const yy = 120 + i * 12; const w = 2 + i * 1.4; R(ctx, 160 - w / 2, yy, w, 4 + i, S); }
  } else if (scene === 'repos') {
    ctx.fillStyle = '#0c0607'; ctx.fillRect(0, 0, W, H);
    const lg = ctx.createRadialGradient(W * .82, 0, 0, W * .82, 0, H * .75); lg.addColorStop(0, 'rgba(255,100,20,.22)'); lg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#0e0809'; R(ctx, 0, 62, 90, 90, S); ctx.fillStyle = '#1a0d0a'; R(ctx, 0, 62, 88, 5, S);
    ctx.fillStyle = '#1e1010'; R(ctx, 4, 70, 60, 22, S); ctx.fillStyle = '#261512'; R(ctx, 4, 70, 60, 3, S);
    ctx.fillStyle = '#1a0e0a'; R(ctx, 270, 80, 12, 60, S); R(ctx, 262, 76, 28, 5, S);
    ctx.fillStyle = 'rgba(255,120,40,.5)'; R(ctx, 264, 77, 24, 3, S);
    ctx.fillStyle = '#0a0508'; R(ctx, 0, 148, 320, 32, S); ctx.fillStyle = '#130807'; R(ctx, 0, 148, 320, 2, S);
    ctx.fillStyle = '#1e1010'; R(ctx, 200, 148, 52, 10, S); ctx.fillStyle = '#2e1818'; R(ctx, 200, 148, 52, 2, S);
    for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? '#241414' : '#1a1010'; R(ctx, 200 + i * 11, 148, 10, 10, S); }
    ctx.fillStyle = 'rgba(255,80,20,.04)'; R(ctx, 100, 158, 120, 22, S);
  } else if (scene === 'jalon') {
    let sg = ctx.createLinearGradient(0, 0, 0, H * .55); sg.addColorStop(0, '#f05030'); sg.addColorStop(1, '#FF4D00'); ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H * .55);
    ctx.fillStyle = '#3a1808'; ctx.fillRect(0, H * .55, W, H * .45);
    for (let i = 0; i < 16; i++) { ctx.fillStyle = i % 2 ? '#FF4D00' : '#FFD166'; R(ctx, i * 20, 22, 20, 18, S); }
    ctx.fillStyle = 'rgba(0,0,0,.55)'; R(ctx, 55, 25, 210, 12, S);
    ctx.fillStyle = 'rgba(8,5,6,.75)';
    [[12, 90, 8], [28, 84, 7], [50, 92, 6], [72, 86, 8], [96, 80, 7], [118, 90, 6], [142, 85, 8], [164, 90, 7], [188, 82, 6], [210, 88, 8], [232, 84, 7], [255, 81, 6], [275, 90, 8], [298, 85, 7]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x * S, y * S, r * S, 0, 6.28); ctx.fill(); });
    [[18, 52], [48, 36], [83, 64], [126, 44], [163, 31], [202, 58], [246, 38], [284, 50], [32, 74], [72, 78], [306, 66], [8, 38], [258, 54], [140, 68]].forEach(([cx2, cy2], i) => { const dx = (t / 4 + i * 23) % 28 - 8, dy = (t / 3 + i * 17) % 28; ctx.fillStyle = ['#FF4D00', '#FFAA33', '#FFD166'][i % 3]; R(ctx, cx2 + dx, cy2 + dy, 2, 2, S); });
    for (let i = 0; i < 32; i++) { ctx.fillStyle = i % 2 ? '#f0e0c0' : '#0a0608'; R(ctx, i * 10, 148, 10, 4, S); }
    ctx.fillStyle = '#1a0c08'; R(ctx, 0, 152, 320, 28, S);
  } else if (scene === 'sleep') {
    ctx.fillStyle = '#030208'; ctx.fillRect(0, 0, W, H);
    const ng = ctx.createLinearGradient(0, 0, 0, H * .65); ng.addColorStop(0, '#040215'); ng.addColorStop(1, '#070410'); ctx.fillStyle = ng; ctx.fillRect(0, 0, W, H * .65);
    const pa = ctx.createRadialGradient(W * .5, H * .7, 0, W * .5, H * .7, W * .35); pa.addColorStop(0, 'rgba(80,60,120,.12)'); pa.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = pa; ctx.fillRect(0, 0, W, H);
    [[88, 8], [130, 14], [165, 5], [210, 9], [250, 6], [290, 12], [305, 22], [40, 28], [75, 22]].forEach(([x, y]) => { ctx.fillStyle = 'rgba(255,255,245,.8)'; R(ctx, x, y, 1, 1, S); });
    const mx = 52, mcy = 20; ctx.fillStyle = '#e8e0c0';
    [[1,0],[2,0],[3,0],[0,1],[4,1],[0,2],[4,2],[0,3],[4,3],[1,4],[2,4],[3,4]].forEach(([dx, dy]) => R(ctx, mx + dx * 3, mcy + dy * 3, 3, 3, S));
    ctx.fillStyle = '#c0c8d8'; R(ctx, mx + 6, mcy + 3, 3, 3, S);
    const zzPhase = (t * .0008) % 1;
    ['Z', 'Z', 'z'].forEach((letter, i) => {
      const zy = 28 + i * 10 - zzPhase * 30;
      if (zy < -5 || zy > 70) return;
      const alpha = Math.max(0, 0.9 - i * 0.2) * (1 - zzPhase * .5);
      ctx.font = `bold ${(14 - i * 2) * S}px monospace`; ctx.fillStyle = `rgba(180,170,220,${alpha})`; ctx.fillText(letter, (178 + i * 8) * S, zy * S);
    });
    ctx.fillStyle = '#060412'; R(ctx, 0, 148, 320, 32, S); ctx.fillStyle = '#100c20'; R(ctx, 0, 148, 320, 2, S);
  } else if (scene === 'morning') {
    const mg = ctx.createLinearGradient(0, 0, 0, H); mg.addColorStop(0, '#080510'); mg.addColorStop(.5, '#1a0b0a'); mg.addColorStop(.8, '#3a1508'); mg.addColorStop(1, '#5a2208'); ctx.fillStyle = mg; ctx.fillRect(0, 0, W, H);
    const sg = ctx.createRadialGradient(W * .5, H * .62, 0, W * .5, H * .62, W * .4); sg.addColorStop(0, 'rgba(255,150,50,.35)'); sg.addColorStop(.4, 'rgba(255,80,20,.15)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#FFAA33'; ctx.beginPath(); ctx.arc(W * .5, H * .62, 22 * S, Math.PI, 0, false); ctx.fill();
    ctx.fillStyle = '#FFD060'; ctx.beginPath(); ctx.arc(W * .5, H * .62, 14 * S, Math.PI, 0, false); ctx.fill();
    ctx.fillStyle = '#3a1808'; R(ctx, 0, 112, 320, 3, S);
    ctx.fillStyle = '#1a0c08'; R(ctx, 0, 115, 320, 65, S); ctx.fillStyle = '#251008'; R(ctx, 0, 115, 320, 3, S);
  } else {
    ctx.fillStyle = '#060407'; ctx.fillRect(0, 0, W, H);
    const ag = ctx.createRadialGradient(0, 0, 0, 0, 0, H * .65); ag.addColorStop(0, 'rgba(40,30,60,.14)'); ag.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = ag; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#180e10'; R(ctx, 16, 118, 288, 44, S); ctx.fillStyle = '#241416'; R(ctx, 16, 118, 288, 4, S);
    ctx.fillStyle = '#0e0a0b'; R(ctx, 16, 118, 4, 44, S); R(ctx, 296, 118, 4, 44, S);
    ctx.fillStyle = '#1c1214'; R(ctx, 20, 124, 130, 32, S); R(ctx, 166, 124, 130, 32, S);
    ctx.fillStyle = '#090508'; R(ctx, 0, 162, 320, 18, S);
    const pg = ctx.createRadialGradient(W * .5, H * .62, 0, W * .5, H * .62, 42 * S); pg.addColorStop(0, 'rgba(255,170,51,.15)'); pg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = pg; ctx.fillRect(0, 0, W, H);
  }
}

function rack(ctx, x, y, S) {
  ctx.fillStyle = '#100a0c'; R(ctx, x, y, 5, 66, S);
  ctx.fillStyle = '#0b0709';
  [10, 26, 42, 56].forEach(o => { R(ctx, x - 3, y + o, 11, 6, S); });
  ctx.fillStyle = 'rgba(255,77,0,.18)'; R(ctx, x + 1, y, 3, 66, S);
}

// ─────────────────────────────────────────────
//  React component
// ─────────────────────────────────────────────
const SCENE_TO_POSE = { gym: 'lift', route: 'run', repos: 'sit', jalon: 'celebrate', absent: 'slump', sleep: 'sit', morning: 'idle', tired: 'idle' };

export default function JamraAvatar({ bodyState = 1, expression = 'neutral', scene = 'gym', weight, bf, customization = {} }) {
  const heroRef = useRef(null);
  const offRef = useRef(null);
  const rafRef = useRef(null);
  const t0Ref = useRef(null);
  const tapRef = useRef({ active: false, type: null, startT: 0, cooldown: false });

  useEffect(() => {
    const off = document.createElement('canvas');
    off.width = 32; off.height = 64;
    offRef.current = off;
    t0Ref.current = performance.now();

    const loop = (t) => {
      const fr = Math.floor((t - t0Ref.current) / 240) % 4;
      const garminGlow = scene === 'route' && (Math.floor(t / 420) % 2 === 0);
      let pose = SCENE_TO_POSE[scene] || 'idle';
      let hopDY = pose === 'celebrate' ? [-2, -3, -3, -2][fr] : 0;
      let effectiveExpr = expression;

      const tap = tapRef.current;
      if (tap.active) {
        const tapElapsed = t - tap.startT;
        if (tapElapsed > 600) {
          tap.active = false; tap.cooldown = true;
          setTimeout(() => { tap.cooldown = false; }, 900);
        } else {
          const tapFr = Math.min(3, Math.floor(tapElapsed / 150));
          if (tap.type === 'wink') effectiveExpr = 'wink';
          else if (tap.type === 'jump') hopDY += [0, -5, -10, -5][tapFr];
          else if (tap.type === 'wave') pose = 'celebrate';
        }
      }

      const g = buildGrid(bodyState, fr, effectiveExpr, garminGlow, pose, customization);
      const offCtx = off.getContext('2d');
      offCtx.clearRect(0, 0, 32, 64);
      for (let y = 0; y < 64; y++) for (let x = 0; x < 32; x++) {
        if (g[y][x]) { offCtx.fillStyle = g[y][x]; offCtx.fillRect(x, y, 1, 1); }
      }

      const hc = heroRef.current;
      if (!hc) { rafRef.current = requestAnimationFrame(loop); return; }
      const ctx = hc.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      const W = hc.width, H = hc.height, S = W / 320;
      drawScene(ctx, scene, S, t);

      const auraI = lerp(.12, .5, (bodyState - 1) / 3) * (0.85 + 0.15 * Math.sin(t / 500));
      let ag = ctx.createRadialGradient(160 * S, 108 * S, 0, 160 * S, 108 * S, 70 * S);
      ag.addColorStop(0, `rgba(255,77,0,${auraI})`); ag.addColorStop(1, 'rgba(255,77,0,0)');
      ctx.fillStyle = ag; ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = 'rgba(0,0,0,.45)';
      ctx.beginPath(); ctx.ellipse(160 * S, 151 * S, 26 * S, 5 * S, 0, 0, 7); ctx.fill();

      const ch = 104, cw = ch * 32 / 64, dx = (320 - cw) / 2, dy = 152 - ch;
      ctx.drawImage(off, 0, 0, 32, 64, Math.round(dx * S), Math.round((dy + hopDY) * S), Math.round(cw * S), Math.round(ch * S));

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [bodyState, expression, scene, customization]);

  const stateLabels = ['Départ', 'Phase 1', 'Phase 2', 'Objectif'];
  const bfValues = ['~30', '~18', '~14', '~12'];

  const handleTap = () => {
    const tap = tapRef.current;
    if (tap.active || tap.cooldown) return;
    const types = ['wave', 'wink', 'jump'];
    tap.type = types[Math.floor(Math.random() * 3)];
    tap.startT = performance.now();
    tap.active = true;
  };

  const idleStyle = { animation: 'jmrBreath 4s ease-in-out infinite' };
  const canvasStyle = {
    display: 'block', width: '100%', height: 'auto',
    imageRendering: 'pixelated',
    animation: 'jmrBounce 2.4s ease-in-out infinite',
  };

  return (
    <div className="relative rounded-[18px] overflow-hidden border border-subtle cursor-pointer" style={{ background: '#070405', ...idleStyle }} onClick={handleTap}>
      <canvas ref={heroRef} width={640} height={360} style={canvasStyle} />
      <div className="absolute top-2.5 left-3 flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: 'rgba(7,4,5,.55)', backdropFilter: 'blur(2px)' }}>
        <div className="w-1.5 h-1.5 rounded-full bg-heat-orange" style={{ boxShadow: '0 0 8px #FF4D00', animation: 'jmrPulse 1.6s infinite' }} />
        <span className="font-mono text-[8px] text-[#ffe0c2] tracking-[0.5px]">
          {({ gym: 'SALLE', route: 'ROUTE', repos: 'RÉCUP', jalon: 'OBJECTIF ✓', absent: 'INACTIF', sleep: 'SOMMEIL', morning: 'MATIN', tired: 'FATIGUÉ' })[scene] || scene.toUpperCase()}
        </span>
      </div>
      <div className="absolute left-0 right-0 bottom-0 flex items-end justify-between px-3.5 pb-2.5 pt-5"
        style={{ background: 'linear-gradient(to top, rgba(7,4,5,.85), rgba(7,4,5,0))' }}>
        <div>
          <div className="font-mono text-[9px] text-heat-amber mb-1" style={{ fontFamily: "'Press Start 2P', monospace" }}>MOI</div>
          <div className="font-body text-[11px] text-[#b89a8c]">
            État <span className="text-heat-orange font-bold">{bodyState}</span> · {stateLabels[bodyState - 1]}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[19px] font-bold text-[#fbeee6] leading-none">
            {weight ?? '--'}<span className="text-[11px] text-[#8f7468] ml-0.5">kg</span>
          </div>
          <div className="font-mono text-[11px] text-heat-amber mt-0.5">
            {bf ?? bfValues[bodyState - 1]}% MG
          </div>
        </div>
      </div>
    </div>
  );
}
