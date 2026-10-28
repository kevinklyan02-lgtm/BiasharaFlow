# API Contract (SRS v0.2 summary)

The full SRS lives with the Backend pair. This file is the frontend's working copy; if reality differs, change this file first (see [CONTRIBUTING.md](../CONTRIBUTING.md)). Types: `src/api/types.ts`. Validation: `src/api/schemas.ts`.

## Conventions

- Base URL `http://localhost:8000`; JSON with `Content-Type: application/json` (except `/ussd`).
- Money: whole KES integers. Dates: ISO strings. Timestamps: UTC. No auth. CORS open in dev.
- IDs: traders are integers (101); offers `O-0001`, loans `L-0001`, disputes `D-0001`.
- Errors: HTTP status plus `{ "detail": string }`.

| Status | UI behaviour                                    |
| ------ | ----------------------------------------------- |
| 400    | Show `detail` next to the input                 |
| 404    | Not-found state                                 |
| 409    | Refetch and show the current state and `detail` |
| 422    | Developer warning: payload shape is wrong       |
| 5xx    | Retry message                                   |

## Endpoints

| Method | Path                          | Body                                              | Returns                                                                                    |
| ------ | ----------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| GET    | `/traders`                    |                                                   | `[{trader_id, shop_name, type}]`                                                           |
| GET    | `/traders/{id}/forecast`      |                                                   | `{trader_id, shop_name, generated_at, forecast:[{date, expected_sales, low, high}]}` (14d) |
| GET    | `/traders/{id}/limit`         |                                                   | `{trader_id, weekly_limit, calculated_on, reason, low_case_sales_7d, obligations_7d}`      |
| POST   | `/traders/{id}/offer`         | `{amount}`                                        | Offer. 400 above limit; 409 if a loan is active                                            |
| POST   | `/offers/{offer_id}/accept`   | none                                              | Loan. 409 if already accepted/declined or a loan is active                                 |
| POST   | `/offers/{offer_id}/decline`  | none                                              | Offer with `status: "declined"`                                                            |
| GET    | `/traders/{id}/repayments`    |                                                   | `[Loan]`                                                                                   |
| POST   | `/loans/{loan_id}/repay`      | `{txn_id, daily_sales}`                           | `{duplicate, loan}`                                                                        |
| POST   | `/traders/{id}/stock-checkin` | `{item}`                                          | `{trader_id, item, at}`                                                                    |
| POST   | `/traders/{id}/disputes`      | `{reason, loan_id?}`                              | Dispute                                                                                    |
| GET    | `/traders/{id}/insights`      |                                                   | Insights                                                                                   |
| GET    | `/backtest/summary`           |                                                   | Backtest (`placeholder` flag)                                                              |
| GET    | `/traders/{id}/offers`        |                                                   | `[Offer]` oldest first                                                                     |
| GET    | `/traders/{id}/disputes`      |                                                   | `[Dispute]` oldest first                                                                   |
| POST   | `/demo/reset`                 | none                                              | `{reset: true}`; 403 if disabled                                                           |
| POST   | `/ussd`                       | form: `sessionId, serviceCode, phoneNumber, text` | plain text starting `CON ` or `END `                                                       |
| GET    | `/health`                     |                                                   | liveness                                                                                   |

## Objects

- **Offer:** `offer_id, trader_id, amount, fee, total_payable, repay_share_of_daily_sales, estimated_days_to_clear, estimated_clear_date, late_payment_note, status (pending_review|accepted|declined), created_at`
- **Loan:** `loan_id, trader_id, offer_id?, principal, total_payable, repaid, balance, status (active|cleared), repay_share, ledger:[{txn_id, daily_sales, deducted, at}]`
- **Dispute:** `dispute_id, trader_id, loan_id, reason, status, resolve_within_days, at`
- **Insights:** `trader_id, generated_at, source, expected_sales_7d, busiest_days[{date, expected_sales}] (<=3), quietest_days[] (<=2), stock_alerts[{item, reports}], suggestion`
- **Backtest:** `placeholder, period, traders, flat_limit_kes, metrics{stockout_days_avoided, interest_saved_kes, share_of_loans_affordable: {flat_limit, biasharaflow}}, by_shop_type[]`

## Business rules (mirrored by the mock)

1. Limit is based on low-case 7-day sales minus obligations and a 15% buffer, capped so a loan clears in about 21 days at the repay share. `weekly_limit: 0` means no offer.
2. Creating an offer never creates a loan; only accept does.
3. An offer is accepted or declined once. One active loan per trader.
4. Fee is 5%. Repay share is 12% of one day's sales, never more than the balance.
5. A repeated `txn_id` changes nothing (`duplicate: true`).
6. Amount must be between 1 and `weekly_limit`.

## USSD

`text` is the trader's inputs joined by `*`. Empty = main menu. `1` limit (END), `2` borrow choices, `2*1` offer terms, `2*1*1` accepted (END), `3` stock items, `4` balance (END), `5` problem choices. Demo phones: +254700000101, +254700000102, +254700000103.
