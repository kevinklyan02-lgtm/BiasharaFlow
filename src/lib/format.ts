/** Money and dates are formatted here and nowhere else. */

export const formatNumber = (n: number) => Math.round(n).toLocaleString('en-US');

/** Whole shillings with thousands separators, e.g. "KES 22,000". */
export const formatKes = (n: number) => `KES ${formatNumber(n)}`;

/** 0.12 -> "12%" */
export const formatPercent = (fraction: number) => `${Math.round(fraction * 1000) / 10}%`;

/** Parses "2026-11-01" as a UTC calendar day so the weekday never shifts with the viewer's zone. */
const toDate = (iso: string) => new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);

/** "Sat, 1 Nov" */
export function formatDay(iso: string): string {
  return toDate(iso).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

/** "1 Nov" */
export function formatShortDate(iso: string): string {
  return toDate(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

/** "Sat" */
export function formatWeekday(iso: string): string {
  return toDate(iso).toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' });
}

/** "27 Oct 2026, 10:24" in the viewer's local time. */
export function formatDateTime(iso: string): string {
  const d = toDate(iso);
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${date}, ${time}`;
}
