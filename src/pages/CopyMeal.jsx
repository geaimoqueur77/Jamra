import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getMealsForDate,
  copyMealEntries,
  getRecentLoggedDates,
  todayISO,
} from '../db/database';
import { addDaysISO, dateFromISO, formatDayAbbrev, formatDateLong, formatNumber } from '../utils/format';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';

const MEAL_LABELS = {
  petit_dej: 'Petit-déjeuner',
  dejeuner:  'Déjeuner',
  diner:     'Dîner',
  collation: 'Collation',
};
const MEAL_KEYS = ['petit_dej', 'dejeuner', 'diner', 'collation'];

export default function CopyMeal() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const destDate = searchParams.get('date') || todayISO();
  const destMealParam = searchParams.get('meal') || 'dejeuner';

  const [destMeal, setDestMeal] = useState(destMealParam);
  const [srcDate, setSrcDate] = useState(addDaysISO(destDate, -1)); // hier par défaut
  const [srcMeal, setSrcMeal] = useState(destMealParam);
  const [srcMeals, setSrcMeals] = useState(null);
  const [recentDates, setRecentDates] = useState([]);
  const [copying, setCopying] = useState(false);

  // Charger les dates récentes au mount
  useEffect(() => {
    getRecentLoggedDates(14).then(setRecentDates);
  }, []);

  // Charger les repas de la date source à chaque changement
  useEffect(() => {
    getMealsForDate(srcDate).then(setSrcMeals);
  }, [srcDate]);

  const handleCopy = async () => {
    if (copying) return;
    const entries = srcMeals?.[srcMeal] || [];
    if (entries.length === 0) return;
    setCopying(true);
    try {
      await copyMealEntries({ srcDate, srcMeal, destDate, destMeal });
      navigate('/', { replace: true });
    } catch (e) {
      console.error(e);
      setCopying(false);
    }
  };

  const srcEntries = srcMeals?.[srcMeal] || [];
  const srcTotal = srcEntries.reduce((s, e) => s + (e.kcal_snapshot || 0), 0);
  const dstDate = dateFromISO(destDate);

  return (
    <div className="min-h-dvh flex flex-col">
      <Header variant="title" title="Copier un repas" onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto px-6 pt-2 pb-6">
        {/* Destination */}
        <div className="mb-5 p-4 rounded-2xl border border-heat-orange bg-gradient-to-br from-[rgba(255,170,51,0.06)] to-[rgba(255,23,68,0.06)]">
          <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-heat-amber mb-1">
            Destination
          </div>
          <div className="font-display font-bold text-base text-text-primary mb-3">
            {formatDateLong(dstDate)}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {MEAL_KEYS.map(key => (
              <button
                key={key}
                onClick={() => setDestMeal(key)}
                className={`
                  py-2 rounded-lg text-xs font-display font-bold uppercase tracking-[0.06em] transition-all
                  ${destMeal === key
                    ? 'bg-gradient-to-br from-heat-amber to-heat-orange text-white'
                    : 'border border-subtle bg-bg-surface1 text-text-secondary hover:border-strong'
                  }
                `}
              >
                {MEAL_LABELS[key]}
              </button>
            ))}
          </div>
        </div>

        {/* Séparateur visuel */}
        <div className="flex items-center justify-center mb-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary">
            <polyline points="18 15 12 21 6 15" />
          </svg>
        </div>

        {/* Source */}
        <div className="mb-5">
          <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-text-tertiary mb-2">
            Source
          </div>

          {/* Date source */}
          <div className="mb-3 p-4 surface-card rounded-2xl">
            <label className="font-mono text-[10px] tracking-[0.1em] uppercase text-text-tertiary">
              Date
            </label>
            <input
              type="date"
              value={srcDate}
              max={todayISO()}
              onChange={e => setSrcDate(e.target.value)}
              className="w-full mt-2 mb-3 px-3 py-2 bg-bg-surface2 border border-subtle rounded-lg font-mono text-sm text-text-primary focus:outline-none focus:border-heat-orange [color-scheme:dark]"
            />

            {/* Raccourcis jours récents */}
            {recentDates.length > 0 && (
              <>
                <div className="font-mono text-[9px] tracking-wider uppercase text-text-tertiary mb-2">
                  Raccourcis
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {recentDates.slice(0, 7).map(d => {
                    const dt = dateFromISO(d);
                    return (
                      <button
                        key={d}
                        onClick={() => setSrcDate(d)}
                        className={`
                          flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-mono tabular-nums transition-all
                          ${srcDate === d
                            ? 'bg-heat-orange/20 border border-heat-orange text-heat-amber'
                            : 'border border-subtle bg-bg-surface2 text-text-secondary hover:border-strong'
                          }
                        `}
                      >
                        {formatDayAbbrev(dt)} {dt.getDate()}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Repas source */}
          <div className="p-4 surface-card rounded-2xl">
            <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-text-tertiary mb-2">
              Repas à copier
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MEAL_KEYS.map(key => {
                const count = srcMeals?.[key]?.length || 0;
                const disabled = count === 0;
                return (
                  <button
                    key={key}
                    onClick={() => !disabled && setSrcMeal(key)}
                    disabled={disabled}
                    className={`
                      py-2.5 px-3 rounded-lg text-left transition-all
                      ${disabled
                        ? 'border border-subtle bg-bg-surface2 opacity-40 cursor-not-allowed'
                        : srcMeal === key
                          ? 'border border-heat-orange bg-gradient-to-br from-[rgba(255,170,51,0.08)] to-[rgba(255,23,68,0.08)]'
                          : 'border border-subtle bg-bg-surface2 hover:border-strong'
                      }
                    `}
                  >
                    <div className="font-display font-bold text-xs uppercase tracking-wider text-text-primary">
                      {MEAL_LABELS[key]}
                    </div>
                    <div className="font-mono text-[10px] text-text-tertiary mt-0.5">
                      {count > 0 ? `${count} entrée${count > 1 ? 's' : ''}` : 'Vide'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Aperçu */}
        {srcEntries.length > 0 ? (
          <div className="mb-5 p-4 surface-card rounded-2xl">
            <div className="flex justify-between items-center mb-3">
              <div className="font-display font-bold text-[11px] uppercase tracking-[0.12em] text-text-tertiary">
                Aperçu ({srcEntries.length})
              </div>
              <div>
                <span className="font-display font-bold text-base text-heat-amber">{formatNumber(srcTotal)}</span>
                <span className="font-mono text-[9px] text-text-tertiary ml-1 tracking-wider">KCAL</span>
              </div>
            </div>
            <div className="flex flex-col">
              {srcEntries.map((e, i) => (
                <div key={e.id} className={`flex justify-between items-baseline py-1.5 ${i > 0 ? 'border-t border-subtle' : ''}`}>
                  <span className="font-body text-[13px] text-text-secondary truncate flex-1 pr-2">
                    {e.aliment_nom_snapshot}
                    <span className="text-text-tertiary text-[11px] ml-1">· {e.quantite_g} g</span>
                  </span>
                  <span className="font-mono text-xs text-text-primary">
                    {formatNumber(e.kcal_snapshot)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-5 p-6 text-center text-text-tertiary text-sm border border-dashed border-subtle rounded-2xl">
            Pas d'entrée pour ce repas à cette date.
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-6 py-5 border-t border-subtle safe-pb">
        <Button
          fullWidth
          size="lg"
          onClick={handleCopy}
          disabled={copying || srcEntries.length === 0}
        >
          {copying
            ? 'Copie en cours...'
            : srcEntries.length === 0
              ? 'Aucune entrée à copier'
              : `Copier ${srcEntries.length} entrée${srcEntries.length > 1 ? 's' : ''} vers ${MEAL_LABELS[destMeal].toLowerCase()}`
          }
        </Button>
      </div>
    </div>
  );
}
