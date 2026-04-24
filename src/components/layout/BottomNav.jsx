import { NavLink } from 'react-router-dom';

/**
 * BottomNav v2 — barre d'onglets fixée en bas, design premium :
 *  - Glass blur backdrop
 *  - Barre indicatrice au-dessus de l'onglet actif
 *  - Icônes stroke fines plus raffinées
 *  - Labels minuscules élégants (pas d'UPPERCASE criard)
 */

function NavIcon({ children, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const NAV_ITEMS = [
  {
    to: '/',
    label: 'Accueil',
    end: true,
    icon: (
      <NavIcon>
        <path d="M3 9.75 12 3l9 6.75V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M9 22V12h6v10" />
      </NavIcon>
    ),
  },
  {
    to: '/journal',
    label: 'Journal',
    icon: (
      <NavIcon>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <line x1="16" y1="3" x2="16" y2="7" />
        <line x1="8" y1="3" x2="8" y2="7" />
        <line x1="3" y1="11" x2="21" y2="11" />
      </NavIcon>
    ),
  },
  {
    to: '/poids',
    label: 'Poids',
    icon: (
      <NavIcon>
        <path d="M3 17 9 11l4 4 8-8" />
        <polyline points="14 7 21 7 21 14" />
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

function NavItem({ to, label, icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className="flex-1 flex flex-col items-center py-2 press-down relative"
    >
      {({ isActive }) => (
        <>
          {/* Indicator line en haut */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full transition-all duration-300"
            style={{
              width: isActive ? '28px' : '0px',
              height: '3px',
              background: 'linear-gradient(90deg, #FFAA33, #FF4D00)',
              boxShadow: isActive ? '0 0 8px rgba(255, 77, 0, 0.5)' : 'none',
            }}
          />
          <div
            className="transition-colors"
            style={{
              color: isActive ? '#FFAA33' : 'rgba(255, 255, 255, 0.45)',
              marginTop: '6px',
            }}
          >
            {icon}
          </div>
          <span
            className="font-display font-semibold text-[10px] mt-1 tracking-wide"
            style={{
              color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)',
              letterSpacing: '0.02em',
            }}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 safe-pb glass border-t"
      style={{
        borderColor: 'rgba(255, 255, 255, 0.08)',
      }}
    >
      <div className="flex items-stretch max-w-lg mx-auto px-2">
        <NavItem {...NAV_ITEMS[0]} />
        <NavItem {...NAV_ITEMS[1]} />
        {/* Spacer pour FAB */}
        <div style={{ width: '72px', flexShrink: 0 }} />
        <NavItem {...NAV_ITEMS[2]} />
        <NavItem {...NAV_ITEMS[3]} />
      </div>
    </nav>
  );
}
