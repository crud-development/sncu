import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api, apiError } from '../lib/api';
import { Logo } from '../components/Logo';

interface Form {
  email: string;
  password: string;
}

export function Login() {
  const { user, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<Form>();

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin/clienti' : '/dashboard'} replace />;
  }

  async function onSubmit(values: Form) {
    setError('');
    try {
      const { data } = await api.post('/auth/login', values);
      loginWithToken(data.accessToken, data.user);
      navigate(data.user.role === 'admin' ? '/admin/clienti' : '/dashboard');
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
          <h1 className="auth__title">Autentificare</h1>
          <p className="auth__sub">Intră în portalul SNCU</p>

          {error && <div className="alert alert--error">{error}</div>}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="field">
              <label>Email</label>
              <input className="input" type="email" {...register('email', { required: true })} />
            </div>
            <div className="field">
              <label>Parolă</label>
              <input className="input" type="password" {...register('password', { required: true })} />
            </div>
            <button className="btn btn--primary btn--block" disabled={isSubmitting}>
              {isSubmitting ? 'Se procesează…' : 'Autentificare'}
            </button>
          </form>

          <p className="auth__foot">
            <Link to="/recuperare-parola">Am uitat parola</Link>
          </p>
        </div>
        <p className="auth__foot">
          Nu ai cont? <Link to="/inregistrare">Generează contract</Link>
        </p>
      </div>
    </div>
  );
}
