import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { QueryBoundary } from '@/components/QueryBoundary';
import { Card, Skeleton } from '@/components/ui';
import { activeLoan, repaidPercent } from '@/features/dashboard/derive';
import { formatKes, formatPercent } from '@/lib/format';
import { useRepayments } from './hooks';

function Ring({ percent }: { percent: number }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#079455"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - percent / 100)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-slate-900">
        {percent}%
      </span>
    </div>
  );
}

export function RepaymentSummaryCard() {
  const query = useRepayments();
  return (
    <Link
      to="/repayments"
      className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <Card className="border-brand-100 bg-brand-50/40 transition hover:shadow-md">
        <QueryBoundary query={query} loading={<Skeleton className="h-24 w-full" />}>
          {(loans) => {
            const loan = activeLoan(loans);
            if (!loan) {
              return (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">Repayment Progress</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {loans.length > 0 ? 'Your last loan is fully repaid.' : 'No active loan.'}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" aria-hidden />
                </div>
              );
            }
            const percent = repaidPercent(loan);
            return (
              <div className="flex items-center gap-4">
                <Ring percent={percent} />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-900">Repayment Progress</h3>
                  <p className="text-sm text-slate-600">
                    {formatKes(loan.repaid)} paid of {formatKes(loan.total_payable)}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Next repayment: {formatPercent(loan.repay_share)} of today&apos;s sales
                    (automatically deducted)
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400" aria-hidden />
              </div>
            );
          }}
        </QueryBoundary>
      </Card>
    </Link>
  );
}
