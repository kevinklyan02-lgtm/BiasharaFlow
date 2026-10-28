# Integration Guide

For frontend developers and **backend engineers** connecting the dashboard to the real API. The contract is SRS v0.2; if reality differs, fix the contract first, then the code (both pairs agree).

## 1. Switch from mock to live

1. Start the backend (`api/README.md` on the backend branch), default `http://localhost:8000`.
2. Copy `.env.example` to `.env` and set:
   ```
   VITE_API_MODE=live
   VITE_API_BASE_URL=http://localhost:8000
   ```
3. `npm run dev`. The top bar shows `LIVE` or `MOCK` so nobody confuses them.
4. Check the API against the contract tests (see below).

### Contract tests against the real API

`src/api/contract.test.ts` runs the same checks against the mock (always) and the live API (opt-in). Every live response is validated with the Zod schemas, so a mismatch fails with `[contract] METHOD /path: field message`.

```bash
# read-only checks (safe on any server)
CONTRACT_BASE_URL=http://localhost:8000 npm run test:contract:live

# also exercise offers, loans, repayments, check-ins, disputes and USSD.
# This calls POST /demo/reset first, so only use a demo/sandbox server.
CONTRACT_BASE_URL=http://localhost:8000 CONTRACT_MUTATE=1 npm run test:contract:live
```

PowerShell: `$env:CONTRACT_BASE_URL='http://localhost:8000'; npm run test:contract:live`.

The mutating run needs `POST /demo/reset` enabled and a trader with a non-zero limit.

## 2. Where things live

| You want to...                           | Look at                                                              |
| ---------------------------------------- | -------------------------------------------------------------------- |
| See what the UI expects from an endpoint | `src/api/types.ts`, `src/api/schemas.ts`                             |
| See how an endpoint is called            | `src/api/live.ts`                                                    |
| See how the mock enforces a rule         | `src/api/mock/rules.ts`                                              |
| Find which screen uses an endpoint       | table below                                                          |
| Add or change an endpoint                | "Changing the API contract" in [CONTRIBUTING.md](../CONTRIBUTING.md) |

## 3. Endpoint to screen map

| Endpoint                               | Hook                                 | Screen                      |
| -------------------------------------- | ------------------------------------ | --------------------------- |
| `GET /traders`                         | `useTraders`                         | Trader selector             |
| `GET /traders/{id}/forecast`           | `useForecast`                        | Dashboard, Forecast         |
| `GET /traders/{id}/limit`              | `useLimit`                           | Dashboard, My Limit, Offers |
| `POST /traders/{id}/offer`             | `useCreateOffer`                     | Offers form                 |
| `POST /offers/{id}/accept` / `decline` | `useAcceptOffer` / `useDeclineOffer` | Offer review                |
| `GET /traders/{id}/repayments`         | `useRepayments`                      | Dashboard, Repayments       |
| `POST /loans/{id}/repay`               | `useRepay`                           | Demo controls               |
| `POST /traders/{id}/stock-checkin`     | `useStockCheckin`                    | Stock panel                 |
| `POST/GET /traders/{id}/disputes`      | `useCreateDispute` / `useDisputes`   | Report a problem            |
| `GET /traders/{id}/insights`           | `useInsights`                        | Forecast, Dashboard         |
| `GET /backtest/summary`                | `useBacktest`                        | Backtest                    |
| `GET /traders/{id}/offers`             | `useOffers`                          | Offer history               |
| `POST /ussd` (form-encoded)            | `useUssd`                            | USSD simulator              |
| `POST /demo/reset`                     | `useDemoReset`                       | Demo toolbar                |
| `GET /health`                          | `useHealth`                          | Status indicator            |

## 4. Behaviour the backend must keep

These are the things the UI depends on. Changing them breaks screens.

- **Field names and types** exactly as in the SRS. Money is an integer KES; dates are ISO strings; UTC timestamps.
- **Error body** is always `{ "detail": string }` with 400/404/409/422/5xx as in the SRS table.
- **409** on a second offer/accept while a loan is active, and on accepting or declining an offer twice. `detail` is shown to the user verbatim, so keep it plain language.
- **`weekly_limit: 0`** means "no offer"; the UI hides the form.
- **`/repay`** returns `{ duplicate, loan }`; the UI shows no change when `duplicate` is true.
- **`/backtest/summary`** keeps the same keys; `placeholder: true` triggers a banner and hides results.
- **`/ussd`** replies with plain text starting `CON ` or `END `.
- **CORS** allows the dashboard origin.

## 5. Handling a mismatch

1. The dev console warns `[contract] <METHOD> <path>: <zod issue>` and the UI shows an error state.
2. Capture the real response (copy as cURL from DevTools).
3. Post it in the team channel with the endpoint name, per the SRS working agreement.
4. Agree which side changes; update `docs/API_CONTRACT.md` and the schemas/mock in the same PR.

## 6. Demo checklist (live mode)

- [ ] `/health` is green
- [ ] `POST /demo/reset` clears state (or returns 403, handled)
- [ ] Select each trader 101, 102, 103; limits load
- [ ] Create offer, review, accept; second offer returns 409 with a readable message
- [ ] Repay twice with the same `txn_id`; second returns `duplicate: true`
- [ ] Dispute shows a reference and the 30-day note
- [ ] USSD `2*1*1` creates a loan visible on the dashboard
- [ ] Backtest shows the banner while `placeholder` is true
