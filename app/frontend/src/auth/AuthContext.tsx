import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, getToken, setToken } from '../lib/api';

export interface AuthUser {
  id: string;
  email: string;
  role: 'client' | 'admin';
  status: 'inactiv' | 'activ';
  companyName: string;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  impersonating: boolean;
  loginWithToken: (token: string, user: AuthUser) => void;
  /** Pornește impersonarea, salvând sesiunea de admin pentru a putea reveni. */
  startImpersonation: (token: string, user: AuthUser) => void;
  /** Revine la sesiunea de admin. */
  stopImpersonation: () => void;
  logout: () => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

const IMP_KEY = 'sncu_imp_admin';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [impersonating, setImpersonating] = useState<boolean>(
    () => Boolean(localStorage.getItem(IMP_KEY)),
  );

  async function refresh() {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get<AuthUser>('/auth/me');
      setUser(data);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      impersonating,
      loginWithToken: (token, u) => {
        setToken(token);
        setUser(u);
      },
      startImpersonation: (token, u) => {
        // Salvează sesiunea de admin curentă (token + user) ca să putem reveni.
        localStorage.setItem(
          IMP_KEY,
          JSON.stringify({ token: getToken(), user }),
        );
        setToken(token);
        setUser(u);
        setImpersonating(true);
      },
      stopImpersonation: () => {
        const raw = localStorage.getItem(IMP_KEY);
        localStorage.removeItem(IMP_KEY);
        setImpersonating(false);
        if (raw) {
          try {
            const saved = JSON.parse(raw) as { token: string; user: AuthUser };
            setToken(saved.token);
            setUser(saved.user);
            return;
          } catch {
            /* fallthrough */
          }
        }
        // Fallback: dacă nu putem restaura, deconectăm.
        setToken(null);
        setUser(null);
      },
      logout: () => {
        localStorage.removeItem(IMP_KEY);
        setImpersonating(false);
        setToken(null);
        setUser(null);
      },
      refresh,
    }),
    [user, loading, impersonating],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth în afara AuthProvider');
  return ctx;
}
