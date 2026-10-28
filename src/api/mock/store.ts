import type { Dispute, Loan, Offer, StockCheckin } from '../types';

export interface MockState {
  offers: Offer[];
  loans: Loan[];
  checkins: StockCheckin[];
  disputes: Dispute[];
}

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const KEY = 'biasharaflow.mock.v1';

export const emptyState = (): MockState => ({ offers: [], loans: [], checkins: [], disputes: [] });

/** Mock data survives a page reload, like the real backend survives a restart. */
export function loadState(storage?: KeyValueStorage): MockState {
  try {
    const raw = storage?.getItem(KEY);
    if (raw) return { ...emptyState(), ...(JSON.parse(raw) as Partial<MockState>) };
  } catch {
    /* corrupt or unavailable storage: start clean */
  }
  return emptyState();
}

export function saveState(state: MockState, storage?: KeyValueStorage): void {
  try {
    storage?.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked: the mock keeps working in memory */
  }
}

/** Sequential IDs that restart after a reset, e.g. O-0001. */
export const nextId = (prefix: 'O' | 'L' | 'D', existing: unknown[]) =>
  `${prefix}-${String(existing.length + 1).padStart(4, '0')}`;
