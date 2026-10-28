import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';

export const cx = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(' ');

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx('rounded-2xl border border-slate-200 bg-white p-5 shadow-sm', className)}
      {...props}
    />
  );
}

type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'danger';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700',
  accent: 'bg-accent-600 text-white hover:bg-accent-700',
  secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
  danger: 'border border-red-200 bg-white text-red-700 hover:bg-red-50',
};

export function Button({
  variant = 'primary',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; loading?: boolean }) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 p-8 text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      <span className="text-sm">{label}…</span>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cx('animate-pulse rounded-lg bg-slate-200', className)} />;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 p-8 text-center">
      <AlertTriangle className="h-8 w-8 text-amber-500" aria-hidden />
      <p className="font-semibold text-slate-800">{title}</p>
      <p className="max-w-md text-sm text-slate-600">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 p-8 text-center">
      <Inbox className="h-8 w-8 text-slate-400" aria-hidden />
      <p className="font-semibold text-slate-800">{title}</p>
      {message && <p className="max-w-md text-sm text-slate-600">{message}</p>}
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-5">
      <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
    </header>
  );
}

/** NFR-3: every figure shown in the demo is labelled as simulated. */
export function SimulatedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800',
        className,
      )}
    >
      Simulated
    </span>
  );
}
