import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/features/layout/AppShell';
import { ComingSoon } from './ComingSoon';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { ForecastPage } from '@/features/forecast/ForecastPage';
import { LimitPage } from '@/features/limit/LimitPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="forecast" element={<ForecastPage />} />
        <Route path="limit" element={<LimitPage />} />
        <Route path="offers" element={<ComingSoon title="Offers" phase={4} />} />
        <Route path="repayments" element={<ComingSoon title="Repayment Progress" phase={5} />} />
        <Route path="problem" element={<ComingSoon title="Report a Problem" phase={6} />} />
        <Route path="backtest" element={<ComingSoon title="Backtest" phase={7} />} />
        <Route path="ussd" element={<ComingSoon title="USSD Phone" phase={8} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
