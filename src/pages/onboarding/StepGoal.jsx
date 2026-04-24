import { useState, useMemo } from 'react';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import SelectCard from '../../components/ui/SelectCard';
import { SCENARIOS, projectTargetDate } from '../../utils/calculations';
import { formatDateShort } from '../../utils/format';

/**
 * Étape 4 — Objectif
 * objectif, poids_cible_kg, scenario
 */

const OBJECTIF_OPTIONS = [
  {
    key: 'perte_poids',
    title: 'Perte de poids',
    description: 'Réduire la masse grasse en préservant le muscle',
  },
  {
    key: 'prise_muscle',
    title: 'Prise de muscle',
    description: 'Recomposition corporelle, gain de masse maigre',
  },
  {
    key: 'performance',
    title: 'Performance sportive',
    description: 'Endurance, force, optimisation des sorties',
  },
  {
    key: 'entretien',
    title: 'Entretien / santé',
    description: 'Stabilité du poids, équilibre nutritionnel',
  },
];

const SCENARIO_OPTIONS = [
  {
    key: 'durable',
    title: 'Durable',
    description: '0,5 kg/semaine · durable, zéro impact sur les perfs',
  },
  {
    key: 'modere',
    title: 'Modéré',
    description: '0,7 kg/semaine · équilibre progression/performance',
  },
  {
    key: 'intermediaire',
    title: 'Intermédiaire',
    description: '0,8 kg/semaine · soutenu mais tenable',
  },
  {
    key: 'agressif',
    title: 'Agressif',
    description: '1,0 kg/semaine · rapide, risque sur les perfs running',
  },
];

export default function StepGoal({ data, onNext, onBack }) {
  const [objectif, setObjectif] = useState(data.objectif || '');
  const [poidsCible, setPoidsCible] = useState(data.poids_cible_kg || '');
  const [scenario, setScenario] = useState(data.scenario || '');

  const needsScenario = objectif === 'perte_poids';
  const isValid = objectif && (needsScenario ? poidsCible && scenario : true);

  // Projection date if perte_poids
  const projectedDate = useMemo(() => {
    if (!needsScenario || !poidsCible || !scenario) return null;
    return projectTargetDate({
      poids_actuel_kg: data.poids_initial_kg,
      poids_cible_kg: Number(poidsCible),
      scenario,
      date_debut: new Date(),
    });
  }, [data.poids_initial_kg, poidsCible, scenario, needsScenario]);

  const handleNext = () => {
    const now = new Date().toISOString().slice(0, 10);
    onNext({
      objectif,
      poids_cible_kg: poidsCible ? Number(poidsCible) : data.poids_initial_kg,
      scenario: needsScenario ? scenario : 'entretien',
      date_debut_objectif: now,
      date_cible: projectedDate ? projectedDate.toISOString().slice(0, 10) : null,
    });
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 px-6 py-4 overflow-y-auto">
        <h2 className="font-display font-semibold text-3xl mb-2 leading-[1.05] text-text-primary" style={{ letterSpacing: '-0.02em' }}>
          Quel objectif ?
        </h2>
        <p className="text-text-secondary text-[14px] mb-8 leading-relaxed">
          Tout se calibre à partir d'ici.
        </p>

        <div className="flex flex-col gap-6 stagger-1">
          <div>
            <label className="font-body font-semibold text-sm text-text-primary mb-2 block">
              Objectif principal
            </label>
            <div className="flex flex-col gap-2">
              {OBJECTIF_OPTIONS.map(opt => (
                <SelectCard
                  key={opt.key}
                  title={opt.title}
                  description={opt.description}
                  selected={objectif === opt.key}
                  onClick={() => setObjectif(opt.key)}
                />
              ))}
            </div>
          </div>

          {needsScenario && (
            <>
              <TextField
                label="Poids cible"
                type="number"
                step="0.1"
                placeholder="75.0"
                value={poidsCible}
                suffix="kg"
                onChange={(e) => setPoidsCible(e.target.value)}
              />

              <div>
                <label className="font-body font-semibold text-sm text-text-primary mb-2 block">
                  Rythme de progression
                </label>
                <div className="flex flex-col gap-2">
                  {SCENARIO_OPTIONS.map(opt => (
                    <SelectCard
                      key={opt.key}
                      title={opt.title}
                      description={opt.description}
                      selected={scenario === opt.key}
                      onClick={() => setScenario(opt.key)}
                    />
                  ))}
                </div>
                {scenario === 'agressif' && (
                  <div className="mt-3 p-4 rounded-xl border border-[rgba(255,77,0,0.25)] bg-[rgba(255,77,0,0.05)]">
                    <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-heat-orange mb-1">
                      Avertissement
                    </div>
                    <p className="text-text-secondary text-xs leading-relaxed">
                      À ce rythme, les performances running peuvent chuter après 2-3 semaines.
                      L'app activera des garde-fous renforcés.
                    </p>
                  </div>
                )}
              </div>

              {projectedDate && (
                <div className="p-4 rounded-2xl bg-bg-surface1 border border-subtle">
                  <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-tertiary mb-2">
                    Projection
                  </div>
                  <div className="font-body text-sm text-text-primary leading-relaxed">
                    Objectif <span className="font-display font-bold text-heat-orange">{poidsCible} kg</span> atteint vers le <span className="font-display font-bold text-heat-orange">{formatDateShort(projectedDate)}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="px-6 py-5 flex gap-3 border-t border-subtle safe-pb">
        <Button variant="outline" size="lg" onClick={onBack}>
          Retour
        </Button>
        <Button size="lg" fullWidth onClick={handleNext} disabled={!isValid}>
          Continuer
        </Button>
      </div>
    </div>
  );
}
