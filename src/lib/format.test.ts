import { describe, expect, it } from 'vitest';
import { newTxnId } from './id';
import { formatDay, formatKes, formatPercent, formatShortDate, formatWeekday } from './format';

describe('format', () => {
  it('formats whole KES with thousands separators', () => {
    expect(formatKes(22000)).toBe('KES 22,000');
    expect(formatKes(0)).toBe('KES 0');
    expect(formatKes(1234567)).toBe('KES 1,234,567');
  });

  it('formats a fraction as a percentage without float noise', () => {
    expect(formatPercent(0.12)).toBe('12%');
    expect(formatPercent(0.155)).toBe('15.5%');
  });

  it('formats ISO dates as UTC calendar days', () => {
    expect(formatDay('2026-11-01')).toBe('Sun, 1 Nov');
    expect(formatShortDate('2026-11-01')).toBe('1 Nov');
    expect(formatWeekday('2026-11-01')).toBe('Sun');
  });

  it('generates a unique txn id each call', () => {
    expect(newTxnId()).not.toBe(newTxnId());
  });
});
