import { CalendarDays } from 'lucide-react';
import { QueryBoundary } from '@/components/QueryBoundary';
import { Card, Skeleton } from '@/components/ui';
import { useForecast } from './hooks';
import { ForecastChart } from './ForecastChart';

export function ForecastCard() {
  const query = useForecast();
  return (
    <Card>
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <CalendarDays className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h3 className="font-semibold text-slate-900">14-Day Sales Forecast</h3>
          <p className="text-sm text-slate-500">Predicted M-PESA Till sales for the next 14 days</p>
        </div>
      </div>
      <QueryBoundary query={query} loading={<Skeleton className="h-72 w-full" />}>
        {(forecast) => <ForecastChart forecast={forecast} />}
      </QueryBoundary>
    </Card>
  );
}
