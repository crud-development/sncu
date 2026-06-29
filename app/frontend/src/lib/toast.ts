export type ToastKind = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

type Listener = (t: ToastItem) => void;

let listeners: Listener[] = [];
let seq = 0;

function emit(kind: ToastKind, message: string) {
  const item: ToastItem = { id: ++seq, kind, message };
  listeners.forEach((l) => l(item));
}

export const toast = {
  success: (m: string) => emit('success', m),
  error: (m: string) => emit('error', m),
  info: (m: string) => emit('info', m),
};

export function subscribeToast(l: Listener): () => void {
  listeners.push(l);
  return () => {
    listeners = listeners.filter((x) => x !== l);
  };
}
