import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Logo } from './Logo';
import { Icon } from './Icon';
import { ImpersonationBar } from './ImpersonationBar';

const clientLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/puncte-lucru', label: 'Puncte de lucru', icon: 'pin' },
  { to: '/contracte', label: 'Contracte', icon: 'contract' },
  { to: '/comenzi', label: 'Comenzi', icon: 'order' },
  { to: '/profil', label: 'Profil firmă', icon: 'building' },
];

const adminLinks = [
  { to: '/admin/clienti', label: 'Clienți', icon: 'users' },
  { to: '/admin/comenzi', label: 'Comenzi', icon: 'order' },
  { to: '/admin/contracte', label: 'Contracte', icon: 'contract' },
  { to: '/admin/facturi', label: 'Facturi', icon: 'card' },
  { to: '/admin/setari', label: 'Setări', icon: 'settings' },
];

function initials(name?: string) {
  if (!name) return 'B';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const links = isAdmin ? adminLinks : clientLinks;

  return (
    <>
      <ImpersonationBar />
      <div className="shell">
        <aside className="sidebar">
          <div className="sidebar__brand">
            <Logo height={30} />
          </div>

          <div className="side-label">{isAdmin ? 'Administrare' : 'Meniu'}</div>
          <nav className="nav">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to}>
                <Icon name={l.icon} size={19} />
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="side-user">
            <span className="side-user__avatar">{initials(user?.companyName)}</span>
            <div className="side-user__info">
              <div className="side-user__name">{user?.companyName}</div>
              <div className="side-user__role">{isAdmin ? 'Administrator' : 'Client'}</div>
            </div>
            <button
              className="icon-btn"
              title="Deconectare"
              aria-label="Deconectare"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              <Icon name="logout" size={18} />
            </button>
          </div>
        </aside>

        <main className="main">
          <Outlet />
        </main>
      </div>
    </>
  );
}
