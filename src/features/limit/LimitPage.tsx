import { Link } from 'react-router-dom';
import { QueryBoundary } from '@/components/QueryBoundary';
import { Card, PageHeader } from '@/components/ui';
import { formatKes } from '@/lib/format';
import { LimitCard } from './LimitCard';
import { useLimit } from './hooks';

export function LimitPage() {
  const query = useLimit();
  return (
    <>
      <PageHeader
        title="My Limit"
        subtitle="The most you can request for restocking this week, and how we worked it out."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <LimitCard alwaysExplain />
        <Card>
          <h3 className="font-semibold text-slate-900">How it adds up</h3>
          <QueryBoundary query={query}>
            {(l) => (
              <>
                <dl className="mt-3 divide-y divide-slate-100 text-sm">
                  <Row label="Low-case sales, next 7 days" value={formatKes(l.low_case_sales_7d)} />
                  <Row
                    label="Rent, suppliers and debts"
                    value={`− ${formatKes(l.obligations_7d)}`}
                  />
                  <Row label="Weekly limit" value={formatKes(l.weekly_limit)} strong />
                </dl>
                <p className="mt-3 text-xs text-slate-500">
                  Calculated on {l.calculated_on}. The final limit also includes a safety buffer and
                  is capped so a full loan clears in about three weeks.
                </p>
                {l.weekly_limit > 0 && (
                  <Link
                    to="/offers"
                    className="mt-4 inline-block rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-700"
                  >
                    Request a restock loan
                  </Link>
                )}
              </>
            )}
          </QueryBoundary>
        </Card>
      </div>
    </>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between py-2">
      <dt className="text-slate-600">{label}</dt>
      <dd className={strong ? 'font-bold text-slate-900' : 'text-slate-800'}>{value}</dd>
    </div>
  );
}
