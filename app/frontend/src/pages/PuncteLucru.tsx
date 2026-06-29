import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiError } from '../lib/api';
import { Modal } from '../components/Modal';
import { Icon } from '../components/Icon';
import { TIP_ACTIVITATE_PUNCT_LUCRU } from '../lib/constants';
import {
  createWorkpoint,
  deleteWorkpoint,
  generateContract,
  getProfile,
  listWorkpoints,
  updateProfile,
  updateWorkpoint,
  type Profile,
  type Workpoint,
} from '../lib/resources';

export function PuncteLucru() {
  const qc = useQueryClient();
  const profileQ = useQuery({ queryKey: ['profile'], queryFn: getProfile });
  const wpQ = useQuery({ queryKey: ['workpoints'], queryFn: listWorkpoints });

  if (profileQ.isLoading || wpQ.isLoading) {
    return <div className="card"><p className="muted">Se încarcă…</p></div>;
  }
  const profile = profileQ.data!;
  const workpoints = wpQ.data ?? [];

  return (
    <>
      <div className="topbar">
        <div className="page-head">
          <span className="page-head__icon"><Icon name="pin" /></span>
          <div>
            <h1 className="page-title">Puncte de lucru</h1>
            <p className="page-head__sub">Gestionează adresele de ridicare și datele administratorului.</p>
          </div>
        </div>
      </div>

      {!profile.adminComplete ? (
        <AdminGate
          profile={profile}
          onDone={() => qc.invalidateQueries({ queryKey: ['profile'] })}
        />
      ) : (
        <WorkpointsManager profile={profile} workpoints={workpoints} />
      )}
    </>
  );
}

/* ─── Pasul 1: datele administratorului (precondiție US-05) ─── */
function AdminGate({ profile, onDone }: { profile: Profile; onDone: () => void }) {
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      adminName: profile.adminName ?? '',
      adminIdSeries: profile.adminIdSeries ?? '',
      adminIdNumber: profile.adminIdNumber ?? '',
    },
  });

  async function onSubmit(values: any) {
    setError('');
    try {
      await updateProfile(values);
      onDone();
    } catch (e) {
      setError(apiError(e));
    }
  }

  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <h3 style={{ fontSize: 18, marginBottom: 6 }}>Datele administratorului</h3>
      <p className="muted" style={{ fontSize: 14, marginBottom: 18 }}>
        Înainte de a adăuga puncte de lucru și a genera contractul, completează
        datele administratorului firmei.
      </p>
      {error && <div className="alert alert--error">{error}</div>}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="field">
          <label>Nume administrator *</label>
          <input className="input" {...register('adminName', { required: true })} />
        </div>
        <div className="form-grid">
          <div className="field">
            <label>Serie CI *</label>
            <input className="input" {...register('adminIdSeries', { required: true })} />
          </div>
          <div className="field">
            <label>Număr CI *</label>
            <input className="input" {...register('adminIdNumber', { required: true })} />
          </div>
        </div>
        <button className="btn btn--primary" disabled={isSubmitting}>
          {isSubmitting ? 'Se salvează…' : 'Salvează și continuă'}
        </button>
      </form>
    </div>
  );
}

/* ─── Pasul 2: gestionarea punctelor de lucru ─── */
function WorkpointsManager({
  profile,
  workpoints,
}: {
  profile: Profile;
  workpoints: Workpoint[];
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Workpoint | 'new' | null>(null);
  const [genOpen, setGenOpen] = useState(false);

  const remaining = profile.workpointsAllowed - workpoints.length;
  const withoutContract = workpoints.filter((w) => !w.hasContract);

  const del = useMutation({
    mutationFn: deleteWorkpoint,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workpoints'] }),
  });

  return (
    <>
      <div className="toolbar">
        <button
          className="btn btn--primary"
          disabled={remaining <= 0}
          onClick={() => setEditing('new')}
        >
          <Icon name="plus" size={17} /> Adaugă punct de lucru
        </button>
        <span className="badge badge--gray">
          {workpoints.length} / {profile.workpointsAllowed} puncte
        </span>
        <div className="spacer" />
        <button
          className="btn btn--ghost"
          disabled={withoutContract.length === 0}
          onClick={() => setGenOpen(true)}
        >
          <Icon name="contract" size={17} /> Generează contract
        </button>
      </div>

      {workpoints.length === 0 ? (
        <div className="card empty">
          <div className="empty__icon"><Icon name="pin" size={26} /></div>
          <div className="empty__title">Niciun punct de lucru</div>
          <p>Adaugă primul punct de lucru ca să poți genera contractul cadru.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Denumire</th>
                <th>Adresă</th>
                <th>Activitate</th>
                <th>Nr. autorizație</th>
                <th>Contract</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {workpoints.map((w) => (
                <tr key={w._id}>
                  <td>{w.denumire || '—'}</td>
                  <td>{w.address}</td>
                  <td>{w.tipActivitate}</td>
                  <td>{w.sanitaryAuthNumber}</td>
                  <td>
                    <span className={`badge ${w.hasContract ? 'badge--green' : 'badge--gray'}`}>
                      {w.hasContract ? 'Da' : 'Fără'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button className="icon-btn" title="Editează" onClick={() => setEditing(w)}>
                        <Icon name="edit" size={16} />
                      </button>
                      <button
                        className="icon-btn icon-btn--danger"
                        title="Șterge"
                        disabled={w.hasContract}
                        onClick={() => {
                          if (confirm('Ștergi acest punct de lucru?')) del.mutate(w._id);
                        }}
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <WorkpointForm
          profile={profile}
          workpoint={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            qc.invalidateQueries({ queryKey: ['workpoints'] });
          }}
        />
      )}

      {genOpen && (
        <GenerateContractModal
          workpoints={withoutContract}
          onClose={() => setGenOpen(false)}
        />
      )}
    </>
  );
}

/* ─── Formular punct de lucru (creare/editare) ─── */
function WorkpointForm({
  profile,
  workpoint,
  onClose,
  onSaved,
}: {
  profile: Profile;
  workpoint: Workpoint | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<Partial<Workpoint>>({
    defaultValues: workpoint ?? {
      contactPerson: [profile.contactFirstName, profile.contactLastName].filter(Boolean).join(' '),
      contactPhone: profile.phone,
    },
  });

  async function onSubmit(values: Partial<Workpoint>) {
    setError('');
    try {
      if (workpoint) await updateWorkpoint(workpoint._id, values);
      else await createWorkpoint(values);
      onSaved();
    } catch (e) {
      setError(apiError(e));
    }
  }

  return (
    <Modal title={workpoint ? 'Editează punctul de lucru' : 'Punct de lucru nou'} onClose={onClose}>
      {error && <div className="alert alert--error">{error}</div>}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="field">
          <label>Denumire</label>
          <input className="input" {...register('denumire')} />
        </div>
        <div className="field">
          <label>Adresă completă *</label>
          <input className="input" {...register('address', { required: true })} />
        </div>
        <div className="field">
          <label>Tip activitate *</label>
          <select className="select" {...register('tipActivitate', { required: true })}>
            <option value="">Alege…</option>
            {TIP_ACTIVITATE_PUNCT_LUCRU.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-grid">
          <div className="field">
            <label>Persoană de contact</label>
            <input className="input" {...register('contactPerson')} />
          </div>
          <div className="field">
            <label>Telefon contact</label>
            <input className="input" {...register('contactPhone')} />
          </div>
        </div>
        <div className="field">
          <label>Nr. autorizație / document sanitar-veterinar *</label>
          <input className="input" {...register('sanitaryAuthNumber', { required: true })} />
        </div>
        <button className="btn btn--primary btn--block" disabled={isSubmitting}>
          {isSubmitting ? 'Se salvează…' : 'Salvează'}
        </button>
      </form>
    </Modal>
  );
}

/* ─── Pop-up generare contract (US-05) ─── */
function GenerateContractModal({
  workpoints,
  onClose,
}: {
  workpoints: Workpoint[];
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string[]>(workpoints.map((w) => w._id));
  const [error, setError] = useState('');

  const gen = useMutation({
    mutationFn: () => generateContract(selected),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workpoints'] });
      qc.invalidateQueries({ queryKey: ['contracts'] });
      navigate('/contracte');
    },
    onError: (e) => setError(apiError(e)),
  });

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  return (
    <Modal title="Generează contract" onClose={onClose}>
      <p className="muted" style={{ fontSize: 14, marginBottom: 16 }}>
        Selectează punctele de lucru pentru care generezi contractul cadru.
      </p>
      {error && <div className="alert alert--error">{error}</div>}
      <div style={{ display: 'grid', gap: 10, marginBottom: 18 }}>
        {workpoints.map((w) => (
          <label key={w._id} className="card" style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '14px 16px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={selected.includes(w._id)}
              onChange={() => toggle(w._id)}
            />
            <span>
              <strong>{w.denumire || w.address}</strong>
              <br />
              <small className="muted">{w.address} · {w.tipActivitate}</small>
            </span>
          </label>
        ))}
      </div>
      <button
        className="btn btn--primary btn--block"
        disabled={selected.length === 0 || gen.isPending}
        onClick={() => gen.mutate()}
      >
        {gen.isPending ? 'Se generează…' : `Generează contract (${selected.length})`}
      </button>
    </Modal>
  );
}
