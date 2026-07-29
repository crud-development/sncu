import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '../../lib/toast';
import { apiError } from '../../lib/api';
import { Icon } from '../../components/Icon';
import { TableSkeleton } from '../../components/Skeleton';
import {
  adminStripeCreatePromotionCode,
  adminStripeDeactivatePromotionCode,
  adminStripeListCustomers,
  adminStripeListInvoices,
  adminStripeListPromotionCodes,
  adminStripeListSubscriptions,
  adminStripeStatus,
  type AdminStripeInvoice,
  type CreatePromotionCodeDto,
} from '../../lib/resources';

type Tab = 'codes' | 'customers' | 'subscriptions' | 'invoices';

const fmtDate = (epochSeconds?: number) => {
  if (!epochSeconds) return '—';
  return new Date(epochSeconds * 1000).toLocaleString('ro-RO');
};

function lei(n: number) {
  return `${n.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} lei`;
}

export function AdminStripe() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('codes');

  const statusQ = useQuery({
    queryKey: ['stripe-status'],
    queryFn: adminStripeStatus,
  });

  const codesQ = useQuery({
    queryKey: ['stripe-promo-codes'],
    queryFn: adminStripeListPromotionCodes,
  });

  const customersQ = useQuery({
    queryKey: ['stripe-customers'],
    queryFn: () => adminStripeListCustomers(50),
    enabled: tab === 'customers',
  });

  const subsQ = useQuery({
    queryKey: ['stripe-subs'],
    queryFn: () => adminStripeListSubscriptions(50),
    enabled: tab === 'subscriptions',
  });

  const invoicesQ = useQuery({
    queryKey: ['stripe-invoices'],
    queryFn: () => adminStripeListInvoices(50),
    enabled: tab === 'invoices',
  });

  const [form, setForm] = useState<CreatePromotionCodeDto>({
    code: '',
    discountType: 'percent',
    value: 10,
    duration: 'repeating',
    durationMonths: 12,
  });

  const createCode = useMutation({
    mutationFn: adminStripeCreatePromotionCode,
    onSuccess: () => {
      toast.success('Cod de reducere creat în Stripe.');
      qc.invalidateQueries({ queryKey: ['stripe-promo-codes'] });
      setForm((f) => ({ ...f, code: '' }));
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const deactivate = useMutation({
    mutationFn: adminStripeDeactivatePromotionCode,
    onSuccess: () => {
      toast.success('Cod dezactivat.');
      qc.invalidateQueries({ queryKey: ['stripe-promo-codes'] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const statusBadge = useMemo(() => {
    if (!statusQ.data) return null;
    return (
      <span
        className={
          statusQ.data.configured ? 'badge badge--green' : 'badge badge--amber'
        }
      >
        {statusQ.data.configured ? 'Stripe configurat' : 'Mod MOCK'}
      </span>
    );
  }, [statusQ.data]);

  const codes = codesQ.data ?? [];

  if (codesQ.isLoading || statusQ.isLoading) return <TableSkeleton cols={8} />;

  return (
    <>
      <div className="topbar">
        <div className="page-head">
          <span className="page-head__icon"><Icon name="card" /></span>
          <div>
            <h1 className="page-title">Stripe</h1>
            <p className="page-head__sub">
              Plăți, subscriptii, clienți și coduri de reducere.
              {statusBadge ? (
                <span style={{ marginLeft: 10 }}>{statusBadge}</span>
              ) : null}
            </p>
          </div>
        </div>
      </div>

      <div className="toolbar">
        {(['codes', 'customers', 'subscriptions', 'invoices'] as Tab[]).map((t) => (
          <button
            key={t}
            className={`btn btn--sm ${tab === t ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => setTab(t)}
          >
            {t === 'codes'
              ? 'Coduri reducere'
              : t === 'customers'
                ? 'Clienți'
                : t === 'subscriptions'
                  ? 'Subscriptii'
                  : 'Plăți (invoice)'}
          </button>
        ))}
      </div>

      {tab === 'codes' && (
        <div className="card" style={{ marginTop: 18 }}>
          <h3 style={{ margin: '0 0 10px' }}>Cod de reducere (Promotion Code)</h3>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(12, 1fr)' }}>
            <div style={{ gridColumn: 'span 4' }}>
              <label>Cod (ex: BIO-10)</label>
              <input
                className="input"
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, code: e.target.value }))
                }
                placeholder="BIO-10"
              />
            </div>
            <div style={{ gridColumn: 'span 3' }}>
              <label>Tip</label>
              <select
                className="select"
                value={form.discountType}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    discountType: e.target.value as 'percent' | 'amount',
                  }))
                }
              >
                <option value="percent">% (procent)</option>
                <option value="amount">Suma fixă (lei)</option>
              </select>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label>Valoare</label>
              <input
                className="input"
                type="number"
                value={form.value}
                onChange={(e) =>
                  setForm((f) => ({ ...f, value: Number(e.target.value) }))
                }
                min={0}
                step={form.discountType === 'percent' ? 1 : 0.01}
              />
            </div>
            <div style={{ gridColumn: 'span 3' }}>
              <label>Durată</label>
              <select
                className="select"
                value={form.duration}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    duration: e.target.value as 'forever' | 'once' | 'repeating',
                  }))
                }
              >
                <option value="repeating">Repetat (anual)</option>
                <option value="once">O singură dată</option>
                <option value="forever">Pentru totdeauna</option>
              </select>
            </div>

            {form.duration === 'repeating' && (
              <div style={{ gridColumn: 'span 3' }}>
                <label>luni (implicit 12)</label>
                <input
                  className="input"
                  type="number"
                  value={form.durationMonths ?? 12}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      durationMonths: Number(e.target.value),
                    }))
                  }
                  min={1}
                />
              </div>
            )}

            <div style={{ gridColumn: 'span 12' }}>
              <button
                className="btn btn--primary"
                disabled={createCode.isPending || !statusQ.data?.configured}
                onClick={() => createCode.mutate(form)}
              >
                {createCode.isPending ? 'Se creează…' : 'Creează în Stripe'}
              </button>
              <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                Codurile apar în checkout după ce sunt active. Înregistrarea din portal trimite codul către backend.
              </div>
            </div>
          </div>

          <h3 style={{ margin: '20px 0 10px' }}>Lista codurilor</h3>
          {codesQ.isLoading ? (
            <TableSkeleton cols={6} />
          ) : codes.length === 0 ? (
            <div className="muted">Nu ai coduri în Stripe.</div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Cod</th>
                    <th>Status</th>
                    <th>Discount</th>
                    <th>Durată</th>
                    <th>ID</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((pc) => (
                    <tr key={pc.id}>
                      <td><strong>{pc.code ?? '—'}</strong></td>
                      <td>
                        <span className={`badge ${pc.active ? 'badge--green' : 'badge--gray'}`}
                        >
                          {pc.active ? 'active' : 'inactive'}
                        </span>
                      </td>
                      <td>
                        {pc.coupon?.percent_off != null
                          ? `${pc.coupon.percent_off}%`
                          : pc.coupon?.amount_off != null
                            ? `${pc.coupon.amount_off / 100} lei`
                            : '—'}
                      </td>
                      <td>{pc.coupon?.duration ?? '—'}</td>
                      <td>{pc.id}</td>
                      <td>
                        {pc.active ? (
                          <button
                            className="btn btn--ghost btn--sm"
                            disabled={deactivate.isPending}
                            onClick={() => deactivate.mutate(pc.id)}
                          >
                            Dezactivează
                          </button>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'customers' && (
        <div className="card" style={{ marginTop: 18 }}>
          <h3 style={{ margin: '0 0 10px' }}>Stripe Clienți</h3>
          {customersQ.isLoading ? (
            <TableSkeleton cols={6} />
          ) : customersQ.data?.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Email</th>
                    <th>Nume</th>
                    <th>CUI</th>
                    <th>Creat</th>
                  </tr>
                </thead>
                <tbody>
                  {customersQ.data.map((c) => (
                    <tr key={c.id}>
                      <td>{c.id}</td>
                      <td>{c.email ?? '—'}</td>
                      <td>{c.name ?? '—'}</td>
                      <td>{c.metadata?.cui ?? '—'}</td>
                      <td>{fmtDate(c.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="muted">Nu sunt clienți.</div>
          )}
        </div>
      )}

      {tab === 'subscriptions' && (
        <div className="card" style={{ marginTop: 18 }}>
          <h3 style={{ margin: '0 0 10px' }}>Stripe Subscriptii</h3>
          {subsQ.isLoading ? (
            <TableSkeleton cols={6} />
          ) : subsQ.data?.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Status</th>
                    <th>Customer</th>
                    <th>Perioadă (end)</th>
                    <th>Creat</th>
                  </tr>
                </thead>
                <tbody>
                  {subsQ.data.map((s) => (
                    <tr key={s.id}>
                      <td>{s.id}</td>
                      <td><span className="badge badge--gray">{s.status}</span></td>
                      <td>{s.customer ?? '—'}</td>
                      <td>{fmtDate(s.currentPeriodEnd)}</td>
                      <td>{fmtDate(s.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="muted">Nu sunt subscriptii.</div>
          )}
        </div>
      )}

      {tab === 'invoices' && (
        <div className="card" style={{ marginTop: 18 }}>
          <h3 style={{ margin: '0 0 10px' }}>Stripe Plăți (Invoices)</h3>
          {invoicesQ.isLoading ? (
            <TableSkeleton cols={6} />
          ) : invoicesQ.data?.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Număr</th>
                    <th>Status</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Creat</th>
                  </tr>
                </thead>
                <tbody>
                  {invoicesQ.data.map((inv: AdminStripeInvoice) => (
                    <tr key={inv.id}>
                      <td>{inv.id}</td>
                      <td>{inv.number ?? '—'}</td>
                      <td><span className="badge badge--gray">{inv.status}</span></td>
                      <td>{inv.customer ?? '—'}</td>
                      <td>{lei(inv.amountPaid)}</td>
                      <td>{fmtDate(inv.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="muted">Nu sunt invoice-uri.</div>
          )}
        </div>
      )}
    </>
  );
}
