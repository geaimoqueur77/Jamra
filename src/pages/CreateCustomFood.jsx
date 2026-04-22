import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { createCustomFood, updateCustomFood, deleteCustomFood, getFood, getProfile, todayISO } from '../db/database';
import { FOOD_CATEGORIES, CATEGORY_ICONS } from '../db/foodsDataset';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';

function Field({ label, hint, children, unit, required }) {
  return (
    <div className="mb-4">
      <label className="flex justify-between items-baseline mb-1.5">
        <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-text-tertiary">
          {label}{required && <span className="text-heat-orange ml-0.5">*</span>}
        </span>
        {unit && (
          <span className="font-mono text-[10px] tracking-wider text-text-tertiary">{unit}</span>
        )}
      </label>
      {children}
      {hint && (
        <div className="font-mono text-[10px] tracking-wider text-text-tertiary mt-1">{hint}</div>
      )}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, ...rest }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-3 bg-bg-surface1 border border-subtle rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-heat-orange transition-colors"
      {...rest}
    />
  );
}

function NumberInput({ value, onChange, placeholder = '0', step = '0.1', min = '0' }) {
  return (
    <input
      type="number"
      inputMode="decimal"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      step={step}
      min={min}
      className="w-full px-4 py-3 bg-bg-surface1 border border-subtle rounded-xl font-mono text-sm text-text-primary tabular-nums text-right focus:outline-none focus:border-heat-orange transition-colors"
    />
  );
}

export default function CreateCustomFood() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const meal = searchParams.get('meal') || 'collation';
  const date = searchParams.get('date') || todayISO();
  const prefilledName = searchParams.get('nom') || '';
  const editId = searchParams.get('edit');
  const isEditMode = !!editId;

  const [form, setForm] = useState({
    nom: prefilledName,
    marque: '',
    categorie: 'Plats préparés & snacks',
    kcal_100g: '',
    proteines_100g: '',
    glucides_100g: '',
    sucres_100g: '',
    lipides_100g: '',
    satures_100g: '',
    fibres_100g: '',
    sel_100g: '',
    portion_defaut_g: '',
    portion_defaut_nom: '',
    is_shared: false,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [showDelete, setShowDelete] = useState(false);

  const profile = useLiveQuery(getProfile);
  const hasWorkspace = !!profile?.workspace_id;

  // Pré-charger en mode édition
  useEffect(() => {
    if (!isEditMode) return;
    (async () => {
      const food = await getFood(editId);
      if (!food || food.source !== 'perso') {
        navigate(-1);
        return;
      }
      const toStr = (v) => v == null ? '' : String(v);
      setForm({
        nom: food.nom || '',
        marque: food.marque || '',
        categorie: food.categorie || 'Plats préparés & snacks',
        kcal_100g: toStr(food.kcal_100g),
        proteines_100g: toStr(food.proteines_100g),
        glucides_100g: toStr(food.glucides_100g),
        sucres_100g: toStr(food.sucres_100g),
        lipides_100g: toStr(food.lipides_100g),
        satures_100g: toStr(food.satures_100g),
        fibres_100g: toStr(food.fibres_100g),
        sel_100g: toStr(food.sel_100g),
        portion_defaut_g: toStr(food.portion_defaut_g),
        portion_defaut_nom: food.portion_defaut_nom || '',
        is_shared: food.is_shared || false,
      });
    })();
  }, [editId, isEditMode, navigate]);

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.nom.trim()) errs.nom = 'Requis';
    if (form.kcal_100g === '' || Number(form.kcal_100g) < 0) errs.kcal_100g = 'Requis';
    if (form.proteines_100g === '' || Number(form.proteines_100g) < 0) errs.proteines_100g = 'Requis';
    if (form.glucides_100g === '' || Number(form.glucides_100g) < 0) errs.glucides_100g = 'Requis';
    if (form.lipides_100g === '' || Number(form.lipides_100g) < 0) errs.lipides_100g = 'Requis';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const num = (v) => v === '' || v == null ? null : Number(String(v).replace(',', '.'));

  const handleSave = async () => {
    if (!validate() || saving) return;
    setSaving(true);
    try {
      const payload = {
        nom: form.nom.trim(),
        marque: form.marque.trim() || null,
        categorie: form.categorie,
        kcal_100g: Math.round(num(form.kcal_100g) || 0),
        proteines_100g: Math.round((num(form.proteines_100g) || 0) * 10) / 10,
        glucides_100g: Math.round((num(form.glucides_100g) || 0) * 10) / 10,
        sucres_100g: num(form.sucres_100g) != null ? Math.round(num(form.sucres_100g) * 10) / 10 : null,
        lipides_100g: Math.round((num(form.lipides_100g) || 0) * 10) / 10,
        satures_100g: num(form.satures_100g) != null ? Math.round(num(form.satures_100g) * 10) / 10 : null,
        fibres_100g: num(form.fibres_100g) != null ? Math.round(num(form.fibres_100g) * 10) / 10 : null,
        sel_100g: num(form.sel_100g) != null ? Math.round(num(form.sel_100g) * 100) / 100 : null,
        portion_defaut_g: num(form.portion_defaut_g),
        portion_defaut_nom: form.portion_defaut_nom.trim() || null,
        is_shared: hasWorkspace ? form.is_shared : false,
        workspace_id: hasWorkspace && form.is_shared ? profile.workspace_id : null,
      };

      if (isEditMode) {
        await updateCustomFood(editId, payload);
        navigate(`/aliment/${editId}?meal=${meal}&date=${date}`);
      } else {
        const id = await createCustomFood(payload);
        navigate(`/aliment/${id}?meal=${meal}&date=${date}`);
      }
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode) return;
    try {
      await deleteCustomFood(editId);
      navigate('/', { replace: true });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <Header
        variant="title"
        title={isEditMode ? "Modifier l'aliment" : "Créer un aliment"}
        onBack={() => navigate(-1)}
      />

      <div className="flex-1 overflow-y-auto px-6 pt-2 pb-6">
        {/* Info */}
        <div className="mb-5 p-3 bg-bg-surface1 border border-subtle rounded-xl">
          <div className="font-mono text-[10px] tracking-[0.1em] text-text-tertiary uppercase">
            Les valeurs sont saisies pour <span className="text-heat-amber font-bold">100 g</span> du produit
          </div>
        </div>

        {/* Identification */}
        <div className="mb-6">
          <div className="font-display font-bold text-[11px] uppercase tracking-[0.12em] text-text-tertiary mb-3">
            Identification
          </div>
          <Field label="Nom" required>
            <TextInput
              value={form.nom}
              onChange={v => update('nom', v)}
              placeholder="Ex : Salade quinoa maison"
              autoFocus
            />
            {errors.nom && <div className="text-danger text-xs mt-1">{errors.nom}</div>}
          </Field>
          <Field label="Marque (optionnel)">
            <TextInput
              value={form.marque}
              onChange={v => update('marque', v)}
              placeholder="Ex : Recette maman"
            />
          </Field>
          <Field label="Catégorie">
            <div className="grid grid-cols-3 gap-2">
              {FOOD_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => update('categorie', cat)}
                  className={`
                    px-2 py-2 rounded-lg text-left transition-all
                    ${form.categorie === cat
                      ? 'border border-heat-orange bg-gradient-to-br from-[rgba(255,170,51,0.1)] to-[rgba(255,23,68,0.1)]'
                      : 'border border-subtle bg-bg-surface1 hover:border-strong'
                    }
                  `}
                >
                  <div className="text-lg leading-none mb-1">{CATEGORY_ICONS[cat]}</div>
                  <div className="font-mono text-[9px] leading-tight tracking-wider uppercase text-text-secondary">
                    {cat.replace(' & ', '/')}
                  </div>
                </button>
              ))}
            </div>
          </Field>
        </div>

        {/* Valeurs principales */}
        <div className="mb-6">
          <div className="font-display font-bold text-[11px] uppercase tracking-[0.12em] text-text-tertiary mb-3">
            Pour 100 g — macros principales
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Calories" unit="kcal" required>
              <NumberInput value={form.kcal_100g} onChange={v => update('kcal_100g', v)} step="1" />
              {errors.kcal_100g && <div className="text-danger text-xs mt-1">{errors.kcal_100g}</div>}
            </Field>
            <Field label="Protéines" unit="g" required>
              <NumberInput value={form.proteines_100g} onChange={v => update('proteines_100g', v)} />
              {errors.proteines_100g && <div className="text-danger text-xs mt-1">{errors.proteines_100g}</div>}
            </Field>
            <Field label="Glucides" unit="g" required>
              <NumberInput value={form.glucides_100g} onChange={v => update('glucides_100g', v)} />
              {errors.glucides_100g && <div className="text-danger text-xs mt-1">{errors.glucides_100g}</div>}
            </Field>
            <Field label="Lipides" unit="g" required>
              <NumberInput value={form.lipides_100g} onChange={v => update('lipides_100g', v)} />
              {errors.lipides_100g && <div className="text-danger text-xs mt-1">{errors.lipides_100g}</div>}
            </Field>
          </div>
        </div>

        {/* Détails nutritionnels */}
        <div className="mb-6">
          <div className="font-display font-bold text-[11px] uppercase tracking-[0.12em] text-text-tertiary mb-3">
            Détails (optionnel)
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="dont sucres" unit="g">
              <NumberInput value={form.sucres_100g} onChange={v => update('sucres_100g', v)} />
            </Field>
            <Field label="dont saturés" unit="g">
              <NumberInput value={form.satures_100g} onChange={v => update('satures_100g', v)} />
            </Field>
            <Field label="Fibres" unit="g">
              <NumberInput value={form.fibres_100g} onChange={v => update('fibres_100g', v)} />
            </Field>
            <Field label="Sel" unit="g">
              <NumberInput value={form.sel_100g} onChange={v => update('sel_100g', v)} step="0.01" />
            </Field>
          </div>
        </div>

        {/* Portion par défaut */}
        <div className="mb-6">
          <div className="font-display font-bold text-[11px] uppercase tracking-[0.12em] text-text-tertiary mb-3">
            Portion par défaut (optionnel)
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Poids" unit="g" hint="Ex : 1 yaourt = 125 g">
              <NumberInput value={form.portion_defaut_g} onChange={v => update('portion_defaut_g', v)} step="1" />
            </Field>
            <Field label="Description">
              <TextInput
                value={form.portion_defaut_nom}
                onChange={v => update('portion_defaut_nom', v)}
                placeholder="1 yaourt"
              />
            </Field>
          </div>
        </div>

        {/* Partage dans le foyer (Phase 4.C) */}
        {hasWorkspace && (
          <div className="mb-6">
            <div className="font-display font-bold text-[11px] uppercase tracking-[0.12em] text-text-tertiary mb-3">
              Partage
            </div>
            <button
              type="button"
              onClick={() => update('is_shared', !form.is_shared)}
              className={`
                w-full p-4 rounded-xl border flex items-start gap-3 text-left transition-all
                ${form.is_shared
                  ? 'border-heat-orange bg-gradient-to-br from-[rgba(255,170,51,0.08)] to-[rgba(255,23,68,0.08)]'
                  : 'border-subtle bg-bg-surface1'
                }
              `}
            >
              <div className={`
                w-10 h-6 rounded-full relative transition-all flex-shrink-0 mt-0.5
                ${form.is_shared ? 'bg-gradient-to-r from-heat-amber to-heat-orange' : 'bg-bg-surface2'}
              `}>
                <div className={`
                  absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all
                  ${form.is_shared ? 'left-[18px]' : 'left-0.5'}
                `} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-sm uppercase tracking-[0.04em] text-text-primary flex items-center gap-2">
                  🏠 Partager dans le foyer
                </div>
                <div className="font-body text-xs text-text-secondary mt-1">
                  {form.is_shared
                    ? 'Tous les membres de ton foyer pourront utiliser cet aliment.'
                    : 'Cet aliment reste privé, visible uniquement par toi.'
                  }
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Zone danger (mode édition uniquement) */}
        {isEditMode && (
          <div className="mb-4">
            {!showDelete ? (
              <button
                onClick={() => setShowDelete(true)}
                className="w-full py-3 rounded-xl border border-subtle text-danger text-sm font-display font-bold uppercase tracking-[0.1em] hover:bg-[rgba(255,23,68,0.05)] transition-all"
              >
                Supprimer cet aliment
              </button>
            ) : (
              <div className="p-4 rounded-xl border border-danger bg-[rgba(255,23,68,0.05)]">
                <p className="text-sm text-text-primary mb-2">
                  Supprimer cet aliment de ta liste ?
                </p>
                <p className="text-xs text-text-tertiary mb-3">
                  Les consommations passées qui l'utilisent ne seront pas effacées (historique figé).
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" fullWidth onClick={() => setShowDelete(false)}>
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
        )}
      </div>

      {/* CTA */}
      <div className="px-6 py-5 border-t border-subtle safe-pb">
        <Button fullWidth size="lg" onClick={handleSave} disabled={saving}>
          {saving
            ? (isEditMode ? 'Sauvegarde...' : 'Création...')
            : isEditMode
              ? 'Enregistrer les modifications'
              : 'Créer et choisir la quantité'
          }
        </Button>
      </div>
    </div>
  );
}
