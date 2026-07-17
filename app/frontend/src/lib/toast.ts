export type ToastKind = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
  /** Dacă e true, toast-ul rămâne până la dismiss explicit. */
  sticky?: boolean;
}

type Listener = (t: ToastItem) => void;
type DismissListener = (id: number) => void;

let listeners: Listener[] = [];
let dismissListeners: DismissListener[] = [];
let seq = 0;

function emit(kind: ToastKind, message: string, sticky = false): number {
  const item: ToastItem = { id: ++seq, kind, message, sticky };
  listeners.forEach((l) => l(item));
  return item.id;
}

export const toast = {
  success: (m: string) => emit('success', m),
  error: (m: string) => emit('error', m),
  info: (m: string) => emit('info', m),
  /** Toast persistent (ex. descărcare în curs). Returnează id pentru dismiss. */
  loading: (m: string) => emit('info', m, true),
  dismiss: (id: number) => {
    dismissListeners.forEach((l) => l(id));
  },
};

export function subscribeToast(l: Listener): () => void {
  listeners.push(l);
  return () => {
    listeners = listeners.filter((x) => x !== l);
  };
}

export function subscribeToastDismiss(l: DismissListener): () => void {
  dismissListeners.push(l);
  return () => {
    dismissListeners = dismissListeners.filter((x) => x !== l);
  };
}
