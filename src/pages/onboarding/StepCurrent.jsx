import { useState } from 'react';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import SelectCard from '../../components/ui/SelectCard';

/**
 * Étape 3 — Situation actuelle
 * poids_initial_kg, niveau_activite, sport_principal
 */

const ACTIVITY_OPTIONS = [
  {
    key: 'sedentaire',
    title: 'Sédentaire',
    description: 'Bureau, peu d\'activité physique',
  },
  {
    key: 'leger',
    title: 'Léger',
    description: 'Marche quotidienne, 1-2 séances/sem',
  },
  {
    key: 'modere',
    title: 'Modéré',
    description: '3-4 séances/sem',
  },
  {
    key: 'intense',
    title: 'Intense',
    description: '5+ séances/sem',
  },
];

const SPORT_OPTIONS = [
  { key: 'course', title: 'Course à pied' },
  { key: 'muscu',  title: 'Musculation' },
  { key: 'velo',   title: 'Vélo / cyclisme' },
  { key: 'raquette', title: 'Sports de raquette' },
  { key: 'autre',  title: 'Autre / mix' },
];

export default function StepCurrent({ data, onNext, onBack }) {
  const [poids, setPoids] = useState(data.poids_initial_kg || '');
  const [activite, setActivite] = useState(data.niveau_activite || '');
  const [sport, setSport] = useState(data.sport_principal || '');

  const isValid = poids && activite && sport;

  const handleNext = () => {
    onNext({
      poids_initial_kg: Number(poids),
      niveau_activite: activite,
      sport_principal: sport,
    });
  };

  return (
    <div className="flex-1 flex flex-col animate-fade-in">
      <div className="flex-1 px-6 py-4 overflow-y-auto">
        <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-heat-orange mb-2">
          Étape 2 / 4
        </div>
        <h2 className="font-display font-black text-3xl mb-2 leading-none">
          Où en es-tu ?
        </h2>
        <p className="text-text-secondary text-sm mb-8">
          Point de départ et habitudes actuelles.
        </p>

        <div className="flex flex-col gap-6">
          <TextField
            label="Poids actuel"
            type="number"
            step="0.1"
            placeholder="80.0"
            value={poids}
            suffix="kg"
            onChange={(e) => setPoids(e.target.value)}
          />

          <div>
            <label className="font-body font-semibold text-sm text-text-primary mb-2 block">
              Niveau d'activité
            </label>
            <div className="flex flex-col gap-2">
              {ACTIVITY_OPTIONS.map(opt => (
                <SelectCard
                  key={opt.key}
                  title={opt.title}
                  description={opt.description}
                  selected={activite === opt.key}
                  onClick={() => setActivite(opt.key)}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="font-body font-semibold text-sm text-text-primary mb-2 block">
              Sport principal
            </label>
            <div className="flex flex-col gap-2">
              {SPORT_OPTIONS.map(opt => (
                <SelectCard
                  key={opt.key}
                  title={opt.title}
                  selected={sport === opt.key}
                  onClick={() => setSport(opt.key)}
                />
              ))}
            </div>
          </div>
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
