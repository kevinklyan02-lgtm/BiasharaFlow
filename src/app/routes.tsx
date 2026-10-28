import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/features/layout/AppShell';
import { ComingSoon } from './ComingSoon';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<ComingSoon title="Dashboard" phase={3} />} />
        <Route path="forecast" element={<ComingSoon title="Forecast Chart" phase={3} />} />
        <Route path="limit" element={<ComingSoon title="My Limit" phase={3} />} />
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
