import { AlertCircle, CheckCircle2, Clock, Tag, XCircle, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, EmptyState, Skeleton } from '@/components/ui';
import { useDisputes } from '@/features/disputes/hooks';
import { useOffers } from '@/features/offers/hooks';
import { useRepayments } from '@/features/repayments/hooks';
import { formatDateTime } from '@/lib/format';
import { buildActivity, type ActivityKind } from './activity';

const ICONS: Record<ActivityKind, { icon: LucideIcon; tone: string }> = {
  offer: { icon: Tag, tone: 'bg-amber-100 text-amber-700' },
  accepted: { icon: CheckCircle2, tone: 'bg-brand-100 text-brand-700' },
  declined: { icon: XCircle, tone: 'bg-slate-200 text-slate-600' },
  repayment: { icon: CheckCircle2, tone: 'bg-brand-100 text-brand-700' },
  dispute: { icon: AlertCircle, tone: 'bg-blue-100 text-blue-700' },
};

export function RecentActivity() {
  const offers = useOffers();
  const loans = useRepayments();
  const disputes = useDisputes();

  const pending = offers.isPending || loans.isPending || disputes.isPending;
  const failed = offers.isError || loans.isError || disputes.isError;
  const items =
    offers.data && loans.data && disputes.data
      ? buildActivity({ offers: offers.data, loans: loans.data, disputes: disputes.data })
      : [];

  return (
    <Card>
      <div className="mb-2 flex items-center gap-2">
        <Clock className="h-5 w-5 text-slate-500" aria-hidden />
        <h3 className="font-semibold text-slate-900">Recent Activity</h3>
      </div>
      {pending ? (
        <Skeleton className="h-24 w-full" />
      ) : failed ? (
        <p className="py-4 text-sm text-slate-600">Activity could not be loaded right now.</p>
      ) : items.length === 0 ? (
        <EmptyState title="Nothing yet" message="Offers, repayments and reports will show here." />
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((item) => {
            const { icon: Icon, tone } = ICONS[item.kind];
            return (
              <li key={item.id}>
                <Link to={item.to} className="flex items-center gap-3 py-2.5 hover:bg-slate-50">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone}`}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-slate-900">{item.title}</span>
                    <span className="block truncate text-xs text-slate-500">
                      {item.detail ? `${item.detail} · ` : ''}
                      {formatDateTime(item.at)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
