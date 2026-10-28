/** Query keys, namespaced by trader so switching trader never shows another trader's data. */
export const qk = {
  traders: ['traders'] as const,
  trader: (id: number) => ['trader', id] as const,
  forecast: (id: number) => ['trader', id, 'forecast'] as const,
  limit: (id: number) => ['trader', id, 'limit'] as const,
  repayments: (id: number) => ['trader', id, 'repayments'] as const,
  offers: (id: number) => ['trader', id, 'offers'] as const,
  disputes: (id: number) => ['trader', id, 'disputes'] as const,
  insights: (id: number) => ['trader', id, 'insights'] as const,
  backtest: ['backtest'] as const,
  health: ['health'] as const,
};
