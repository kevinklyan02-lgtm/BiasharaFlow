import type { Forecast, Loan } from '@/api/types';

/** Average expected daily sales over the first 7 forecast days. */
export function avgExpected7(forecast: Forecast): number {
  const week = forecast.forecast.slice(0, 7);
  if (week.length === 0) return 0;
  return Math.round(week.reduce((s, p) => s + p.expected_sales, 0) / week.length);
}

export interface TodaySales {
  amount: number;
  /** Where the number came from, so the UI never presents a forecast as an actual. */
  source: 'repayment' | 'forecast';
  /** Percent change against the previous repayment day, when one exists. */
  changePct: number | null;
}

/**
 * There is no "today's sales" endpoint (docs/OPEN_QUESTIONS.md #1), so use the most recent
 * repayment ledger entry, falling back to the first forecast day.
 */
export function todaySales(loans: Loan[], forecast: Forecast): TodaySales | null {
  const entries = loans.flatMap((l) => l.ledger).sort((a, b) => a.at.localeCompare(b.at));
  const latest = entries.at(-1);
  if (latest) {
    const prev = entries.at(-2);
    const changePct =
      prev && prev.daily_sales > 0
        ? Math.round(((latest.daily_sales - prev.daily_sales) / prev.daily_sales) * 100)
        : null;
    return { amount: latest.daily_sales, source: 'repayment', changePct };
  }
  const first = forecast.forecast[0];
  return first ? { amount: first.expected_sales, source: 'forecast', changePct: null } : null;
}

export const activeLoan = (loans: Loan[]): Loan | undefined =>
  loans.find((l) => l.status === 'active');

/** Share of the total payable already repaid, 0-100. */
export function repaidPercent(loan: Pick<Loan, 'repaid' | 'total_payable'>): number {
  if (loan.total_payable <= 0) return 0;
  return Math.min(100, Math.round((loan.repaid / loan.total_payable) * 100));
}
