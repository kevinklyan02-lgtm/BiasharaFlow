import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/features/layout/AppShell';
import { ComingSoon } from './ComingSoon';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { ForecastPage } from '@/features/forecast/ForecastPage';
import { OfferReviewPage } from '@/features/offers/OfferReviewPage';
import { OffersPage } from '@/features/offers/OffersPage';
import { RepaymentsPage } from '@/features/repayments/RepaymentsPage';
import { ReportProblemPage } from '@/features/disputes/ReportProblemPage';
import { BacktestPage } from '@/features/backtest/BacktestPage';
import { LimitPage } from '@/features/limit/LimitPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="forecast" element={<ForecastPage />} />
        <Route path="limit" element={<LimitPage />} />
        <Route path="offers" element={<OffersPage />} />
        <Route path="offers/:offerId" element={<OfferReviewPage />} />
        <Route path="repayments" element={<RepaymentsPage />} />
        <Route path="problem" element={<ReportProblemPage />} />
        <Route path="backtest" element={<BacktestPage />} />
        <Route path="ussd" element={<ComingSoon title="USSD Phone" phase={8} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
