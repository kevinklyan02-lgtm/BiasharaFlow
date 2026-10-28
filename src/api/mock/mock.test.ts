import { describe, expect, it, beforeEach } from 'vitest';
import { ApiError } from '../errors';
import * as S from '../schemas';
import type { ApiClient } from '../types';
import { createMockClient } from '.';
import { POLICY } from './rules';
import type { KeyValueStorage } from './store';

const NOW = new Date('2026-10-27T10:00:00Z');
let api: ApiClient;

beforeEach(() => {
  api = createMockClient({ now: () => NOW });
});

async function expectApiError(p: Promise<unknown>, status: number) {
  const err = await p.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(ApiError);
  expect((err as ApiError).status).toBe(status);
  return err as ApiError;
}

describe('contract shapes', () => {
  it('every read endpoint matches its schema', async () => {
    S.TradersSchema.parse(await api.getTraders());
    for (const id of [101, 102, 103]) {
      S.ForecastSchema.parse(await api.getForecast(id));
      S.LimitSchema.parse(await api.getLimit(id));
      S.InsightsSchema.parse(await api.getInsights(id));
      S.LoansSchema.parse(await api.getRepayments(id));
    }
    S.BacktestSchema.parse(await api.getBacktest());
  });

  it('write endpoints match their schemas', async () => {
    const offer = S.OfferSchema.parse(await api.createOffer(101, 5000));
    S.LoanSchema.parse(await api.acceptOffer(offer.offer_id));
    const loanId = (await api.getRepayments(101))[0].loan_id;
    S.RepayResponseSchema.parse(await api.repay(loanId, { txn_id: 'X1', daily_sales: 8000 }));
    S.StockCheckinSchema.parse(await api.stockCheckin(101, 'Sugar'));
    S.DisputeSchema.parse(await api.createDispute(101, { reason: 'Other', loan_id: loanId }));
    S.ResetResponseSchema.parse(await api.resetDemo());
  });
});

describe('forecast and limit', () => {
  it('returns 14 days with low <= expected <= high, starting tomorrow', async () => {
    const { forecast } = await api.getForecast(101);
    expect(forecast).toHaveLength(14);
    expect(forecast[0].date).toBe('2026-10-28');
    for (const p of forecast) {
      expect(p.low).toBeLessThanOrEqual(p.expected_sales);
      expect(p.expected_sales).toBeLessThanOrEqual(p.high);
    }
  });

  it('limit is a multiple of 1000 and within the 21-day clearing cap', async () => {
    for (const id of [101, 102, 103]) {
      const { weekly_limit } = await api.getLimit(id);
      const { forecast } = await api.getForecast(id);
      const avg = forecast.slice(0, 7).reduce((s, p) => s + p.expected_sales, 0) / 7;
      expect(weekly_limit % 1000).toBe(0);
      expect(weekly_limit).toBeGreaterThan(0);
      const days = (weekly_limit * (1 + POLICY.feeRate)) / (POLICY.repayShare * avg);
      expect(days).toBeLessThanOrEqual(POLICY.targetClearDays + 0.01);
    }
  });

  it('explains the limit in plain language', async () => {
    const { reason } = await api.getLimit(101);
    expect(reason).toMatch(/low-case sales/);
    expect(reason).toMatch(/15% safety buffer/);
  });

  it('404s for an unknown trader', async () => {
    await expectApiError(api.getLimit(999), 404);
  });
});

describe('offers and loans', () => {
  it('creates an offer without creating a loan', async () => {
    const offer = await api.createOffer(101, 12000);
    expect(offer).toMatchObject({
      offer_id: 'O-0001',
      amount: 12000,
      fee: 600,
      total_payable: 12600,
      repay_share_of_daily_sales: 0.12,
      status: 'pending_review',
    });
    expect(await api.getRepayments(101)).toEqual([]);
  });

  it('rejects amounts above the limit or below 1 with 400', async () => {
    const { weekly_limit } = await api.getLimit(101);
    const err = await expectApiError(api.createOffer(101, weekly_limit + 1), 400);
    expect(err.detail).toMatch(/between 1 and the limit of KES/);
    await expectApiError(api.createOffer(101, 0), 400);
  });

  it('accepts once and returns 409 on a second accept', async () => {
    const offer = await api.createOffer(101, 12000);
    const loan = await api.acceptOffer(offer.offer_id);
    expect(loan).toMatchObject({
      loan_id: 'L-0001',
      principal: 12000,
      balance: 12600,
      repaid: 0,
      status: 'active',
      ledger: [],
    });
    await expectApiError(api.acceptOffer(offer.offer_id), 409);
    expect((await api.getOffers(101))[0].status).toBe('accepted');
  });

  it('declines once and cannot accept afterwards', async () => {
    const offer = await api.createOffer(101, 5000);
    expect((await api.declineOffer(offer.offer_id)).status).toBe('declined');
    await expectApiError(api.declineOffer(offer.offer_id), 409);
    await expectApiError(api.acceptOffer(offer.offer_id), 409);
  });

  it('allows one active loan per trader', async () => {
    const first = await api.createOffer(101, 5000);
    const pending = await api.createOffer(101, 6000);
    await api.acceptOffer(first.offer_id);
    const e1 = await expectApiError(api.createOffer(101, 1000), 409);
    expect(e1.detail).toMatch(/active loan \(L-0001\)/);
    await expectApiError(api.acceptOffer(pending.offer_id), 409);
    // Another trader is unaffected.
    await api.createOffer(102, 1000);
  });

  it('404s for unknown offers and loans', async () => {
    await expectApiError(api.acceptOffer('O-9999'), 404);
    await expectApiError(api.declineOffer('O-9999'), 404);
    await expectApiError(api.repay('L-9999', { txn_id: 'a', daily_sales: 1000 }), 404);
  });
});

describe('repayments', () => {
  async function activeLoan(amount = 5000) {
    const offer = await api.createOffer(101, amount);
    return api.acceptOffer(offer.offer_id);
  }

  it('deducts 12% of daily sales and records the ledger', async () => {
    const loan = await activeLoan();
    const res = await api.repay(loan.loan_id, { txn_id: 'X1', daily_sales: 8000 });
    expect(res.duplicate).toBe(false);
    expect(res.loan).toMatchObject({ repaid: 960, balance: 5250 - 960 });
    const [saved] = await api.getRepayments(101);
    expect(saved.ledger).toEqual([
      { txn_id: 'X1', daily_sales: 8000, deducted: 960, at: NOW.toISOString() },
    ]);
  });

  it('ignores a repeated txn_id', async () => {
    const loan = await activeLoan();
    await api.repay(loan.loan_id, { txn_id: 'X1', daily_sales: 8000 });
    const again = await api.repay(loan.loan_id, { txn_id: 'X1', daily_sales: 8000 });
    expect(again.duplicate).toBe(true);
    expect(again.loan.repaid).toBe(960);
    expect((await api.getRepayments(101))[0].ledger).toHaveLength(1);
  });

  it('never deducts more than the balance and clears the loan', async () => {
    const loan = await activeLoan(1000);
    const res = await api.repay(loan.loan_id, { txn_id: 'big', daily_sales: 1_000_000 });
    expect(res.loan).toMatchObject({ repaid: 1050, balance: 0, status: 'cleared' });
    await expectApiError(api.repay(loan.loan_id, { txn_id: 'more', daily_sales: 5000 }), 409);
  });

  it('frees the trader to borrow again once cleared', async () => {
    const loan = await activeLoan(1000);
    await api.repay(loan.loan_id, { txn_id: 'big', daily_sales: 1_000_000 });
    await expect(api.createOffer(101, 1000)).resolves.toMatchObject({ offer_id: 'O-0002' });
  });

  it('rejects non-positive sales with 400', async () => {
    const loan = await activeLoan();
    await expectApiError(api.repay(loan.loan_id, { txn_id: 'neg', daily_sales: -5 }), 400);
  });
});

describe('check-ins, disputes and insights', () => {
  it('records a stock check-in and surfaces it in insights', async () => {
    await api.stockCheckin(101, 'Sugar');
    await api.stockCheckin(101, 'Sugar');
    await api.stockCheckin(101, 'Rice');
    const insights = await api.getInsights(101);
    expect(insights.stock_alerts[0]).toEqual({ item: 'Sugar', reports: 2 });
    expect(insights.suggestion).toMatch(/Sugar/);
    expect(insights.busiest_days.length).toBeLessThanOrEqual(3);
    expect(insights.quietest_days).toHaveLength(2);
  });

  it('insights have no stock alerts before any check-in', async () => {
    expect((await api.getInsights(102)).stock_alerts).toEqual([]);
  });

  it('logs a dispute with a 30-day response note', async () => {
    const d = await api.createDispute(101, { reason: 'Double deduction' });
    expect(d).toMatchObject({
      dispute_id: 'D-0001',
      status: 'open',
      resolve_within_days: 30,
      loan_id: null,
    });
    expect(await api.getDisputes(101)).toHaveLength(1);
    await expectApiError(api.createDispute(101, { reason: 'x', loan_id: 'L-0404' }), 404);
  });
});

describe('reset and persistence', () => {
  it('reset wipes data and restarts IDs', async () => {
    await api.createOffer(101, 1000);
    await api.stockCheckin(101, 'Sugar');
    await api.createDispute(101, { reason: 'Other' });
    expect(await api.resetDemo()).toEqual({ reset: true });
    expect(await api.getOffers(101)).toEqual([]);
    expect(await api.getDisputes(101)).toEqual([]);
    expect((await api.getInsights(101)).stock_alerts).toEqual([]);
    expect((await api.createOffer(101, 1000)).offer_id).toBe('O-0001');
  });

  it('returns 403 when reset is disabled', async () => {
    const locked = createMockClient({ now: () => NOW, demoResetEnabled: false });
    await expectApiError(locked.resetDemo(), 403);
  });

  it('keeps data across client instances sharing storage', async () => {
    const data = new Map<string, string>();
    const storage: KeyValueStorage = {
      getItem: (k) => data.get(k) ?? null,
      setItem: (k, v) => void data.set(k, v),
    };
    const a = createMockClient({ now: () => NOW, storage });
    await a.createOffer(101, 2000);
    const b = createMockClient({ now: () => NOW, storage });
    expect(await b.getOffers(101)).toHaveLength(1);
  });

  it('returns copies so callers cannot mutate the store', async () => {
    const offer = await api.createOffer(101, 1000);
    offer.amount = 1;
    expect((await api.getOffers(101))[0].amount).toBe(1000);
  });
});
