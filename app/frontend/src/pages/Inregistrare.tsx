import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiError } from '../lib/api';
import { toast } from '../lib/toast';
import { Logo } from '../components/Logo';
import { Icon } from '../components/Icon';
import { StripePayment } from '../components/StripePayment';
import {
  createPaymentIntent,
  getPaymentConfig,
  lookupAnaf,
  mockConfirmPayment,
  type CreateIntentResult,
} from '../lib/resources';
import { JUDETE, TIP_ACTIVITATE, priceNoVat, formatLei } from '../lib/constants';

interface Form {
  contactPerson: string;
  email: string;
  phone: string;
  companyName: string;
  cui: string;
  address: string;
  city: string;
  judet: string;
  tipActivitate: string;
  ansvsaAuthorization?: string;
  acceptTerms: boolean;
}

type Step = 'form' | 'pay' | 'done';

export function Inregistrare() {
  const [step, setStep] = useState<Step>('form');
  const [intent, setIntent] = useState<CreateIntentResult | null>(null);
  const [error, setError] = useState('');
  const [anafLoading, setAnafLoading] = useState(false);
  const { data: paymentConfig } = useQuery({
    queryKey: ['payment-config'],
    queryFn: getPaymentConfig,
  });
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ defaultValues: { acceptTerms: false } });

  const pricing = paymentConfig?.pricing;
  const noVat = pricing ? priceNoVat(pricing) : 0;
  const total = pricing ? noVat * (1 + pricing.vatRate) : 0;

  async function fetchAnaf() {
    const cui = (watch('cui') || '').trim();
    if (!cui) {
      toast.error('Introdu CUI-ul firmei.');
      return;
    }
    setAnafLoading(true);
    try {
      const d = await lookupAnaf(cui);
      setValue('companyName', d.companyName, { shouldValidate: true });
      setValue('address', d.address, { shouldValidate: true });
      setValue('city', d.city, { shouldValidate: true });
      if (d.judet) setValue('judet', d.judet, { shouldValidate: true });
      toast.success('Date preluate de la ANAF.');
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setAnafLoading(false);
    }
  }

  async function onSubmit(values: Form) {
    setError('');
    try {
      const { acceptTerms: _, ...payload } = values;
      const res = await createPaymentIntent(payload);
      setIntent(res);
      setStep('pay');
    } catch (err) {
      setError(apiError(err));
    }
  }

  if (step === 'done') {
    return (
      <Shell>
        <div className="card">
          <h1 className="auth__title">Plată confirmată!</h1>
          <p className="auth__sub">
            Verifică emailul pentru factură și pentru linkul de activare a contului.
          </p>
          <Link className="btn btn--primary btn--block" to="/login">Mergi la autentificare</Link>
        </div>
      </Shell>
    );
  }

  if (step === 'pay' && intent) {
    return (
      <Shell wide>
        <div className="card">
          <h1 className="auth__title">Plată</h1>
          <p className="auth__sub">
            Abonament anual — <strong>{formatLei(intent.amount)}</strong> (TVA inclus) / an
          </p>
          {intent.mock ? (
            <MockPay intent={intent} onDone={() => setStep('done')} />
          ) : (
            <StripePayment
              publishableKey={intent.publishableKey}
              clientSecret={intent.clientSecret}
              amount={intent.amount}
              onSuccess={() => setStep('done')}
            />
          )}
          <p className="auth__foot">
            <button className="linklike" onClick={() => setStep('form')}>← Înapoi la date</button>
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell wide>
      <div className="card">
        <h1 className="auth__title">Generează contractul</h1>
        <p className="auth__sub">Abonament anual — preluare SNCU</p>
        {error && <div className="alert alert--error">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <h3 style={{ margin: '8px 0 14px', fontSize: 15 }}>Date de contact</h3>
          <div className="form-grid">
            <div className="field field--full"><label>Persoana de contact *</label>
              <input className="input" {...register('contactPerson', { required: true })} /></div>
            <div className="field"><label>Email *</label>
              <input className="input" type="email" {...register('email', { required: true })} /></div>
            <div className="field"><label>Telefon *</label>
              <input className="input" {...register('phone', { required: true })} /></div>
          </div>

          <h3 style={{ margin: '18px 0 14px', fontSize: 15 }}>Date firmă</h3>
          <div className="form-grid">
          <div className="field"><label>CUI / CIF *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="input"
                  placeholder="ex: RO12345678"
                  {...register('cui', { required: true })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); fetchAnaf(); }
                  }}
                />
                <button
                  type="button"
                  className="btn btn--ghost"
                  style={{ flex: 'none' }}
                  disabled={anafLoading}
                  onClick={fetchAnaf}
                  title="Preia datele firmei de la ANAF"
                >
                  {anafLoading ? 'Se preia…' : <><Icon name="download" size={16} /> ANAF</>}
                </button>
              </div>
              <span className="muted" style={{ fontSize: 12 }}>
                Completează CUI-ul și apasă ANAF pentru a prelua automat datele firmei.
              </span>
            </div>
            <div className="field"><label>Denumire firmă *</label>
              <input className="input" {...register('companyName', { required: true })} /></div>
         
            <div className="field field--full"><label>Adresă sediu social *</label>
              <input className="input" {...register('address', { required: true })} /></div>
            <div className="field"><label>Oraș *</label>
              <input className="input" {...register('city', { required: true })} /></div>
            <div className="field"><label>Județ *</label>
              <select className="select" {...register('judet', { required: true })}>
                <option value="">Alege…</option>
                {JUDETE.map((j) => <option key={j} value={j}>{j}</option>)}
              </select></div>
            <div className="field"><label>Tip activitate *</label>
              <select className="select" {...register('tipActivitate', { required: true })}>
                <option value="">Alege…</option>
                {TIP_ACTIVITATE.map((t) => <option key={t} value={t}>{t}</option>)}
              </select></div>
            <div className="field"><label>Autorizație ANSVSA</label>
              <input className="input" {...register('ansvsaAuthorization')} /></div>
          </div>

          <div className="alert alert--success" style={{ marginTop: 8 }}>
            <strong>Rezumat:</strong>{' '}
            {pricing ? (
              <>
                Cont anual (abonament) · {formatLei(noVat)} + TVA ·{' '}
                <strong>Total {formatLei(total)}</strong> / an
              </>
            ) : (
              'Se încarcă prețurile…'
            )}
          </div>

          <div className="field" style={{ marginTop: 4 }}>
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', fontWeight: 500 }}>
              <input
                type="checkbox"
                style={{ marginTop: 3, flexShrink: 0 }}
                {...register('acceptTerms', {
                  required: 'Trebuie să fii de acord cu termenii și condițiile.',
                })}
              />
              <span>
                Sunt de acord cu termenii și condițiile și crearea abonamentului *
              </span>
            </label>
            {errors.acceptTerms && (
              <span className="field__error">{errors.acceptTerms.message}</span>
            )}
          </div>

          <button className="btn btn--primary btn--block" disabled={isSubmitting || !pricing}>
            {isSubmitting ? 'Se procesează…' : 'Continuă spre plată'}
          </button>
        </form>
      </div>
      <p className="auth__foot">Ai deja cont? <Link to="/login">Autentificare</Link></p>
    </Shell>
  );
}

function MockPay({ intent, onDone }: { intent: CreateIntentResult; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function pay() {
    setBusy(true);
    setError('');
    try {
      await mockConfirmPayment(intent.paymentIntentId);
      onDone();
    } catch (e) {
      setError(apiError(e));
      setBusy(false);
    }
  }
  return (
    <div>
      <div className="alert alert--success">
        Mod simulare (fără chei Stripe). Apasă butonul pentru a finaliza plata de test.
      </div>
      {error && <div className="alert alert--error">{error}</div>}
      <button className="btn btn--primary btn--block" disabled={busy} onClick={pay}>
        {busy ? 'Se procesează…' : `Plătește ${intent.amount.toFixed(2)} lei (simulare)`}
      </button>
    </div>
  );
}

function Shell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`auth ${wide ? 'auth--wide' : ''}`}>
      <div className="auth__box">
        <div className="auth__brand">
          <Logo height={46} />
        </div>
        {children}
      </div>
    </div>
  );
}
