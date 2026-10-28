import { AlertTriangle, ChevronRight, Store, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui';
import { ForecastCard } from '@/features/forecast/ForecastCard';
import { LimitCard } from '@/features/limit/LimitCard';
import { RepaymentSummaryCard } from '@/features/repayments/RepaymentSummaryCard';
import { RecentActivity } from './RecentActivity';
import { RestockCta } from './RestockCta';
import { StatCards } from './StatCards';

function Hero() {
  return (
    <section className="flex items-center gap-5 rounded-2xl bg-gradient-to-r from-brand-100 to-brand-50 p-5 sm:p-6">
      <Store className="hidden h-24 w-24 shrink-0 text-brand-700 sm:block" aria-hidden />
      <div className="min-w-0 flex-1">
        <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">
          Your Financial Partner
        </span>
        <h2 className="mt-3 text-2xl font-bold text-brand-900 sm:text-3xl">
          Smarter restock. Stronger business.
        </h2>
        <p className="mt-2 text-sm text-slate-700">
          We use your M-PESA sales to predict your cash flow, offer affordable restock loans and
          help you repay little by little.
        </p>
      </div>
      <TrendingUp className="hidden h-12 w-12 shrink-0 text-brand-600 md:block" aria-hidden />
    </section>
  );
}

function ReportProblemCard() {
  return (
    <Link
      to="/problem"
      className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <Card className="border-blue-100 bg-blue-50/50 transition hover:shadow-md">
        <div className="flex items-center gap-4">
          <AlertTriangle className="h-9 w-9 shrink-0 text-blue-600" aria-hidden />
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">Report a Problem</h3>
            <p className="text-sm text-slate-600">
              Wrong balance? Double deduction? Let us know and we&apos;ll help.
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400" aria-hidden />
        </div>
      </Card>
    </Link>
  );
}

export function DashboardPage() {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0 space-y-5">
        <Hero />
        <StatCards />
        <ForecastCard />
        <div className="grid gap-5 md:grid-cols-2">
          <LimitCard />
          <RecentActivity />
        </div>
      </div>
      <div className="space-y-5">
        <RestockCta />
        <RepaymentSummaryCard />
        <ReportProblemCard />
      </div>
    </div>
  );
}
