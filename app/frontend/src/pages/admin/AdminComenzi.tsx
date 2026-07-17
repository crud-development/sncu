import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiError } from '../../lib/api';
import { toast } from '../../lib/toast';
import { exportExcel } from '../../lib/exportExcel';
import { Icon } from '../../components/Icon';
import { Modal } from '../../components/Modal';
import { TableSkeleton } from '../../components/Skeleton';
import {
  CATEGORII_SNCU,
  ORDER_STATUS,
  ORIGINE_PRODUS,
  STARE_PRODUS,
  TIP_AMBALARE,
} from '../../lib/constants';
import {
  adminClientWorkpoints,
  adminCreateOrder,
  adminGetOrder,
  adminListClients,
  adminListOrders,
  adminSetOrderCost,
  adminSetOrderStatus,
  adminUpdateOrder,
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

function fmt(d?: string) {
  return d ? new Date(d).toLocaleDateString('ro-RO') : '';
}

function inDateRange(value: string | undefined, from: string, to: string): boolean {
  if (!from && !to) return true;
  if (!value) return false;
  const d = new Date(value);
  if (from && d < new Date(from)) return false;
  if (to && d > new Date(to + 'T23:59:59')) return false;
  return true;
}

export function AdminComenzi() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-orders'], queryFn: adminListOrders });
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [originFilter, setOriginFilter] = useState('');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [placedFrom, setPlacedFrom] = useState('');
  const [placedTo, setPlacedTo] = useState('');

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminSetOrderStatus(id, status),
    meta: { successMessage: 'Status actualizat. Clientul a fost notificat.' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-orders'] }),
  });

  const orders = data ?? [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return orders.filter((o) => {
      if (q) {
        const hay = [
          o.orderNo,
          o.companyName,
          o.contactPhone,
          o.contactEmail,
          o.contactPerson,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (statusFilter && o.status !== statusFilter) return false;
      if (originFilter && o.origin !== originFilter) return false;
      if (!inDateRange(o.createdAt, createdFrom, createdTo)) return false;
      // Data plasare = data dorită de ridicare (desiredDate); fallback pe createdAt.
      if (!inDateRange(o.desiredDate || o.createdAt, placedFrom, placedTo)) return false;
      return true;
    });
  }, [
    orders,
    search,
    statusFilter,
    originFilter,
    createdFrom,
    createdTo,
    placedFrom,
    placedTo,
  ]);

  if (isLoading) return <TableSkeleton cols={13} />;

  return (
    <>
      <div className="topbar">
        <div className="page-head">
          <span className="page-head__icon"><Icon name="order" /></span>
          <div>
            <h1 className="page-title">Comenzi</h1>
            <p className="page-head__sub">
              {filtered.length === orders.length
                ? 'Adaugă, schimbă statusul, setează costul, descarcă cererile.'
                : `${filtered.length} din ${orders.length} comenzi.`}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="btn btn--ghost"
            disabled={filtered.length === 0}
            onClick={() => {
              exportExcel(
                'comenzi.xls',
                [
                  'Nr.', 'Firmă', 'CUI', 'Telefon', 'Email', 'Persoană contact',
                  'Data creare', 'Data plasare', 'Denumire deșeu', 'Origine deșeu',
                  'Tip SNCU', 'Cantitate (kg)', 'Status', 'Cost estimat',
                ],
                filtered.map((o) => [
                  o.orderNo,
                  o.companyName || '',
                  o.cui || '',
                  o.contactPhone || '',
                  o.contactEmail || '',
                  o.contactPerson || '',
                  fmt(o.createdAt),
                  fmt(o.desiredDate || o.createdAt),
                  o.wasteName || '',
                  o.origin || '',
                  o.sncuCategory,
                  o.estimatedQuantityKg,
                  o.status,
                  o.estimatedCost ?? '',
                ]),
              );
            }}
          >
            <Icon name="download" size={17} /> Export Excel
          </button>
          <button className="btn btn--primary" onClick={() => setAddOpen(true)}>
            <Icon name="plus" size={17} /> Adaugă comandă
          </button>
        </div>
      </div>

      <div className="toolbar">
        <input
          className="input"
          style={{ width: 280 }}
          placeholder="Caută nr. comandă, firmă, telefon, email, contact…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="select"
          style={{ width: 'auto' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Status: toate</option>
          {ORDER_STATUS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          className="select"
          style={{ width: 'auto' }}
          value={originFilter}
          onChange={(e) => setOriginFilter(e.target.value)}
        >
          <option value="">Origine: toate</option>
          {ORIGINE_PRODUS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <span className="muted" style={{ fontSize: 13 }}>Data creare:</span>
        <input type="date" className="input" style={{ width: 'auto' }} value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)} />
        <input type="date" className="input" style={{ width: 'auto' }} value={createdTo} onChange={(e) => setCreatedTo(e.target.value)} />
        <span className="muted" style={{ fontSize: 13 }}>Data plasare:</span>
        <input type="date" className="input" style={{ width: 'auto' }} value={placedFrom} onChange={(e) => setPlacedFrom(e.target.value)} />
        <input type="date" className="input" style={{ width: 'auto' }} value={placedTo} onChange={(e) => setPlacedTo(e.target.value)} />
      </div>

      {addOpen && <AdminOrderForm onClose={() => setAddOpen(false)} onSaved={() => { setAddOpen(false); qc.invalidateQueries({ queryKey: ['admin-orders'] }); }} />}
      {editId && <AdminOrderForm editOrderId={editId} onClose={() => setEditId(null)} onSaved={() => { setEditId(null); qc.invalidateQueries({ queryKey: ['admin-orders'] }); }} />}

      {filtered.length === 0 ? (
        <div className="card empty">
          <div className="empty__icon"><Icon name="order" size={26} /></div>
          <div className="empty__title">Nicio comandă</div>
          <p>Nu există comenzi pentru filtrele curente.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nr.</th>
                <th>Firmă</th>
                <th>CUI</th>
                <th>Telefon</th>
                <th>Data plasare</th>
                <th>Denumire deșeu</th>
                <th>Origine deșeu</th>
                <th>Tip SNCU</th>
                <th>Cantitate</th>
                <th>Status</th>
                <th>Cost estimat</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <OrderRow key={o.id} order={o}
                  onStatus={(status) => setStatus.mutate({ id: o.id, status })}
                  onEdit={() => setEditId(o.id)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function OrderRow({ order, onStatus, onEdit }: { order: AdminOrder; onStatus: (s: string) => void; onEdit: () => void }) {
  const qc = useQueryClient();
  const [cost, setCost] = useState(order.estimatedCost?.toString() ?? '');
  const [downloading, setDownloading] = useState(false);
  const saveCost = useMutation({
    mutationFn: () => adminSetOrderCost(order.id, Number(cost)),
    meta: { successMessage: 'Cost estimat salvat.' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-orders'] }),
  });
  const next = NEXT[order.status];

  async function handleDownload() {
    setDownloading(true);
    const loadingId = toast.loading('Se descarcă comanda, te rugăm să aștepți…');
    try {
      await downloadAdminOrderPdf(order.id);
      toast.dismiss(loadingId);
      toast.success('Comanda a fost descărcată.');
    } catch (e) {
      toast.dismiss(loadingId);
      toast.error(apiError(e));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <tr>
      <td>{order.orderNo}</td>
      <td>{order.companyName || '—'}</td>
      <td>{order.cui || '—'}</td>
      <td>{order.contactPhone || '—'}</td>
      <td>{fmt(order.createdAt) || '—'}</td>
      <td>{order.wasteName || '—'}</td>
      <td>{order.origin || '—'}</td>
      <td>{order.sncuCategory}</td>
      <td>{order.estimatedQuantityKg} kg</td>
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
      <td>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="icon-btn" title="Vezi / editează comanda" onClick={onEdit}>
            <Icon name="edit" size={16} />
          </button>
          <button
            className="icon-btn"
            title="Descarcă cererea (PDF)"
            disabled={downloading}
            onClick={handleDownload}
          >
            <Icon name="download" size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

const ORDER_EDITABLE = [
  'desiredDate', 'timeInterval', 'wasteName', 'origin', 'sncuCategory',
  'estimatedQuantityKg', 'exactAddress', 'productState', 'accountingValue',
  'countryOfOrigin', 'producer', 'distributor', 'packagingType', 'activity',
  'sanitaryAuthNumber', 'contactPerson', 'contactPhone', 'contactEmail',
  'csvDoc', 'observations',
];

/* ─── 4.2.1/4.2.2: adăugare (create) sau vizualizare/editare (edit) comandă ─── */
function AdminOrderForm({ onClose, onSaved, editOrderId }: { onClose: () => void; onSaved: () => void; editOrderId?: string }) {
  const isEdit = Boolean(editOrderId);
  const [error, setError] = useState('');
  const { register, handleSubmit, watch, setValue, reset, formState: { isSubmitting } } = useForm<any>();
  const clientId = watch('clientId');
  const origin = watch('origin');
  const sncuRequired = origin === 'Animala';

  const clientsQ = useQuery({ queryKey: ['admin-clients'], queryFn: adminListClients, enabled: !isEdit });
  const wpQ = useQuery({
    queryKey: ['admin-client-workpoints', clientId],
    queryFn: () => adminClientWorkpoints(clientId),
    enabled: !isEdit && Boolean(clientId),
  });
  const orderQ = useQuery({
    queryKey: ['admin-order', editOrderId],
    queryFn: () => adminGetOrder(editOrderId!),
    enabled: isEdit,
  });
  const workpoints: Workpoint[] = wpQ.data ?? [];

  useEffect(() => {
    if (orderQ.data) {
      reset({ ...orderQ.data, desiredDate: orderQ.data.desiredDate?.slice(0, 10) });
    }
  }, [orderQ.data, reset]);

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
      const num = (v: any) => (v === '' || v == null ? undefined : Number(v));
      if (isEdit) {
        const payload: Record<string, unknown> = {};
        for (const k of ORDER_EDITABLE) if (values[k] !== undefined) payload[k] = values[k];
        payload.estimatedQuantityKg = num(values.estimatedQuantityKg);
        payload.accountingValue = num(values.accountingValue);
        await adminUpdateOrder(editOrderId!, payload);
      } else {
        await adminCreateOrder({
          ...values,
          sncuCategory: values.origin === 'Animala' ? values.sncuCategory : (values.sncuCategory || undefined),
          estimatedQuantityKg: Number(values.estimatedQuantityKg),
          accountingValue: num(values.accountingValue),
        });
      }
      onSaved();
    } catch (e) {
      setError(apiError(e));
    }
  }

  return (
    <Modal title={isEdit ? `Comandă ${orderQ.data?.orderNo ?? ''}` : 'Adaugă comandă (din admin)'} onClose={onClose} wide>
      {error && <div className="alert alert--error">{error}</div>}
      {isEdit ? (
        orderQ.data && (
          <div className="alert alert--info" style={{ marginBottom: 16 }}>
            <Icon name="building" size={18} />
            <span><strong>{orderQ.data.companyName}</strong> · {orderQ.data.exactAddress}</span>
          </div>
        )
      ) : (
        <p className="muted" style={{ fontSize: 14, marginBottom: 16 }}>
          Comanda primește automat status <strong>Confirmată</strong> și clientul este notificat pe email.
        </p>
      )}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-grid">
          {!isEdit && (
            <>
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
            </>
          )}
          <div className="field"><label>Data dorită *</label>
            <input type="date" className="input" {...register('desiredDate', { required: true })} /></div>
          <div className="field"><label>Interval orar</label>
            <input className="input" placeholder="ex: 08:00–12:00" {...register('timeInterval')} /></div>
          <div className="field"><label>Denumire deșeu/produs *</label>
            <input className="input" {...register('wasteName', { required: true })} /></div>
          <div className="field"><label>Origine *</label>
            <select
              className="select"
              {...register('origin', {
                required: true,
                onChange: (e) => {
                  if (e.target.value !== 'Animala') setValue('sncuCategory', '');
                },
              })}
            >
              <option value="">Alege…</option>{ORIGINE_PRODUS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select></div>
          <div className="field"><label>Categorie SNCU{sncuRequired ? ' *' : ''}</label>
            <select className="select" {...register('sncuCategory', { required: sncuRequired })}>
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
          {isSubmitting ? 'Se salvează…' : isEdit ? 'Salvează modificările' : 'Adaugă comanda'}
        </button>
      </form>
    </Modal>
  );
}
