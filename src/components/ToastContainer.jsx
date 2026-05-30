import { useToast } from '../context/ToastContext.jsx';

const styles = {
  success: 'border-[#10b981]/40 bg-[#10b981]/15 text-[#10b981]',
  error: 'border-[#f43f5e]/40 bg-[#f43f5e]/15 text-[#f43f5e]',
  info: 'border-[#3b82f6]/40 bg-[#3b82f6]/15 text-[#3b82f6]',
  loading: 'border-[#f7c948]/40 bg-[#f7c948]/15 text-[#f7c948]',
};

const icons = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  loading: '⏳',
};

export default function ToastContainer() {
  const { toasts, dismiss } = useToast();

  if (!toasts.length) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex w-[min(100vw-2rem,380px)] flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={[
            'toast-enter pointer-events-auto flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-2xl backdrop-blur-md',
            styles[t.type] || styles.info,
          ].join(' ')}
        >
          <span className="mt-0.5 shrink-0 text-base">{icons[t.type]}</span>
          <p className="flex-1 leading-snug text-[#e8ecf5]">{t.message}</p>
          {t.type !== 'loading' && (
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="shrink-0 cursor-pointer opacity-60 transition-opacity hover:opacity-100"
              aria-label="Dismiss"
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
