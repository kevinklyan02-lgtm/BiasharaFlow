import type { z } from 'zod';
import type * as S from './schemas';

export type Trader = z.infer<typeof S.TraderSchema>;
export type ForecastPoint = z.infer<typeof S.ForecastPointSchema>;
export type Forecast = z.infer<typeof S.ForecastSchema>;
export type Limit = z.infer<typeof S.LimitSchema>;
export type OfferStatus = z.infer<typeof S.OfferStatusSchema>;
export type Offer = z.infer<typeof S.OfferSchema>;
export type LedgerEntry = z.infer<typeof S.LedgerEntrySchema>;
export type LoanStatus = z.infer<typeof S.LoanStatusSchema>;
export type Loan = z.infer<typeof S.LoanSchema>;
export type RepayResponse = z.infer<typeof S.RepayResponseSchema>;
export type StockCheckin = z.infer<typeof S.StockCheckinSchema>;
export type Dispute = z.infer<typeof S.DisputeSchema>;
export type Insights = z.infer<typeof S.InsightsSchema>;
export type Backtest = z.infer<typeof S.BacktestSchema>;

export interface RepayRequest {
  txn_id: string;
  daily_sales: number;
}

export interface DisputeRequest {
  reason: string;
  loan_id?: string;
}

export interface UssdRequest {
  sessionId: string;
  serviceCode: string;
  phoneNumber: string;
  text: string;
}

/** One method per endpoint. Both the live and mock adapters implement this. */
export interface ApiClient {
  readonly mode: 'mock' | 'live';
  getTraders(): Promise<Trader[]>;
  getForecast(traderId: number): Promise<Forecast>;
  getLimit(traderId: number): Promise<Limit>;
  createOffer(traderId: number, amount: number): Promise<Offer>;
  acceptOffer(offerId: string): Promise<Loan>;
  declineOffer(offerId: string): Promise<Offer>;
  getRepayments(traderId: number): Promise<Loan[]>;
  repay(loanId: string, body: RepayRequest): Promise<RepayResponse>;
  stockCheckin(traderId: number, item: string): Promise<StockCheckin>;
  createDispute(traderId: number, body: DisputeRequest): Promise<Dispute>;
  getInsights(traderId: number): Promise<Insights>;
  getBacktest(): Promise<Backtest>;
  getOffers(traderId: number): Promise<Offer[]>;
  getDisputes(traderId: number): Promise<Dispute[]>;
  resetDemo(): Promise<{ reset: boolean }>;
  ussd(body: UssdRequest): Promise<string>;
  health(): Promise<Record<string, unknown>>;
}
