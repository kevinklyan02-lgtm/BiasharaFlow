import { formatDay } from '@/lib/format';
import { ApiError } from '../errors';
import type { ApiClient, Backtest, Insights, Loan } from '../types';
import { SEED_TRADERS } from './seed';
import {
  POLICY,
  applyRepayment,
  buildForecast,
  buildLoan,
  buildOffer,
  computeLimit,
  findTrader,
  formatKes,
} from './rules';
import { emptyState, loadState, nextId, saveState, type KeyValueStorage } from './store';
import { handleUssd } from './ussd';

export interface MockOptions {
  now?: () => Date;
  storage?: KeyValueStorage;
  /** Simulated network delay, so loading states are visible in the demo. */
  latencyMs?: number;
  /** Mirrors the backend's switch; when false, POST /demo/reset returns 403. */
  demoResetEnabled?: boolean;
}

const clone = <T>(v: T): T => structuredClone(v);

/** In-browser simulator of the SRS contract. Same interface as the live adapter. */
export function createMockClient(options: MockOptions = {}): ApiClient {
  const now = options.now ?? (() => new Date());
  const latency = options.latencyMs ?? 0;
  const resetEnabled = options.demoResetEnabled ?? true;
  let state = loadState(options.storage);
  const persist = () => saveState(state, options.storage);

  const trader = (id: number) => {
    const t = findTrader(id);
    if (!t) throw new ApiError(404, `Trader ${id} not found`);
    return t;
  };
  const forecastFor = (id: number) => buildForecast(trader(id), now());
  const limitFor = (id: number) => computeLimit(trader(id), forecastFor(id), now());
  const activeLoan = (id: number) =>
    state.loans.find((l) => l.trader_id === id && l.status === 'active');
  const findOffer = (offerId: string) => {
    const offer = state.offers.find((o) => o.offer_id === offerId);
    if (!offer) throw new ApiError(404, `Offer ${offerId} not found`);
    return offer;
  };
  const activeLoanConflict = (loan: Loan) =>
    new ApiError(
      409,
      `You already have an active loan (${loan.loan_id}) with a balance of ${formatKes(loan.balance)}. Repay it before starting a new one.`,
    );

  // Each endpoint is a plain synchronous function; `wrap` adds latency and defensive copies.
  const impl = {
    getTraders: () =>
      SEED_TRADERS.map(({ trader_id, shop_name, type }) => ({ trader_id, shop_name, type })),
    getForecast: (id: number) => forecastFor(id),
    getLimit: (id: number) => limitFor(id),

    createOffer: (id: number, amount: number) => {
      const t = trader(id);
      if (!Number.isInteger(amount)) throw new ApiError(422, 'amount must be a whole number');
      const loan = activeLoan(id);
      if (loan) throw activeLoanConflict(loan);
      const { weekly_limit } = limitFor(id);
      if (weekly_limit <= 0) throw new ApiError(400, 'No offer is available this week');
      if (amount < 1 || amount > weekly_limit) {
        throw new ApiError(
          400,
          `Amount must be between 1 and the limit of ${formatKes(weekly_limit)}`,
        );
      }
      const offer = buildOffer(nextId('O', state.offers), t, amount, forecastFor(id), now());
      state.offers.push(offer);
      persist();
      return offer;
    },

    acceptOffer: (offerId: string) => {
      const offer = findOffer(offerId);
      if (offer.status !== 'pending_review') {
        throw new ApiError(409, `Offer ${offerId} was already ${offer.status}`);
      }
      const existing = activeLoan(offer.trader_id);
      if (existing) throw activeLoanConflict(existing);
      const loan = buildLoan(nextId('L', state.loans), offer);
      offer.status = 'accepted';
      state.loans.push(loan);
      persist();
      return loan;
    },

    declineOffer: (offerId: string) => {
      const offer = findOffer(offerId);
      if (offer.status !== 'pending_review') {
        throw new ApiError(409, `Offer ${offerId} was already ${offer.status}`);
      }
      offer.status = 'declined';
      persist();
      return offer;
    },

    getRepayments: (id: number) => {
      trader(id);
      return state.loans.filter((l) => l.trader_id === id);
    },

    repay: (loanId: string, body: { txn_id: string; daily_sales: number }) => {
      const loan = state.loans.find((l) => l.loan_id === loanId);
      if (!loan) throw new ApiError(404, `Loan ${loanId} not found`);
      if (!body.txn_id) throw new ApiError(422, 'txn_id is required');
      if (loan.ledger.some((e) => e.txn_id === body.txn_id)) return { duplicate: true, loan };
      if (!Number.isInteger(body.daily_sales) || body.daily_sales <= 0) {
        throw new ApiError(400, 'daily_sales must be a positive whole number of KES');
      }
      if (loan.status === 'cleared') throw new ApiError(409, `Loan ${loanId} is already cleared`);
      applyRepayment(loan, body.txn_id, body.daily_sales, now());
      persist();
      return { duplicate: false, loan };
    },

    stockCheckin: (id: number, item: string) => {
      trader(id);
      if (!item.trim()) throw new ApiError(422, 'item is required');
      const entry = { trader_id: id, item: item.trim(), at: now().toISOString() };
      state.checkins.push(entry);
      persist();
      return entry;
    },

    createDispute: (id: number, body: { reason: string; loan_id?: string }) => {
      trader(id);
      if (!body.reason.trim()) throw new ApiError(422, 'reason is required');
      if (
        body.loan_id &&
        !state.loans.some((l) => l.loan_id === body.loan_id && l.trader_id === id)
      ) {
        throw new ApiError(404, `Loan ${body.loan_id} not found`);
      }
      const dispute = {
        dispute_id: nextId('D', state.disputes),
        trader_id: id,
        loan_id: body.loan_id ?? null,
        reason: body.reason.trim(),
        status: 'open',
        resolve_within_days: POLICY.resolveWithinDays,
        at: now().toISOString(),
      };
      state.disputes.push(dispute);
      persist();
      return dispute;
    },

    getInsights: (id: number): Insights => {
      const week = forecastFor(id).forecast.slice(0, 7);
      const byBusiest = [...week].sort((a, b) => b.expected_sales - a.expected_sales);
      const pick = (p: { date: string; expected_sales: number }) => ({
        date: p.date,
        expected_sales: p.expected_sales,
      });
      const counts = new Map<string, number>();
      state.checkins
        .filter((c) => c.trader_id === id)
        .forEach((c) => counts.set(c.item, (counts.get(c.item) ?? 0) + 1));
      const alerts = [...counts]
        .map(([item, reports]) => ({ item, reports }))
        .sort((a, b) => b.reports - a.reports);
      const busiest = byBusiest[0];
      return {
        trader_id: id,
        generated_at: now().toISOString(),
        source: 'rule-based',
        expected_sales_7d: week.reduce((s, p) => s + p.expected_sales, 0),
        busiest_days: byBusiest.slice(0, 3).map(pick),
        quietest_days: byBusiest.slice(-2).reverse().map(pick),
        stock_alerts: alerts,
        suggestion:
          `Your busiest day next week is ${formatDay(busiest.date)}. Restock before then.` +
          (alerts[0] ? ` ${alerts[0].item} is the item you report running low most often.` : ''),
      };
    },

    getBacktest: (): Backtest => ({
      placeholder: true,
      period: 'Friday to Friday',
      traders: SEED_TRADERS.length,
      flat_limit_kes: 15000,
      metrics: {
        stockout_days_avoided: { flat_limit: 0, biasharaflow: 0 },
        interest_saved_kes: { flat_limit: 0, biasharaflow: 0 },
        share_of_loans_affordable: { flat_limit: 0, biasharaflow: 0 },
      },
      by_shop_type: [],
    }),

    getOffers: (id: number) => {
      trader(id);
      return state.offers.filter((o) => o.trader_id === id);
    },
    getDisputes: (id: number) => {
      trader(id);
      return state.disputes.filter((d) => d.trader_id === id);
    },

    resetDemo: () => {
      if (!resetEnabled) throw new ApiError(403, 'Demo reset is turned off on this server');
      state = emptyState();
      persist();
      return { reset: true };
    },

    health: () => ({ status: 'ok', mode: 'mock' }),
  };

  type Impl = typeof impl;
  const wrap =
    <K extends keyof Impl>(name: K) =>
    async (...args: Parameters<Impl[K]>): Promise<ReturnType<Impl[K]>> => {
      if (latency > 0) await new Promise((r) => setTimeout(r, latency));
      const fn = impl[name] as (...a: unknown[]) => ReturnType<Impl[K]>;
      return clone(fn(...args));
    };

  const client: ApiClient = {
    mode: 'mock',
    getTraders: wrap('getTraders'),
    getForecast: wrap('getForecast'),
    getLimit: wrap('getLimit'),
    createOffer: wrap('createOffer'),
    acceptOffer: wrap('acceptOffer'),
    declineOffer: wrap('declineOffer'),
    getRepayments: wrap('getRepayments'),
    repay: wrap('repay'),
    stockCheckin: wrap('stockCheckin'),
    createDispute: wrap('createDispute'),
    getInsights: wrap('getInsights'),
    getBacktest: wrap('getBacktest'),
    getOffers: wrap('getOffers'),
    getDisputes: wrap('getDisputes'),
    resetDemo: wrap('resetDemo'),
    health: wrap('health'),
    ussd: async (body) => {
      if (latency > 0) await new Promise((r) => setTimeout(r, latency));
      return handleUssd(client, body);
    },
  };
  return client;
}
