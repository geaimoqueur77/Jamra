import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getStatsOverRange, todayISO } from '../../db/database';
import { addDaysISO, formatNumber } from '../../utils/format';

const PERIODS = [
  { key: 7,  label: '7 J' },
  { key: 14, label: '14 J' },
  { key: 30, label: '30 J' },
];

/**
 * Panneau de tendances intégré au Journal.
 * Sélecteur de période + stats + mini visualisation.
 */
export default function TrendsPanel({ target }) {
  const [period, setPeriod] = useState(7);
  const today = todayISO();
  const startIso = useMemo(() => addDaysISO(today, -(period - 1)), [today, period]);

  const stats = useLiveQuery(
    () => target ? getStatsOverRange(startIso, today, target) : null,
    [startIso, today, target]
  );

  if (!stats) {
    return (
      <div className="p-4 bg-bg-surface1 border border-subtle rounded-2xl text-center text-text-tertiary text-sm">
        Chargement...
      </div>
    );
  }

  const { daysLogged, daysTotal, avgKcal, stdKcal, streak, inTarget, over, under, avgP, avgG, avgL, avgF } = stats;
  const loggingRate = daysTotal > 0 ? Math.round((daysLogged / daysTotal) * 100) : 0;
  const inTargetRate = daysLogged > 0 ? Math.round((inTarget / daysLogged) * 100) : 0;
  const deviation = target > 0 && avgKcal > 0 ? Math.round(((avgKcal - target) / target) * 100) : 0;

  return (
    <div className="p-4 bg-bg-surface1 border border-subtle rounded-2xl">
      {/* Toggle période */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-bg-surface2 rounded-lg mb-4">
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`
              py-1.5 rounded text-xs font-display font-bold uppercase tracking-[0.1em] transition-all
              ${period === p.key
                ? 'bg-gradient-to-br from-heat-amber to-heat-orange text-white'
                : 'text-text-tertiary hover:text-text-primary'
              }
            `}
          >
            {p.label}
          </button>
        ))}
      </div>

      {daysLogged === 0 ? (
        <div className="py-6 text-center text-text-tertiary text-sm">
          Pas encore de données sur {period} jours.
        </div>
      ) : (
        <>
          {/* Stats principales */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-xl border border-subtle">
              <div className="flex items-baseline gap-1">
                <span className="font-display font-bold text-2xl text-heat-gradient">
                  {formatNumber(avgKcal)}
                </span>
                <span className="font-mono text-[10px] text-text-tertiary tracking-wider">KCAL</span>
              </div>
              <div className="font-mono text-[9px] tracking-[0.15em] uppercase text-text-tertiary mt-1">
                Moy./jour
              </div>
              {stdKcal > 0 && (
                <div className="font-mono text-[9px] text-text-tertiary mt-0.5">
                  ± {formatNumber(stdKcal)} kcal
                </div>
              )}
            </div>
            <div className="p-3 rounded-xl border border-subtle">
              <div className="flex items-baseline gap-1">
                <span className={`font-display font-bold text-2xl ${Math.abs(deviation) <= 5 ? 'text-success' : 'text-heat-amber'}`}>
                  {deviation > 0 ? '+' : ''}{deviation}%
                </span>
              </div>
              <div className="font-mono text-[9px] tracking-[0.15em] uppercase text-text-tertiary mt-1">
                Écart cible
              </div>
              <div className="font-mono text-[9px] text-text-tertiary mt-0.5">
                / {formatNumber(target)} kcal
              </div>
            </div>
          </div>

          {/* Barres de répartition */}
          <div className="mb-4">
            <div className="flex justify-between items-baseline mb-2">
              <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-text-tertiary">
                Répartition des {daysLogged} jours saisis
              </span>
            </div>
            <div className="flex h-3 rounded-full overflow-hidden bg-bg-surface2">
              {under > 0 && (
                <div
                  className="bg-[rgba(51,170,255,0.8)]"
                  style={{ width: `${(under / daysLogged) * 100}%` }}
                  title={`${under} jour${under > 1 ? 's' : ''} sous la cible`}
                />
              )}
              {inTarget > 0 && (
                <div
                  className="bg-success"
                  style={{ width: `${(inTarget / daysLogged) * 100}%` }}
                  title={`${inTarget} jour${inTarget > 1 ? 's' : ''} dans la cible`}
                />
              )}
              {over > 0 && (
                <div
                  className="bg-danger"
                  style={{ width: `${(over / daysLogged) * 100}%` }}
                  title={`${over} jour${over > 1 ? 's' : ''} au-dessus`}
                />
              )}
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="font-mono text-[9px] text-[#33AAFF]">↓ {under} sous</span>
              <span className="font-mono text-[9px] text-success">✓ {inTarget} OK</span>
              <span className="font-mono text-[9px] text-danger">↑ {over} +</span>
            </div>
          </div>

          {/* Stats secondaires en grille */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 rounded-lg bg-bg-surface2">
              <div className="font-display font-bold text-base text-heat-amber">{streak}</div>
              <div className="font-mono text-[9px] tracking-wider uppercase text-text-tertiary">Série</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-bg-surface2">
              <div className="font-display font-bold text-base text-text-primary">{daysLogged}<span className="text-text-tertiary font-mono text-xs">/{daysTotal}</span></div>
              <div className="font-mono text-[9px] tracking-wider uppercase text-text-tertiary">Saisis</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-bg-surface2">
              <div className="font-display font-bold text-base text-text-primary">{inTargetRate}%</div>
              <div className="font-mono text-[9px] tracking-wider uppercase text-text-tertiary">Tenue</div>
            </div>
          </div>

          {/* Macros moyennes */}
          <div className="pt-3 border-t border-subtle">
            <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-text-tertiary mb-2">
              Macros moyennes / jour
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center">
                <div className="font-display font-bold text-sm">{avgP}g</div>
                <div className="font-mono text-[9px] text-text-tertiary uppercase">Prot.</div>
              </div>
              <div className="text-center">
                <div className="font-display font-bold text-sm">{avgG}g</div>
                <div className="font-mono text-[9px] text-text-tertiary uppercase">Gluc.</div>
              </div>
              <div className="text-center">
                <div className="font-display font-bold text-sm">{avgL}g</div>
                <div className="font-mono text-[9px] text-text-tertiary uppercase">Lip.</div>
              </div>
              <div className="text-center">
                <div className="font-display font-bold text-sm text-success">{avgF}g</div>
                <div className="font-mono text-[9px] text-text-tertiary uppercase">Fib.</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
