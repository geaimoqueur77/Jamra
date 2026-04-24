import { useState } from 'react';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import SelectCard from '../../components/ui/SelectCard';

/**
 * Étape 2 — Données personnelles
 * prenom, date_naissance, sexe, taille_cm
 */

export default function StepPersonal({ data, onNext, onBack }) {
  const [prenom, setPrenom] = useState(data.prenom || '');
  const [dateNaissance, setDateNaissance] = useState(data.date_naissance || '');
  const [sexe, setSexe] = useState(data.sexe || '');
  const [taille, setTaille] = useState(data.taille_cm || '');

  const isValid = prenom && dateNaissance && sexe && taille;

  const handleNext = () => {
    onNext({
      prenom,
      date_naissance: dateNaissance,
      sexe,
      taille_cm: Number(taille),
    });
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 px-6 py-4 overflow-y-auto">
        <h2 className="font-display font-semibold text-3xl mb-2 leading-[1.05] text-text-primary" style={{ letterSpacing: '-0.02em' }}>
          Qui es-tu ?
        </h2>
        <p className="text-text-secondary text-[14px] mb-8 leading-relaxed">
          Ces informations servent à calculer tes besoins caloriques personnalisés.
        </p>

        <div className="flex flex-col gap-5 stagger-1">
          <TextField
            label="Prénom"
            placeholder="Ton prénom"
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
          />

          <TextField
            label="Date de naissance"
            type="date"
            value={dateNaissance}
            onChange={(e) => setDateNaissance(e.target.value)}
          />

          <div>
            <label className="font-body font-semibold text-sm text-text-primary mb-2 block">
              Sexe biologique
            </label>
            <div className="grid grid-cols-2 gap-3">
              <SelectCard
                title="Homme"
                selected={sexe === 'homme'}
                onClick={() => setSexe('homme')}
              />
              <SelectCard
                title="Femme"
                selected={sexe === 'femme'}
                onClick={() => setSexe('femme')}
              />
            </div>
          </div>

          <TextField
            label="Taille"
            type="number"
            placeholder="180"
            value={taille}
            suffix="cm"
            onChange={(e) => setTaille(e.target.value)}
          />
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
