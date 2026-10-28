/** Money and dates are formatted here and nowhere else. */

export const formatNumber = (n: number) => Math.round(n).toLocaleString('en-US');

/** Whole shillings with thousands separators, e.g. "KES 22,000". */
export const formatKes = (n: number) => `KES ${formatNumber(n)}`;

/** 0.12 -> "12%" */
export const formatPercent = (fraction: number) => `${Math.round(fraction * 1000) / 10}%`;

/** Parses "2026-11-01" as a UTC calendar day so the weekday never shifts with the viewer's zone. */
const toDate = (iso: string) => new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);

/**
 * Intl supplies the words and numbers; we supply the punctuation. The separators Intl puts
 * between parts (for example the comma after the weekday) differ between ICU versions, so the
 * output would otherwise change from one machine or CI runner to the next.
 */
function parts(d: Date, options: Intl.DateTimeFormatOptions): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of new Intl.DateTimeFormat('en-GB', options).formatToParts(d)) {
    if (p.type !== 'literal') out[p.type] = p.value;
  }
  return out;
}

/** "Sun, 1 Nov" */
export function formatDay(iso: string): string {
  const p = parts(toDate(iso), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
  return `${p.weekday}, ${p.day} ${p.month}`;
}

/** "1 Nov" */
export function formatShortDate(iso: string): string {
  const p = parts(toDate(iso), { day: 'numeric', month: 'short', timeZone: 'UTC' });
  return `${p.day} ${p.month}`;
}

/** "Sun" */
export function formatWeekday(iso: string): string {
  return parts(toDate(iso), { weekday: 'short', timeZone: 'UTC' }).weekday;
}

/** "27 Oct 2026, 10:24" in the viewer's local time. */
export function formatDateTime(iso: string): string {
  const p = parts(toDate(iso), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  return `${p.day} ${p.month} ${p.year}, ${p.hour}:${p.minute}`;
}
