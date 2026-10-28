# Decisions

Short records of choices that are not obvious from the code. Newest last.

| #   | Decision                                                                                                                  | Why                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1   | Build against an in-browser mock that mirrors the SRS, switched by `VITE_API_MODE`                                        | The backend was not available; the interface keeps the swap to live a config change        |
| 2   | Zod schemas are the single source of truth; TS types are inferred                                                         | One edit updates validation and types; live mismatches are reported with the endpoint name |
| 3   | The repay response's `loan` is validated as a partial loan                                                                | The SRS example only shows `loan_id`, `repaid`, `balance`, `status`                        |
| 4   | There is no `GET /offers/{id}`, so the review screen finds the offer in `GET /traders/{id}/offers`                        | Works on refresh and for any status, no extra endpoint needed                              |
| 5   | "Today's sales" is derived from the latest repayment ledger entry, else the first forecast day, and labelled as such      | No endpoint exists for it (OPEN_QUESTIONS #1)                                              |
| 6   | Recent activity is built from offers, ledgers and disputes only                                                           | Stock check-ins have no list endpoint; they appear in insights instead                     |
| 7   | Backtest numbers are not shown while `placeholder` is true                                                                | SRS: never present placeholder zeros as results                                            |
| 8   | Inline status messages instead of toasts                                                                                  | Accessible by default, simpler to test, no timers                                          |
| 9   | The 409 detail from offer creation is lifted to the page and shown beside the current loan                                | The form unmounts once the active loan is refetched                                        |
| 10  | The USSD simulator re-sends the full input history in `text` on each press                                                | Matches the real gateway so the backend handler stays stateless                            |
| 11  | A11y is checked with axe in jsdom plus a manual pass; colour contrast and responsive layout are not machine-verified here | jsdom has no layout engine                                                                 |
