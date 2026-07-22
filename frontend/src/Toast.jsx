import { useToastList } from './ToastContext.jsx';

export default function Toast() {
  const toasts = useToastList();
  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          <span className="toast-check">✓</span>
          <span className="toast-message">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
