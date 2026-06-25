import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api, apiError } from '../lib/api';
import { Logo } from '../components/Logo';

interface Form {
  password: string;
  confirm: string;
}

export function Activare() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Form>();

  async function onSubmit(values: Form) {
    setError('');
    try {
      const { data } = await api.post('/auth/activate', { token, password: values.password });
      loginWithToken(data.accessToken, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(apiError(err));
    }
  }

  return (
    <div className="auth">
      <div className="auth__box">
        <div className="auth__brand">
          <span className="auth__logo"><Logo /></span> BIOECOLAB
        </div>
        <div className="card">
          <h1 className="auth__title">Activează-ți contul</h1>
          <p className="auth__sub">Setează o parolă pentru a continua</p>

          {!token && <div className="alert alert--error">Link de activare invalid.</div>}
          {error && <div className="alert alert--error">{error}</div>}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="field">
              <label>Parolă (min. 8 caractere)</label>
              <input className="input" type="password"
                {...register('password', { required: true, minLength: 8 })} />
              {errors.password && <span className="field__error">Minim 8 caractere</span>}
            </div>
            <div className="field">
              <label>Confirmă parola</label>
              <input className="input" type="password"
                {...register('confirm', {
                  validate: (v) => v === getValues('password') || 'Parolele nu coincid',
                })} />
              {errors.confirm && <span className="field__error">{errors.confirm.message}</span>}
            </div>
            <button className="btn btn--primary btn--block" disabled={isSubmitting || !token}>
              {isSubmitting ? 'Se procesează…' : 'Activează și intră'}
            </button>
          </form>
        </div>
        <p className="auth__foot"><Link to="/login">Înapoi la autentificare</Link></p>
      </div>
    </div>
  );
}
