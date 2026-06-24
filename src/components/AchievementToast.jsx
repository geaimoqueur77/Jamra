import { useEffect, useState } from 'react';

export default function AchievementToast({ achievement, onDone }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, 3500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`
        fixed bottom-24 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-3 px-5 py-3.5 rounded-2xl
        border border-heat-orange/30 bg-bg-surface1 shadow-xl
        transition-all duration-300
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
      style={{ minWidth: 240, maxWidth: 320 }}
    >
      <div className="text-2xl">{achievement.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-heat-orange mb-0.5">
          Achievement débloqué
        </div>
        <div className="font-display font-bold text-[14px] text-text-primary truncate">
          {achievement.label}
        </div>
        <div className="font-mono text-[10px] text-text-tertiary truncate">
          {achievement.description}
        </div>
      </div>
      <div className="font-display font-bold text-[13px] text-heat-amber ml-1">
        +{achievement.xp}
      </div>
    </div>
  );
}

export function AchievementToastLayer({ unlocks, onDismiss }) {
  if (!unlocks?.length) return null;
  const first = unlocks[0];
  return (
    <AchievementToast
      key={first._id}
      achievement={first}
      onDone={() => onDismiss(first._id)}
    />
  );
}
