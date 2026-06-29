import { useEffect, useState } from 'react';
import { subscribeToast, type ToastItem } from '../lib/toast';
import { Icon } from './Icon';

const ICONS: Record<string, string> = {
  success: 'check-circle',
  error: 'alert',
  info: 'sparkles',
};

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(
    () =>
      subscribeToast((t) => {
        setItems((prev) => [...prev, t]);
        setTimeout(
          () => setItems((prev) => prev.filter((x) => x.id !== t.id)),
          4200,
        );
      }),
    [],
  );

  function dismiss(id: number) {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  if (items.length === 0) return null;

  return (
    <div className="toast-stack">
      {items.map((t) => (
        <div key={t.id} className={`toast toast--${t.kind}`} onClick={() => dismiss(t.id)}>
          <Icon name={ICONS[t.kind]} size={18} />
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
