import { useState } from 'react';
import Button from '../../components/ui/Button';
import SelectCard from '../../components/ui/SelectCard';

const OBJECTIF_OPTIONS = [
  {
    key: 'recomposition',
    title: 'Recomposition',
    description: 'Perdre du gras tout en gardant le muscle',
  },
  {
    key: 'marathon',
    title: 'Marathon de Paris — 11 avril 2027',
    description: 'Préparer l\'endurance et atteindre le poids cible pour la course',
  },
  {
    key: 'les_deux',
    title: 'Les deux',
    description: 'Recomposition + préparation marathon en parallèle',
  },
];

const MG_LABELS = {
  low: (v) => v <= 15 ? 'Athlétique' : null,
  fit: (v) => v > 15 && v <= 20 ? 'Fit' : null,
  avg: (v) => v > 20 && v <= 25 ? 'Dans la moyenne' : null,
  above: (v) => v > 25 && v <= 32 ? 'Au-dessus de la moyenne' : null,
  obese: (v) => v > 32 ? 'Surpoids' : null,
};

function getMgLabel(v) {
  for (const fn of Object.values(MG_LABELS)) {
    const r = fn(v);
    if (r) return r;
  }
  return '';
}

export default function StepFitness({ data, onNext, onBack }) {
  const today = new Date().toISOString().slice(0, 10);
  const [mgDepart, setMgDepart] = useState(data.mg_depart_pct ?? null);
  const [mgTouched, setMgTouched] = useState(!!data.mg_depart_pct);
  const [objectifFitness, setObjectifFitness] = useState(data.objectif_fitness || '');
  const [dateDebut, setDateDebut] = useState(data.date_debut || today);

  const isValid = !!objectifFitness;

  const handleNext = () => {
    const marathonDate = (objectifFitness === 'marathon' || objectifFitness === 'les_deux')
      ? '2027-04-11'
      : null;
    onNext({
      mg_depart_pct: mgTouched ? Number(mgDepart) : null,
      objectif_fitness: objectifFitness,
      objectif_marathon: marathonDate,
      date_debut: dateDebut,
    });
  };

  return (
    <div className="flex-1 flex flex-col animate-fade-in">
      <div className="flex-1 px-6 py-4 overflow-y-auto">
        <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-heat-orange mb-2">
          Étape 3 / 5
        </div>
        <h2 className="font-display font-black text-3xl mb-2 leading-none">
          Tes données de départ
        </h2>
        <p className="text-text-secondary text-sm mb-8">
          Calibre l'objectif et le point de départ.
        </p>

        <div className="flex flex-col gap-7">
          {/* MG optionnel */}
          <div>
            <label className="font-body font-semibold text-sm text-text-primary mb-1 block">
              Taux de masse grasse <span className="font-normal text-text-tertiary">(optionnel)</span>
            </label>
            <p className="font-mono text-[10px] text-text-tertiary mb-3 tracking-wide">
              Estimation ok — si tu ne sais pas, laisse glisser ou passe.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="10"
                max="45"
                step="1"
                value={mgDepart ?? 25}
                onChange={(e) => { setMgDepart(e.target.value); setMgTouched(true); }}
                className="flex-1 accent-[#FF4D00]"
              />
              <div className="font-mono font-bold text-[15px] text-heat-orange w-14 text-right">
                {mgTouched ? `${mgDepart}%` : '—'}
              </div>
            </div>
            {mgTouched && mgDepart && (
              <div className="mt-1.5 font-mono text-[10px] text-text-tertiary">
                {getMgLabel(Number(mgDepart))}
              </div>
            )}
          </div>

          {/* Objectif principal */}
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
                  selected={objectifFitness === opt.key}
                  onClick={() => setObjectifFitness(opt.key)}
                />
              ))}
            </div>
          </div>

          {/* Date de début */}
          <div>
            <label className="font-body font-semibold text-sm text-text-primary mb-1 block">
              Date de début officielle
            </label>
            <input
              type="date"
              value={dateDebut}
              max={today}
              onChange={(e) => setDateDebut(e.target.value)}
              className="w-full bg-bg-surface1 border border-subtle rounded-xl px-4 py-3 font-mono text-[13px] text-text-primary focus:border-heat-orange/60 focus:outline-none transition-colors"
              style={{ colorScheme: 'dark' }}
            />
            <p className="mt-1.5 font-mono text-[10px] text-text-tertiary">
              Par défaut : aujourd'hui. Antidaté si tu avais déjà commencé.
            </p>
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
