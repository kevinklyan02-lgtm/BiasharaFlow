import { Lightbulb } from 'lucide-react';
import { QueryBoundary } from '@/components/QueryBoundary';
import { Card, Skeleton } from '@/components/ui';
import { formatDay, formatKes } from '@/lib/format';
import { useInsights } from './hooks';

export function InsightsPanel() {
  const query = useInsights();
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-amber-500" aria-hidden />
        <h3 className="font-semibold text-slate-900">Insights for next week</h3>
      </div>
      <QueryBoundary query={query} loading={<Skeleton className="h-32 w-full" />}>
        {(i) => (
          <div className="space-y-4 text-sm">
            <p className="rounded-lg bg-brand-50 p-3 text-brand-900">{i.suggestion}</p>
            <p className="text-slate-600">
              Expected sales over 7 days:{' '}
              <strong className="text-slate-900">{formatKes(i.expected_sales_7d)}</strong>
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <DayList title="Busiest days" days={i.busiest_days} />
              <DayList title="Quietest days" days={i.quietest_days} />
            </div>
            <div>
              <p className="mb-1 font-medium text-slate-800">Running low most often</p>
              {i.stock_alerts.length === 0 ? (
                <p className="text-slate-500">No stock check-ins yet.</p>
              ) : (
                <ul className="space-y-1">
                  {i.stock_alerts.map((s) => (
                    <li key={s.item} className="flex justify-between text-slate-700">
                      <span>{s.item}</span>
                      <span className="text-slate-500">
                        {s.reports} {s.reports === 1 ? 'report' : 'reports'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </QueryBoundary>
    </Card>
  );
}

function DayList({
  title,
  days,
}: {
  title: string;
  days: { date: string; expected_sales: number }[];
}) {
  return (
    <div>
      <p className="mb-1 font-medium text-slate-800">{title}</p>
      <ul className="space-y-1">
        {days.map((d) => (
          <li key={d.date} className="flex justify-between text-slate-700">
            <span>{formatDay(d.date)}</span>
            <span className="text-slate-500">{formatKes(d.expected_sales)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
