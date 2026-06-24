import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveProfile } from '../../db/database';
import { supabase } from '../../lib/supabase';
import { computePhase } from '../../utils/calculations';
import StepWelcome from './StepWelcome';
import StepPersonal from './StepPersonal';
import StepCurrent from './StepCurrent';
import StepFitness from './StepFitness';
import StepGoal from './StepGoal';
import StepAvatar from './StepAvatar';
import StepRecap from './StepRecap';

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({});

  const handleNext = (partial) => {
    if (partial) setData(d => ({ ...d, ...partial }));
    setStep(s => s + 1);
  };

  const handleBack = () => setStep(s => Math.max(0, s - 1));

  const handleFinish = async () => {
    await saveProfile(data);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const phase = computePhase(data.poids_initial_kg);
      await supabase.from('profiles').upsert({
        id: user.id,
        poids_initial_kg: data.poids_initial_kg,
        poids_actuel_kg: data.poids_initial_kg,
        poids_cible_kg: data.poids_cible_kg,
        mg_depart_pct: data.mg_depart_pct ?? null,
        objectif_fitness: data.objectif_fitness ?? null,
        objectif_marathon: data.objectif_marathon ?? null,
        date_debut: data.date_debut ?? new Date().toISOString().slice(0, 10),
        phase_actuelle: phase,
        xp: 0,
        strava_connected: false,
        avatar_customization: data.avatar_customization ?? { skin: 'medium', hair: 'short_dark', glasses: 'none', outfit: 'default', shoes: 'default' },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    }
    navigate('/', { replace: true });
  };

  const totalSteps = 6;
  const progress = step === 0 ? 0 : step / totalSteps;

  return (
    <div className="min-h-dvh flex flex-col">
      {step > 0 && (
        <div className="h-1 bg-bg-surface2 safe-pt">
          <div
            className="h-full bg-heat-gradient transition-all duration-500 ease-out-quart"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}

      {step === 0 && <StepWelcome onNext={() => handleNext()} />}
      {step === 1 && <StepPersonal data={data} onNext={handleNext} onBack={handleBack} />}
      {step === 2 && <StepCurrent  data={data} onNext={handleNext} onBack={handleBack} />}
      {step === 3 && <StepFitness  data={data} onNext={handleNext} onBack={handleBack} />}
      {step === 4 && <StepGoal     data={data} onNext={handleNext} onBack={handleBack} />}
      {step === 5 && <StepAvatar   data={data} onNext={handleNext} onBack={handleBack} />}
      {step === 6 && <StepRecap    data={data} onFinish={handleFinish} onBack={handleBack} />}
    </div>
  );
}
