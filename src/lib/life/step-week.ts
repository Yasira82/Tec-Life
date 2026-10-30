// The daily step, read for the Home card (owner, 2026-10-30: «حاجات مفيدة من غير AI»).
//
// Pure: no clock of its own, no storage. tec-life-service keeps one answer per day per step
// (DONE / PARTLY / NOT_YET) and hands back the last two weeks; this turns them into the seven
// dots and the week's few words. No score and no streak, as on «أنا بتغيّر»: a missed day is
// only an empty dot, and a slower week is never said as a loss.
import type { JourneyEntry, JourneyOutcome } from '@/lib-client/life/journey';

export interface StepDay { day: string; answer: JourneyOutcome }

const DAY = 86_400_000;

/** The person's own calendar day, `YYYY-MM-DD` — the day the server is told a tap belongs to. */
export function localDayKey(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** `key` moved by `n` days, on the calendar (no clock hours, so no daylight-saving slip). */
export function shiftDay(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!) + n * DAY).toISOString().slice(0, 10);
}

/** The last `n` days ending today, oldest first — each with its answer, or null for no tap. */
export function lastDays(days: StepDay[], today: string, n = 7): { day: string; answer: JourneyOutcome | null }[] {
  const by = new Map(days.map((d) => [d.day, d.answer]));
  return Array.from({ length: n }, (_, i) => {
    const day = shiftDay(today, i - (n - 1));
    return { day, answer: by.get(day) ?? null };
  });
}

export type Trend = 'first' | 'more' | 'same' | 'fewer';

/**
 * The last seven days against the seven before them. `first` when there was no answer at all
 * in the earlier seven — nothing to compare, and a first week is not "fewer".
 */
export function weekReview(days: StepDay[], today: string): { done: number; partly: number; before: number; trend: Trend } {
  const week = lastDays(days, today, 7);
  const prev = lastDays(days, shiftDay(today, -7), 7);
  const count = (xs: { answer: JourneyOutcome | null }[], a: JourneyOutcome) => xs.filter((x) => x.answer === a).length;
  const done = count(week, 'DONE');
  const before = count(prev, 'DONE');
  const answeredBefore = prev.some((x) => x.answer !== null);
  const trend: Trend = !answeredBefore ? 'first' : done > before ? 'more' : done === before ? 'same' : 'fewer';
  return { done, partly: count(week, 'PARTLY'), before, trend };
}

/**
 * The step the card follows: the NEWEST kept entry's — an older step was replaced by the newer
 * conversation (the service's reminder reads the same one) — unless said DONE or over a month old.
 */
export function followedStep(entries: JourneyEntry[], now: Date = new Date()): JourneyEntry | null {
  const newest = entries[0];
  if (!newest?.step || newest.step_outcome === 'DONE') return null;
  if (now.getTime() - new Date(newest.created_at).getTime() > 30 * DAY) return null;
  return newest;
}
