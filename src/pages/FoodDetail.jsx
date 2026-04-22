import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getFood, addMealEntry, toggleFavorite, todayISO } from '../db/database';
import { CATEGORY_ICONS } from '../db/foodsDataset';
import { formatNumber } from '../utils/format';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';

const MEAL_LABELS = {
  petit_dej: 'Petit-déjeuner',
  dejeuner:  'Déjeuner',
  diner:     'Dîner',
  collation: 'Collation',
};

const QUICK_QUANTITIES = [30, 50, 80, 100, 125, 150, 200, 250, 300];

function NutritionRow({ label, value, unit = 'g', main = false, sub = false }) {
  return (
    <div className={`flex justify-between items-baseline py-2 ${sub ? 'pl-4' : ''} border-t border-subtle first:border-t-0`}>
      <div className={`font-body ${main ? 'text-text-primary font-semibold text-sm' : sub ? 'text-text-tertiary text-xs' : 'text-text-secondary text-sm'}`}>
        {label}
      </div>
      <div className={`font-mono ${main ? 'font-display font-bold text-heat-amber text-base' : 'text-text-primary text-xs font-medium'}`}>
        {value != null && value !== '' ? `${value} ${unit}` : '—'}
      </div>
    </div>
  );
}

export default function FoodDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const meal = searchParams.get('meal') || 'collation';
  const date = searchParams.get('date') || todayISO();
  const { user } = useAuth();

  const [food, setFood] = useState(null);
  const [quantity, setQuantity] = useState(100);
  const [inputValue, setInputValue] = useState('100');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getFood(id).then(f => {
      if (f) {
        setFood(f);
        const defaultQ = f.portion_defaut_g || 100;
        setQuantity(defaultQ);
        setInputValue(String(defaultQ));
      }
    });
  }, [id]);

  if (!food) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-text-tertiary font-mono text-sm">
        Chargement...
      </div>
    );
  }

  const factor = quantity / 100;
  const calc = (v) => v != null ? Math.round(v * factor * 10) / 10 : null;
  const calcInt = (v) => v != null ? Math.round(v * factor) : null;

  // L'aliment m'appartient si :
  //  - pas encore sync (owner_profile_id null) ET source != ciqual
  //  - OU owner_profile_id correspond à mon user.id
  const isMine =
    food.source !== 'ciqual' &&
    (!food.owner_profile_id || food.owner_profile_id === user?.id);

  const kcal = calcInt(food.kcal_100g);
  const proteines = calc(food.proteines_100g);
  const glucides = calc(food.glucides_100g);
  const sucres = calc(food.sucres_100g);
  const lipides = calc(food.lipides_100g);
  const satures = calc(food.satures_100g);
  const fibres = calc(food.fibres_100g);
  const sel = food.sel_100g != null ? Math.round(food.sel_100g * factor * 100) / 100 : null;

  const handleQuickQty = (q) => {
    setQuantity(q);
    setInputValue(String(q));
  };

  const handleInputChange = (v) => {
    setInputValue(v);
    const n = Number(v);
    if (!isNaN(n) && n >= 0) setQuantity(n);
  };

  const handleSave = async () => {
    if (saving || quantity <= 0) return;
    setSaving(true);
    try {
      await addMealEntry({
        date,
        type_repas: meal,
        aliment_id: food.id,
        quantite_g: quantity,
      });
      navigate('/', { replace: true });
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  const handleFav = async () => {
    await toggleFavorite(food.id);
    const updated = await getFood(id);
    setFood(updated);
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <Header variant="title" title="Quantité" onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto pb-6">
        {/* Hero */}
        <div className="px-6 py-6 text-center">
          <div className="text-3xl mb-3">{CATEGORY_ICONS[food.categorie] || '🍽️'}</div>
          <div className="font-display font-bold text-2xl uppercase tracking-[0.02em] text-text-primary px-2">
            {food.nom}
          </div>
          <div className="font-mono text-[10px] text-text-tertiary tracking-[0.2em] uppercase mt-2">
            {food.source === 'ciqual' ? 'CIQUAL' : food.source === 'perso' ? 'Perso' : food.source === 'openfoodfacts' ? 'OFF' : food.source} · {food.categorie}
          </div>
          {food.is_shared && (
            <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-[rgba(255,170,51,0.1)] border border-heat-amber/40">
              <span className="text-xs">🏠</span>
              <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-heat-amber">
                {isMine ? 'Partagé avec le foyer' : 'Partagé par un membre'}
              </span>
            </div>
          )}
        </div>

        {/* Quantity input */}
        <div className="mx-6 mb-5 p-6 bg-bg-surface1 border border-subtle rounded-2xl text-center">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-tertiary mb-3">
            Quantité
          </div>
          <div className="flex items-baseline justify-center gap-2 mb-4">
            <input
              type="number"
              inputMode="decimal"
              value={inputValue}
              onChange={e => handleInputChange(e.target.value)}
              className="w-32 bg-transparent border-none outline-none text-center font-display font-extrabold text-6xl leading-none tracking-tight text-heat-gradient"
              style={{
                WebkitAppearance: 'none',
                MozAppearance: 'textfield',
              }}
              min="0"
              step="5"
            />
            <span className="font-display font-bold text-xl text-text-secondary">g</span>
          </div>
          {food.portion_defaut_g && food.portion_defaut_nom && (
            <div className="font-mono text-[10px] text-text-tertiary tracking-wider uppercase mb-2">
              {food.portion_defaut_nom} = {food.portion_defaut_g} g
            </div>
          )}
        </div>

        {/* Quick buttons */}
        <div className="px-6 mb-6">
          <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-text-tertiary mb-2">
            Raccourcis
          </div>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_QUANTITIES.map(q => (
              <button
                key={q}
                onClick={() => handleQuickQty(q)}
                className={`
                  py-3 rounded-xl border font-mono text-sm font-semibold
                  transition-all duration-200 ease-out-quart
                  ${quantity === q
                    ? 'border-heat-orange text-text-primary bg-gradient-to-br from-[rgba(255,170,51,0.15)] to-[rgba(255,23,68,0.15)]'
                    : 'border-subtle bg-bg-surface1 text-text-secondary hover:border-strong'
                  }
                `}
              >
                {q} g
              </button>
            ))}
          </div>
        </div>

        {/* Nutrition values */}
        <div className="mx-6 mb-6 p-5 bg-bg-surface1 border border-subtle rounded-2xl">
          <div className="font-display font-bold text-[11px] uppercase tracking-[0.12em] text-text-tertiary mb-3">
            Valeurs pour {quantity} g
          </div>
          <NutritionRow label="Calories" value={formatNumber(kcal)} unit="kcal" main />
          <NutritionRow label="Protéines" value={proteines} />
          <NutritionRow label="Glucides" value={glucides} />
          <NutritionRow label="dont sucres" value={sucres} sub />
          <NutritionRow label="Lipides" value={lipides} />
          <NutritionRow label="dont saturés" value={satures} sub />
          <NutritionRow label="Fibres" value={fibres} />
          <NutritionRow label="Sel" value={sel} />
        </div>

        {/* Favorite */}
        <div className="px-6 mb-4">
          <button
            onClick={handleFav}
            className={`
              w-full py-3 rounded-xl border text-sm font-display font-bold uppercase tracking-[0.1em]
              transition-all duration-200
              ${food.is_favori
                ? 'border-heat-amber text-heat-amber bg-[rgba(255,170,51,0.08)]'
                : 'border-subtle text-text-secondary hover:text-heat-amber hover:border-heat-amber'
              }
            `}
          >
            {food.is_favori ? '★ Retirer des favoris' : '☆ Ajouter aux favoris'}
          </button>
        </div>

        {/* Éditer aliment perso (uniquement si c'est le mien) */}
        {food.source === 'perso' && isMine && (
          <div className="px-6 mb-4">
            <button
              onClick={() => {
                const p = new URLSearchParams({ meal, date, edit: String(food.id) });
                navigate(`/creer-aliment?${p.toString()}`);
              }}
              className="w-full py-3 rounded-xl border border-subtle text-text-secondary hover:text-heat-orange hover:border-heat-orange font-display font-bold text-sm uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Modifier cet aliment
            </button>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-6 py-5 border-t border-subtle safe-pb">
        <Button
          size="lg"
          fullWidth
          onClick={handleSave}
          disabled={saving || quantity <= 0}
        >
          {saving ? 'Enregistrement...' : `Ajouter au ${MEAL_LABELS[meal].toLowerCase()}`}
        </Button>
      </div>
    </div>
  );
}
