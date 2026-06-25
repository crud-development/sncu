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
  loginWithToken: (token: string, user: AuthUser) => void;
  logout: () => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

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
      loginWithToken: (token, u) => {
        setToken(token);
        setUser(u);
      },
      logout: () => {
        setToken(null);
        setUser(null);
      },
      refresh,
    }),
    [user, loading],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth în afara AuthProvider');
  return ctx;
}
