import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { apiError } from '../lib/api';
import { Logo } from '../components/Logo';
import { StripePayment } from '../components/StripePayment';
import {
  createPaymentIntent,
  mockConfirmPayment,
  type CreateIntentResult,
} from '../lib/resources';
import { JUDETE, TIP_ACTIVITATE, priceNoVat, formatLei, PRICING } from '../lib/constants';

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
  workpoints: number;
}

type Step = 'form' | 'pay' | 'done';

export function Inregistrare() {
  const [step, setStep] = useState<Step>('form');
  const [intent, setIntent] = useState<CreateIntentResult | null>(null);
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ defaultValues: { workpoints: 1 } });

  const workpoints = Number(watch('workpoints')) || 1;
  const noVat = priceNoVat(workpoints);
  const total = noVat * (1 + PRICING.vatRate);

  async function onSubmit(values: Form) {
    setError('');
    try {
      const res = await createPaymentIntent({ ...values, workpoints: Number(values.workpoints) });
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
            Contract cadru anual — <strong>{formatLei(intent.amount)}</strong> (TVA inclus)
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
        <p className="auth__sub">Contract cadru anual — preluare SNCU</p>
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
            <div className="field"><label>Denumire firmă *</label>
              <input className="input" {...register('companyName', { required: true })} /></div>
            <div className="field"><label>CUI / CIF *</label>
              <input className="input" {...register('cui', { required: true })} /></div>
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
            <div className="field"><label>Număr puncte de lucru</label>
              <input className="input" type="number" min={1} {...register('workpoints', { min: 1 })} /></div>
          </div>

          <div className="alert alert--success" style={{ marginTop: 8 }}>
            <strong>Rezumat:</strong> {workpoints} {workpoints === 1 ? 'punct' : 'puncte'} de lucru ·{' '}
            {formatLei(noVat)} + TVA · <strong>Total {formatLei(total)}</strong> / an
            {errors.workpoints && ' — număr invalid'}
          </div>

          <button className="btn btn--primary btn--block" disabled={isSubmitting}>
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
          <span className="auth__logo"><Logo /></span> BIOECOLAB
        </div>
        {children}
      </div>
    </div>
  );
}
