# BiasharaFlow Frontend Integration Plan

Source of truth: SRS v0.2 (Frontend–Backend contract). Visual reference: the Kadogo Traders dashboard mockup.
We have **no backend access**, so we build against the documented contract with a swappable mock layer.

## 1. Approach

- **Stack:** Vite + React + TypeScript, React Router, TanStack Query (fetching/caching), Recharts (forecast band), Tailwind CSS.
- **API layer with two adapters** behind one interface, switched by `VITE_API_MODE=mock|live` and `VITE_API_BASE_URL` (default `http://localhost:8000`):
  - `mock`: in-browser fake backend that implements the SRS rules (limit cap, one active loan -> 409, 400 above limit, duplicate `txn_id`, 12% capped repay, 5% fee, `/ussd` flow, `/demo/reset`). Persists to `localStorage`.
  - `live`: plain `fetch` to the real API. Switching requires no UI changes.
- **Types** are written straight from the SRS JSON examples (`src/api/types.ts`). Any mismatch with the real backend is fixed in one place.
- **Errors:** one `ApiError {status, detail}`; UI follows the SRS table (400 inline at input, 404 not-found state, 409 refetch + show detail, 422 dev warning, 5xx retry).
- **Always label figures "Simulated"** (NFR-3). Money is whole KES, formatted with commas. Dates are ISO strings.

## 2. Layout (from the mockup)

Dark-green sidebar (Dashboard, Forecast Chart, My Limit, Offers, Repayment Progress, Report a Problem, plus Help/Contact Support) and a top bar with shop name, trader selector, bell and user menu. Mobile (NFR-5): sidebar collapses to a bottom tab bar or drawer.

Dashboard home cards, mapped to endpoints:

| Mockup element                   | Data source                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------- |
| Today's M-PESA Sales             | latest `ledger[].daily_sales` from `/repayments`; falls back to today's `forecast` expected value |
| 7-Day Forecast (avg.)            | average of first 7 `expected_sales` from `/forecast` (or `expected_sales_7d` from `/insights`)    |
| Your Weekly Limit                | `weekly_limit` from `/limit`                                                                      |
| 14-Day Sales Forecast            | `/forecast`: expected line + low/high band (always show the band)                                 |
| Weekly Limit + "Why this limit?" | `reason`, `low_case_sales_7d`, `obligations_7d` from `/limit`                                     |
| Ready for a restock loan? CTA    | links to Offers; hidden if `weekly_limit` is 0 or there is an active loan                         |
| Repayment Progress ring          | active loan `repaid / total_payable`; "next repayment: 12% of daily sales" from `repay_share`     |
| Report a Problem                 | opens the dispute form                                                                            |
| Recent Activity                  | derived by merging `/offers`, `/repayments` ledger, and local stock check-ins, sorted by time     |

Mockup deviations to fix: it says "KES 21,000" and "3 weeks", so read everything from the API (SRS v0.2 point 1). Welcome heading uses the selected trader's `shop_name`. The mockup's "John Doe" user chip becomes the trader selector. Mockup dates say 2025, so use API dates.

## 3. Screens and calls

1. **Trader selector** (`GET /traders`): stores `trader_id` in context + `localStorage`.
2. **Dashboard** (`forecast`, `limit`, `repayments`, `insights`): refetch after accept or repay.
3. **Forecast page:** the full chart, a 7-day summary, and the insights panel (busiest/quietest days, stock alerts, suggestion).
4. **My Limit:** limit card and the full reason panel. If `weekly_limit == 0`, show a message instead of the form.
5. **Offers:** request form (amount 1..`weekly_limit`, slider + input), `POST /offer`, then the **review screen** with amount, fee, total payable, repay share %, clear date, late-payment note, and Accept / Decline. If a loan is active, show the 409 `detail` plus the current loan. Optional history from `GET /offers`.
6. **Repayment Progress:** progress bar, loan facts, ledger table. A **Demo controls** panel posts `/loans/{id}/repay` with a fresh `txn_id` (timestamp) and a daily-sales input. It handles `duplicate: true`.
7. **Stock check-in panel:** static item list, `POST /stock-checkin`, with a toast on success.
8. **Report a Problem:** reason choices (wrong balance, double deduction, other) + optional `loan_id`. Show the dispute reference and the 30-day note afterward. Optional history from `GET /disputes`.
9. **Backtest results page:** `GET /backtest/summary`. Show a "placeholder data" banner and hide the numbers as results while `placeholder` is true. Render the fairness table from `by_shop_type`.
10. **Simulated USSD phone:** phone frame; form-encoded `POST /ussd` (`sessionId`, `serviceCode`, `phoneNumber`, `text` joined by `*`). Strip `CON`/`END`, show an input for `CON`, close the session on `END`. Demo numbers +254700000101/102/103.
11. **Demo mode toolbar:** "Reset demo" (`POST /demo/reset`, handle 403) and an API-mode/base-URL indicator.

## 4. Build order (fast path)

1. Scaffold: Vite, Tailwind, router, query client, theme tokens (greens, purple CTA), app shell/sidebar.
2. `api/types.ts`, `api/client.ts`, `api/mock.ts` (full rule set), env switch.
3. Trader context + dashboard cards + forecast chart.
4. Offer flow (form -> review -> accept/decline) with all error states.
5. Repayment progress + demo controls + activity feed.
6. Stock check-in, disputes, insights, backtest page.
7. USSD simulator.
8. Mobile pass, empty/loading/error states, "Simulated" labels, README with run steps.

## 5. Risks and assumptions

- Real response shapes may differ slightly from the SRS examples, so we keep parsing defensive and centralised in `api/`.
- The deployed backend URL isn't known yet. We use `VITE_API_BASE_URL` and the mock until it's shared.
- CORS is open in dev per the SRS, so the live adapter needs no proxy.
- Auth doesn't exist. The UI states "sandbox demo, simulated data".
- "Today's sales" has no dedicated endpoint, so the derivation above is a documented guess to confirm with the Backend pair.

## 6. Open questions for the Backend pair

- Is there a "today's sales" source other than the repayment ledger?
- Are `/repayments` ledger entries ordered oldest-first?
- Which shop-type values besides `general`, `kiosk` and `cereals` exist?
- Final deployed base URL, and is `/demo/reset` enabled there?
