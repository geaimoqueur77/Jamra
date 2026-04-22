/**
 * Helpers d'affichage cohérents avec l'identité Jamra
 */

export function formatNumber(n, { decimals = 0 } = {}) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return n.toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatKcal(n) {
  return formatNumber(n);
}

export function formatGrams(g, decimals = 0) {
  return formatNumber(g, { decimals });
}

export function formatDateLong(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

export function formatDateShort(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

export function formatDayEyebrow(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('fr-FR', { weekday: 'long' });
}

export function formatDateHeader(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  }).toUpperCase();
}

/**
 * Abréviation jour (3 lettres) : LUN, MAR, MER, JEU, VEN, SAM, DIM
 */
export function formatDayAbbrev(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('fr-FR', { weekday: 'short' })
    .replace('.', '')
    .slice(0, 3)
    .toUpperCase();
}

/**
 * Jour + mois court, ex: "18 avr"
 */
export function formatDayMonth(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    .replace('.', '');
}

// ==========================================================================
// Helpers dates ISO (YYYY-MM-DD) safe timezone
// ==========================================================================

export function dateFromISO(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isoFromDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysISO(iso, days) {
  const d = dateFromISO(iso);
  d.setDate(d.getDate() + days);
  return isoFromDate(d);
}

/**
 * Retourne un tableau de 7 ISO dates : [date-6, date-5, ..., date]
 */
export function last7DaysISO(endIso) {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    out.push(addDaysISO(endIso, -i));
  }
  return out;
}
