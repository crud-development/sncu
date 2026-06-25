import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function Dashboard() {
  const { user } = useAuth();

  const cards = [
    { to: '/puncte-lucru', title: 'Puncte de lucru', text: 'Configurează adresele de la care ridicăm SNCU.' },
    { to: '/contracte', title: 'Contracte', text: 'Generează și semnează electronic contractul cadru.' },
    { to: '/comenzi', title: 'Comenzi', text: 'Plasează și urmărește comenzile de ridicare.' },
  ];

  return (
    <>
      <div className="topbar">
        <div>
          <h1 className="page-title">Bun venit, {user?.companyName}</h1>
          <p className="muted">Status cont: {user?.status}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="card" style={{ display: 'block' }}>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>{c.title}</h3>
            <p className="muted" style={{ fontSize: 14 }}>{c.text}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
