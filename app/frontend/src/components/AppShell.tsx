import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Logo } from './Logo';

const clientLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/puncte-lucru', label: 'Puncte de lucru' },
  { to: '/comenzi', label: 'Comenzi' },
  { to: '/contracte', label: 'Contracte' },
];

const adminLinks = [
  { to: '/admin/clienti', label: 'Clienți' },
  { to: '/admin/comenzi', label: 'Comenzi' },
  { to: '/admin/contracte', label: 'Contracte' },
  { to: '/admin/setari', label: 'Setări' },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = user?.role === 'admin' ? adminLinks : clientLinks;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <Logo height={32} />
        </div>
        <nav className="nav">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', padding: '12px 8px' }}>
          <p className="muted" style={{ fontSize: 13, marginBottom: 10 }}>
            {user?.companyName}
          </p>
          <button
            className="btn btn--ghost btn--block"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Deconectare
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
