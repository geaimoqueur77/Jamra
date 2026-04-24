import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMealEntry, getFood, updateMealEntry, deleteMealEntry } from '../db/database';
import { CATEGORY_ICONS } from '../db/foodsDataset';
import { formatNumber } from '../utils/format';
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

export default function EditEntry() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [entry, setEntry] = useState(null);
  const [food, setFood] = useState(null);
  const [quantity, setQuantity] = useState(100);
  const [inputValue, setInputValue] = useState('100');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    (async () => {
      const e = await getMealEntry(id);
      if (!e) {
        navigate(-1);
        return;
      }
      setEntry(e);
      setQuantity(e.quantite_g);
      setInputValue(String(e.quantite_g));
      const f = await getFood(e.aliment_id);
      setFood(f);
    })();
  }, [id, navigate]);

  if (!entry || !food) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-text-tertiary font-mono text-sm">
        Chargement...
      </div>
    );
  }

  const factor = quantity / 100;
  const calc = (v) => v != null ? Math.round(v * factor * 10) / 10 : null;
  const calcInt = (v) => v != null ? Math.round(v * factor) : null;

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
      await updateMealEntry(id, { quantite_g: quantity });
      navigate('/', { replace: true });
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await deleteMealEntry(id);
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <Header variant="title" title={`Modifier · ${MEAL_LABELS[entry.type_repas]}`} onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto pb-6">
        {/* Hero */}
        <div className="px-6 py-6 text-center">
          <div className="text-3xl mb-3">{CATEGORY_ICONS[food.categorie] || '🍽️'}</div>
          <div className="font-display font-bold text-2xl uppercase tracking-[0.02em] text-text-primary px-2">
            {food.nom}
          </div>
          <div className="font-mono text-[10px] text-text-tertiary tracking-[0.2em] uppercase mt-2">
            {food.source === 'ciqual' ? 'CIQUAL' : food.source === 'openfoodfacts' ? 'OFF' : 'Perso'} · {food.categorie}
          </div>
        </div>

        {/* Quantity */}
        <div className="mx-6 mb-5 p-6 surface-card rounded-2xl text-center">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-tertiary mb-3">
            Quantité
          </div>
          <div className="flex items-baseline justify-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              value={inputValue}
              onChange={e => handleInputChange(e.target.value)}
              className="w-32 bg-transparent border-none outline-none text-center font-display font-extrabold text-6xl leading-none tracking-tight text-heat-gradient"
              min="0"
              step="5"
            />
            <span className="font-display font-bold text-xl text-text-secondary">g</span>
          </div>
        </div>

        {/* Quick buttons */}
        <div className="px-6 mb-6">
          <div className="grid grid-cols-3 gap-2">
            {QUICK_QUANTITIES.map(q => (
              <button
                key={q}
                onClick={() => handleQuickQty(q)}
                className={`
                  py-3 rounded-xl border font-mono text-sm font-semibold
                  transition-all duration-200
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
        <div className="mx-6 mb-6 p-5 surface-card rounded-2xl">
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

        {/* Delete zone */}
        <div className="px-6 mb-4">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3 rounded-xl border border-subtle text-danger text-sm font-display font-bold uppercase tracking-[0.1em] hover:bg-[rgba(255,23,68,0.05)] transition-all"
            >
              Supprimer cette entrée
            </button>
          ) : (
            <div className="p-4 rounded-xl border border-danger bg-[rgba(255,23,68,0.05)]">
              <p className="text-sm text-text-primary mb-3">
                Supprimer cette entrée ? Irréversible.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" fullWidth onClick={() => setShowDeleteConfirm(false)}>
                  Annuler
                </Button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2 rounded-xl bg-danger text-white font-display font-bold text-xs uppercase tracking-[0.1em]"
                >
                  Supprimer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 py-5 border-t border-subtle safe-pb">
        <Button size="lg" fullWidth onClick={handleSave} disabled={saving || quantity <= 0}>
          {saving ? 'Enregistrement...' : 'Valider les modifications'}
        </Button>
      </div>
    </div>
  );
}
