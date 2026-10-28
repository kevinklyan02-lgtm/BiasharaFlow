import { BarChart3, ShieldCheck, Wallet, type LucideIcon } from 'lucide-react';
import { Card, Skeleton } from '@/components/ui';
import { useForecast } from '@/features/forecast/hooks';
import { useLimit } from '@/features/limit/hooks';
import { useRepayments } from '@/features/repayments/hooks';
import { formatKes } from '@/lib/format';
import { avgExpected7, todaySales } from './derive';

function Stat({
  icon: Icon,
  tone,
  label,
  value,
  hint,
  loading,
}: {
  icon: LucideIcon;
  tone: string;
  label: string;
  value?: string;
  hint?: string;
  loading: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <p className="text-sm text-slate-600">{label}</p>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-32" />
      ) : (
        <p className="mt-3 text-2xl font-bold text-slate-900">{value ?? '—'}</p>
      )}
      {hint && !loading && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </Card>
  );
}

export function StatCards() {
  const forecast = useForecast();
  const limit = useLimit();
  const loans = useRepayments();

  const today = forecast.data && loans.data ? todaySales(loans.data, forecast.data) : null;
  const todayHint = today
    ? today.source === 'forecast'
      ? 'Expected tomorrow (forecast)'
      : today.changePct === null
        ? 'Latest repayment day'
        : `${today.changePct >= 0 ? '▲' : '▼'} ${Math.abs(today.changePct)}% vs previous day`
    : undefined;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Stat
        icon={Wallet}
        tone="bg-accent-100 text-accent-700"
        label="Today's M-PESA Sales"
        value={today ? formatKes(today.amount) : undefined}
        hint={todayHint}
        loading={forecast.isPending || loans.isPending}
      />
      <Stat
        icon={BarChart3}
        tone="bg-blue-100 text-blue-700"
        label="7-Day Forecast (avg.)"
        value={forecast.data ? formatKes(avgExpected7(forecast.data)) : undefined}
        hint="Per day, next 7 days"
        loading={forecast.isPending}
      />
      <Stat
        icon={ShieldCheck}
        tone="bg-brand-100 text-brand-700"
        label="Your Weekly Limit"
        value={limit.data ? formatKes(limit.data.weekly_limit) : undefined}
        hint="Based on your forecast and obligations"
        loading={limit.isPending}
      />
    </div>
  );
}
