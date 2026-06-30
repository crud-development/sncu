import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiError } from '../../lib/api';
import { Icon } from '../../components/Icon';
import { Modal } from '../../components/Modal';
import { TableSkeleton } from '../../components/Skeleton';
import {
  CATEGORII_SNCU,
  ORIGINE_PRODUS,
  STARE_PRODUS,
  TIP_AMBALARE,
} from '../../lib/constants';
import {
  adminClientWorkpoints,
  adminCreateOrder,
  adminListClients,
  adminListOrders,
  adminSetOrderCost,
  adminSetOrderStatus,
  downloadAdminOrderPdf,
  type AdminOrder,
  type OrderStatus,
  type Workpoint,
} from '../../lib/resources';

const NEXT: Record<OrderStatus, OrderStatus[]> = {
  Plasată: ['Confirmată', 'Anulată'],
  Confirmată: ['Onorată', 'Anulată'],
  Onorată: [],
  Anulată: [],
};

const STATUS_CLASS: Record<OrderStatus, string> = {
  Plasată: 'badge--amber',
  Confirmată: 'badge--green',
  Onorată: 'badge--gray',
  Anulată: 'badge--red',
};

export function AdminComenzi() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-orders'], queryFn: adminListOrders });
  const [addOpen, setAddOpen] = useState(false);

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminSetOrderStatus(id, status),
    meta: { successMessage: 'Status actualizat. Clientul a fost notificat.' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-orders'] }),
  });

  if (isLoading) return <TableSkeleton cols={9} />;
  const orders = data ?? [];

  return (
    <>
      <div className="topbar">
        <div className="page-head">
          <span className="page-head__icon"><Icon name="order" /></span>
          <div>
            <h1 className="page-title">Comenzi</h1>
            <p className="page-head__sub">Adaugă, schimbă statusul, setează costul, descarcă cererile.</p>
          </div>
        </div>
        <button className="btn btn--primary" onClick={() => setAddOpen(true)}>
          <Icon name="plus" size={17} /> Adaugă comandă
        </button>
      </div>
      {addOpen && <AdminOrderForm onClose={() => setAddOpen(false)} onSaved={() => { setAddOpen(false); qc.invalidateQueries({ queryKey: ['admin-orders'] }); }} />}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Nr.</th><th>Firmă</th><th>CUI</th><th>Tip SNCU</th><th>Cantitate</th>
              <th>Dată</th><th>Status</th><th>Cost estimat</th><th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <OrderRow key={o.id} order={o}
                onStatus={(status) => setStatus.mutate({ id: o.id, status })} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function OrderRow({ order, onStatus }: { order: AdminOrder; onStatus: (s: string) => void }) {
  const qc = useQueryClient();
  const [cost, setCost] = useState(order.estimatedCost?.toString() ?? '');
  const saveCost = useMutation({
    mutationFn: () => adminSetOrderCost(order.id, Number(cost)),
    meta: { successMessage: 'Cost estimat salvat.' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-orders'] }),
  });
  const next = NEXT[order.status];

  return (
    <tr>
      <td>{order.orderNo}</td>
      <td>{order.companyName || '—'}</td>
      <td>{order.cui || '—'}</td>
      <td>{order.sncuCategory}</td>
      <td>{order.estimatedQuantityKg} kg</td>
      <td>{new Date(order.createdAt).toLocaleDateString('ro-RO')}</td>
      <td>
        <span className={`badge ${STATUS_CLASS[order.status]}`}>{order.status}</span>
        {next.length > 0 && (
          <select className="select" style={{ marginTop: 6, padding: '4px 8px', fontSize: 12 }}
            value="" onChange={(e) => e.target.value && onStatus(e.target.value)}>
            <option value="">Schimbă în…</option>
            {next.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </td>
      <td>
        <div style={{ display: 'flex', gap: 6 }}>
          <input className="input" style={{ width: 90, padding: '6px 8px' }} type="number"
            value={cost} onChange={(e) => setCost(e.target.value)} placeholder="lei" />
          <button className="btn btn--ghost btn--sm" disabled={!cost || saveCost.isPending}
            onClick={() => saveCost.mutate()}>✓</button>
        </div>
      </td>
      <td style={{ textAlign: 'right' }}>
        <button className="btn btn--ghost btn--sm" onClick={() => downloadAdminOrderPdf(order.id)}>PDF</button>
      </td>
    </tr>
  );
}

/* ─── 4.2.2: adăugare comandă din admin (status auto Confirmată) ─── */
function AdminOrderForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [error, setError] = useState('');
  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<any>();
  const clientId = watch('clientId');

  const clientsQ = useQuery({ queryKey: ['admin-clients'], queryFn: adminListClients });
  const wpQ = useQuery({
    queryKey: ['admin-client-workpoints', clientId],
    queryFn: () => adminClientWorkpoints(clientId),
    enabled: Boolean(clientId),
  });
  const workpoints: Workpoint[] = wpQ.data ?? [];

  function onWpChange(id: string) {
    const wp = workpoints.find((w) => w._id === id);
    if (wp) {
      setValue('exactAddress', wp.address);
      setValue('activity', wp.tipActivitate);
      setValue('sanitaryAuthNumber', wp.sanitaryAuthNumber);
      setValue('contactPerson', wp.contactPerson ?? '');
      setValue('contactPhone', wp.contactPhone ?? '');
    }
  }

  async function onSubmit(values: any) {
    setError('');
    try {
      await adminCreateOrder({
        ...values,
        estimatedQuantityKg: Number(values.estimatedQuantityKg),
        accountingValue: values.accountingValue ? Number(values.accountingValue) : undefined,
      });
      onSaved();
    } catch (e) {
      setError(apiError(e));
    }
  }

  return (
    <Modal title="Adaugă comandă (din admin)" onClose={onClose} wide>
      {error && <div className="alert alert--error">{error}</div>}
      <p className="muted" style={{ fontSize: 14, marginBottom: 16 }}>
        Comanda primește automat status <strong>Confirmată</strong> și clientul este notificat pe email.
      </p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-grid">
          <div className="field">
            <label>Client *</label>
            <select className="select" {...register('clientId', { required: true })}
              onChange={(e) => { setValue('clientId', e.target.value); setValue('workpointId', ''); }}>
              <option value="">Alege clientul…</option>
              {(clientsQ.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.companyName} · {c.cui}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Punct de lucru *</label>
            <select className="select" disabled={!clientId} {...register('workpointId', { required: true })}
              onChange={(e) => { setValue('workpointId', e.target.value); onWpChange(e.target.value); }}>
              <option value="">{clientId ? 'Alege…' : 'Alege clientul întâi'}</option>
              {workpoints.map((w) => <option key={w._id} value={w._id}>{w.denumire || w.address}</option>)}
            </select>
          </div>
          <div className="field"><label>Data dorită *</label>
            <input type="date" className="input" {...register('desiredDate', { required: true })} /></div>
          <div className="field"><label>Interval orar</label>
            <input className="input" placeholder="ex: 08:00–12:00" {...register('timeInterval')} /></div>
          <div className="field"><label>Denumire deșeu/produs *</label>
            <input className="input" {...register('wasteName', { required: true })} /></div>
          <div className="field"><label>Origine *</label>
            <select className="select" {...register('origin', { required: true })}>
              <option value="">Alege…</option>{ORIGINE_PRODUS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select></div>
          <div className="field"><label>Categorie SNCU *</label>
            <select className="select" {...register('sncuCategory', { required: true })}>
              <option value="">Alege…</option>{CATEGORII_SNCU.map((c) => <option key={c} value={c}>{c}</option>)}
            </select></div>
          <div className="field"><label>Cantitate estimată (kg) *</label>
            <input type="number" step="0.1" className="input" {...register('estimatedQuantityKg', { required: true })} /></div>
          <div className="field"><label>Starea produsului *</label>
            <select className="select" {...register('productState', { required: true })}>
              <option value="">Alege…</option>{STARE_PRODUS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select></div>
          <div className="field"><label>Tip ambalare *</label>
            <select className="select" {...register('packagingType', { required: true })}>
              <option value="">Alege…</option>{TIP_AMBALARE.map((t) => <option key={t} value={t}>{t}</option>)}
            </select></div>
          <div className="field field--full"><label>Adresa exactă *</label>
            <input className="input" {...register('exactAddress', { required: true })} /></div>
          <div className="field"><label>Valoare contabilă (lei)</label>
            <input type="number" step="0.01" className="input" {...register('accountingValue')} /></div>
          <div className="field"><label>Țara de origine</label>
            <input className="input" {...register('countryOfOrigin')} /></div>
          <div className="field"><label>Producător</label>
            <input className="input" {...register('producer')} /></div>
          <div className="field"><label>Distribuitor</label>
            <input className="input" {...register('distributor')} /></div>
          <div className="field"><label>Activitatea desfășurată</label>
            <input className="input" {...register('activity')} /></div>
          <div className="field"><label>Nr. autorizație sanitar-veterinară</label>
            <input className="input" {...register('sanitaryAuthNumber')} /></div>
          <div className="field"><label>Persoană de contact</label>
            <input className="input" {...register('contactPerson')} /></div>
          <div className="field"><label>Telefon contact</label>
            <input className="input" {...register('contactPhone')} /></div>
          <div className="field"><label>Email contact</label>
            <input type="email" className="input" {...register('contactEmail')} /></div>
          <div className="field field--full"><label>Nr. Certificat CSV / Sechestru / PV / Sigiliu / Emis de</label>
            <input className="input" {...register('csvDoc')} /></div>
          <div className="field field--full"><label>Observații</label>
            <input className="input" {...register('observations')} /></div>
        </div>
        <button className="btn btn--primary btn--block" disabled={isSubmitting}>
          {isSubmitting ? 'Se adaugă…' : 'Adaugă comanda'}
        </button>
      </form>
    </Modal>
  );
}
