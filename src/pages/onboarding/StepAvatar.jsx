import { useState } from 'react';
import { CUSTOMIZATION_OPTIONS } from '../../components/JamraAvatar';
import AvatarPreview from '../../components/AvatarPreview';

function Pill({ label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all duration-150
        ${selected
          ? 'bg-heat-orange text-white shadow-[0_0_8px_rgba(255,77,0,0.35)]'
          : 'bg-bg-surface2 text-text-secondary border border-subtle hover:border-heat-orange/40'
        }`}
    >
      {label}
    </button>
  );
}

const DEFAULT = { skin: 'medium', hair: 'short_dark', glasses: 'none', outfit: 'default', shoes: 'default' };

export default function StepAvatar({ data, onNext, onBack }) {
  const [custom, setCustom] = useState({ ...DEFAULT, ...(data.avatar_customization || {}) });
  const set = (key, id) => setCustom(c => ({ ...c, [key]: id }));

  // En onboarding, seulement les options unlockAt: 0 ou default
  const freeOptions = (category) =>
    CUSTOMIZATION_OPTIONS[category].filter(o => o.default || o.unlockAt === 0);

  return (
    <div className="flex-1 flex flex-col px-6 py-8 gap-6">
      <div>
        <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-tertiary mb-1">ÉTAPE 6</div>
        <h2 className="font-display font-bold text-[28px] leading-tight text-text-primary">
          Crée ton personnage
        </h2>
        <p className="font-body text-[13px] text-text-secondary mt-1">
          Tu débloqueras d'autres options en progressant.
        </p>
      </div>

      {/* Preview centré */}
      <div className="flex justify-center">
        <div className="rounded-2xl overflow-hidden border border-subtle" style={{ background: '#070405' }}>
          <AvatarPreview bodyState={2} customization={custom} size={120} />
        </div>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-4">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-wider text-text-muted mb-2">Peau</div>
          <div className="flex flex-wrap gap-2">
            {freeOptions('skin').map(opt => (
              <Pill key={opt.id} label={opt.label} selected={custom.skin === opt.id} onClick={() => set('skin', opt.id)} />
            ))}
          </div>
        </div>
        <div>
          <div className="font-mono text-[9px] uppercase tracking-wider text-text-muted mb-2">Cheveux</div>
          <div className="flex flex-wrap gap-2">
            {freeOptions('hair').map(opt => (
              <Pill key={opt.id} label={opt.label} selected={custom.hair === opt.id} onClick={() => set('hair', opt.id)} />
            ))}
          </div>
        </div>
        <div>
          <div className="font-mono text-[9px] uppercase tracking-wider text-text-muted mb-2">Lunettes</div>
          <div className="flex flex-wrap gap-2">
            {freeOptions('glasses').map(opt => (
              <Pill key={opt.id} label={opt.label} selected={custom.glasses === opt.id} onClick={() => set('glasses', opt.id)} />
            ))}
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="mt-auto flex gap-3">
        <button onClick={onBack} className="flex-1 py-3.5 rounded-xl border border-subtle font-display font-bold text-[13px] uppercase tracking-wider text-text-secondary hover:border-heat-orange/40 transition-colors">
          Retour
        </button>
        <button
          onClick={() => onNext({ avatar_customization: custom })}
          className="flex-1 py-3.5 rounded-xl bg-heat-orange font-display font-bold text-[13px] uppercase tracking-wider text-white hover:bg-[#FF6030] active:scale-95 transition-all"
        >
          C'est parti →
        </button>
      </div>
    </div>
  );
}
