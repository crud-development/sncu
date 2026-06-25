import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adminCancelContract,
  adminListContracts,
  downloadAdminContractPdf,
} from '../../lib/resources';

const STATUSES = ['Draft', 'Semnat', 'Anulat', 'Expirat'];
const STATUS_CLASS: Record<string, string> = {
  Semnat: 'badge--green', Draft: 'badge--gray', Anulat: 'badge--red', Expirat: 'badge--amber',
};
const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString('ro-RO') : '—');

export function AdminContracte() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-contracts'], queryFn: adminListContracts });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [cFrom, setCFrom] = useState('');
  const [cTo, setCTo] = useState('');

  const cancel = useMutation({
    mutationFn: adminCancelContract,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-contracts'] }),
  });

  if (isLoading) return <div className="card"><p className="muted">Se încarcă…</p></div>;
  const all = data ?? [];

  const filtered = all.filter((c) => {
    const q = search.toLowerCase().trim();
    if (q && !`${c.companyName} ${c.cui} ${c.contractNo ?? ''}`.toLowerCase().includes(q)) return false;
    if (statusFilter.length && !statusFilter.includes(c.status)) return false;
    const date = c.signedAt ?? c.createdAt;
    if (cFrom && new Date(date) < new Date(cFrom)) return false;
    if (cTo && new Date(date) > new Date(cTo + 'T23:59:59')) return false;
    return true;
  });

  function toggleStatus(s: string) {
    setStatusFilter((f) => (f.includes(s) ? f.filter((x) => x !== s) : [...f, s]));
  }

  function exportCsv() {
    const head = ['Firmă', 'CUI', 'Serie/Nr', 'Data', 'Pct lucru', 'Expirare', 'Status'];
    const rows = filtered.map((c) => [
      c.companyName, c.cui, c.contractNo ?? '', fmt(c.signedAt ?? c.createdAt),
      c.workpointsCount, fmt(c.expiresAt), c.status,
    ]);
    const csv = [head, ...rows].map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'contracte.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="topbar"><h1 className="page-title">Contracte</h1></div>

      <div className="toolbar">
        <input className="input" style={{ width: 260 }} placeholder="Caută firmă / CUI / serie…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <span className="muted" style={{ fontSize: 13 }}>Data:</span>
        <input type="date" className="input" style={{ width: 'auto' }} value={cFrom} onChange={(e) => setCFrom(e.target.value)} />
        <input type="date" className="input" style={{ width: 'auto' }} value={cTo} onChange={(e) => setCTo(e.target.value)} />
        <div className="spacer" />
        {STATUSES.map((s) => (
          <button key={s} className={`btn btn--sm ${statusFilter.includes(s) ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => toggleStatus(s)}>{s}</button>
        ))}
        <button className="btn btn--ghost btn--sm" onClick={exportCsv} disabled={!filtered.length}>Export</button>
      </div>

      {filtered.length === 0 ? (
        <div className="card empty">Niciun contract pentru filtrele curente.</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Firmă</th><th>CUI</th><th>Serie/Nr</th><th>Data</th>
                <th>Pct lucru</th><th>Expirare</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>{c.companyName}</td>
                  <td>{c.cui}</td>
                  <td>{c.contractNo ?? <span className="muted">(draft)</span>}</td>
                  <td>{fmt(c.signedAt ?? c.createdAt)}</td>
                  <td>{c.workpointsCount}</td>
                  <td>{fmt(c.expiresAt)}</td>
                  <td><span className={`badge ${STATUS_CLASS[c.status]}`}>{c.status}</span></td>
                  <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                    {c.contractNo && (
                      <button className="btn btn--ghost btn--sm" onClick={() => downloadAdminContractPdf(c.id)}>PDF</button>
                    )}{' '}
                    {c.canCancel && (
                      <button className="btn btn--danger btn--sm"
                        onClick={() => { if (confirm('Anulezi contractul semnat?')) cancel.mutate(c.id); }}>
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
    </>
  );
}
