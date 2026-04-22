import { projectWeightTrend } from '../../utils/calculations';
import { formatNumber, formatDateLong } from '../../utils/format';

/**
 * Carte de projection de poids basée sur la régression linéaire des pesées.
 * Affichée dans la page Mon poids, sous la courbe.
 */
export default function WeightProjection({ weights, targetKg, theoreticalWeekLoss }) {
  if (!weights || weights.length < 3) {
    return (
      <div className="p-4 bg-bg-surface1 border border-dashed border-subtle rounded-2xl">
        <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-text-tertiary mb-2">
          Projection
        </div>
        <div className="text-text-secondary text-sm">
          Il faut au moins <span className="text-heat-amber font-bold">3 pesées</span> pour calculer une projection fiable.
        </div>
        <div className="font-mono text-[10px] text-text-tertiary mt-1">
          Actuellement : {weights.length} pesée{weights.length > 1 ? 's' : ''}.
        </div>
      </div>
    );
  }

  const trend = projectWeightTrend(weights, targetKg);

  if (!trend || trend.slope === 0) {
    return (
      <div className="p-4 bg-bg-surface1 border border-subtle rounded-2xl">
        <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-text-tertiary mb-2">
          Projection
        </div>
        <div className="text-text-secondary text-sm">
          Ton poids est stable. Impossible de projeter sans tendance.
        </div>
      </div>
    );
  }

  const losingWeight = trend.slope < 0;
  const weeklyRate = Math.abs(trend.slopePerWeek);
  const rateIsGood = losingWeight && weeklyRate >= 0.3 && weeklyRate <= 1.2;
  const onTrack = losingWeight && targetKg != null && trend.daysToTarget != null && trend.daysToTarget > 0;

  // Comparaison avec le rythme théorique (scénario choisi à l'onboarding)
  const theoreticalKgPerWeek = theoreticalWeekLoss || 1.0;
  const actualVsTheoretical = weeklyRate / theoreticalKgPerWeek;

  return (
    <div className="p-4 bg-bg-surface1 border border-subtle rounded-2xl">
      <div className="flex items-center justify-between mb-3">
        <div className="font-display font-bold text-[11px] uppercase tracking-[0.12em] text-text-tertiary">
          Projection
        </div>
        <div className="font-mono text-[9px] text-text-tertiary tracking-wider uppercase">
          R² = {trend.r2.toFixed(2)}
        </div>
      </div>

      {/* Pente hebdo */}
      <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-bg-surface2">
        <div className="text-3xl">
          {losingWeight ? '📉' : '📈'}
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-1">
            <span className={`font-display font-extrabold text-2xl ${losingWeight ? 'text-success' : 'text-danger'}`}>
              {losingWeight ? '−' : '+'}{weeklyRate.toFixed(2)}
            </span>
            <span className="font-mono text-xs text-text-tertiary">kg / semaine</span>
          </div>
          <div className="font-mono text-[10px] tracking-wider uppercase text-text-tertiary mt-0.5">
            Tendance actuelle
          </div>
        </div>
      </div>

      {/* Comparaison scenario */}
      {losingWeight && theoreticalKgPerWeek && (
        <div className="mb-4">
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-text-tertiary mb-2">
            Ton scénario visait −{theoreticalKgPerWeek} kg/semaine
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-bg-surface2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  actualVsTheoretical >= 0.9 && actualVsTheoretical <= 1.2
                    ? 'bg-success'
                    : actualVsTheoretical < 0.5
                      ? 'bg-danger'
                      : 'bg-heat-amber'
                }`}
                style={{ width: `${Math.min(100, actualVsTheoretical * 100)}%` }}
              />
            </div>
            <span className="font-mono text-xs text-text-primary tabular-nums">
              {Math.round(actualVsTheoretical * 100)}%
            </span>
          </div>
          <div className="font-mono text-[10px] text-text-tertiary mt-1">
            {actualVsTheoretical >= 0.9 && actualVsTheoretical <= 1.2
              ? '✓ Dans la fourchette attendue'
              : actualVsTheoretical < 0.5
                ? 'Rythme très en-deçà, le déficit mérite d\'être revu'
                : actualVsTheoretical < 0.9
                  ? 'Rythme en-deçà mais pas dramatique'
                  : 'Rythme au-delà de ce qui était prévu'
            }
          </div>
        </div>
      )}

      {/* Date projetée */}
      {onTrack && (
        <div className="p-3 rounded-xl border border-heat-orange bg-gradient-to-br from-[rgba(255,170,51,0.05)] to-[rgba(255,23,68,0.05)]">
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-heat-amber mb-1">
            À ce rythme, tu atteins {formatNumber(targetKg, { decimals: 0 })} kg
          </div>
          <div className="font-display font-bold text-base text-text-primary">
            {formatDateLong(trend.projectedTargetDate)}
          </div>
          <div className="font-mono text-[10px] text-text-tertiary mt-1">
            Dans {trend.daysToTarget} jours · ≈ {Math.round(trend.daysToTarget / 7)} semaines
          </div>
        </div>
      )}

      {!losingWeight && targetKg != null && (
        <div className="p-3 rounded-xl border border-danger/40 bg-[rgba(255,23,68,0.04)]">
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-danger mb-1">
            Tendance remontante
          </div>
          <div className="font-body text-sm text-text-primary">
            Ta courbe remonte actuellement. Revoir le déficit ou l'activité peut aider.
          </div>
        </div>
      )}
    </div>
  );
}
