import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Leaf, LifeBuoy } from 'lucide-react';
import { Button, cx } from '@/components/ui';
import { DemoReset } from './DemoReset';
import { DEMO_NAV, MAIN_NAV, type NavItem } from './navItems';

function NavGroup({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  return (
    <ul className="space-y-1">
      {items.map(({ to, label, icon: Icon, end }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cx(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition',
                isActive
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-brand-50/90 hover:bg-white/10 hover:text-white',
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden />
            {label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const [helpOpen, setHelpOpen] = useState(false);
  return (
    <div className="flex h-full flex-col bg-brand-900 p-4 text-white">
      <div className="flex items-center gap-3 px-2 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500">
          <Leaf className="h-6 w-6" aria-hidden />
        </div>
        <div>
          <p className="text-xl font-bold leading-tight">BiasharaFlow</p>
          <p className="text-xs text-brand-100/80">Restock. Grow. Thrive.</p>
        </div>
      </div>

      <nav aria-label="Main" className="mt-4 flex-1 space-y-6 overflow-y-auto">
        <NavGroup items={MAIN_NAV} onNavigate={onNavigate} />
        <div>
          <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wide text-brand-100/60">
            Demo tools
          </p>
          <NavGroup items={DEMO_NAV} onNavigate={onNavigate} />
          <DemoReset />
        </div>
      </nav>

      <div className="mt-4 rounded-xl border border-white/20 p-4">
        <div className="flex items-center gap-2">
          <LifeBuoy className="h-5 w-5" aria-hidden />
          <p className="font-semibold">Need help?</p>
        </div>
        <p className="mt-1 text-xs text-brand-100/80">We&apos;re here for you.</p>
        <Button className="mt-3 w-full" onClick={() => setHelpOpen((o) => !o)}>
          Contact Support
        </Button>
        {helpOpen && (
          <p className="mt-2 text-xs text-brand-100">
            Support is simulated in this prototype. Use &quot;Report a Problem&quot; to log an
            issue.
          </p>
        )}
      </div>
    </div>
  );
}
