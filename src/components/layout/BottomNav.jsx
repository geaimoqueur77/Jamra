import { NavLink } from 'react-router-dom';

function NavIcon({ children }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </NavIcon>
    ),
  },
  {
    to: '/sport',
    label: 'Sport',
    icon: (
      <NavIcon>
        <path d="M6.5 6.5a5 5 0 0 0 0 11h11a5 5 0 0 0 0-11H6.5z" />
        <line x1="2" y1="12" x2="6.5" y2="12" />
        <line x1="17.5" y1="12" x2="22" y2="12" />
        <line x1="12" y1="6.5" x2="12" y2="2" />
        <line x1="12" y1="22" x2="12" y2="17.5" />
      </NavIcon>
    ),
  },
  // SPACE for FAB
  {
    to: '/corps',
    label: 'Corps',
    icon: (
      <NavIcon>
        <path d="M12 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
        <path d="M6.5 8a1 1 0 0 0-.9.6L3 15h18l-2.6-6.4A1 1 0 0 0 17.5 8h-11z" />
        <path d="M3 15l2 7h14l2-7" />
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
  const itemCls = 'flex flex-col items-center gap-1 py-1.5 px-3 flex-1 transition-colors duration-200';

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 safe-pb pt-3 px-5 border-t border-subtle flex justify-around items-center"
      style={{
        background: 'rgba(10, 9, 8, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {NAV_ITEMS.slice(0, 2).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `${itemCls} ${isActive ? 'text-heat-orange' : 'text-text-tertiary hover:text-text-secondary'}`
          }
        >
          {item.icon}
          <span className="font-display font-bold text-[10px] uppercase tracking-[0.1em]">
            {item.label}
          </span>
        </NavLink>
      ))}

      {/* Spacer for FAB */}
      <div style={{ flex: 1 }} />

      {NAV_ITEMS.slice(2).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `${itemCls} ${isActive ? 'text-heat-orange' : 'text-text-tertiary hover:text-text-secondary'}`
          }
        >
          {item.icon}
          <span className="font-display font-bold text-[10px] uppercase tracking-[0.1em]">
            {item.label}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}
