import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveProfile } from '../../db/database';
import StepWelcome from './StepWelcome';
import StepPersonal from './StepPersonal';
import StepCurrent from './StepCurrent';
import StepGoal from './StepGoal';
import StepRecap from './StepRecap';

/**
 * OnboardingWizard — orchestre les 5 étapes, agrège les données, sauvegarde en fin
 */

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
    navigate('/', { replace: true });
  };

  // Progress indicator (barre de haut)
  const totalSteps = 4; // étapes 1-4 (StepWelcome est le 0, affichage: étape 0/4 = start)
  const progress = step === 0 ? 0 : step / totalSteps;

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Progress bar */}
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
      {step === 2 && <StepCurrent data={data} onNext={handleNext} onBack={handleBack} />}
      {step === 3 && <StepGoal data={data} onNext={handleNext} onBack={handleBack} />}
      {step === 4 && <StepRecap data={data} onFinish={handleFinish} onBack={handleBack} />}
    </div>
  );
}
