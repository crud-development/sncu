import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthContext';
import { ToastHost } from './components/ToastHost';
import { toast } from './lib/toast';
import { apiError } from './lib/api';
import { App } from './App';
import './styles/theme.css';

const queryClient = new QueryClient({
  // Feedback global: orice mutație eșuată afișează un toast de eroare; mutațiile
  // care declară meta.successMessage afișează un toast de succes.
  mutationCache: new MutationCache({
    onError: (err) => toast.error(apiError(err)),
    onSuccess: (_data, _vars, _ctx, mutation) => {
      const msg = mutation.meta?.successMessage as string | undefined;
      if (msg) toast.success(msg);
    },
  }),
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <ToastHost />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
