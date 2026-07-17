import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiError } from '../lib/api';
import { toast } from '../lib/toast';
import { Modal } from '../components/Modal';
import { Icon } from '../components/Icon';
import { DocFrame } from '../components/DocFrame';
import { TableSkeleton } from '../components/Skeleton';
import { SignaturePad } from '../components/SignaturePad';
import {
  cancelContract,
  deleteContract,
  downloadContractPdf,
  editContract,
  getContractHtml,
  listContracts,
  listWorkpoints,
  signContract,
  type Contract,
  type ContractStatus,
  type Workpoint,
} from '../lib/resources';

const STATUS_CLASS: Record<ContractStatus, string> = {
  Semnat: 'badge--green',
  Draft: 'badge--gray',
  Anulat: 'badge--red',
  Expirat: 'badge--amber',
};

function fmt(d?: string) {
  return d ? new Date(d).toLocaleDateString('ro-RO') : '—';
}

async function handleDownloadPdf(id: string, setDownloading: (id: string | null) => void) {
  setDownloading(id);
  toast.info('Descărcarea este în curs, te rugăm să aștepți…');
  try {
    await downloadContractPdf(id);
    toast.success('PDF descărcat.');
  } catch (e) {
    toast.error(apiError(e));
  } finally {
    setDownloading(null);
  }
}

export function Contracte() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['contracts'], queryFn: listContracts });
  const [signing, setSigning] = useState<Contract | null>(null);
  const [viewing, setViewing] = useState<Contract | null>(null);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['contracts'] });
    qc.invalidateQueries({ queryKey: ['workpoints'] });
  };

  const cancel = useMutation({
    mutationFn: cancelContract,
    meta: { successMessage: 'Contract anulat.' },
    onSuccess: invalidate,
  });
  const del = useMutation({
    mutationFn: deleteContract,
    meta: { successMessage: 'Draft șters.' },
    onSuccess: invalidate,
  });

  if (isLoading) return <TableSkeleton cols={6} />;
  const contracts = data ?? [];

  return (
    <>
      <div className="topbar">
        <div className="page-head">
          <span className="page-head__icon"><Icon name="contract" /></span>
          <div>
            <h1 className="page-title">Contracte</h1>
            <p className="page-head__sub">Deschide, generează, editează (draft), semnează și descarcă.</p>
          </div>
        </div>
      </div>

      {contracts.length === 0 ? (
        <div className="card empty">
          <div className="empty__icon"><Icon name="contract" size={26} /></div>
          <div className="empty__title">Niciun contract încă</div>
          <p>Mergi la <Link to="/puncte-lucru">Puncte de lucru</Link> și generează contractul cadru.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nr. contract</th>
                <th>Puncte lucru</th>
                <th>Data</th>
                <th>Expirare</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c._id}>
                  <td>{c.contractNo ? <strong>{c.contractNo}</strong> : <span className="muted">(draft)</span>}</td>
                  <td>{c.snapshot.workpoints.length}</td>
                  <td>{fmt(c.signedAt ?? c.createdAt)}</td>
                  <td>{fmt(c.expiresAt)}</td>
                  <td><span className={`badge ${STATUS_CLASS[c.status]}`}>{c.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                      {c.status === 'Draft' ? (
                        <>
                          <button className="btn btn--primary btn--sm" onClick={() => setSigning(c)}>
                            <Icon name="edit" size={15} /> Semnează
                          </button>
                          <button className="icon-btn" title="Editează punctele de lucru" onClick={() => setEditing(c)}>
                            <Icon name="edit" size={16} />
                          </button>
                          <button
                            className="icon-btn icon-btn--danger"
                            title="Șterge draftul"
                            onClick={() => { if (confirm('Ștergi acest draft de contract?')) del.mutate(c._id); }}
                          >
                            <Icon name="trash" size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="icon-btn" title="Deschide contractul" onClick={() => setViewing(c)}>
                            <Icon name="eye" size={16} />
                          </button>
                          {(c.status === 'Semnat' || c.status === 'Expirat') && (
                            <button
                              className="icon-btn"
                              title="Descarcă PDF"
                              disabled={downloadingId === c._id}
                              onClick={() => handleDownloadPdf(c._id, setDownloadingId)}
                            >
                              <Icon name="download" size={16} />
                            </button>
                          )}
                          {c.status === 'Semnat' && (
                            <button
                              className="btn btn--danger btn--sm"
                              onClick={() => { if (confirm('Anulezi acest contract?')) cancel.mutate(c._id); }}
                            >
                              Anulează
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {signing && (
        <SignModal contract={signing} onClose={() => setSigning(null)} onSigned={() => { setSigning(null); invalidate(); }} />
      )}
      {viewing && <ViewModal contract={viewing} onClose={() => setViewing(null)} />}
      {editing && (
        <EditDraftModal contract={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); invalidate(); }} />
      )}
    </>
  );
}

/* ─── Vizualizare contract (read-only) ─── */
function ViewModal({ contract, onClose }: { contract: Contract; onClose: () => void }) {
  const htmlQ = useQuery({
    queryKey: ['contract-html', contract._id],
    queryFn: () => getContractHtml(contract._id),
  });
  const [downloading, setDownloading] = useState(false);

  async function onDownload() {
    setDownloading(true);
    toast.info('Descărcarea este în curs, te rugăm să aștepți…');
    try {
      await downloadContractPdf(contract._id);
      toast.success('PDF descărcat.');
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Modal title={contract.contractNo ? `Contract ${contract.contractNo}` : 'Contract (draft)'} onClose={onClose} wide>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 16, fontSize: 13 }}>
        <span className="muted">Status: <strong style={{ color: 'var(--ink)' }}>{contract.status}</strong></span>
        <span className="muted">Data: {fmt(contract.signedAt ?? contract.createdAt)}</span>
        <span className="muted">Expirare: {fmt(contract.expiresAt)}</span>
        <span className="muted">Puncte de lucru: {contract.snapshot.workpoints.length}</span>
      </div>
      <DocFrame html={htmlQ.data} height={520} />
      {(contract.status === 'Semnat' || contract.status === 'Expirat') && (
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

/* ─── Editare draft: schimbă punctele de lucru incluse ─── */
function EditDraftModal({ contract, onClose, onSaved }: { contract: Contract; onClose: () => void; onSaved: () => void }) {
  const wpQ = useQuery({ queryKey: ['workpoints'], queryFn: listWorkpoints });
  const [selected, setSelected] = useState<string[]>(contract.workpointIds);
  const [error, setError] = useState('');

  const save = useMutation({
    mutationFn: () => editContract(contract._id, selected),
    meta: { successMessage: 'Draft actualizat.' },
    onSuccess: onSaved,
    onError: (e) => setError(apiError(e)),
  });

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  // Disponibile: punctele fără alt contract + cele incluse deja în acest draft.
  const all: Workpoint[] = wpQ.data ?? [];
  const available = all.filter((w) => !w.hasContract || contract.workpointIds.includes(w._id));

  return (
    <Modal title="Editează draftul de contract" onClose={onClose}>
      <p className="muted" style={{ fontSize: 14, marginBottom: 16 }}>
        Bifează punctele de lucru incluse în contract. Datele se reîmprospătează din punctele curente.
      </p>
      {error && <div className="alert alert--error">{error}</div>}
      {wpQ.isLoading ? (
        <div className="skeleton" style={{ height: 120 }} />
      ) : (
        <div style={{ display: 'grid', gap: 10, marginBottom: 18 }}>
          {available.map((w) => (
            <label key={w._id} className="card" style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '14px 16px', cursor: 'pointer' }}>
              <input type="checkbox" checked={selected.includes(w._id)} onChange={() => toggle(w._id)} />
              <span>
                <strong>{w.denumire || w.address}</strong><br />
                <small className="muted">{w.address} · {w.tipActivitate}</small>
              </span>
            </label>
          ))}
        </div>
      )}
      <button className="btn btn--primary btn--block" disabled={selected.length === 0 || save.isPending} onClick={() => save.mutate()}>
        {save.isPending ? 'Se salvează…' : `Salvează draftul (${selected.length})`}
      </button>
    </Modal>
  );
}

function SignModal({
  contract,
  onClose,
  onSigned,
}: {
  contract: Contract;
  onClose: () => void;
  onSigned: () => void;
}) {
  const htmlQ = useQuery({
    queryKey: ['contract-html', contract._id],
    queryFn: () => getContractHtml(contract._id),
  });
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState('');

  const sign = useMutation({
    mutationFn: () => signContract(contract._id, signature!),
    meta: { successMessage: 'Contract semnat cu succes.' },
    onSuccess: onSigned,
    onError: (e) => setError(apiError(e)),
  });

  return (
    <Modal title="Citește & semnează contractul" onClose={onClose} wide>
      {error && <div className="alert alert--error">{error}</div>}

      <DocFrame html={htmlQ.data} height={460} />

      <p style={{ margin: '20px 0 10px', fontWeight: 600 }}>Semnătură electronică</p>
      <SignaturePad onChange={setSignature} />

      <button
        className="btn btn--primary btn--block"
        style={{ marginTop: 18 }}
        disabled={!signature || sign.isPending}
        onClick={() => sign.mutate()}
      >
        {sign.isPending ? 'Se semnează…' : 'Semnează contractul'}
      </button>
    </Modal>
  );
}
