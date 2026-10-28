import { describe, expect, it } from 'vitest';
import type { Forecast, Loan } from '@/api/types';
import { activeLoan, avgExpected7, repaidPercent, todaySales } from './derive';

const forecast: Forecast = {
  trader_id: 101,
  shop_name: 'x',
  generated_at: '2026-10-27T00:00:00Z',
  forecast: Array.from({ length: 14 }, (_, i) => ({
    date: `2026-11-${String(i + 1).padStart(2, '0')}`,
    expected_sales: i < 7 ? 1000 : 9999,
    low: 800,
    high: 1200,
  })),
};

const loan = (over: Partial<Loan> = {}): Loan => ({
  loan_id: 'L-0001',
  trader_id: 101,
  principal: 1000,
  total_payable: 1050,
  repaid: 0,
  balance: 1050,
  status: 'active',
  repay_share: 0.12,
  ledger: [],
  ...over,
});

describe('derive', () => {
  it('averages only the first 7 forecast days', () => {
    expect(avgExpected7(forecast)).toBe(1000);
  });

  it('falls back to the forecast when there is no repayment history', () => {
    expect(todaySales([loan()], forecast)).toEqual({
      amount: 1000,
      source: 'forecast',
      changePct: null,
    });
  });

  it('uses the latest ledger entry across loans and the change vs the previous one', () => {
    const loans = [
      loan({
        ledger: [
          { txn_id: 'a', daily_sales: 8000, deducted: 960, at: '2026-10-26T18:00:00Z' },
          { txn_id: 'b', daily_sales: 8800, deducted: 1056, at: '2026-10-27T18:00:00Z' },
        ],
      }),
    ];
    expect(todaySales(loans, forecast)).toEqual({
      amount: 8800,
      source: 'repayment',
      changePct: 10,
    });
  });

  it('returns null with no data at all', () => {
    expect(todaySales([], { ...forecast, forecast: [] })).toBeNull();
  });

  it('finds the active loan and computes repaid percent', () => {
    expect(activeLoan([loan({ status: 'cleared' }), loan({ loan_id: 'L-0002' })])?.loan_id).toBe(
      'L-0002',
    );
    expect(repaidPercent({ repaid: 5520, total_payable: 12000 })).toBe(46);
    expect(repaidPercent({ repaid: 0, total_payable: 0 })).toBe(0);
    expect(repaidPercent({ repaid: 2000, total_payable: 1000 })).toBe(100);
  });
});
