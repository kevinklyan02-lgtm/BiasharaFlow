/** Static choices the UI offers (docs/OPEN_QUESTIONS.md #5 and #6). Shared with the mock and USSD. */
export const STOCK_ITEMS = ['Cooking oil', 'Sugar', 'Maize flour', 'Rice', 'Milk', 'Bread'];

export const DISPUTE_REASONS = ['Wrong balance', 'Double deduction', 'Other'];

/** Demo phone numbers registered with the sandbox, by trader id (SRS 4.5). */
export const DEMO_PHONES: Record<number, string> = {
  101: '+254700000101',
  102: '+254700000102',
  103: '+254700000103',
};

export const USSD_SERVICE_CODE = '*384#';
