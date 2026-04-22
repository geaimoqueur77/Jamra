import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { searchFoods, getFavoriteFoods, getRecentFoods } from '../db/database';
import { CATEGORY_ICONS } from '../db/foodsDataset';
import { formatKcal } from '../utils/format';
import Header from '../components/layout/Header';

const MEAL_LABELS = {
  petit_dej: 'Petit-déjeuner',
  dejeuner:  'Déjeuner',
  diner:     'Dîner',
  collation: 'Collation',
};

function FoodItem({ food, onClick }) {
  const icon = CATEGORY_ICONS[food.categorie] || '🍽️';
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 p-3 rounded-xl hover:bg-bg-surface1 transition-colors"
    >
      <div className="w-10 h-10 rounded-lg bg-bg-surface2 flex items-center justify-center text-xl flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-body font-semibold text-sm truncate">{food.nom}</div>
        <div className="font-mono text-[10px] text-text-tertiary uppercase tracking-wider">
          {formatKcal(food.kcal_100g)} kcal / 100 g · {food.categorie}
        </div>
      </div>
      {food.source === 'ciqual' && (
        <div className="font-mono text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider bg-[rgba(0,230,118,0.15)] text-success">
          CIQUAL
        </div>
      )}
      {food.source === 'openfoodfacts' && (
        <div className="font-mono text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider bg-[rgba(51,170,255,0.15)] text-[#33AAFF]">
          OFF
        </div>
      )}
      {food.source === 'perso' && (
        <div className="font-mono text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider bg-[rgba(255,170,51,0.15)] text-heat-amber">
          PERSO
        </div>
      )}
      {food.is_favori && (
        <div className="text-heat-amber text-sm">★</div>
      )}
    </button>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="font-display font-bold text-[13px] uppercase tracking-[0.12em] text-text-secondary">
          {title}
        </div>
        {subtitle && (
          <div className="font-mono text-[10px] text-text-tertiary tracking-wider">
            {subtitle}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

export default function Add() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const meal = searchParams.get('meal') || 'collation';
  const date = searchParams.get('date');

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [recents, setRecents] = useState([]);

  // Load favorites and recents on mount
  useEffect(() => {
    (async () => {
      const [favs, recs] = await Promise.all([
        getFavoriteFoods(20),
        getRecentFoods(15),
      ]);
      setFavorites(favs);
      setRecents(recs);
    })();
  }, []);

  // Search as user types
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    searchFoods(query, 50).then(r => {
      if (!cancelled) setResults(r);
    });
    return () => { cancelled = true; };
  }, [query]);

  const handleFoodClick = (food) => {
    const params = new URLSearchParams();
    params.set('meal', meal);
    if (date) params.set('date', date);
    navigate(`/aliment/${food.id}?${params.toString()}`);
  };

  return (
    <div>
      <Header
        variant="title"
        title={`Ajouter · ${MEAL_LABELS[meal]}`}
        onBack={() => navigate(-1)}
      />

      {/* Search bar */}
      <div className="px-6 pb-2">
        <div className="flex items-center gap-3 px-4 py-3.5 bg-bg-surface1 border border-subtle rounded-xl">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary flex-shrink-0">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher un aliment..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-tertiary"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-text-tertiary hover:text-text-primary"
              aria-label="Effacer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Actions rapides */}
      <div className="px-6 pt-2 pb-1 grid grid-cols-3 gap-2">
        <button
          onClick={() => {
            const p = new URLSearchParams({ meal, ...(date ? { date } : {}) });
            navigate(`/scanner?${p.toString()}`);
          }}
          className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border border-subtle bg-bg-surface1 hover:border-heat-orange transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-heat-orange">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <line x1="7" y1="8" x2="7" y2="16" />
            <line x1="10" y1="8" x2="10" y2="16" />
            <line x1="13" y1="8" x2="13" y2="16" />
            <line x1="17" y1="8" x2="17" y2="16" />
          </svg>
          <div className="font-display font-bold text-[10px] uppercase tracking-[0.08em] text-text-primary">Code-barres</div>
        </button>
        <button
          onClick={() => {
            const p = new URLSearchParams({ meal, ...(date ? { date } : {}) });
            if (query.trim()) p.set('nom', query.trim());
            navigate(`/creer-aliment?${p.toString()}`);
          }}
          className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border border-subtle bg-bg-surface1 hover:border-heat-orange transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-heat-orange">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <div className="font-display font-bold text-[10px] uppercase tracking-[0.08em] text-text-primary">Créer perso</div>
        </button>
        <button
          onClick={() => {
            const p = new URLSearchParams({ meal, ...(date ? { date } : {}) });
            navigate(`/copier-repas?${p.toString()}`);
          }}
          className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border border-subtle bg-bg-surface1 hover:border-heat-orange transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-heat-orange">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <div className="font-display font-bold text-[10px] uppercase tracking-[0.08em] text-text-primary">Copier un jour</div>
        </button>
      </div>

      {/* Results / default */}
      {query.trim() ? (
        <Section title="Résultats" subtitle={`${results.length}`}>
          {results.length === 0 ? (
            <div className="text-center py-10 animate-fade-in">
              <div className="text-text-tertiary text-sm mb-3">Aucun résultat pour "{query}"</div>
              <button
                onClick={() => {
                  const p = new URLSearchParams({ meal, ...(date ? { date } : {}) });
                  p.set('nom', query.trim());
                  navigate(`/creer-aliment?${p.toString()}`);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-heat-orange text-heat-orange font-display font-bold text-xs uppercase tracking-[0.1em] hover:bg-[rgba(255,77,0,0.08)] transition-colors"
              >
                + Créer "{query}" comme aliment perso
              </button>
            </div>
          ) : (
            results.map(food => (
              <FoodItem key={food.id} food={food} onClick={() => handleFoodClick(food)} />
            ))
          )}
        </Section>
      ) : (
        <>
          {favorites.length > 0 && (
            <Section title="★ Favoris" subtitle={String(favorites.length)}>
              {favorites.map(food => (
                <FoodItem key={food.id} food={food} onClick={() => handleFoodClick(food)} />
              ))}
            </Section>
          )}
          {recents.length > 0 && (
            <Section title="⌛ Récents" subtitle="14 JOURS">
              {recents.map(food => (
                <FoodItem key={food.id} food={food} onClick={() => handleFoodClick(food)} />
              ))}
            </Section>
          )}
          {favorites.length === 0 && recents.length === 0 && (
            <div className="text-center py-16 px-6 animate-fade-in">
              <div className="text-4xl mb-3">🔎</div>
              <div className="font-display font-bold text-lg mb-2">Commence par chercher</div>
              <div className="text-text-secondary text-sm">
                Tape le nom d'un aliment dans la barre de recherche ci-dessus. Tes favoris et aliments récents apparaîtront ici.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
