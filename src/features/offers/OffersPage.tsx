import { useState } from 'react';
import { Link } from 'react-router-dom';
import { QueryBoundary } from '@/components/QueryBoundary';
import { Card, EmptyState, PageHeader, Skeleton } from '@/components/ui';
import { activeLoan, repaidPercent } from '@/features/dashboard/derive';
import { useLimit } from '@/features/limit/hooks';
import { useRepayments } from '@/features/repayments/hooks';
import { formatDateTime, formatKes } from '@/lib/format';
import { StatusBadge } from './OfferTerms';
import { RestockForm } from './RestockForm';
import { useOffers } from './hooks';

function ActiveLoanNotice({ message }: { message: string | null }) {
  const loans = useRepayments();
  return (
    <Card className="border-amber-200 bg-amber-50">
      <h3 className="font-semibold text-slate-900">You already have an active loan</h3>
      {message && (
        <p role="alert" className="mt-1 text-sm text-amber-900">
          {message}
        </p>
      )}
      <QueryBoundary query={loans} loading={<Skeleton className="mt-3 h-12 w-full" />}>
        {(all) => {
          const loan = activeLoan(all);
          if (!loan) return null;
          return (
            <div className="mt-3 text-sm text-slate-700">
              <p>
                {loan.loan_id}: {formatKes(loan.repaid)} paid of {formatKes(loan.total_payable)} (
                {repaidPercent(loan)}%). Balance {formatKes(loan.balance)}.
              </p>
              <Link
                to="/repayments"
                className="mt-2 inline-block font-medium text-accent-600 hover:underline"
              >
                View repayment progress
              </Link>
            </div>
          );
        }}
      </QueryBoundary>
    </Card>
  );
}

function OfferHistory() {
  const query = useOffers();
  return (
    <Card>
      <h3 className="font-semibold text-slate-900">Your offers</h3>
      <QueryBoundary query={query} loading={<Skeleton className="mt-3 h-16 w-full" />}>
        {(offers) =>
          offers.length === 0 ? (
            <EmptyState title="No offers yet" message="Offers you request will appear here." />
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {[...offers].reverse().map((o) => (
                <li
                  key={o.offer_id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {o.offer_id} · {formatKes(o.amount)}
                    </p>
                    <p className="text-xs text-slate-500">{formatDateTime(o.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={o.status} />
                    <Link
                      to={`/offers/${o.offer_id}`}
                      className="text-sm font-medium text-accent-600 hover:underline"
                    >
                      {o.status === 'pending_review' ? 'Review' : 'Details'}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )
        }
      </QueryBoundary>
    </Card>
  );
}

export function OffersPage() {
  const limit = useLimit();
  const loans = useRepayments();
  const [conflict, setConflict] = useState<string | null>(null);

  let main;
  if (limit.isPending || loans.isPending) {
    main = <Skeleton className="h-64 w-full" />;
  } else if (loans.data && activeLoan(loans.data)) {
    main = <ActiveLoanNotice message={conflict} />;
  } else {
    main = (
      <QueryBoundary query={limit}>
        {(l) =>
          l.weekly_limit === 0 ? (
            <Card>
              <EmptyState
                title="No offer available this week"
                message="Your limit is KES 0 right now. It updates with your sales forecast, so check back soon."
              />
            </Card>
          ) : (
            <RestockForm limit={l.weekly_limit} onConflict={setConflict} />
          )
        }
      </QueryBoundary>
    );
  }

  return (
    <>
      <PageHeader
        title="Offers"
        subtitle="Request restock money, review the terms, and accept only if they work for you."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <div>{main}</div>
        <OfferHistory />
      </div>
    </>
  );
}
