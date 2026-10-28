import { Info } from 'lucide-react';
import type { Backtest } from '@/api/types';
import { QueryBoundary } from '@/components/QueryBoundary';
import { Card, PageHeader, SimulatedBadge } from '@/components/ui';
import { formatKes, formatNumber, formatPercent } from '@/lib/format';
import { useBacktest } from './hooks';

type Pair = { flat_limit: number; biasharaflow: number };

const METRICS: {
  key: keyof Backtest['metrics'];
  title: string;
  hint: string;
  format: (n: number) => string;
  /** Higher is better for every metric here. */
}[] = [
  {
    key: 'stockout_days_avoided',
    title: 'Stock-out days avoided',
    hint: 'Days a shop kept stock that it would have run out of',
    format: (n) => `${formatNumber(n)} days`,
  },
  {
    key: 'interest_saved_kes',
    title: 'Interest saved',
    hint: 'Fees avoided by borrowing only what the shop can afford',
    format: formatKes,
  },
  {
    key: 'share_of_loans_affordable',
    title: 'Loans that were affordable',
    hint: 'Share of loans repayable within the target period',
    format: formatPercent,
  },
];

const humanize = (key: string) => key.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

function MetricCard({
  title,
  hint,
  pair,
  format,
  placeholder,
}: {
  title: string;
  hint: string;
  pair: Pair;
  format: (n: number) => string;
  placeholder: boolean;
}) {
  return (
    <Card>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
      {placeholder ? (
        <p className="mt-4 text-sm font-medium text-slate-500">Awaiting results</p>
      ) : (
        <dl className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <dt className="text-xs text-slate-500">Flat limit</dt>
            <dd className="text-xl font-bold text-slate-700">{format(pair.flat_limit)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">BiasharaFlow</dt>
            <dd className="text-xl font-bold text-brand-700">{format(pair.biasharaflow)}</dd>
          </div>
        </dl>
      )}
    </Card>
  );
}

function FairnessTable({ rows }: { rows: Record<string, unknown>[] }) {
  const columns = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const cell = (v: unknown) =>
    typeof v === 'number' ? formatNumber(v) : v === null || v === undefined ? '—' : String(v);
  return (
    <Card>
      <h3 className="font-semibold text-slate-900">Fairness check by shop type</h3>
      <p className="mt-1 text-xs text-slate-500">
        The same measures, split by type of shop, to confirm no type is treated worse.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              {columns.map((c) => (
                <th key={c} className="py-2 pr-4 font-medium">
                  {humanize(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r, i) => (
              <tr key={i}>
                {columns.map((c) => (
                  <td key={c} className="py-2 pr-4 text-slate-800">
                    {cell(r[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function BacktestPage() {
  const query = useBacktest();
  return (
    <>
      <PageHeader
        title="Backtest"
        subtitle="How a limit sized from each shop's forecast compares with one flat limit for everyone."
      />
      <QueryBoundary query={query}>
        {(b) => (
          <div className="space-y-5">
            {b.placeholder && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
              >
                <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                <div>
                  <p className="font-semibold">Placeholder data</p>
                  <p>
                    The backtest results are not available yet. Nothing below is a real result, so
                    no figures are shown.
                  </p>
                </div>
              </div>
            )}

            <Card className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-700">
              <span>
                Period: <strong>{b.period}</strong>
              </span>
              <span>
                Traders: <strong>{b.traders}</strong>
              </span>
              <span>
                Flat limit compared: <strong>{formatKes(b.flat_limit_kes)}</strong>
              </span>
              <SimulatedBadge />
            </Card>

            <div className="grid gap-5 md:grid-cols-3">
              {METRICS.map((m) => (
                <MetricCard
                  key={m.key}
                  title={m.title}
                  hint={m.hint}
                  pair={b.metrics[m.key]}
                  format={m.format}
                  placeholder={b.placeholder}
                />
              ))}
            </div>

            {!b.placeholder && b.by_shop_type.length > 0 && <FairnessTable rows={b.by_shop_type} />}
          </div>
        )}
      </QueryBoundary>
    </>
  );
}
