import { z } from 'zod';

/** Zod schemas mirror docs/API_CONTRACT.md. Types are inferred from them (see types.ts). */

export const TraderSchema = z.object({
  trader_id: z.number().int(),
  shop_name: z.string(),
  type: z.string(),
});

export const ForecastPointSchema = z.object({
  date: z.string(),
  expected_sales: z.number(),
  low: z.number(),
  high: z.number(),
});

export const ForecastSchema = z.object({
  trader_id: z.number().int(),
  shop_name: z.string(),
  generated_at: z.string(),
  forecast: z.array(ForecastPointSchema),
});

export const LimitSchema = z.object({
  trader_id: z.number().int(),
  weekly_limit: z.number(),
  calculated_on: z.string(),
  reason: z.string(),
  low_case_sales_7d: z.number(),
  obligations_7d: z.number(),
});

export const OfferStatusSchema = z.enum(['pending_review', 'accepted', 'declined']);

export const OfferSchema = z.object({
  offer_id: z.string(),
  trader_id: z.number().int(),
  amount: z.number(),
  fee: z.number(),
  total_payable: z.number(),
  repay_share_of_daily_sales: z.number(),
  estimated_days_to_clear: z.number(),
  estimated_clear_date: z.string(),
  late_payment_note: z.string(),
  status: OfferStatusSchema,
  created_at: z.string(),
});

export const LedgerEntrySchema = z.object({
  txn_id: z.string(),
  daily_sales: z.number(),
  deducted: z.number(),
  at: z.string(),
});

export const LoanStatusSchema = z.enum(['active', 'cleared']);

export const LoanSchema = z.object({
  loan_id: z.string(),
  trader_id: z.number().int(),
  offer_id: z.string().optional(),
  principal: z.number(),
  total_payable: z.number(),
  repaid: z.number(),
  balance: z.number(),
  status: LoanStatusSchema,
  repay_share: z.number(),
  ledger: z.array(LedgerEntrySchema),
});

/** The repay response only promises these loan fields; the rest may be omitted. */
export const RepayLoanSchema = LoanSchema.partial().required({
  loan_id: true,
  repaid: true,
  balance: true,
  status: true,
});

export const RepayResponseSchema = z.object({
  duplicate: z.boolean(),
  loan: RepayLoanSchema,
});

export const StockCheckinSchema = z.object({
  trader_id: z.number().int(),
  item: z.string(),
  at: z.string(),
});

export const DisputeSchema = z.object({
  dispute_id: z.string(),
  trader_id: z.number().int(),
  loan_id: z.string().nullish(),
  reason: z.string(),
  status: z.string(),
  resolve_within_days: z.number(),
  at: z.string(),
});

export const InsightsSchema = z.object({
  trader_id: z.number().int(),
  generated_at: z.string(),
  source: z.string(),
  expected_sales_7d: z.number(),
  busiest_days: z.array(z.object({ date: z.string(), expected_sales: z.number() })),
  quietest_days: z.array(z.object({ date: z.string(), expected_sales: z.number() })),
  stock_alerts: z.array(z.object({ item: z.string(), reports: z.number() })),
  suggestion: z.string(),
});

const MetricPairSchema = z.object({ flat_limit: z.number(), biasharaflow: z.number() });

export const BacktestSchema = z.object({
  placeholder: z.boolean(),
  period: z.string(),
  traders: z.number(),
  flat_limit_kes: z.number(),
  metrics: z.object({
    stockout_days_avoided: MetricPairSchema,
    interest_saved_kes: MetricPairSchema,
    share_of_loans_affordable: MetricPairSchema,
  }),
  by_shop_type: z.array(z.record(z.unknown())),
});

export const ResetResponseSchema = z.object({ reset: z.boolean() });

export const TradersSchema = z.array(TraderSchema);
export const LoansSchema = z.array(LoanSchema);
export const OffersSchema = z.array(OfferSchema);
export const DisputesSchema = z.array(DisputeSchema);
