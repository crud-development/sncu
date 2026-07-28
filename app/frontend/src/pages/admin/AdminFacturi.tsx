import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '../../components/Icon';
import { TableSkeleton } from '../../components/Skeleton';
import { apiError } from '../../lib/api';
import { exportExcel } from '../../lib/exportExcel';
import { toast } from '../../lib/toast';
import {
  adminInvoicingStatus,
  adminListInvoices,
  adminRetryInvoice,
  type AdminInvoice,
} from '../../lib/resources';

const KIND_LABEL: Record<AdminInvoice['kind'], string> = {
  registration: 'Înregistrare',
  extension: 'Prelungire',
};

const fmt = (d?: string) => (d ? new Date(d).toLocaleString('ro-RO') : '—');
const lei = (n: number) =>
  `${n.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} lei`;

export function AdminFacturi() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-invoices'],
    queryFn: adminListInvoices,
  });
  const statusQ = useQuery({
    queryKey: ['admin-invoicing-status'],
    queryFn: adminInvoicingStatus,
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const retry = useMutation({
    mutationFn: adminRetryInvoice,
    meta: { successMessage: 'Factură reemisă / email retrimis.' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-invoices'] }),
    onSettled: () => setRetryingId(null),
  });

  if (isLoading) return <TableSkeleton cols={8} />;
  const all = data ?? [];

  const filtered = all.filter((inv) => {
    const q = search.toLowerCase().trim();
    if (
      q &&
      !`${inv.companyName} ${inv.cui} ${inv.email} ${inv.series ?? ''} ${inv.number ?? ''}`
        .toLowerCase()
        .includes(q)
    ) {
      return false;
    }
    if (statusFilter.length && !statusFilter.includes(inv.status)) return false;
    return true;
  });

  function toggleStatus(s: string) {
    setStatusFilter((f) => (f.includes(s) ? f.filter((x) => x !== s) : [...f, s]));
  }

  function exportXls() {
    exportExcel(
      'facturi.xls',
      ['Firmă', 'CUI', 'Email', 'Tip', 'Status', 'Serie/Nr', 'Total', 'Data', 'Mock', 'Eroare'],
      filtered.map((inv) => [
        inv.companyName,
        inv.cui,
        inv.email,
        KIND_LABEL[inv.kind],
        inv.status,
        inv.series && inv.number ? `${inv.series}-${inv.number}` : '',
        inv.amountTotal,
        fmt(inv.createdAt),
        inv.mock ? 'da' : 'nu',
        inv.error ?? '',
      ]),
    );
  }

  return (
    <>
      <div className="topbar">
        <div className="page-head">
          <span className="page-head__icon"><Icon name="card" /></span>
          <div>
            <h1 className="page-title">Facturi</h1>
            <p className="page-head__sub">
              Facturi Oblio (înregistrare, reînnoire Stripe, prelungire OP).{' '}
              {statusQ.data && (
                <span className={statusQ.data.configured ? 'badge badge--green' : 'badge badge--amber'}>
                  {statusQ.data.configured ? 'Oblio configurat' : 'Mod MOCK'}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="toolbar">
        <input
          className="input"
          style={{ width: 280 }}
          placeholder="Caută firmă / CUI / email / serie…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {(['issued', 'failed'] as const).map((s) => (
          <button
            key={s}
            className={`btn btn--sm ${statusFilter.includes(s) ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => toggleStatus(s)}
          >
            {s === 'issued' ? 'Emisă' : 'Eșuată'}
          </button>
        ))}
        <div className="spacer" />
        <button className="btn btn--ghost btn--sm" onClick={exportXls} disabled={!filtered.length}>
          <Icon name="download" size={15} /> Export Excel
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="card empty">Nicio factură pentru filtrele curente.</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Firmă</th>
                <th>CUI</th>
                <th>Tip</th>
                <th>Serie/Nr</th>
                <th>Total</th>
                <th>Status</th>
                <th>Data</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <strong>{inv.companyName}</strong>
                    <div className="muted" style={{ fontSize: 12 }}>{inv.email}</div>
                  </td>
                  <td>{inv.cui}</td>
                  <td>
                    {KIND_LABEL[inv.kind]}
                    {inv.periodYears > 1 ? ` (${inv.periodYears} ani)` : ''}
                  </td>
                  <td>
                    {inv.series && inv.number ? (
                      inv.link ? (
                        <a href={inv.link} target="_blank" rel="noreferrer">
                          {inv.series}-{inv.number}
                        </a>
                      ) : (
                        `${inv.series}-${inv.number}`
                      )
                    ) : (
                      <span className="muted">—</span>
                    )}
                    {inv.mock && <span className="badge badge--gray" style={{ marginLeft: 6 }}>mock</span>}
                  </td>
                  <td>{lei(inv.amountTotal)}</td>
                  <td>
                    <span className={`badge ${inv.status === 'issued' ? 'badge--green' : 'badge--red'}`}>
                      {inv.status === 'issued' ? 'Emisă' : 'Eșuată'}
                    </span>
                    {inv.status === 'failed' && inv.error && (
                      <div className="muted" style={{ fontSize: 11, maxWidth: 220 }} title={inv.error}>
                        {inv.error}
                      </div>
                    )}
                  </td>
                  <td>{fmt(inv.createdAt)}</td>
                  <td>
                    {(inv.status === 'failed' || (inv.status === 'issued' && !inv.emailedAt)) && (
                      <button
                        className="btn btn--ghost btn--sm"
                        disabled={retryingId === inv.id || retry.isPending}
                        onClick={() => {
                          setRetryingId(inv.id);
                          retry.mutate(inv.id, {
                            onError: (e) => toast.error(apiError(e)),
                          });
                        }}
                      >
                        {retryingId === inv.id ? 'Se reîncearcă…' : 'Reîncearcă'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
