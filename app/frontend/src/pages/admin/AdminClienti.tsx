import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiError } from '../../lib/api';
import { toast } from '../../lib/toast';
import { exportExcel } from '../../lib/exportExcel';
import { useAuth } from '../../auth/AuthContext';
import { Modal } from '../../components/Modal';
import { Icon } from '../../components/Icon';
import { TableSkeleton } from '../../components/Skeleton';
import { JUDETE, TIP_ACTIVITATE, priceNoVat, formatLei } from '../../lib/constants';
import {
  adminCancelContract,
  adminCreateClient,
  adminExtendContract,
  adminGetClient,
  adminImpersonate,
  adminListClients,
  adminUpdateClient,
  getPaymentConfig,
  lookupAnaf,
  type AdminClient,
} from '../../lib/resources';

function statusBadge(status: string | null) {
  if (!status) return <span className="badge badge--gray">—</span>;
  const cls =
    status === 'Activ' || status === 'Semnat' ? 'badge--green'
    : status === 'Expirat' ? 'badge--amber'
    : status === 'Anulat' ? 'badge--red'
    : 'badge--gray';
  return <span className={`badge ${cls}`}>{status}</span>;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Status client pe baza expirării contractului: Activ / Expirat. */
function clientLifecycleStatus(c: AdminClient): 'Activ' | 'Expirat' | null {
  if (c.contractStatus === 'Expirat') return 'Expirat';
  if (c.contractExpiresAt) {
    return startOfDay(new Date(c.contractExpiresAt)) >= startOfDay(new Date())
      ? 'Activ'
      : 'Expirat';
  }
  if (c.contractStatus === 'Semnat') return 'Activ';
  return null;
}

function hasActiveContract(c: AdminClient): boolean {
  if (c.contractStatus !== 'Semnat') return false;
  if (!c.contractExpiresAt) return true;
  return startOfDay(new Date(c.contractExpiresAt)) >= startOfDay(new Date());
}

function fmt(d?: string) {
  return d ? new Date(d).toLocaleDateString('ro-RO') : '';
}

export function AdminClienti() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-clients'], queryFn: adminListClients });
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<AdminClient | null>(null);
  const [managing, setManaging] = useState<AdminClient | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeContract, setActiveContract] = useState('');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [expiresFrom, setExpiresFrom] = useState('');
  const [expiresTo, setExpiresTo] = useState('');
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

  const clients = data ?? [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return clients.filter((c) => {
      if (q) {
        const hay = [
          c.companyName,
          c.cui,
          c.email,
          c.phone,
          c.contactPerson,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (statusFilter) {
        if (clientLifecycleStatus(c) !== statusFilter) return false;
      }

      if (activeContract === 'da' && !hasActiveContract(c)) return false;
      if (activeContract === 'nu' && hasActiveContract(c)) return false;

      if (createdFrom || createdTo) {
        if (!c.createdAt) return false;
        const created = new Date(c.createdAt);
        if (createdFrom && created < new Date(createdFrom)) return false;
        if (createdTo && created > new Date(createdTo + 'T23:59:59')) return false;
      }

      if (expiresFrom || expiresTo) {
        if (!c.contractExpiresAt) return false;
        const exp = new Date(c.contractExpiresAt);
        if (expiresFrom && exp < new Date(expiresFrom)) return false;
        if (expiresTo && exp > new Date(expiresTo + 'T23:59:59')) return false;
      }

      return true;
    });
  }, [
    clients,
    search,
    statusFilter,
    activeContract,
    createdFrom,
    createdTo,
    expiresFrom,
    expiresTo,
  ]);

  if (isLoading) return <TableSkeleton cols={10} />;

  return (
    <>
      <div className="topbar">
        <div className="page-head">
          <span className="page-head__icon"><Icon name="users" /></span>
          <div>
            <h1 className="page-title">Clienți</h1>
            <p className="page-head__sub">
              {filtered.length === clients.length
                ? `${clients.length} clienți înregistrați în platformă.`
                : `${filtered.length} din ${clients.length} clienți.`}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="btn btn--ghost"
            disabled={filtered.length === 0}
            onClick={() => {
              exportExcel(
                'clienti.xls',
                ['Firmă', 'CUI', 'Contact', 'Email', 'Telefon', 'Contract activ', 'Status', 'Creat', 'Expirare', 'Plată'],
                filtered.map((c) => [
                  c.companyName,
                  c.cui,
                  c.contactPerson || '',
                  c.email,
                  c.phone || '',
                  hasActiveContract(c) ? 'Da' : 'Nu',
                  clientLifecycleStatus(c) || '',
                  fmt(c.createdAt),
                  fmt(c.contractExpiresAt),
                  c.paymentType,
                ]),
              );
            }}
          >
            <Icon name="download" size={17} /> Export Excel
          </button>
          <button className="btn btn--primary" onClick={() => setAddOpen(true)}>
            <Icon name="plus" size={17} /> Adaugă client (OP)
          </button>
        </div>
      </div>

      <div className="toolbar">
        <input
          className="input"
          style={{ width: 280 }}
          placeholder="Caută firmă, CUI, email, telefon, contact…"
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
          <option value="Activ">Activ</option>
          <option value="Expirat">Expirat</option>
        </select>
        <select
          className="select"
          style={{ width: 'auto' }}
          value={activeContract}
          onChange={(e) => setActiveContract(e.target.value)}
        >
          <option value="">Contract activ: toate</option>
          <option value="da">Contract activ: Da</option>
          <option value="nu">Contract activ: Nu</option>
        </select>
        <span className="muted" style={{ fontSize: 13 }}>Data creare:</span>
        <input type="date" className="input" style={{ width: 'auto' }} value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)} />
        <input type="date" className="input" style={{ width: 'auto' }} value={createdTo} onChange={(e) => setCreatedTo(e.target.value)} />
        <span className="muted" style={{ fontSize: 13 }}>Expirare:</span>
        <input type="date" className="input" style={{ width: 'auto' }} value={expiresFrom} onChange={(e) => setExpiresFrom(e.target.value)} />
        <input type="date" className="input" style={{ width: 'auto' }} value={expiresTo} onChange={(e) => setExpiresTo(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="card empty">
          <div className="empty__icon"><Icon name="users" size={26} /></div>
          <div className="empty__title">Niciun client</div>
          <p>Nu există clienți pentru filtrele curente.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Firmă</th><th>Contact</th><th>Email</th><th>Telefon</th>
                <th>Contract activ</th><th>Status</th><th>Creat</th><th>Expirare</th><th>Plată</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>{c.companyName}<br /><small className="muted">{c.cui}</small></td>
                  <td>{c.contactPerson || '—'}</td>
                  <td>{c.email}</td>
                  <td>{c.phone || '—'}</td>
                  <td>
                    <Link
                      to={`/admin/contracte?q=${encodeURIComponent(c.cui || c.companyName)}`}
                      className={`badge ${hasActiveContract(c) ? 'badge--green' : 'badge--gray'}`}
                      title="Vezi contractele clientului"
                      style={{ textDecoration: 'none' }}
                    >
                      {hasActiveContract(c) ? 'Da' : 'Nu'}
                    </Link>
                  </td>
                  <td>{statusBadge(clientLifecycleStatus(c))}</td>
                  <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString('ro-RO') : '—'}</td>
                  <td>{c.contractExpiresAt ? new Date(c.contractExpiresAt).toLocaleDateString('ro-RO') : '—'}</td>
                  <td><span className="badge badge--gray">{c.paymentType}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button className="btn btn--ghost btn--sm" onClick={() => setManaging(c)}>
                        Gestionează
                      </button>
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
      )}

      {addOpen && <AddClientModal onClose={() => setAddOpen(false)} />}
      {editing && <EditClientModal client={editing} onClose={() => setEditing(null)} />}
      {managing && (
        <ManageClientModal
          client={managing}
          onClose={() => setManaging(null)}
          onExtended={() => {
            setManaging(null);
            qc.invalidateQueries({ queryKey: ['admin-clients'] });
          }}
        />
      )}
    </>
  );
}

function ManageClientModal({
  client,
  onClose,
  onExtended,
}: {
  client: AdminClient;
  onClose: () => void;
  onExtended: () => void;
}) {
  const [periodYears, setPeriodYears] = useState(1);
  const [error, setError] = useState('');
  const pricingQ = useQuery({
    queryKey: ['payment-config'],
    queryFn: getPaymentConfig,
  });

  const extend = useMutation({
    mutationFn: () => adminExtendContract(client.id, periodYears),
    meta: { successMessage: 'Contract prelungit. Plata OP a fost înregistrată.' },
    onSuccess: onExtended,
    onError: (e) => setError(apiError(e)),
  });

  const pricing = pricingQ.data?.pricing;
  const yearlyNoVat = pricing ? priceNoVat(pricing) : 0;
  const yearlyTotal = pricing ? yearlyNoVat * (1 + pricing.vatRate) : 0;
  const amountNoVat = yearlyNoVat * periodYears;
  const amountTotal = yearlyTotal * periodYears;

  const currentExpiry = client.contractExpiresAt
    ? new Date(client.contractExpiresAt)
    : null;
  const now = new Date();
  const base = currentExpiry && currentExpiry > now ? currentExpiry : now;
  const previewExpiry = new Date(base);
  previewExpiry.setFullYear(previewExpiry.getFullYear() + periodYears);

  return (
    <Modal title={`Gestionează — ${client.companyName}`} onClose={onClose}>
      {error && <div className="alert alert--error">{error}</div>}

      <div style={{ display: 'grid', gap: 8, marginBottom: 18, fontSize: 13 }}>
        <span className="muted">
          Expirare curentă:{' '}
          <strong style={{ color: 'var(--ink)' }}>
            {currentExpiry ? currentExpiry.toLocaleDateString('ro-RO') : '—'}
          </strong>
        </span>
      </div>

      <div className="form-section-title">Prelungește contract</div>
      <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>
        Selectează perioada de prelungire. Se înregistrează automat o plată OP în baza de date.
      </p>

      <div className="field">
        <label>Perioadă prelungire *</label>
        <select
          className="select"
          value={periodYears}
          onChange={(e) => setPeriodYears(Number(e.target.value))}
        >
          <option value={1}>1 an</option>
          <option value={2}>2 ani</option>
          <option value={3}>3 ani</option>
        </select>
      </div>

      <div className="alert alert--success" style={{ marginBottom: 16 }}>
        Noua expirare: <strong>{previewExpiry.toLocaleDateString('ro-RO')}</strong>
        {pricing && (
          <>
            <br />
            Plată OP: <strong>{formatLei(amountTotal)}</strong>
            {' '}({formatLei(amountNoVat)} + TVA) pentru {periodYears} {periodYears === 1 ? 'an' : 'ani'}
          </>
        )}
      </div>

      <button
        className="btn btn--primary btn--block"
        disabled={extend.isPending || !pricing}
        onClick={() => extend.mutate()}
      >
        {extend.isPending ? 'Se salvează…' : 'Salvează prelungirea'}
      </button>
    </Modal>
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
    mutationFn: (v: any) =>
      adminCreateClient({
        companyName: v.companyName,
        cui: v.cui,
        regCom: v.regCom || undefined,
        address: v.address,
        city: v.city,
        judet: v.judet,
        tipActivitate: v.tipActivitate,
        contactFirstName: v.contactFirstName,
        contactLastName: v.contactLastName,
        email: v.email,
        phone: v.phone,
        contractExpiresAt: v.contractExpiresAt,
      }),
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
        </div>
        <p className="muted" style={{ fontSize: 13, margin: '4px 0 14px' }}>
          Plata este setată automat pe <strong>OP</strong>. Contul se creează inactiv și primește email de activare.
        </p>
        <button className="btn btn--primary btn--block" disabled={isSubmitting || create.isPending}>
          {isSubmitting || create.isPending ? 'Se salvează…' : 'Creează client'}
        </button>
      </form>
    </Modal>
  );
}
