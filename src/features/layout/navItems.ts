import {
  AlertCircle,
  BarChart3,
  Gauge,
  History,
  LayoutDashboard,
  LineChart,
  Smartphone,
  Tag,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

/** Same order as the design mockup. */
export const MAIN_NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/forecast', label: 'Forecast Chart', icon: LineChart },
  { to: '/limit', label: 'My Limit', icon: Gauge },
  { to: '/offers', label: 'Offers', icon: Tag },
  { to: '/repayments', label: 'Repayment Progress', icon: History },
  { to: '/problem', label: 'Report a Problem', icon: AlertCircle },
];

/** Demo and engineering views, kept visually separate from the trader's own screens. */
export const DEMO_NAV: NavItem[] = [
  { to: '/ussd', label: 'USSD Phone', icon: Smartphone },
  { to: '/backtest', label: 'Backtest', icon: BarChart3 },
];
