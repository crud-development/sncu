import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiError } from '../lib/api';
import { Modal } from '../components/Modal';
import { SignaturePad } from '../components/SignaturePad';
import {
  cancelContract,
  downloadContractPdf,
  getContractText,
  listContracts,
  signContract,
  type Contract,
  type ContractStatus,
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

export function Contracte() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['contracts'], queryFn: listContracts });
  const [signing, setSigning] = useState<Contract | null>(null);

  const cancel = useMutation({
    mutationFn: cancelContract,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] });
      qc.invalidateQueries({ queryKey: ['workpoints'] });
    },
  });

  if (isLoading) {
    return <div className="card"><p className="muted">Se încarcă…</p></div>;
  }
  const contracts = data ?? [];

  return (
    <>
      <div className="topbar">
        <h1 className="page-title">Contracte</h1>
      </div>

      {contracts.length === 0 ? (
        <div className="card empty">
          Niciun contract încă. Mergi la{' '}
          <Link to="/puncte-lucru">Puncte de lucru</Link> și generează contractul.
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
                  <td>{c.contractNo ?? <span className="muted">(draft)</span>}</td>
                  <td>{c.snapshot.workpoints.length}</td>
                  <td>{fmt(c.signedAt ?? c.createdAt)}</td>
                  <td>{fmt(c.expiresAt)}</td>
                  <td>
                    <span className={`badge ${STATUS_CLASS[c.status]}`}>{c.status}</span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                    {c.status === 'Draft' && (
                      <button className="btn btn--primary btn--sm" onClick={() => setSigning(c)}>
                        Citește & semnează
                      </button>
                    )}
                    {(c.status === 'Semnat' || c.status === 'Expirat') && (
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={() => downloadContractPdf(c._id)}
                      >
                        Descarcă PDF
                      </button>
                    )}{' '}
                    {(c.status === 'Draft' || c.status === 'Semnat') && (
                      <button
                        className="btn btn--danger btn--sm"
                        onClick={() => {
                          if (confirm('Anulezi acest contract?')) cancel.mutate(c._id);
                        }}
                      >
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

      {signing && (
        <SignModal
          contract={signing}
          onClose={() => setSigning(null)}
          onSigned={() => {
            setSigning(null);
            qc.invalidateQueries({ queryKey: ['contracts'] });
          }}
        />
      )}
    </>
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
  const textQ = useQuery({
    queryKey: ['contract-text', contract._id],
    queryFn: () => getContractText(contract._id),
  });
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState('');

  const sign = useMutation({
    mutationFn: () => signContract(contract._id, signature!),
    onSuccess: onSigned,
    onError: (e) => setError(apiError(e)),
  });

  return (
    <Modal title="Semnează contractul" onClose={onClose} wide>
      {error && <div className="alert alert--error">{error}</div>}

      <div className="contract-text">
        {textQ.isLoading ? 'Se încarcă contractul…' : textQ.data}
      </div>

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
