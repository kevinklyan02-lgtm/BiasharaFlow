import { Link } from 'react-router-dom';
import { QueryBoundary } from '@/components/QueryBoundary';
import { Card, EmptyState, PageHeader, Skeleton } from '@/components/ui';
import { activeLoan, avgExpected7 } from '@/features/dashboard/derive';
import { useForecast } from '@/features/forecast/hooks';
import { isDemoMode } from '@/lib/config';
import { DemoControls } from './DemoControls';
import { LoanCard } from './LoanCard';
import { useRepayments } from './hooks';

export function RepaymentsPage() {
  const query = useRepayments();
  const forecast = useForecast();

  return (
    <>
      <PageHeader
        title="Repayment Progress"
        subtitle="A small, agreed share of your daily sales goes toward your loan. Never more than you owe."
      />
      <QueryBoundary query={query} loading={<Skeleton className="h-64 w-full" />}>
        {(loans) => {
          if (loans.length === 0) {
            return (
              <Card>
                <EmptyState
                  title="No loans yet"
                  message="When you accept a restock offer, your repayment progress shows here."
                  action={
                    <Link
                      to="/offers"
                      className="text-sm font-medium text-accent-600 hover:underline"
                    >
                      See offers
                    </Link>
                  }
                />
              </Card>
            );
          }
          const active = activeLoan(loans);
          // Newest first; the active loan is always at the top.
          const ordered = [...loans]
            .reverse()
            .sort((a, b) => Number(b === active) - Number(a === active));
          return (
            <div className="space-y-5">
              {active && isDemoMode() && (
                <DemoControls
                  key={active.loan_id}
                  loan={active}
                  suggested={forecast.data ? avgExpected7(forecast.data) : 8000}
                />
              )}
              {ordered.map((loan) => (
                <LoanCard key={loan.loan_id} loan={loan} />
              ))}
            </div>
          );
        }}
      </QueryBoundary>
    </>
  );
}
