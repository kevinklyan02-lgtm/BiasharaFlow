import type { Forecast, Limit, Loan, Offer } from '../types';
import { SEED_TRADERS, WEEKDAY_FACTORS, type SeedTrader } from './seed';

/** Illustrative policy values from the SRS. Kept in one place, like the backend does. */
export const POLICY = {
  feeRate: 0.05,
  repayShare: 0.12,
  safetyBuffer: 0.15,
  roundTo: 1000,
  targetClearDays: 21,
  resolveWithinDays: 30,
  lowFactor: 0.82,
  highFactor: 1.18,
} as const;

const DAY_MS = 86_400_000;

export const isoDate = (d: Date) => d.toISOString().slice(0, 10);
export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY_MS);
export const formatKes = (n: number) => `KES ${n.toLocaleString('en-US')}`;

/** Deterministic +-3% wobble so charts look natural but tests stay stable. */
function jitter(traderId: number, dayIndex: number): number {
  const x = Math.sin(traderId * 12.9898 + dayIndex * 78.233) * 43758.5453;
  return (x - Math.floor(x) - 0.5) * 0.06;
}

export function findTrader(id: number): SeedTrader | undefined {
  return SEED_TRADERS.find((t) => t.trader_id === id);
}

export function buildForecast(trader: SeedTrader, now: Date): Forecast {
  const start = addDays(now, 1);
  const forecast = Array.from({ length: 14 }, (_, i) => {
    const day = addDays(start, i);
    const dayIndex = Math.floor(day.getTime() / DAY_MS);
    const expected = Math.round(
      trader.base_daily_sales *
        WEEKDAY_FACTORS[day.getUTCDay()] *
        (1 + jitter(trader.trader_id, dayIndex)),
    );
    return {
      date: isoDate(day),
      expected_sales: expected,
      low: Math.round(expected * POLICY.lowFactor),
      high: Math.round(expected * POLICY.highFactor),
    };
  });
  return {
    trader_id: trader.trader_id,
    shop_name: trader.shop_name,
    generated_at: now.toISOString(),
    forecast,
  };
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** Average expected daily sales over the next 7 days. */
export function avgDailyExpected(forecast: Forecast): number {
  return sum(forecast.forecast.slice(0, 7).map((p) => p.expected_sales)) / 7;
}

export function computeLimit(trader: SeedTrader, forecast: Forecast, now: Date): Limit {
  const low7 = sum(forecast.forecast.slice(0, 7).map((p) => p.low));
  const obligations = trader.weekly_obligations;
  const afterBuffer = Math.max(0, low7 - obligations) * (1 - POLICY.safetyBuffer);
  const capPrincipal =
    (POLICY.targetClearDays * POLICY.repayShare * avgDailyExpected(forecast)) /
    (1 + POLICY.feeRate);
  const limit = Math.floor(Math.min(afterBuffer, capPrincipal) / POLICY.roundTo) * POLICY.roundTo;

  return {
    trader_id: trader.trader_id,
    weekly_limit: limit,
    calculated_on: isoDate(now),
    reason:
      `Projected low-case sales ${formatKes(low7)} next 7 days, minus ${formatKes(obligations)} ` +
      `rent, supplier and existing debts, minus a ${POLICY.safetyBuffer * 100}% safety buffer. ` +
      `Capped so a full loan clears in about ${POLICY.targetClearDays} days at ` +
      `${POLICY.repayShare * 100}% of daily sales.`,
    low_case_sales_7d: low7,
    obligations_7d: obligations,
  };
}

export function buildOffer(
  offerId: string,
  trader: SeedTrader,
  amount: number,
  forecast: Forecast,
  now: Date,
): Offer {
  const fee = Math.round(amount * POLICY.feeRate);
  const total = amount + fee;
  const days = Math.ceil(total / (POLICY.repayShare * avgDailyExpected(forecast)));
  return {
    offer_id: offerId,
    trader_id: trader.trader_id,
    amount,
    fee,
    total_payable: total,
    repay_share_of_daily_sales: POLICY.repayShare,
    estimated_days_to_clear: days,
    estimated_clear_date: isoDate(addDays(now, days)),
    late_payment_note: 'SIMULATED: no late charges in this prototype.',
    status: 'pending_review',
    created_at: now.toISOString(),
  };
}

export function buildLoan(loanId: string, offer: Offer): Loan {
  return {
    loan_id: loanId,
    trader_id: offer.trader_id,
    offer_id: offer.offer_id,
    principal: offer.amount,
    total_payable: offer.total_payable,
    repaid: 0,
    balance: offer.total_payable,
    status: 'active',
    repay_share: offer.repay_share_of_daily_sales,
    ledger: [],
  };
}

/** Deduct the capped share of one day's sales, never more than the balance. Mutates `loan`. */
export function applyRepayment(loan: Loan, txnId: string, dailySales: number, now: Date): number {
  const deducted = Math.min(Math.round(dailySales * loan.repay_share), loan.balance);
  loan.repaid += deducted;
  loan.balance -= deducted;
  if (loan.balance === 0) loan.status = 'cleared';
  loan.ledger.push({ txn_id: txnId, daily_sales: dailySales, deducted, at: now.toISOString() });
  return deducted;
}
