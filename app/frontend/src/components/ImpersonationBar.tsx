import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

/** Bară afișată cât timp adminul vizualizează contul unui client (impersonare). */
export function ImpersonationBar() {
  const { impersonating, user, stopImpersonation } = useAuth();
  const navigate = useNavigate();

  if (!impersonating) return null;

  return (
    <div className="imp-bar">
      <span className="imp-bar__text">
        Vizualizezi ca <strong>{user?.companyName}</strong> · mod impersonare
      </span>
      <button
        className="imp-bar__btn"
        onClick={() => {
          stopImpersonation();
          navigate('/admin/clienti');
        }}
      >
        Ieși din impersonare
      </button>
    </div>
  );
}
