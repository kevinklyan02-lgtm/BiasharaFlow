import { describe, expect, it } from 'vitest';
import type { Dispute, Loan, Offer } from '@/api/types';
import { buildActivity } from './activity';

const offer = (id: string, status: Offer['status'], at: string): Offer => ({
  offer_id: id,
  trader_id: 101,
  amount: 5000,
  fee: 250,
  total_payable: 5250,
  repay_share_of_daily_sales: 0.12,
  estimated_days_to_clear: 5,
  estimated_clear_date: '2026-11-01',
  late_payment_note: 'x',
  status,
  created_at: at,
});

const loan: Loan = {
  loan_id: 'L-0001',
  trader_id: 101,
  principal: 5000,
  total_payable: 5250,
  repaid: 960,
  balance: 4290,
  status: 'active',
  repay_share: 0.12,
  ledger: [{ txn_id: 'X1', daily_sales: 8000, deducted: 960, at: '2026-10-27T18:00:00Z' }],
};

const dispute: Dispute = {
  dispute_id: 'D-0001',
  trader_id: 101,
  loan_id: null,
  reason: 'Other',
  status: 'open',
  resolve_within_days: 30,
  at: '2026-10-28T09:00:00Z',
};

describe('buildActivity', () => {
  it('merges offers, repayments and disputes newest first', () => {
    const items = buildActivity({
      offers: [offer('O-0001', 'accepted', '2026-10-26T10:00:00Z')],
      loans: [loan],
      disputes: [dispute],
    });
    expect(items.map((i) => i.title)).toEqual([
      'Problem reported',
      'Repayment received',
      'Loan offer accepted',
    ]);
  });

  it('titles offers by status and links pending ones to review', () => {
    const items = buildActivity({
      offers: [
        offer('O-0001', 'pending_review', '2026-10-25T00:00:00Z'),
        offer('O-0002', 'declined', '2026-10-24T00:00:00Z'),
      ],
      loans: [],
      disputes: [],
    });
    expect(items[0]).toMatchObject({ title: 'Loan offer available', to: '/offers/O-0001' });
    expect(items[1].title).toBe('Loan offer declined');
  });

  it('caps the list', () => {
    const many = Array.from({ length: 9 }, (_, i) =>
      offer(`O-${i}`, 'declined', `2026-10-2${i}T00:00:00Z`),
    );
    expect(buildActivity({ offers: many, loans: [], disputes: [] })).toHaveLength(5);
  });
});
