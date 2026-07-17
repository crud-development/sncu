import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '../../components/Icon';
import { Modal } from '../../components/Modal';
import { DocFrame } from '../../components/DocFrame';
import { TableSkeleton } from '../../components/Skeleton';
import { apiError } from '../../lib/api';
import { exportExcel } from '../../lib/exportExcel';
import { toast } from '../../lib/toast';
import {
  adminCancelContract,
  adminGetContractHtml,
  adminListContracts,
  downloadAdminContractPdf,
  type AdminContract,
} from '../../lib/resources';

const STATUSES = ['Draft', 'Semnat', 'Anulat', 'Expirat'];
const STATUS_CLASS: Record<string, string> = {
  Semnat: 'badge--green', Draft: 'badge--gray', Anulat: 'badge--red', Expirat: 'badge--amber',
};
const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString('ro-RO') : '—');

async function handleAdminDownload(
  id: string,
  setDownloading: (id: string | null) => void,
) {
  setDownloading(id);
  const loadingId = toast.loading('Descărcarea este în curs, te rugăm să aștepți…');
  try {
    await downloadAdminContractPdf(id);
    toast.dismiss(loadingId);
    toast.success('PDF descărcat.');
  } catch (e) {
    toast.dismiss(loadingId);
    toast.error(apiError(e));
  } finally {
    setDownloading(null);
  }
}

export function AdminContracte() {
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const { data, isLoading } = useQuery({ queryKey: ['admin-contracts'], queryFn: adminListContracts });
  const [search, setSearch] = useState(() => params.get('q') ?? '');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [cFrom, setCFrom] = useState('');
  const [cTo, setCTo] = useState('');
  const [eFrom, setEFrom] = useState('');
  const [eTo, setETo] = useState('');
  const [viewing, setViewing] = useState<AdminContract | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    const q = params.get('q');
    if (q != null) setSearch(q);
  }, [params]);

  const cancel = useMutation({
    mutationFn: adminCancelContract,
    meta: { successMessage: 'Contract anulat.' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-contracts'] }),
  });

  if (isLoading) return <TableSkeleton cols={8} />;
  const all = data ?? [];

  const filtered = all.filter((c) => {
    const q = search.toLowerCase().trim();
    if (q && !`${c.companyName} ${c.cui} ${c.contractNo ?? ''}`.toLowerCase().includes(q)) return false;
    if (statusFilter.length && !statusFilter.includes(c.status)) return false;
    const date = c.signedAt ?? c.createdAt;
    if (cFrom && new Date(date) < new Date(cFrom)) return false;
    if (cTo && new Date(date) > new Date(cTo + 'T23:59:59')) return false;
    if ((eFrom || eTo)) {
      if (!c.expiresAt) return false;
      if (eFrom && new Date(c.expiresAt) < new Date(eFrom)) return false;
      if (eTo && new Date(c.expiresAt) > new Date(eTo + 'T23:59:59')) return false;
    }
    return true;
  });

  function toggleStatus(s: string) {
    setStatusFilter((f) => (f.includes(s) ? f.filter((x) => x !== s) : [...f, s]));
  }

  function exportXls() {
    exportExcel(
      'contracte.xls',
      ['Firmă', 'CUI', 'Serie/Nr', 'Data', 'Pct lucru', 'Expirare', 'Status'],
      filtered.map((c) => [
        c.companyName,
        c.cui,
        c.contractNo ?? '',
        fmt(c.signedAt ?? c.createdAt),
        c.workpointsCount,
        fmt(c.expiresAt),
        c.status,
      ]),
    );
  }

  return (
    <>
      <div className="topbar">
        <div className="page-head">
          <span className="page-head__icon"><Icon name="contract" /></span>
          <div>
            <h1 className="page-title">Contracte</h1>
            <p className="page-head__sub">Centralizator: caută, filtrează, anulează, exportă.</p>
          </div>
        </div>
      </div>

      <div className="toolbar">
        <input className="input" style={{ width: 260 }} placeholder="Caută firmă / CUI / serie…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <span className="muted" style={{ fontSize: 13 }}>Data contract:</span>
        <input type="date" className="input" style={{ width: 'auto' }} value={cFrom} onChange={(e) => setCFrom(e.target.value)} />
        <input type="date" className="input" style={{ width: 'auto' }} value={cTo} onChange={(e) => setCTo(e.target.value)} />
        <span className="muted" style={{ fontSize: 13 }}>Expiră:</span>
        <input type="date" className="input" style={{ width: 'auto' }} value={eFrom} onChange={(e) => setEFrom(e.target.value)} />
        <input type="date" className="input" style={{ width: 'auto' }} value={eTo} onChange={(e) => setETo(e.target.value)} />
        <div className="spacer" />
        {STATUSES.map((s) => (
          <button key={s} className={`btn btn--sm ${statusFilter.includes(s) ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => toggleStatus(s)}>{s}</button>
        ))}
        <button className="btn btn--ghost btn--sm" onClick={exportXls} disabled={!filtered.length}>
          <Icon name="download" size={15} /> Export Excel
        </button>
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
                  <td>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button className="icon-btn" title="Deschide contractul" onClick={() => setViewing(c)}>
                        <Icon name="eye" size={16} />
                      </button>
                      {c.contractNo && (
                        <button
                          className="btn btn--ghost btn--sm"
                          title="Descarcă PDF"
                          disabled={downloadingId === c.id}
                          onClick={() => handleAdminDownload(c.id, setDownloadingId)}
                        >
                          <Icon name="download" size={15} />
                          {downloadingId === c.id ? 'Se descarcă…' : 'Descarcă'}
                        </button>
                      )}
                      {c.canCancel && (
                        <button className="btn btn--danger btn--sm"
                          onClick={() => { if (confirm('Anulezi contractul semnat?')) cancel.mutate(c.id); }}>
                          Anulează
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewing && <AdminContractView contract={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}

function AdminContractView({ contract, onClose }: { contract: AdminContract; onClose: () => void }) {
  const htmlQ = useQuery({
    queryKey: ['admin-contract-html', contract.id],
    queryFn: () => adminGetContractHtml(contract.id),
  });
  const [downloading, setDownloading] = useState(false);

  async function onDownload() {
    setDownloading(true);
    const loadingId = toast.loading('Descărcarea este în curs, te rugăm să aștepți…');
    try {
      await downloadAdminContractPdf(contract.id);
      toast.dismiss(loadingId);
      toast.success('PDF descărcat.');
    } catch (e) {
      toast.dismiss(loadingId);
      toast.error(apiError(e));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Modal title={contract.contractNo ? `Contract ${contract.contractNo}` : 'Contract (draft)'} onClose={onClose} wide>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 16, fontSize: 13 }}>
        <span className="muted">Firmă: <strong style={{ color: 'var(--ink)' }}>{contract.companyName}</strong></span>
        <span className="muted">CUI: {contract.cui}</span>
        <span className="muted">Status: {contract.status}</span>
        <span className="muted">Expirare: {fmt(contract.expiresAt)}</span>
      </div>
      <DocFrame html={htmlQ.data} height={520} />
      {contract.contractNo && (
        <button
          className="btn btn--ghost btn--block"
          style={{ marginTop: 16 }}
          disabled={downloading}
          onClick={onDownload}
        >
          <Icon name="download" size={16} /> {downloading ? 'Se descarcă…' : 'Descarcă PDF'}
        </button>
      )}
    </Modal>
  );
}
