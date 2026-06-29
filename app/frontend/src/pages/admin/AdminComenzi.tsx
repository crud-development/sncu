import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '../../components/Icon';
import { TableSkeleton } from '../../components/Skeleton';
import {
  adminListOrders,
  adminSetOrderCost,
  adminSetOrderStatus,
  downloadAdminOrderPdf,
  type AdminOrder,
  type OrderStatus,
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
            <p className="page-head__sub">Schimbă statusul, setează costul estimat, descarcă cererile.</p>
          </div>
        </div>
      </div>
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
