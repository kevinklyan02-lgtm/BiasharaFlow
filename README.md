# BiasharaFlow Dashboard

Merchant dashboard for BiasharaFlow: forecast a duka's M-PESA cash cycle, see an affordable restock limit, review and accept an offer, and track capped repayments. A simulated USSD phone covers feature-phone users.

**All data is simulated.** No real merchant data, credentials or money are used.

## Quick start

```bash
npm install
cp .env.example .env     # VITE_API_MODE=mock works with no backend
npm run dev              # http://localhost:5173
```

| Command                      | What it does                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| `npm run check`              | lint + typecheck + tests + build. Run before every commit                                  |
| `npm run test:watch`         | tests in watch mode                                                                        |
| `npm run test:contract:live` | check a real backend against the contract (see [docs/INTEGRATION.md](docs/INTEGRATION.md)) |
| `npm run format`             | Prettier                                                                                   |

## Screens

| Route                    | Screen                                                          | Backend calls                                 |
| ------------------------ | --------------------------------------------------------------- | --------------------------------------------- |
| `/`                      | Dashboard: stats, 14-day forecast, limit, activity, restock CTA | forecast, limit, repayments, offers, disputes |
| `/forecast`              | Forecast chart with low/high band, insights, stock check-in     | forecast, insights, stock-checkin             |
| `/limit`                 | Weekly limit and the plain-language reason                      | limit                                         |
| `/offers`, `/offers/:id` | Request an amount, review terms, accept or decline              | offer, accept, decline, offers                |
| `/repayments`            | Progress, ledger, demo "simulate a day of sales"                | repayments, repay                             |
| `/problem`               | Report a problem, reference and 30-day note                     | disputes                                      |
| `/backtest`              | Results vs a flat limit (placeholder-aware)                     | backtest/summary                              |
| `/ussd`                  | Simulated feature phone using the real `/ussd` handler          | ussd                                          |

## Mock and live backend

The app talks to one `ApiClient` interface with two adapters, chosen by `VITE_API_MODE`:

- `mock` (default): an in-browser simulator of the SRS rules. Data persists in `localStorage`; "Reset demo data" clears it.
- `live`: plain `fetch` to `VITE_API_BASE_URL` (default `http://localhost:8000`). Every response is validated against the contract.

The top bar shows `MOCK` or `LIVE`, and an API online/offline dot.

## Deploying

`npm run build` produces `dist/`, a static single-page app. `public/_redirects` (Netlify) and `vercel.json` rewrite all paths to `index.html` so deep links work. Set `VITE_API_MODE`, `VITE_API_BASE_URL` and `VITE_DEMO_MODE` as build-time environment variables. Set `VITE_DEMO_MODE=false` to hide demo tools.

## Docs

- [FRONTEND_PLAN.md](FRONTEND_PLAN.md): original approach and screens
- [docs/ROADMAP.md](docs/ROADMAP.md): delivery phases and gates
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): layers and folder layout
- [docs/API_CONTRACT.md](docs/API_CONTRACT.md): endpoint contract
- [docs/INTEGRATION.md](docs/INTEGRATION.md): switching to the real backend (for backend engineers)
- [docs/DECISIONS.md](docs/DECISIONS.md): why things are the way they are
- [docs/OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md): questions for the backend pair
- [CONTRIBUTING.md](CONTRIBUTING.md): working rules

## Known limits

- Built without a live backend; the mock follows SRS v0.2. Run the live contract test as soon as a server is available and record differences in `docs/OPEN_QUESTIONS.md`.
- Layout, colour contrast and the 360px mobile view were checked with component tests and axe in jsdom, not in a real browser. Do a manual pass before a public demo.
