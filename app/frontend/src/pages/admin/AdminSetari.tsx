import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiError } from '../../lib/api';
import { adminGetSettings, adminUpdateSettings, type Settings } from '../../lib/resources';

export function AdminSetari() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-settings'], queryFn: adminGetSettings });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Settings>();

  useEffect(() => {
    if (data) {
      reset({ ...data, contractStartDate: data.contractStartDate?.slice(0, 10) as any });
    }
  }, [data, reset]);

  const save = useMutation({
    mutationFn: (v: Partial<Settings>) => adminUpdateSettings(v),
    onSuccess: () => {
      setMsg('Setări salvate.');
      setError('');
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      setTimeout(() => setMsg(''), 3000);
    },
    onError: (e) => setError(apiError(e)),
  });

  if (isLoading) return <div className="card"><p className="muted">Se încarcă…</p></div>;

  return (
    <>
      <div className="topbar"><h1 className="page-title">Setări</h1></div>
      <div className="card" style={{ maxWidth: 720 }}>
        {msg && <div className="alert alert--success">{msg}</div>}
        {error && <div className="alert alert--error">{error}</div>}
        <form onSubmit={handleSubmit((v) => save.mutate(v))}>
          <div className="form-grid">
            <div className="field"><label>Serie contracte</label><input className="input" {...register('contractSeries')} /></div>
            <div className="field"><label>Serie comenzi</label><input className="input" {...register('orderSeries')} /></div>
            <div className="field"><label>Data start contracte</label><input type="date" className="input" {...register('contractStartDate')} /></div>
          </div>
          <div className="field"><label>Template contract (URL Google Docs)</label><input className="input" {...register('contractTemplateUrl')} /></div>
          <div className="field"><label>Template comandă (URL)</label><input className="input" {...register('orderTemplateUrl')} /></div>
          <div className="field"><label>Template PV comandă (URL)</label><input className="input" {...register('pvTemplateUrl')} /></div>
          <div className="field">
            <label>Text template contract (gol = template implicit). Placeholdere: {'{{companyName}}'}, {'{{cui}}'}, {'{{contractNo}}'}, {'{{workpointsBlock}}'} etc.</label>
            <textarea className="input" rows={10} style={{ fontFamily: 'monospace', fontSize: 13 }} {...register('contractTemplateText')} />
          </div>
          <button className="btn btn--primary" disabled={isSubmitting}>
            {isSubmitting ? 'Se salvează…' : 'Salvează setările'}
          </button>
        </form>
      </div>
    </>
  );
}
