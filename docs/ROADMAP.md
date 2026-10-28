# Roadmap: Delivery Phases

Each phase ends with a **gate**: lint, typecheck, unit tests and build all pass, and the phase's acceptance checks are verified by running the app. Only then is the phase committed and pushed (see [CONTRIBUTING.md](../CONTRIBUTING.md)).

| Phase | Name                         | Outcome                                                                                                     | Gate (must pass before commit)                                                                                  |
| ----- | ---------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 0     | Foundation                   | Vite + React + TS + Tailwind scaffold, lint/format/test tooling, folder structure, env config, CI workflow  | `npm run check` green; dev server renders the app shell                                                         |
| 1     | API layer and mock backend   | Typed client, `ApiError`, mock adapter implementing every SRS rule, `live`/`mock` switch                    | Unit tests for each business rule (limit cap, 400/404/409, duplicate txn, capped repay, one active loan, reset) |
| 2     | App shell and trader context | Sidebar, top bar, mobile nav, trader selector, routing, theme, global error/empty/loading components        | Trader switch persists; layout works at 360px and 1280px                                                        |
| 3     | Dashboard and forecast       | Stat cards, 14-day forecast chart with low/high band, limit card + "Why this limit?", insights panel        | Component tests with mock data; chart shows the band; values come from the API                                  |
| 4     | Offer flow                   | Request form (1..limit), review screen with all terms, accept/decline, 409 handling with current loan       | Tests for 400 inline message, 409 refresh, zero-limit state; end-to-end happy path in the browser               |
| 5     | Repayments and activity      | Progress ring/bar, ledger table, demo repay controls (fresh `txn_id`), recent activity feed                 | Duplicate txn shows no change; balance never goes below 0; cleared state renders                                |
| 6     | Stock check-in and disputes  | Check-in panel, dispute form and reference + 30-day note, optional histories                                | Form validation tests; success/error toasts verified                                                            |
| 7     | Backtest page                | `/backtest/summary` view, placeholder banner, fairness table                                                | Numbers hidden/labelled while `placeholder` is true                                                             |
| 8     | USSD simulator               | Phone UI posting form-encoded `/ussd`, `CON`/`END` handling, demo numbers                                   | Scripted session `2*1*1` produces the accept flow against the mock                                              |
| 9     | Demo mode and hardening      | Reset button (403 handled), "Simulated" labels, a11y pass, performance pass, live-mode smoke test checklist | Lighthouse a11y >= 90; keyboard-only run-through; all docs updated                                              |
| 10    | Release                      | Deployed build config, final README, tag `v1.0.0`                                                           | Production build served and walked through end to end                                                           |

## Phase workflow

1. Branch `phase/<n>-<slug>` from `main`.
2. Implement in small commits (Conventional Commits).
3. Run the gate locally and manually exercise the feature in the browser.
4. Update docs touched by the phase.
5. Merge to `main`, push, tag `phase-<n>`.
