import type { Offer, OfferStatus } from '@/api/types';
import { SimulatedBadge, cx } from '@/components/ui';
import { formatDay, formatKes, formatPercent } from '@/lib/format';

const STATUS: Record<OfferStatus, { label: string; tone: string }> = {
  pending_review: { label: 'Pending your review', tone: 'bg-amber-100 text-amber-800' },
  accepted: { label: 'Accepted', tone: 'bg-brand-100 text-brand-800' },
  declined: { label: 'Declined', tone: 'bg-slate-200 text-slate-700' },
};

export function StatusBadge({ status }: { status: OfferStatus }) {
  const { label, tone } = STATUS[status];
  return (
    <span className={cx('rounded-full px-2.5 py-0.5 text-xs font-semibold', tone)}>{label}</span>
  );
}

/** Every term the trader must see before accepting (SRS 4.4). */
export function OfferTerms({ offer }: { offer: Offer }) {
  const rows: [string, string, boolean?][] = [
    ['Amount you receive', formatKes(offer.amount)],
    ['Fee', formatKes(offer.fee)],
    ['Total payable', formatKes(offer.total_payable), true],
    ['Repayment share', `${formatPercent(offer.repay_share_of_daily_sales)} of daily sales`],
    [
      'Estimated clear date',
      `${formatDay(offer.estimated_clear_date)} (about ${offer.estimated_days_to_clear} days)`,
    ],
  ];
  return (
    <div>
      <dl className="divide-y divide-slate-100 text-sm">
        {rows.map(([label, value, strong]) => (
          <div key={label} className="flex justify-between gap-4 py-2.5">
            <dt className="text-slate-600">{label}</dt>
            <dd
              className={cx('text-right', strong ? 'font-bold text-slate-900' : 'text-slate-800')}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
        <SimulatedBadge />
        <span>{offer.late_payment_note}</span>
      </p>
    </div>
  );
}
