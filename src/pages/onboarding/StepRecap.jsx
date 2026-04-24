import { useMemo } from 'react';
import Button from '../../components/ui/Button';
import { computeProfileMetrics, calculateBMI } from '../../utils/calculations';
import { formatNumber, formatDateShort } from '../../utils/format';

/**
 * Étape 5 — Récapitulatif et validation
 * Affiche tous les calculs dérivés du profil.
 */

function StatLine({ label, value, highlight = false, sub }) {
  return (
    <div className="flex justify-between items-baseline py-2.5 border-t border-subtle first:border-t-0">
      <div className="font-body text-sm text-text-secondary">{label}</div>
      <div className="text-right">
        <div className={`font-mono font-semibold text-sm ${highlight ? 'text-heat-orange' : 'text-text-primary'}`}>
          {value}
        </div>
        {sub && <div className="font-mono text-[10px] text-text-tertiary">{sub}</div>}
      </div>
    </div>
  );
}

export default function StepRecap({ data, onFinish, onBack }) {
  const metrics = useMemo(() => computeProfileMetrics(data), [data]);
  const bmi = useMemo(
    () => calculateBMI({ poids_kg: data.poids_initial_kg, taille_cm: data.taille_cm }),
    [data]
  );

  if (!metrics) return null;

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 px-6 py-4 overflow-y-auto">
        <h2 className="font-display font-semibold text-3xl mb-2 leading-[1.05] text-text-primary" style={{ letterSpacing: '-0.02em' }}>
          Ton calibrage
        </h2>
        <p className="text-text-secondary text-[14px] mb-8 leading-relaxed">
          Voici ce que Jamra calcule pour toi. Tout reste ajustable plus tard.
        </p>

        <div className="flex flex-col gap-3 stagger-1">

          {/* Profil */}
          <div className="surface-card rounded-2xl p-5 animate-fade-up">
            <div className="font-display font-bold text-xs uppercase tracking-[0.12em] text-text-tertiary mb-3">
              Profil
            </div>
            <StatLine label="Prénom" value={data.prenom} />
            <StatLine label="Âge" value={`${metrics.age} ans`} />
            <StatLine label="Taille" value={`${data.taille_cm} cm`} />
            <StatLine label="Poids" value={`${formatNumber(data.poids_initial_kg, { decimals: 1 })} kg`} />
            <StatLine label="IMC" value={formatNumber(bmi, { decimals: 1 })} />
          </div>

          {/* Énergie */}
          <div className="surface-card rounded-2xl p-5 animate-fade-up">
            <div className="font-display font-bold text-xs uppercase tracking-[0.12em] text-text-tertiary mb-3">
              Énergie
            </div>
            <StatLine label="Métabolisme de base" value={`${formatNumber(metrics.bmr)} kcal`} sub="MIFFLIN-ST JEOR" />
            <StatLine label="Dépense totale (TDEE)" value={`${formatNumber(metrics.tdee)} kcal`} sub="MAINTENANCE" />
            <StatLine
              label="Apport cible"
              value={`${formatNumber(metrics.target_kcal)} kcal`}
              highlight
              sub={metrics.deficit_kcal > 0 ? `DÉFICIT −${formatNumber(metrics.deficit_kcal)}` : 'MAINTENANCE'}
            />
          </div>

          {/* Macros */}
          <div className="surface-card rounded-2xl p-5 animate-fade-up">
            <div className="font-display font-bold text-xs uppercase tracking-[0.12em] text-text-tertiary mb-3">
              Macros cible / jour
            </div>
            <StatLine label="Protéines" value={`${metrics.proteines_g} g`} sub={`${metrics.proteines_pct} %`} />
            <StatLine label="Lipides" value={`${metrics.lipides_g} g`} sub={`${metrics.lipides_pct} %`} />
            <StatLine label="Glucides" value={`${metrics.glucides_g} g`} sub={`${metrics.glucides_pct} %`} />
            <StatLine label="Fibres" value={`${metrics.fibres_g} g`} />
          </div>

          {/* Objectif */}
          {data.date_cible && (
            <div className="rounded-2xl p-5 border bg-gradient-to-br from-[rgba(255,170,51,0.08)] to-[rgba(255,23,68,0.08)] border-[rgba(255,77,0,0.25)]">
              <div className="font-display font-bold text-xs uppercase tracking-[0.12em] text-heat-orange mb-2">
                Projection objectif
              </div>
              <p className="font-body text-sm text-text-primary leading-relaxed">
                {data.poids_initial_kg > data.poids_cible_kg ? 'Perte' : 'Gain'} de{' '}
                <span className="font-display font-bold text-heat-orange">
                  {Math.abs(data.poids_initial_kg - data.poids_cible_kg).toFixed(1)} kg
                </span>
                {' '}visé pour le{' '}
                <span className="font-display font-bold text-heat-orange">
                  {formatDateShort(data.date_cible)}
                </span>
                .
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-5 flex gap-3 border-t border-subtle safe-pb">
        <Button variant="outline" size="lg" onClick={onBack}>
          Retour
        </Button>
        <Button size="lg" fullWidth onClick={() => onFinish(metrics)}>
          Valider · C'est parti
        </Button>
      </div>
    </div>
  );
}
