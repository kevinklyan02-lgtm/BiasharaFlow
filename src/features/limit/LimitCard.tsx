import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { QueryBoundary } from '@/components/QueryBoundary';
import { Card, Skeleton } from '@/components/ui';
import { formatKes } from '@/lib/format';
import { useLimit } from './hooks';

/** The "why this limit" panel always shows the backend's reason text. */
export function LimitCard({ alwaysExplain = false }: { alwaysExplain?: boolean }) {
  const query = useLimit();
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <ShieldCheck className="h-5 w-5" aria-hidden />
        </span>
        <h3 className="font-semibold text-slate-900">Your Weekly Limit</h3>
      </div>
      <QueryBoundary query={query} loading={<Skeleton className="mt-4 h-24 w-full" />}>
        {(limit) => (
          <>
            <div className="mt-3 flex items-baseline justify-between gap-2">
              <p className="text-3xl font-bold text-slate-900">{formatKes(limit.weekly_limit)}</p>
              {!alwaysExplain && (
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpen((o) => !o)}
                  className="text-sm font-medium text-accent-600 underline-offset-2 hover:underline"
                >
                  Why this limit?
                </button>
              )}
            </div>
            {limit.weekly_limit === 0 && (
              <p className="mt-2 text-sm text-amber-700">
                No restock offer is available this week.
              </p>
            )}
            {(alwaysExplain || open) && (
              <p className="mt-3 rounded-lg bg-brand-50 p-3 text-sm text-brand-900">
                {limit.reason}
              </p>
            )}
          </>
        )}
      </QueryBoundary>
    </Card>
  );
}
