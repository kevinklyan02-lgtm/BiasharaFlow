# Architecture

## Goals

- Build only from the SRS contract; keep the backend swappable with zero UI change.
- Keep server data, UI state and presentation clearly separated.
- Make every business rule testable without a browser or network.

## Stack

Vite, React 18, TypeScript (strict), React Router, TanStack Query, Recharts, Tailwind CSS, Vitest + React Testing Library, ESLint + Prettier, Zod (runtime response validation).

## Layers

```
UI (pages, components)      renders, no fetch calls
   │ uses
Feature hooks (queries/mutations)   TanStack Query; cache keys, invalidation
   │ calls
API client (interface)      one function per endpoint, typed
   │ resolved by env
┌──────────────┬──────────────┐
│ live adapter │ mock adapter │   fetch to real API  |  in-browser SRS simulator
└──────────────┴──────────────┘
```

Rule of dependency: a layer may only import from the layer directly below it. Pages never import adapters; components never call `fetch`.

## Folder structure

```
src/
  app/            providers, router, layout shell, global styles
  api/
    types.ts      TS types from the SRS
    schemas.ts    Zod schemas (validate live responses)
    errors.ts     ApiError {status, detail}
    client.ts     ApiClient interface + factory (reads VITE_API_MODE)
    live.ts       fetch implementation
    mock/         in-browser backend: rules.ts, store.ts, ussd.ts, seed.ts
  features/
    traders/  dashboard/  forecast/  limit/  offers/
    repayments/  stock/  disputes/  backtest/  ussd/  demo/
      (each: components/, hooks.ts, pages/, *.test.tsx)
  components/     shared UI (Card, Button, Money, Toast, ErrorState, ...)
  lib/            format.ts (KES, dates), id.ts (txn ids), storage.ts
  test/           setup, factories, msw-free fixtures
docs/             ROADMAP, ARCHITECTURE, INTEGRATION, API_CONTRACT, DECISIONS
```

## Key decisions

1. **Mock adapter implements the same interface as live.** Contract tests run against both so the mock can't drift from the SRS.
2. **Server state in TanStack Query only.** No copying API data into global stores. UI state (selected trader, mobile drawer) lives in a small React context persisted to `localStorage`.
3. **Query keys are namespaced by trader**, e.g. `['trader', id, 'limit']`. Accept/repay/reset invalidate the affected keys: `limit`, `repayments`, `offers`.
4. **Validate at the boundary.** Live responses pass through Zod; a mismatch raises a visible dev warning naming the endpoint, which speeds up backend integration.
5. **Errors are values with a policy.** One `ApiError` and a mapping from status to UI behaviour (400 inline, 404 not-found, 409 refetch + message, 422 dev warning, 5xx retry). Components never inspect raw responses.
6. **Money and dates are formatted in one place** (`lib/format.ts`). Money is an integer; never floats.
7. **Accessibility and mobile first.** Semantic HTML, keyboard reachable, 360px minimum, colour is never the only signal.
8. **No secrets in the frontend.** Only `VITE_*` public config; `.env` is git-ignored, `.env.example` is committed.

## Configuration

| Variable            | Values                           | Default                 |
| ------------------- | -------------------------------- | ----------------------- |
| `VITE_API_MODE`     | `mock` or `live`                 | `mock`                  |
| `VITE_API_BASE_URL` | backend base URL                 | `http://localhost:8000` |
| `VITE_DEMO_MODE`    | `true` shows reset/demo controls | `true`                  |

## Testing strategy

- **Unit:** mock rules, formatters, ID generation.
- **Contract:** a shared suite that runs against the mock (always) and the live API (opt-in with `npm run test:contract:live`).
- **Component:** key screens with the mock adapter.
- **Manual:** each phase gate includes a browser walkthrough, since type checks and unit tests don't prove the UI works.
