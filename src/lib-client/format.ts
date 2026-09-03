// Dates, written the way a person writes them.
//
// Every timestamp in this app rendered as `new Date(iso).toLocaleString()`,
// which on an English phone is `8/28/2026, 11:02:27 PM`. Nine of those stacked
// down the Activity screen is the single strongest signal that a screen was
// assembled rather than designed: it shows the SECONDS (nobody has ever needed
// them here), repeats the year on every row, and forces the reader to work out
// "was that yesterday?" for themselves.
//
// These helpers answer that question instead of posing it. They stay
// locale-aware — the app speaks twelve languages, so the month name and the
// clock format come from `Intl`, never from a hand-written table.

/** Midnight, in the reader's own timezone — the boundary "yesterday" turns on. */
const startOfDay = (d: Date): number =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

const safe = (iso: string): Date | null => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** `23:02` or `11:02 PM` — the phone's own convention, never seconds. */
export function formatTime(iso: string, locale: string): string {
  const d = safe(iso);
  if (!d) return '';
  try {
    return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(d);
  } catch {
    return d.toISOString().slice(11, 16);
  }
}

/**
 * `Today` · `Yesterday` · `28 Aug` · `28 Aug 2025`.
 *
 * The year appears only when it is NOT this one. Printing `2026` on every row
 * of a list where every row is 2026 is nine repetitions of a fact the reader
 * already has, taking space from the part that differs.
 */
export function formatDay(iso: string, locale: string, labels: { today: string; yesterday: string }): string {
  const d = safe(iso);
  if (!d) return '';
  const now  = new Date();
  const days = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000);
  if (days === 0) return labels.today;
  if (days === 1) return labels.yesterday;
  try {
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

/** One line: `Today · 23:02`. For a row that is not already under a day header. */
export function formatWhen(iso: string, locale: string, labels: { today: string; yesterday: string }): string {
  const day  = formatDay(iso, locale, labels);
  const time = formatTime(iso, locale);
  return day && time ? `${day} · ${time}` : day || time;
}

/**
 * Group rows under the day they happened on, newest first, preserving the
 * order they arrived in.
 *
 * A list of forty identical "Payment completed" rows is a wall. The same forty
 * under three date headers is a history — the reader can see the shape of a
 * week without reading a single timestamp.
 */
export function groupByDay<T>(rows: T[], at: (row: T) => string): { key: string; iso: string; rows: T[] }[] {
  const out: { key: string; iso: string; rows: T[] }[] = [];
  for (const row of rows) {
    const d = safe(at(row));
    // An unparseable date gets its own bucket rather than being dropped: a row
    // we cannot place is still a row that happened.
    const key = d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10) : 'unknown';
    const last = out[out.length - 1];
    if (last && last.key === key) last.rows.push(row);
    else out.push({ key, iso: at(row), rows: [row] });
  }
  return out;
}
