let counter = 0;

/** A fresh repayment transaction id per click (txn_id must be unique per simulated day). */
export function newTxnId(): string {
  counter += 1;
  return `W${Date.now()}-${counter}`;
}
