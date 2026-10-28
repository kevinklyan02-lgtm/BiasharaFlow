import { lazy, Suspense, type ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Spinner } from '@/components/ui';
import { AppShell } from '@/features/layout/AppShell';

// Each screen is its own chunk, so the first paint only loads the shell and the screen in view.
const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const ForecastPage = lazy(() =>
  import('@/features/forecast/ForecastPage').then((m) => ({ default: m.ForecastPage })),
);
const LimitPage = lazy(() =>
  import('@/features/limit/LimitPage').then((m) => ({ default: m.LimitPage })),
);
const OffersPage = lazy(() =>
  import('@/features/offers/OffersPage').then((m) => ({ default: m.OffersPage })),
);
const OfferReviewPage = lazy(() =>
  import('@/features/offers/OfferReviewPage').then((m) => ({ default: m.OfferReviewPage })),
);
const RepaymentsPage = lazy(() =>
  import('@/features/repayments/RepaymentsPage').then((m) => ({ default: m.RepaymentsPage })),
);
const ReportProblemPage = lazy(() =>
  import('@/features/disputes/ReportProblemPage').then((m) => ({ default: m.ReportProblemPage })),
);
const BacktestPage = lazy(() =>
  import('@/features/backtest/BacktestPage').then((m) => ({ default: m.BacktestPage })),
);
const UssdPage = lazy(() =>
  import('@/features/ussd/UssdPage').then((m) => ({ default: m.UssdPage })),
);

/** Suspense sits inside the shell, so the sidebar and top bar stay put while a screen loads. */
const loading = (page: ReactElement) => <Suspense fallback={<Spinner />}>{page}</Suspense>;

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={loading(<DashboardPage />)} />
        <Route path="forecast" element={loading(<ForecastPage />)} />
        <Route path="limit" element={loading(<LimitPage />)} />
        <Route path="offers" element={loading(<OffersPage />)} />
        <Route path="offers/:offerId" element={loading(<OfferReviewPage />)} />
        <Route path="repayments" element={loading(<RepaymentsPage />)} />
        <Route path="problem" element={loading(<ReportProblemPage />)} />
        <Route path="backtest" element={loading(<BacktestPage />)} />
        <Route path="ussd" element={loading(<UssdPage />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
