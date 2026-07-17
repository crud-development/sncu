import { useEffect, useState } from 'react';
import { subscribeToast, subscribeToastDismiss, type ToastItem } from '../lib/toast';
import { Icon } from './Icon';

const ICONS: Record<string, string> = {
  success: 'check-circle',
  error: 'alert',
  info: 'clock',
};

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubAdd = subscribeToast((t) => {
      setItems((prev) => [...prev, t]);
      if (!t.sticky) {
        setTimeout(
          () => setItems((prev) => prev.filter((x) => x.id !== t.id)),
          4200,
        );
      }
    });
    const unsubDismiss = subscribeToastDismiss((id) => {
      setItems((prev) => prev.filter((x) => x.id !== id));
    });
    return () => {
      unsubAdd();
      unsubDismiss();
    };
  }, []);

  function dismiss(id: number) {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  if (items.length === 0) return null;

  return (
    <div className="toast-stack">
      {items.map((t) => (
        <div
          key={t.id}
          className={`toast toast--${t.kind}${t.sticky ? ' toast--sticky' : ''}`}
          onClick={() => {
            if (!t.sticky) dismiss(t.id);
          }}
        >
          <Icon name={ICONS[t.kind]} size={18} />
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
