import { Menu, Store } from 'lucide-react';
import { useApi } from '@/api/ApiProvider';
import { cx } from '@/components/ui';
import { useTrader } from '@/features/traders/TraderContext';
import { useHealth } from './hooks';

function HealthDot() {
  const health = useHealth();
  const state = health.isPending ? 'checking' : health.isError ? 'offline' : 'online';
  const tone = { checking: 'bg-slate-300', offline: 'bg-red-500', online: 'bg-brand-500' }[state];
  return (
    <span className="flex items-center gap-1.5 text-xs text-slate-600" role="status">
      <span className={cx('h-2.5 w-2.5 rounded-full', tone)} aria-hidden />
      <span className="sr-only sm:not-sr-only">API {state}</span>
    </span>
  );
}

function ModeBadge() {
  const { mode } = useApi();
  return (
    <span
      title={mode === 'live' ? 'Connected to the real backend' : 'Using the in-browser simulator'}
      className={cx(
        'rounded-full px-2.5 py-1 text-xs font-bold',
        mode === 'live' ? 'bg-brand-100 text-brand-800' : 'bg-amber-100 text-amber-800',
      )}
    >
      {mode === 'live' ? 'LIVE' : 'MOCK'}
    </span>
  );
}

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const { trader, traders, setTraderId } = useTrader();
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Open menu"
        className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
      >
        <Menu className="h-6 w-6" aria-hidden />
      </button>

      <Store className="hidden h-9 w-9 text-brand-700 sm:block" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500 sm:text-sm">Welcome back,</p>
        <h1 className="truncate text-lg font-bold text-slate-900 sm:text-2xl">
          {trader.shop_name}
        </h1>
      </div>

      <HealthDot />
      <ModeBadge />
      <label className="flex items-center gap-2 text-sm">
        <span className="sr-only sm:not-sr-only sm:text-slate-500">Trader</span>
        <select
          value={trader.trader_id}
          onChange={(e) => setTraderId(Number(e.target.value))}
          className="max-w-[10rem] rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:max-w-none"
        >
          {traders.map((t) => (
            <option key={t.trader_id} value={t.trader_id}>
              {t.shop_name}
            </option>
          ))}
        </select>
      </label>
    </header>
  );
}
