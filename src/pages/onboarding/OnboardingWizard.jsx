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
      {/* Progress bar v2 avec step indicator */}
      {step > 0 && (
        <div className="safe-pt px-6 pt-4 pb-2 animate-fade-up">
          <div className="flex items-center justify-between mb-2">
            <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-heat-amber font-bold">
              Étape {step} / {totalSteps}
            </div>
            <div className="font-mono text-[10px] tracking-wider uppercase text-text-tertiary tabular">
              {Math.round(progress * 100)}%
            </div>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.06)' }}>
            <div
              className="h-full rounded-full transition-all duration-500 ease-out-quart"
              style={{
                width: `${progress * 100}%`,
                background: 'linear-gradient(90deg, #FFAA33 0%, #FF4D00 50%, #FF1744 100%)',
                boxShadow: '0 0 8px rgba(255, 77, 0, 0.5)',
              }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col animate-fade-up" key={step}>
        {step === 0 && <StepWelcome onNext={() => handleNext()} />}
        {step === 1 && <StepPersonal data={data} onNext={handleNext} onBack={handleBack} />}
        {step === 2 && <StepCurrent data={data} onNext={handleNext} onBack={handleBack} />}
        {step === 3 && <StepGoal data={data} onNext={handleNext} onBack={handleBack} />}
        {step === 4 && <StepRecap data={data} onFinish={handleFinish} onBack={handleBack} />}
      </div>
    </div>
  );
}
