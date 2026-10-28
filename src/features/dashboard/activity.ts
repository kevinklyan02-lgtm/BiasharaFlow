import type { Dispute, Loan, Offer } from '@/api/types';

export type ActivityKind = 'offer' | 'accepted' | 'declined' | 'repayment' | 'dispute';

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  title: string;
  detail?: string;
  at: string;
  to: string;
}

const kes = (n: number) => `KES ${n.toLocaleString('en-US')}`;

/** Newest-first feed built only from endpoints that exist (offers, loan ledgers, disputes). */
export function buildActivity(
  { offers, loans, disputes }: { offers: Offer[]; loans: Loan[]; disputes: Dispute[] },
  limit = 5,
): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const o of offers) {
    const base = { id: o.offer_id, at: o.created_at, to: `/offers/${o.offer_id}` };
    if (o.status === 'pending_review') {
      items.push({ ...base, kind: 'offer', title: 'Loan offer available', detail: kes(o.amount) });
    } else if (o.status === 'accepted') {
      items.push({
        ...base,
        kind: 'accepted',
        title: 'Loan offer accepted',
        detail: kes(o.amount),
      });
    } else {
      items.push({
        ...base,
        kind: 'declined',
        title: 'Loan offer declined',
        detail: kes(o.amount),
      });
    }
  }
  for (const l of loans) {
    for (const e of l.ledger) {
      items.push({
        id: `${l.loan_id}:${e.txn_id}`,
        kind: 'repayment',
        title: 'Repayment received',
        detail: `${kes(e.deducted)} from ${kes(e.daily_sales)} sales`,
        at: e.at,
        to: '/repayments',
      });
    }
  }
  for (const d of disputes) {
    items.push({
      id: d.dispute_id,
      kind: 'dispute',
      title: 'Problem reported',
      detail: `${d.dispute_id}: ${d.reason}`,
      at: d.at,
      to: '/problem',
    });
  }

  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}
