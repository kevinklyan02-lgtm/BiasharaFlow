import type { Loan } from '@/api/types';
import { Card, cx } from '@/components/ui';
import { repaidPercent } from '@/features/dashboard/derive';
import { formatDateTime, formatKes, formatPercent } from '@/lib/format';

export function LoanCard({ loan }: { loan: Loan }) {
  const percent = repaidPercent(loan);
  const cleared = loan.status === 'cleared';
  const ledger = [...loan.ledger].sort((a, b) => a.at.localeCompare(b.at));

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-900">Loan {loan.loan_id}</h3>
        <span
          className={cx(
            'rounded-full px-2.5 py-0.5 text-xs font-semibold',
            cleared ? 'bg-brand-100 text-brand-800' : 'bg-blue-100 text-blue-800',
          )}
        >
          {cleared ? 'Fully repaid' : 'Active'}
        </span>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-sm">
          <span className="text-slate-600">
            {formatKes(loan.repaid)} paid of {formatKes(loan.total_payable)}
          </span>
          <span className="font-semibold text-slate-900">{percent}%</span>
        </div>
        <div
          role="progressbar"
          aria-label="Repayment progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="h-3 overflow-hidden rounded-full bg-slate-200"
        >
          <div
            className="h-full rounded-full bg-brand-600 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <Fact label="Borrowed" value={formatKes(loan.principal)} />
        <Fact label="Total payable" value={formatKes(loan.total_payable)} />
        <Fact label="Balance" value={formatKes(loan.balance)} strong />
        <Fact label="Repay share" value={`${formatPercent(loan.repay_share)} of daily sales`} />
      </dl>

      <h4 className="mt-6 text-sm font-semibold text-slate-900">Transaction history</h4>
      {ledger.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">
          No repayments yet. A share of your daily sales is deducted automatically.
        </p>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 pr-4 font-medium">Reference</th>
                <th className="py-2 pr-4 text-right font-medium">Daily sales</th>
                <th className="py-2 text-right font-medium">Deducted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ledger.map((e) => (
                <tr key={e.txn_id}>
                  <td className="py-2 pr-4 text-slate-700">{formatDateTime(e.at)}</td>
                  <td className="py-2 pr-4 font-mono text-xs text-slate-500">{e.txn_id}</td>
                  <td className="py-2 pr-4 text-right text-slate-700">
                    {formatKes(e.daily_sales)}
                  </td>
                  <td className="py-2 text-right font-medium text-slate-900">
                    {formatKes(e.deducted)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function Fact({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={strong ? 'font-bold text-slate-900' : 'text-slate-800'}>{value}</dd>
    </div>
  );
}
