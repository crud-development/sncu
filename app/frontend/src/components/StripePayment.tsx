import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';

interface Props {
  publishableKey: string;
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
}

/** Formular de card real (Stripe Elements). */
export function StripePayment({ publishableKey, clientSecret, amount, onSuccess }: Props) {
  const stripePromise = loadStripe(publishableKey);
  return (
    <Elements stripe={stripePromise} options={{ clientSecret, locale: 'ro' }}>
      <PayForm amount={amount} onSuccess={onSuccess} />
    </Elements>
  );
}

function PayForm({ amount, onSuccess }: { amount: number; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function pay() {
    if (!stripe || !elements) return;
    setBusy(true);
    setError('');
    const { error: err } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });
    setBusy(false);
    if (err) {
      setError(err.message ?? 'Plata a eșuat.');
    } else {
      onSuccess();
    }
  }

  return (
    <div>
      {error && <div className="alert alert--error">{error}</div>}
      <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <PaymentElement />
      </div>
      <button className="btn btn--primary btn--block" disabled={!stripe || busy} onClick={pay}>
        {busy ? 'Se procesează…' : `Plătește ${amount.toFixed(2)} lei`}
      </button>
    </div>
  );
}
