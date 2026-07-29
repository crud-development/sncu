import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './components/AppShell';
import { Login } from './pages/Login';
import { Inregistrare } from './pages/Inregistrare';
import { Activare } from './pages/Activare';
import { RecuperareParola, ResetParola } from './pages/ResetParola';
import { Dashboard } from './pages/Dashboard';
import { Profil } from './pages/Profil';
import { PuncteLucru } from './pages/PuncteLucru';
import { Comenzi } from './pages/Comenzi';
import { Contracte } from './pages/Contracte';
import { AdminClienti } from './pages/admin/AdminClienti';
import { AdminComenzi } from './pages/admin/AdminComenzi';
import { AdminContracte } from './pages/admin/AdminContracte';
import { AdminFacturi } from './pages/admin/AdminFacturi';
import { AdminStripe } from './pages/admin/AdminStripe';
import { AdminSetari } from './pages/admin/AdminSetari';

export function App() {
  const { loading, user } = useAuth();
  if (loading) {
    return <div className="auth"><p className="muted">Se încarcă…</p></div>;
  }

  const home = user?.role === 'admin' ? '/admin/clienti' : '/dashboard';

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/inregistrare" element={<Inregistrare />} />
      <Route path="/activare" element={<Activare />} />
      <Route path="/recuperare-parola" element={<RecuperareParola />} />
      <Route path="/reset-parola" element={<ResetParola />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profil" element={<Profil />} />
        <Route path="/puncte-lucru" element={<PuncteLucru />} />
        <Route path="/comenzi" element={<Comenzi />} />
        <Route path="/contracte" element={<Contracte />} />

        <Route path="/admin/clienti" element={<AdminClienti />} />
        <Route path="/admin/comenzi" element={<AdminComenzi />} />
        <Route path="/admin/contracte" element={<AdminContracte />} />
        <Route path="/admin/facturi" element={<AdminFacturi />} />
        <Route path="/admin/stripe" element={<AdminStripe />} />
        <Route path="/admin/setari" element={<AdminSetari />} />
      </Route>

      <Route path="*" element={<Navigate to={home} replace />} />
    </Routes>
  );
}
