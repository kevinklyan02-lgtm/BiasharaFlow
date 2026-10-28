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
