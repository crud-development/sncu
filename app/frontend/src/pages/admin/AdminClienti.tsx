import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiError } from '../../lib/api';
import { toast } from '../../lib/toast';
import { useAuth } from '../../auth/AuthContext';
import { Modal } from '../../components/Modal';
import { Icon } from '../../components/Icon';
import { TableSkeleton } from '../../components/Skeleton';
import { JUDETE, TIP_ACTIVITATE } from '../../lib/constants';
import {
  adminCancelContract,
  adminCreateClient,
  adminGetClient,
  adminImpersonate,
  adminListClients,
  adminUpdateClient,
  downloadAdminContractPdf,
  lookupAnaf,
  type AdminClient,
} from '../../lib/resources';

function statusBadge(status: string | null) {
  if (!status) return <span className="badge badge--gray">—</span>;
  const cls =
    status === 'Semnat' ? 'badge--green'
    : status === 'Anulat' ? 'badge--red'
    : status === 'Expirat' ? 'badge--amber'
    : 'badge--gray';
  return <span className={`badge ${cls}`}>{status}</span>;
}

export function AdminClienti() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-clients'], queryFn: adminListClients });
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<AdminClient | null>(null);
  const { startImpersonation } = useAuth();
  const navigate = useNavigate();

  const impersonate = useMutation({
    mutationFn: adminImpersonate,
    onSuccess: (d) => {
      startImpersonation(d.accessToken, d.user);
      navigate('/dashboard');
    },
  });
  const cancelContract = useMutation({
    mutationFn: adminCancelContract,
    meta: { successMessage: 'Contract anulat.' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-clients'] }),
  });

  if (isLoading) return <TableSkeleton cols={10} />;
  const clients = data ?? [];

  return (
    <>
      <div className="topbar">
        <div className="page-head">
          <span className="page-head__icon"><Icon name="users" /></span>
          <div>
            <h1 className="page-title">Clienți</h1>
            <p className="page-head__sub">{clients.length} clienți înregistrați în platformă.</p>
          </div>
        </div>
        <button className="btn btn--primary" onClick={() => setAddOpen(true)}>
          <Icon name="plus" size={17} /> Adaugă client (OP)
        </button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Firmă</th><th>Contact</th><th>Email</th><th>Telefon</th>
              <th>Contract</th><th>Status</th><th>Creat</th><th>Expirare</th><th>Plată</th><th></th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id}>
                <td>{c.companyName}<br /><small className="muted">{c.cui}</small></td>
                <td>{c.contactPerson || '—'}</td>
                <td>{c.email}</td>
                <td>{c.phone || '—'}</td>
                <td>
                  {c.contractId ? (
                    <button className="btn btn--ghost btn--sm" onClick={() => downloadAdminContractPdf(c.contractId!)}>
                      {c.contractNo}
                    </button>
                  ) : '—'}
                </td>
                <td>{statusBadge(c.contractStatus)}</td>
                <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString('ro-RO') : '—'}</td>
                <td>{c.contractExpiresAt ? new Date(c.contractExpiresAt).toLocaleDateString('ro-RO') : '—'}</td>
                <td><span className="badge badge--gray">{c.paymentType}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                    <button className="icon-btn" title="Editează clientul" onClick={() => setEditing(c)}>
                      <Icon name="edit" size={16} />
                    </button>
                    {c.contractId && c.contractStatus === 'Semnat' && (
                      <button className="icon-btn icon-btn--danger" title="Anulează contractul"
                        onClick={() => { if (confirm('Anulezi contractul acestui client?')) cancelContract.mutate(c.contractId!); }}>
                        <Icon name="x" size={16} />
                      </button>
                    )}
                    <button className="btn btn--ghost btn--sm" onClick={() => impersonate.mutate(c.id)}>
                      Impersonare
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {addOpen && <AddClientModal onClose={() => setAddOpen(false)} />}
      {editing && <EditClientModal client={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function EditClientModal({ client, onClose }: { client: AdminClient; onClose: () => void }) {
  const qc = useQueryClient();
  const [error, setError] = useState('');
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<any>();
  const detailQ = useQuery({ queryKey: ['admin-client', client.id], queryFn: () => adminGetClient(client.id) });

  useEffect(() => { if (detailQ.data) reset(detailQ.data); }, [detailQ.data, reset]);

  const save = useMutation({
    mutationFn: (v: any) => adminUpdateClient(client.id, v),
    meta: { successMessage: 'Client actualizat.' },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-clients'] }); onClose(); },
    onError: (e) => setError(apiError(e)),
  });

  return (
    <Modal title={`Editează ${client.companyName}`} onClose={onClose} wide>
      {error && <div className="alert alert--error">{error}</div>}
      {detailQ.isLoading ? (
        <div className="skeleton" style={{ height: 220 }} />
      ) : (
        <form onSubmit={handleSubmit((v) => save.mutate(v))}>
          <div className="form-section-title">Date firmă</div>
          <div className="form-grid">
            <div className="field"><label>Denumire firmă</label><input className="input" {...register('companyName')} /></div>
            <div className="field"><label>Nr. Registrul Comerțului</label><input className="input" {...register('regCom')} /></div>
            <div className="field field--full"><label>Adresă sediu social</label><input className="input" {...register('address')} /></div>
            <div className="field"><label>Oraș</label><input className="input" {...register('city')} /></div>
            <div className="field"><label>Județ</label>
              <select className="select" {...register('judet')}>
                <option value="">Alege…</option>{JUDETE.map((j) => <option key={j} value={j}>{j}</option>)}
              </select></div>
            <div className="field field--full"><label>Tip activitate</label>
              <select className="select" {...register('tipActivitate')}>
                <option value="">Alege…</option>{TIP_ACTIVITATE.map((t) => <option key={t} value={t}>{t}</option>)}
              </select></div>
            <div className="field"><label>Autorizație ANSVSA</label><input className="input" {...register('ansvsaAuthorization')} /></div>
          </div>

          <div className="form-section-title">Persoană de contact</div>
          <div className="form-grid">
            <div className="field"><label>Prenume</label><input className="input" {...register('contactFirstName')} /></div>
            <div className="field"><label>Nume</label><input className="input" {...register('contactLastName')} /></div>
            <div className="field"><label>Telefon</label><input className="input" {...register('phone')} /></div>
          </div>

          <div className="form-section-title">Administrator</div>
          <div className="form-grid">
            <div className="field field--full"><label>Nume administrator</label><input className="input" {...register('adminName')} /></div>
            <div className="field"><label>Serie CI</label><input className="input" {...register('adminIdSeries')} /></div>
            <div className="field"><label>Număr CI</label><input className="input" {...register('adminIdNumber')} /></div>
          </div>

          <button className="btn btn--primary btn--block" disabled={isSubmitting}>
            {isSubmitting ? 'Se salvează…' : 'Salvează modificările'}
          </button>
        </form>
      )}
    </Modal>
  );
}

function AddClientModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [error, setError] = useState('');
  const [anafLoading, setAnafLoading] = useState(false);
  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<any>();

  async function fetchAnaf() {
    const cui = (watch('cui') || '').trim();
    if (!cui) {
      toast.error('Introdu CUI-ul firmei.');
      return;
    }
    setAnafLoading(true);
    try {
      const d = await lookupAnaf(cui);
      setValue('companyName', d.companyName);
      setValue('regCom', d.regCom);
      setValue('address', d.address);
      setValue('city', d.city);
      if (d.judet) setValue('judet', d.judet);
      toast.success('Date preluate de la ANAF.');
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setAnafLoading(false);
    }
  }

  const create = useMutation({
    mutationFn: (v: any) => adminCreateClient(v),
    meta: { successMessage: 'Client creat. Emailul de activare a fost trimis.' },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-clients'] });
      onClose();
    },
    onError: (e) => setError(apiError(e)),
  });

  return (
    <Modal title="Adaugă client (plată OP)" onClose={onClose} wide>
      {error && <div className="alert alert--error">{error}</div>}
      <form onSubmit={handleSubmit((v) => create.mutate(v))}>
        <div className="form-grid">
          <div className="field"><label>Denumire firmă *</label><input className="input" {...register('companyName', { required: true })} /></div>
          <div className="field"><label>CUI / CIF *</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                placeholder="ex: RO12345678"
                {...register('cui', { required: true })}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); fetchAnaf(); } }}
              />
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                style={{ flex: 'none' }}
                disabled={anafLoading}
                onClick={fetchAnaf}
                title="Preia datele firmei de la ANAF"
              >
                {anafLoading ? '…' : <><Icon name="download" size={15} /> ANAF</>}
              </button>
            </div>
          </div>
          <div className="field"><label>Nr. Reg. Comerțului</label><input className="input" {...register('regCom')} /></div>
          <div className="field"><label>Adresă sediu social *</label><input className="input" {...register('address', { required: true })} /></div>
          <div className="field"><label>Oraș *</label><input className="input" {...register('city', { required: true })} /></div>
          <div className="field">
            <label>Județ *</label>
            <select className="select" {...register('judet', { required: true })}>
              <option value="">Alege…</option>
              {JUDETE.map((j) => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Tip activitate *</label>
            <select className="select" {...register('tipActivitate', { required: true })}>
              <option value="">Alege…</option>
              {TIP_ACTIVITATE.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="field"><label>Prenume contact *</label><input className="input" {...register('contactFirstName', { required: true })} /></div>
          <div className="field"><label>Nume contact *</label><input className="input" {...register('contactLastName', { required: true })} /></div>
          <div className="field"><label>Email *</label><input type="email" className="input" {...register('email', { required: true })} /></div>
          <div className="field"><label>Telefon *</label><input className="input" {...register('phone', { required: true })} /></div>
          <div className="field"><label>Data expirare contract *</label><input type="date" className="input" {...register('contractExpiresAt', { required: true })} /></div>
          <div className="field"><label>Nr. puncte de lucru</label><input type="number" min={1} className="input" defaultValue={1} {...register('workpoints')} /></div>
        </div>
        <p className="muted" style={{ fontSize: 13, margin: '4px 0 14px' }}>
          Plata este setată automat pe <strong>OP</strong>. Contul se creează inactiv și primește email de activare.
        </p>
        <button className="btn btn--primary btn--block" disabled={isSubmitting}>
          {isSubmitting ? 'Se salvează…' : 'Creează client'}
        </button>
      </form>
    </Modal>
  );
}
