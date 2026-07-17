import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { Icon } from '../components/Icon';
import {
  listContracts,
  listOrders,
  listWorkpoints,
} from '../lib/resources';

function fmt(d?: string) {
  return d ? new Date(d).toLocaleDateString('ro-RO') : '—';
}

export function Dashboard() {
  const { user } = useAuth();
  const wpQ = useQuery({ queryKey: ['workpoints'], queryFn: listWorkpoints });
  const contractsQ = useQuery({ queryKey: ['contracts'], queryFn: listContracts });
  const ordersQ = useQuery({ queryKey: ['orders'], queryFn: listOrders });

  const workpoints = wpQ.data ?? [];
  const contracts = contractsQ.data ?? [];
  const orders = ordersQ.data ?? [];

  const activeContract = contracts.find(
    (c) => c.status === 'Semnat' && c.expiresAt && new Date(c.expiresAt) > new Date(),
  );
  const openOrders = orders.filter((o) => o.status === 'Plasată' || o.status === 'Confirmată').length;

  const stats = [
    { icon: 'pin', label: 'Puncte de lucru', value: workpoints.length },
    { icon: 'contract', label: 'Contracte active', value: contracts.filter((c) => c.status === 'Semnat').length, tone: '' },
    { icon: 'order', label: 'Comenzi în lucru', value: openOrders, tone: 'blue' },
  ];

  const actions = [
    { to: '/puncte-lucru', icon: 'pin', title: 'Puncte de lucru', text: 'Configurează adresele de la care ridicăm SNCU și datele administratorului.' },
    { to: '/contracte', icon: 'contract', title: 'Contracte', text: 'Generează și semnează electronic contractul cadru, descarcă PDF-ul.' },
    { to: '/comenzi', icon: 'order', title: 'Comenzi', text: 'Plasează și urmărește comenzile de ridicare a SNCU.' },
  ];

  return (
    <>
      <div className="topbar">
        <div className="page-head">
          <span className="page-head__icon"><Icon name="dashboard" /></span>
          <div>
            <h1 className="page-title">Bun venit, {user?.companyName}</h1>
            <p className="page-head__sub">Privire de ansamblu asupra contului tău SNCU.</p>
          </div>
        </div>
      </div>

      {/* Banner status contract */}
      {!contractsQ.isLoading && (
        activeContract ? (
          <div className="alert alert--success" style={{ marginBottom: 22 }}>
            <Icon name="shield" size={18} />
            <span>
              Contract activ <strong>{activeContract.contractNo}</strong> · valabil până la{' '}
              <strong>{fmt(activeContract.expiresAt)}</strong>. Ești conform.
            </span>
          </div>
        ) : (
          <div className="alert alert--info" style={{ marginBottom: 22 }}>
            <Icon name="alert" size={18} />
            <span>
              Nu ai un contract activ. <Link to="/puncte-lucru">Configurează un punct de lucru și generează contractul</Link> ca să poți plasa comenzi.
            </span>
          </div>
        )
      )}

      {/* Statistici */}
      <div className="stat-grid" style={{ marginBottom: 26 }}>
        {stats.map((s) => (
          <div key={s.label} className="stat">
            <div className="stat__top">
              <span className={`stat__icon ${s.tone === 'blue' ? 'stat__icon--blue' : ''}`}>
                <Icon name={s.icon} />
              </span>
            </div>
            <div className="stat__value">{s.value}</div>
            <div className="stat__label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Acțiuni rapide */}
      <div className="side-label" style={{ padding: '0 0 12px' }}>Acțiuni rapide</div>
      <div className="stat-grid">
        {actions.map((a) => (
          <Link key={a.to} to={a.to} className="action-card card--link">
            <span className="action-card__icon"><Icon name={a.icon} /></span>
            <div className="action-card__title">{a.title}</div>
            <p className="action-card__text">{a.text}</p>
            <span className="action-card__cta">Deschide <Icon name="arrow" size={16} /></span>
          </Link>
        ))}
      </div>
    </>
  );
}
