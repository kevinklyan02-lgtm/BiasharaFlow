# Open Questions for the Backend Pair

Answer in the team channel, then record the decision here and in `API_CONTRACT.md`.

| #   | Question                                                              | Frontend assumption until answered                                          | Status |
| --- | --------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------ |
| 1   | Is there a "today's sales" source other than the repayment ledger?    | Use the latest ledger `daily_sales`, else today's forecast `expected_sales` | Open   |
| 2   | Are `/repayments` ledger entries ordered oldest-first?                | Yes; the UI sorts by `at` anyway                                            | Open   |
| 3   | Which shop `type` values exist besides `general`, `kiosk`, `cereals`? | Unknown types render as plain text                                          | Open   |
| 4   | Deployed base URL, and is `/demo/reset` enabled there?                | `http://localhost:8000`; 403 handled                                        | Open   |
| 5   | Which stock items should the check-in list offer?                     | Static list: Cooking oil, Sugar, Maize flour, Rice, Milk, Bread             | Open   |
| 6   | Exact `reason` values accepted by `POST /disputes`?                   | "Wrong balance", "Double deduction", "Other"                                | Open   |

## Mock-only assumptions (the SRS is silent; confirm against the real backend)

| #   | Behaviour the mock invents                                                               | Why                                               |
| --- | ---------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 7   | `POST /loans/{id}/repay` on a cleared loan returns 409                                   | No loan should take deductions after clearing     |
| 8   | Non-integer or zero/negative `daily_sales` returns 400; non-integer `amount` returns 422 | Money is whole KES                                |
| 9   | USSD borrow menu offers 100%, 50% and 25% of the limit (rounded down to KES 100)         | SRS only says "borrow choices"                    |
| 10  | The USSD offer is created at `2*k` and accepted/declined at `2*k*1` / `2*k*2`            | Keeps USSD stateless; matches "terms then Accept" |
| 11  | `POST /disputes` with an unknown `loan_id` returns 404                                   | Avoids disputes against loans that do not exist   |
