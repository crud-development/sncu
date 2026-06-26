import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api, apiError } from '../lib/api';
import { Logo } from '../components/Logo';

function Frame({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="auth">
      <div className="auth__box">
        <div className="auth__brand">
          <Logo height={46} />
        </div>
        <div className="card">
          <h1 className="auth__title">{title}</h1>
          <p className="auth__sub">{sub}</p>
          {children}
        </div>
        <p className="auth__foot"><Link to="/login">Înapoi la autentificare</Link></p>
      </div>
    </div>
  );
}

export function RecuperareParola() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<{ email: string }>();

  async function onSubmit(values: { email: string }) {
    await api.post('/auth/forgot-password', values).catch(() => {});
    setSent(true);
  }

  return (
    <Frame title="Recuperare parolă" sub="Îți trimitem un link de resetare pe email">
      {sent ? (
        <div className="alert alert--success">
          Dacă există un cont cu acest email, vei primi un link de resetare.
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" {...register('email', { required: true })} />
          </div>
          <button className="btn btn--primary btn--block" disabled={isSubmitting}>
            {isSubmitting ? 'Se trimite…' : 'Trimite linkul'}
          </button>
        </form>
      )}
    </Frame>
  );
}

export function ResetParola() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<{ password: string }>();

  async function onSubmit(values: { password: string }) {
    setError('');
    try {
      const { data } = await api.post('/auth/reset-password', { token, password: values.password });
      loginWithToken(data.accessToken, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(apiError(err));
    }
  }

  return (
    <Frame title="Setează parola nouă" sub="Alege o parolă de minim 8 caractere">
      {!token && <div className="alert alert--error">Link invalid.</div>}
      {error && <div className="alert alert--error">{error}</div>}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="field">
          <label>Parolă nouă</label>
          <input className="input" type="password"
            {...register('password', { required: true, minLength: 8 })} />
          {errors.password && <span className="field__error">Minim 8 caractere</span>}
        </div>
        <button className="btn btn--primary btn--block" disabled={isSubmitting || !token}>
          {isSubmitting ? 'Se procesează…' : 'Salvează parola'}
        </button>
      </form>
    </Frame>
  );
}
