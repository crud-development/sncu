import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiError } from '../lib/api';
import { toast } from '../lib/toast';
import { Modal } from '../components/Modal';
import { Icon } from '../components/Icon';
import { TableSkeleton } from '../components/Skeleton';
import {
  CATEGORII_SNCU,
  ORDER_STATUS,
  ORIGINE_PRODUS,
  STARE_PRODUS,
  TIP_AMBALARE,
} from '../lib/constants';
import {
  cancelOrder,
  createOrder,
  downloadOrderPdf,
  listContracts,
  listOrders,
  listWorkpoints,
  type OrderStatus,
  type Workpoint,
} from '../lib/resources';

const STATUS_CLASS: Record<OrderStatus, string> = {
  Plasată: 'badge--amber',
  Confirmată: 'badge--green',
  Onorată: 'badge--gray',
  Anulată: 'badge--red',
};

function fmt(d?: string) {
  return d ? new Date(d).toLocaleDateString('ro-RO') : '—';
}

export function Comenzi() {
  const qc = useQueryClient();
  const ordersQ = useQuery({ queryKey: ['orders'], queryFn: listOrders });
  const wpQ = useQuery({ queryKey: ['workpoints'], queryFn: listWorkpoints });
  const contractsQ = useQuery({ queryKey: ['contracts'], queryFn: listContracts });

  const [formOpen, setFormOpen] = useState(false);
  const [filters, setFilters] = useState({ from: '', to: '', workpoint: '', status: '' });
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const workpoints = wpQ.data ?? [];
  const wpName = useMemo(() => {
    const m = new Map<string, string>();
    workpoints.forEach((w) => m.set(w._id, w.denumire || w.address));
    return m;
  }, [workpoints]);

  const hasActiveContract = (contractsQ.data ?? []).some(
    (c) => c.status === 'Semnat' && c.expiresAt && new Date(c.expiresAt) > new Date(),
  );

  const cancel = useMutation({
    mutationFn: (id: string) => cancelOrder(id),
    meta: { successMessage: 'Comandă anulată.' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });

  async function handleDownload(id: string) {
    setDownloadingId(id);
    const loadingId = toast.loading('Se descarcă comanda, te rugăm să aștepți…');
    try {
      await downloadOrderPdf(id);
      toast.dismiss(loadingId);
      toast.success('Comanda a fost descărcată.');
    } catch (e) {
      toast.dismiss(loadingId);
      toast.error(apiError(e));
    } finally {
      setDownloadingId(null);
    }
  }

  const orders = ordersQ.data ?? [];
  const filtered = orders.filter((o) => {
    if (filters.workpoint && o.workpointId !== filters.workpoint) return false;
    if (filters.status && o.status !== filters.status) return false;
    if (filters.from && new Date(o.createdAt) < new Date(filters.from)) return false;
    if (filters.to && new Date(o.createdAt) > new Date(filters.to + 'T23:59:59')) return false;
    return true;
  });

  function exportCsv() {
    const head = [
      'Nr comandă', 'Punct lucru', 'Telefon', 'Data plasare',
      'Denumire deșeu', 'Origine deșeu', 'Tip SNCU', 'Cantitate (kg)', 'Status',
    ];
    const rows = filtered.map((o) => [
      o.orderNo,
      wpName.get(o.workpointId) ?? '',
      o.contactPhone || '',
      fmt(o.createdAt),
      o.wasteName || '',
      o.origin || '',
      o.sncuCategory,
      o.estimatedQuantityKg,
      o.status,
    ]);
    const csv = [head, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comenzi.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (ordersQ.isLoading || wpQ.isLoading) {
    return <TableSkeleton cols={10} />;
  }

  return (
    <>
      <div className="topbar">
        <div className="page-head">
          <span className="page-head__icon"><Icon name="order" /></span>
          <div>
            <h1 className="page-title">Comenzi</h1>
            <p className="page-head__sub">Plasează și urmărește comenzile de ridicare SNCU.</p>
          </div>
        </div>
      </div>

      {!hasActiveContract && (
        <div className="alert alert--error">
          Ai nevoie de un contract activ pentru a plasa comenzi. Mergi la{' '}
          <Link to="/contracte">Contracte</Link>.
        </div>
      )}

      <div className="toolbar">
        <button
          className="btn btn--primary"
          disabled={!hasActiveContract || workpoints.length === 0}
          onClick={() => setFormOpen(true)}
        >
          <Icon name="plus" size={17} /> Plasează comandă
        </button>
        <div className="spacer" />
        <input type="date" className="input" style={{ width: 'auto' }}
          value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        <span className="muted">–</span>
        <input type="date" className="input" style={{ width: 'auto' }}
          value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        <select className="select" style={{ width: 'auto' }}
          value={filters.workpoint} onChange={(e) => setFilters({ ...filters, workpoint: e.target.value })}>
          <option value="">Toate punctele</option>
          {workpoints.map((w) => <option key={w._id} value={w._id}>{w.denumire || w.address}</option>)}
        </select>
        <select className="select" style={{ width: 'auto' }}
          value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">Toate statusurile</option>
          {ORDER_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn btn--ghost btn--sm" onClick={exportCsv} disabled={filtered.length === 0}>
          Export CSV
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="card empty">
          <div className="empty__icon"><Icon name="inbox" size={26} /></div>
          <div className="empty__title">Nicio comandă</div>
          <p>Nu există comenzi pentru filtrele curente.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nr. comandă</th>
                <th>Punct lucru</th>
                <th>Telefon</th>
                <th>Data plasare</th>
                <th>Denumire deșeu</th>
                <th>Origine deșeu</th>
                <th>Tip SNCU</th>
                <th>Cantitate</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o._id}>
                  <td>{o.orderNo}</td>
                  <td>{wpName.get(o.workpointId) ?? '—'}</td>
                  <td>{o.contactPhone || '—'}</td>
                  <td>{fmt(o.createdAt)}</td>
                  <td>{o.wasteName || '—'}</td>
                  <td>{o.origin || '—'}</td>
                  <td>{o.sncuCategory}</td>
                  <td>{o.estimatedQuantityKg} kg</td>
                  <td><span className={`badge ${STATUS_CLASS[o.status]}`}>{o.status}</span></td>
                  <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                    <button
                      className="btn btn--ghost btn--sm"
                      disabled={downloadingId === o._id}
                      onClick={() => handleDownload(o._id)}
                    >
                      {downloadingId === o._id ? 'Se descarcă…' : 'PDF'}
                    </button>{' '}
                    {o.status === 'Plasată' && (
                      <button className="btn btn--danger btn--sm"
                        onClick={() => { if (confirm('Anulezi comanda?')) cancel.mutate(o._id); }}>
                        Anulează
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <OrderForm
          workpoints={workpoints}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            qc.invalidateQueries({ queryKey: ['orders'] });
          }}
        />
      )}
    </>
  );
}

function OrderForm({
  workpoints,
  onClose,
  onSaved,
}: {
  workpoints: Workpoint[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState('');
  const { register, handleSubmit, setValue, watch, formState: { isSubmitting } } =
    useForm<any>();
  const origin = watch('origin');
  const sncuRequired = origin === 'Animala';

  // Prefill din punctul de lucru selectat.
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
      await createOrder({
        ...values,
        sncuCategory: values.origin === 'Animala' ? values.sncuCategory : (values.sncuCategory || undefined),
        estimatedQuantityKg: Number(values.estimatedQuantityKg),
        accountingValue: values.accountingValue ? Number(values.accountingValue) : undefined,
      });
      toast.success('Comandă plasată. Vei primi un email de confirmare.');
      onSaved();
    } catch (e) {
      setError(apiError(e));
    }
  }

  return (
    <Modal title="Comandă nouă de ridicare" onClose={onClose} wide>
      {error && <div className="alert alert--error">{error}</div>}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-grid">
          <div className="field">
            <label>Punct de lucru *</label>
            <select className="select" {...register('workpointId', { required: true })}
              onChange={(e) => { setValue('workpointId', e.target.value); onWpChange(e.target.value); }}>
              <option value="">Alege…</option>
              {workpoints.map((w) => <option key={w._id} value={w._id}>{w.denumire || w.address}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Data dorită *</label>
            <input type="date" className="input" {...register('desiredDate', { required: true })} />
          </div>
          <div className="field">
            <label>Interval orar</label>
            <input className="input" placeholder="ex: 08:00–12:00" {...register('timeInterval')} />
          </div>
          <div className="field">
            <label>Denumire deșeu/produs *</label>
            <input className="input" {...register('wasteName', { required: true })} />
          </div>
          <div className="field">
            <label>Origine *</label>
            <select
              className="select"
              {...register('origin', {
                required: true,
                onChange: (e) => {
                  if (e.target.value !== 'Animala') setValue('sncuCategory', '');
                },
              })}
            >
              <option value="">Alege…</option>
              {ORIGINE_PRODUS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Categorie SNCU{sncuRequired ? ' *' : ''}</label>
            <select
              className="select"
              {...register('sncuCategory', { required: sncuRequired })}
            >
              <option value="">Alege…</option>
              {CATEGORII_SNCU.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Cantitate estimată (kg) *</label>
            <input type="number" step="0.1" className="input" {...register('estimatedQuantityKg', { required: true })} />
          </div>
          <div className="field">
            <label>Starea produsului *</label>
            <select className="select" {...register('productState', { required: true })}>
              <option value="">Alege…</option>
              {STARE_PRODUS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Tip ambalare *</label>
            <select className="select" {...register('packagingType', { required: true })}>
              <option value="">Alege…</option>
              {TIP_AMBALARE.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="field field--full">
            <label>Adresa exactă *</label>
            <input className="input" {...register('exactAddress', { required: true })} />
          </div>
          <div className="field">
            <label>Valoare contabilă (lei)</label>
            <input type="number" step="0.01" className="input" {...register('accountingValue')} />
          </div>
          <div className="field">
            <label>Țara de origine</label>
            <input className="input" {...register('countryOfOrigin')} />
          </div>
          <div className="field">
            <label>Producător</label>
            <input className="input" {...register('producer')} />
          </div>
          <div className="field">
            <label>Distribuitor</label>
            <input className="input" {...register('distributor')} />
          </div>
          <div className="field">
            <label>Activitatea desfășurată</label>
            <input className="input" {...register('activity')} />
          </div>
          <div className="field">
            <label>Nr. autorizație sanitar-veterinară</label>
            <input className="input" {...register('sanitaryAuthNumber')} />
          </div>
          <div className="field">
            <label>Persoană de contact</label>
            <input className="input" {...register('contactPerson')} />
          </div>
          <div className="field">
            <label>Telefon contact</label>
            <input className="input" {...register('contactPhone')} />
          </div>
          <div className="field">
            <label>Email contact</label>
            <input type="email" className="input" {...register('contactEmail')} />
          </div>
          <div className="field field--full">
            <label>Nr. Certificat CSV / Document Sechestru / PV / Sigiliu / Emis de</label>
            <input className="input" {...register('csvDoc')} />
          </div>
          <div className="field field--full">
            <label>Observații</label>
            <input className="input" placeholder="Instrucțiuni acces, contact gardă etc." {...register('observations')} />
          </div>
        </div>
        <button className="btn btn--primary btn--block" disabled={isSubmitting}>
          {isSubmitting ? 'Se trimite…' : 'Plasează comanda'}
        </button>
      </form>
    </Modal>
  );
}
