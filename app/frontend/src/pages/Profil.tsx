import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '../components/Icon';
import { JUDETE, TIP_ACTIVITATE } from '../lib/constants';
import { getProfile, updateProfile, type Profile as ProfileT } from '../lib/resources';

type FormValues = Partial<ProfileT>;

export function Profil() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['profile'], queryFn: getProfile });
  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<FormValues>();

  useEffect(() => {
    if (data) reset(data);
  }, [data, reset]);

  const save = useMutation({
    mutationFn: (v: FormValues) => updateProfile(v),
    meta: { successMessage: 'Profil salvat.' },
    onSuccess: (updated) => {
      qc.setQueryData(['profile'], updated);
      reset(updated);
    },
  });

  if (isLoading || !data) {
    return (
      <div className="card" style={{ maxWidth: 820 }}>
        <div className="skeleton" style={{ height: 18, width: '40%', marginBottom: 18 }} />
        <div className="skeleton" style={{ height: 44, marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 44, marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 44 }} />
      </div>
    );
  }

  return (
    <>
      <div className="topbar">
        <div className="page-head">
          <span className="page-head__icon"><Icon name="building" /></span>
          <div>
            <h1 className="page-title">Profil firmă</h1>
            <p className="page-head__sub">Datele firmei, persoanei de contact și administratorului.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit((v) => save.mutate(v))} style={{ maxWidth: 820 }}>
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="form-section-title">Date firmă</div>
          <div className="form-grid">
            <div className="field">
              <label>Denumire firmă</label>
              <input className="input" {...register('companyName')} />
            </div>
            <div className="field">
              <label>CUI / CIF</label>
              <input className="input" defaultValue={data.cui} disabled />
            </div>
            <div className="field">
              <label>Nr. Registrul Comerțului</label>
              <input className="input" {...register('regCom')} />
            </div>
            <div className="field">
              <label>Autorizație ANSVSA</label>
              <input className="input" {...register('ansvsaAuthorization')} />
            </div>
            <div className="field field--full">
              <label>Adresă sediu social</label>
              <input className="input" {...register('address')} />
            </div>
            <div className="field">
              <label>Oraș</label>
              <input className="input" {...register('city')} />
            </div>
            <div className="field">
              <label>Județ</label>
              <select className="select" {...register('judet')}>
                <option value="">Alege…</option>
                {JUDETE.map((j) => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div className="field field--full">
              <label>Tip activitate</label>
              <select className="select" {...register('tipActivitate')}>
                <option value="">Alege…</option>
                {TIP_ACTIVITATE.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 18 }}>
          <div className="form-section-title">Persoană de contact</div>
          <div className="form-grid">
            <div className="field">
              <label>Prenume</label>
              <input className="input" {...register('contactFirstName')} />
            </div>
            <div className="field">
              <label>Nume</label>
              <input className="input" {...register('contactLastName')} />
            </div>
            <div className="field">
              <label>Telefon</label>
              <input className="input" {...register('phone')} />
            </div>
            <div className="field">
              <label>Email (cont)</label>
              <input className="input" defaultValue={data.email} disabled />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 18 }}>
          <div className="form-section-title">Administrator (pentru contract)</div>
          <div className="form-grid">
            <div className="field field--full">
              <label>Nume administrator</label>
              <input className="input" {...register('adminName')} />
            </div>
            <div className="field">
              <label>Serie CI</label>
              <input className="input" {...register('adminIdSeries')} />
            </div>
            <div className="field">
              <label>Număr CI</label>
              <input className="input" {...register('adminIdNumber')} />
            </div>
          </div>
        </div>

        <button className="btn btn--primary" disabled={save.isPending || !isDirty}>
          {save.isPending ? 'Se salvează…' : 'Salvează modificările'}
        </button>
      </form>
    </>
  );
}
