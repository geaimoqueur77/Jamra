import { NavLink } from 'react-router-dom';

/**
 * BottomNav — barre d'onglets fixe en bas
 * 4 sections : Accueil / Journal / Poids / Profil
 * (espace central laissé au FAB)
 */

function NavIcon({ children, className = '' }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {children}
    </svg>
  );
}

const NAV_ITEMS = [
  {
    to: '/',
    label: 'Accueil',
    icon: (
      <NavIcon>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </NavIcon>
    ),
  },
  {
    to: '/journal',
    label: 'Journal',
    icon: (
      <NavIcon>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </NavIcon>
    ),
  },
  // SPACE for FAB
  {
    to: '/poids',
    label: 'Poids',
    icon: (
      <NavIcon>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </NavIcon>
    ),
  },
  {
    to: '/profil',
    label: 'Profil',
    icon: (
      <NavIcon>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </NavIcon>
    ),
  },
];

export default function BottomNav() {
  const itemCls =
    'flex flex-col items-center gap-1 py-1.5 px-3 flex-1 transition-colors duration-200';

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 safe-pb pt-3 px-5 border-t border-subtle flex justify-around items-center"
      style={{
        background: 'rgba(10, 9, 8, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Accueil */}
      <NavLink
        to={NAV_ITEMS[0].to}
        end
        className={({ isActive }) =>
          `${itemCls} ${isActive ? 'text-heat-orange' : 'text-text-tertiary hover:text-text-secondary'}`
        }
      >
        {NAV_ITEMS[0].icon}
        <span className="font-display font-bold text-[10px] uppercase tracking-[0.1em]">
          {NAV_ITEMS[0].label}
        </span>
      </NavLink>

      {/* Journal */}
      <NavLink
        to={NAV_ITEMS[1].to}
        className={({ isActive }) =>
          `${itemCls} ${isActive ? 'text-heat-orange' : 'text-text-tertiary hover:text-text-secondary'}`
        }
      >
        {NAV_ITEMS[1].icon}
        <span className="font-display font-bold text-[10px] uppercase tracking-[0.1em]">
          {NAV_ITEMS[1].label}
        </span>
      </NavLink>

      {/* Spacer for FAB */}
      <div style={{ flex: 1 }} />

      {/* Poids */}
      <NavLink
        to={NAV_ITEMS[2].to}
        className={({ isActive }) =>
          `${itemCls} ${isActive ? 'text-heat-orange' : 'text-text-tertiary hover:text-text-secondary'}`
        }
      >
        {NAV_ITEMS[2].icon}
        <span className="font-display font-bold text-[10px] uppercase tracking-[0.1em]">
          {NAV_ITEMS[2].label}
        </span>
      </NavLink>

      {/* Profil */}
      <NavLink
        to={NAV_ITEMS[3].to}
        className={({ isActive }) =>
          `${itemCls} ${isActive ? 'text-heat-orange' : 'text-text-tertiary hover:text-text-secondary'}`
        }
      >
        {NAV_ITEMS[3].icon}
        <span className="font-display font-bold text-[10px] uppercase tracking-[0.1em]">
          {NAV_ITEMS[3].label}
        </span>
      </NavLink>
    </nav>
  );
}
