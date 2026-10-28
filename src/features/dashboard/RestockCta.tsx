import { ArrowRight, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, Skeleton } from '@/components/ui';
import { useLimit } from '@/features/limit/hooks';
import { useRepayments } from '@/features/repayments/hooks';
import { activeLoan } from './derive';

const linkClass =
  'mt-4 inline-flex items-center gap-2 rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-2';

/** Hidden-offer rules: no offer when the limit is 0 or a loan is already active. */
export function RestockCta() {
  const limit = useLimit();
  const loans = useRepayments();

  let body;
  if (limit.isPending || loans.isPending) {
    body = <Skeleton className="mt-3 h-24 w-full" />;
  } else if (loans.data && activeLoan(loans.data)) {
    body = (
      <>
        <p className="mt-3 text-lg font-bold text-slate-900">You have a loan in progress.</p>
        <p className="mt-1 text-sm text-slate-600">
          You can request a new restock loan once it is repaid.
        </p>
        <Link to="/repayments" className={linkClass}>
          View repayment progress <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </>
    );
  } else if (limit.data && limit.data.weekly_limit === 0) {
    body = (
      <>
        <p className="mt-3 text-lg font-bold text-slate-900">No offer available this week.</p>
        <p className="mt-1 text-sm text-slate-600">Check back after your forecast updates.</p>
      </>
    );
  } else {
    body = (
      <>
        <p className="mt-3 text-xl font-bold text-slate-900">
          Get the stock you need, when you need it.
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Choose an amount, review the details, and accept when you&apos;re ready.
        </p>
        <Link to="/offers" className={linkClass}>
          View Offers <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </>
    );
  }

  return (
    <Card className="border-accent-100 bg-accent-50">
      <div className="flex items-center gap-2 text-accent-700">
        <Tag className="h-5 w-5" aria-hidden />
        <h3 className="font-semibold">Ready for a restock loan?</h3>
      </div>
      {body}
    </Card>
  );
}
