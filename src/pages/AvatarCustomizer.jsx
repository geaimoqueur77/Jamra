import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAvatarState } from '../hooks/useAvatarState';
import { useAvatarCustomization } from '../hooks/useAvatarCustomization';
import { CUSTOMIZATION_OPTIONS } from '../components/JamraAvatar';
import AvatarPreview from '../components/AvatarPreview';
import Header from '../components/layout/Header';

function OptionPill({ option, selected, unlocked, unlockLabel, onClick }) {
  return (
    <button
      onClick={unlocked ? onClick : undefined}
      className={`
        relative px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all duration-150
        ${selected
          ? 'bg-heat-orange text-white shadow-[0_0_10px_rgba(255,77,0,0.4)]'
          : unlocked
            ? 'bg-bg-surface2 text-text-secondary border border-subtle hover:border-heat-orange/40'
            : 'bg-bg-surface1 text-text-muted border border-subtle opacity-50 cursor-not-allowed'
        }
      `}
    >
      {option.label}
      {!unlocked && unlockLabel && (
        <span className="ml-1 text-[8px] text-text-muted">🔒{unlockLabel}</span>
      )}
      {unlocked && !option.default && !selected && (
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-heat-orange opacity-60" />
      )}
    </button>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-5">
      <div className="font-display font-bold text-[10px] uppercase tracking-[0.18em] text-text-tertiary mb-2">
        {title}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export default function AvatarCustomizer() {
  const navigate = useNavigate();
  const { bodyState } = useAvatarState();
  const { customization, setCustomization, isUnlocked, unlockLabel, save, loading } = useAvatarCustomization();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (key, id) => setCustomization(c => ({ ...c, [key]: id }));

  const handleSave = async () => {
    setSaving(true);
    await save(customization);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-heat-orange/30 border-t-heat-orange animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col pb-32">
      <Header variant="back" onBack={() => navigate(-1)} eyebrow="PROFIL" title="Mon avatar" />

      {/* Preview */}
      <div className="flex justify-center py-6 px-6">
        <div className="rounded-2xl overflow-hidden border border-subtle" style={{ background: '#070405' }}>
          <AvatarPreview bodyState={bodyState || 2} customization={customization} size={180} />
        </div>
      </div>

      {/* Options */}
      <div className="px-6">
        <Section title="Apparence">
          <div className="w-full mb-2">
            <div className="font-mono text-[9px] uppercase tracking-wider text-text-muted mb-1.5">Peau</div>
            <div className="flex flex-wrap gap-2">
              {CUSTOMIZATION_OPTIONS.skin.map(opt => (
                <OptionPill
                  key={opt.id}
                  option={opt}
                  selected={customization.skin === opt.id}
                  unlocked={isUnlocked(opt)}
                  unlockLabel={unlockLabel(opt)}
                  onClick={() => set('skin', opt.id)}
                />
              ))}
            </div>
          </div>
          <div className="w-full mb-2">
            <div className="font-mono text-[9px] uppercase tracking-wider text-text-muted mb-1.5">Cheveux</div>
            <div className="flex flex-wrap gap-2">
              {CUSTOMIZATION_OPTIONS.hair.map(opt => (
                <OptionPill
                  key={opt.id}
                  option={opt}
                  selected={customization.hair === opt.id}
                  unlocked={isUnlocked(opt)}
                  unlockLabel={unlockLabel(opt)}
                  onClick={() => set('hair', opt.id)}
                />
              ))}
            </div>
          </div>
          <div className="w-full">
            <div className="font-mono text-[9px] uppercase tracking-wider text-text-muted mb-1.5">Lunettes</div>
            <div className="flex flex-wrap gap-2">
              {CUSTOMIZATION_OPTIONS.glasses.map(opt => (
                <OptionPill
                  key={opt.id}
                  option={opt}
                  selected={customization.glasses === opt.id}
                  unlocked={isUnlocked(opt)}
                  unlockLabel={unlockLabel(opt)}
                  onClick={() => set('glasses', opt.id)}
                />
              ))}
            </div>
          </div>
        </Section>

        <Section title="Tenue">
          {CUSTOMIZATION_OPTIONS.outfit.map(opt => (
            <OptionPill
              key={opt.id}
              option={opt}
              selected={customization.outfit === opt.id}
              unlocked={isUnlocked(opt)}
              unlockLabel={unlockLabel(opt)}
              onClick={() => set('outfit', opt.id)}
            />
          ))}
        </Section>

        <Section title="Chaussures">
          {CUSTOMIZATION_OPTIONS.shoes.map(opt => (
            <OptionPill
              key={opt.id}
              option={opt}
              selected={customization.shoes === opt.id}
              unlocked={isUnlocked(opt)}
              unlockLabel={unlockLabel(opt)}
              onClick={() => set('shoes', opt.id)}
            />
          ))}
        </Section>
      </div>

      {/* Save button */}
      <div className="fixed bottom-0 left-0 right-0 px-6 pb-8 pt-4 bg-gradient-to-t from-bg-base via-bg-base/95 to-transparent safe-pb">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-4 rounded-2xl font-display font-bold text-[14px] uppercase tracking-wider transition-all duration-200
            ${saved
              ? 'bg-success text-white'
              : 'bg-heat-orange text-white hover:bg-[#FF6030] active:scale-95 disabled:opacity-60'
            }`}
        >
          {saving ? 'Sauvegarde...' : saved ? '✓ Sauvegardé !' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
}
