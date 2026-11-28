// The redesign's «My mirror» (Phase 1, owner 2026-11-28), as plain arithmetic on Life's own reads.
//
// Where every number comes from (approved mockup v4, «Where My mirror's numbers come from»):
//   • days you logged progress, goals finished → /life/trajectory?window_days=7|30|90 (no cap).
//     What that read is, from tec-life-service `getTrajectory` on main (e64ab24e; owner review of
//     9f5a44f, 28 Nov 2026) — limits the screen inherits and does not correct:
//       – it counts logged STEPS only (`kind: 'step'`); corrections are excluded;
//       – its period is a ROLLING window, now minus N×24 hours, and `active_days` are UTC days —
//         while every other number here uses whole calendar days of the phone, ending today. Near a
//         day's edge the two can differ by a day without anything being wrong in the data;
//       – «goals finished» counts goals whose status is DONE and whose `updated_at` falls in the
//         window, with no upper bound. `updated_at` is the last change, not when the goal was
//         finished: a goal finished earlier and edited inside the window is counted. It is NOT a
//         record of when goals were completed — that would need a completion date in the backend.
//     Whether production runs this code is not confirmed here: the gateway sends /identity/life/* to
//     tec-life-service only when LIFE_SERVICE_URL is set, and the deployed version is not checked;
//   • summaries kept   → /life/journey, counted by created_at; the read is capped at 500, so a list
//                        that comes back at the cap with its oldest entry still inside the period is
//                        said as «at least»;
//   • days you did your step → the step answers, which Life returns for the last 14 days only, so
//                        they are counted under «Week» only and never stretched over a longer period.
// Analytics is not read at all.
//
// The evidence rule (owner, same mockup): nothing is read INTO the person's records unless there are
// 5 or more dated records, on 3 or more different days, spanning 14 or more days. A record is a dated
// step answer (done or partly) or a kept summary. Logged progress is NOT counted: the trajectory read
// returns totals only — no date per logged step — so it cannot show different days or a span.
// Ticks on a goal's steps carry no date and count as nothing.
import type { Journey, JourneyEntry, JourneyOutcome } from '@/lib-client/life/journey';
import { localDayKey, shiftDay } from './step-week';
import { JOURNEY_READ_CAP } from './deletion-count';

export type Period = 'week' | 'month' | 'm3';
export const PERIODS: readonly Period[] = ['week', 'month', 'm3'];
export const PERIOD_DAYS: Record<Period, number> = { week: 7, month: 30, m3: 90 };
/** Life returns step answers for this many days back (tec-life-service STEP_DAYS_BACK). */
export const STEP_DAYS_BACK = 14;
export const GATE = { records: 5, days: 3, span: 14 } as const;

const DAY = 86_400_000;
const dayOf = (iso: string) => localDayKey(new Date(iso));
/** The first day inside a period of `days` days that ends today. */
export const periodStart = (today: string, days: number) => shiftDay(today, -(days - 1));
const between = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY);

/** Kept summaries inside the period; `atLeast` when the capped read may have cut the period short. */
export function summariesIn(journey: Journey, today: string, days: number): { n: number; atLeast: boolean; entries: JourneyEntry[] } {
  const start = periodStart(today, days);
  // Inside the period AND not after today: a record dated in the future (a phone clock behind the
  // server's, or bad data) is counted nowhere (owner review of #133).
  const entries = journey.entries.filter((e) => { const d = dayOf(e.created_at); return d >= start && d <= today; });
  // The capped read may have cut the period short only when its OLDEST record is itself inside the
  // period, bounded on both sides (owner review of #133). The oldest is found, not assumed from the
  // list's order; a read whose oldest record is after today proves nothing about the period.
  const oldestDay = journey.entries.reduce<string | null>((min, e) => { const d = dayOf(e.created_at); return min === null || d < min ? d : min; }, null);
  const atLeast = journey.entries.length >= JOURNEY_READ_CAP && oldestDay !== null && oldestDay >= start && oldestDay <= today;
  return { n: entries.length, atLeast, entries };
}

const RANK: Record<JourneyOutcome, number> = { DONE: 2, PARTLY: 1, NOT_YET: 0 };

/** One answer per day across every kept step (the best of them), for the last `n` days. */
export function stepWeek(journey: Journey, today: string, n = 7): { day: string; answer: JourneyOutcome | null }[] {
  const best = new Map<string, JourneyOutcome>();
  for (const e of journey.entries) for (const d of e.days ?? []) {
    const had = best.get(d.day);
    if (!had || RANK[d.answer] > RANK[had]) best.set(d.day, d.answer);
  }
  return Array.from({ length: n }, (_, i) => {
    const day = shiftDay(today, i - (n - 1));
    return { day, answer: best.get(day) ?? null };
  });
}

/** Days with the step fully done (DONE only — a «partly» day is shown in the bars, not counted here), in the period — or null when Life has no answers that far back. */
export function stepDaysDone(journey: Journey, today: string, days: number): number | null {
  if (days > STEP_DAYS_BACK) return null;
  return stepWeek(journey, today, days).filter((d) => d.answer === 'DONE').length;
}

export interface Evidence { kind: 'step' | 'summary'; day: string; text: string; answer?: JourneyOutcome; id: string }

/** Every dated record in the period that counts as evidence, newest first. */
export function evidenceIn(journey: Journey, today: string, days: number): Evidence[] {
  const start = periodStart(today, days);
  const out: Evidence[] = [];
  for (const e of journey.entries) {
    const day = dayOf(e.created_at);
    if (day >= start && day <= today) out.push({ kind: 'summary', day, text: e.problem, id: `s:${e.id}` });
    for (const d of e.days ?? []) {
      if (d.day < start || d.day > today || d.answer === 'NOT_YET' || !e.step) continue;
      out.push({ kind: 'step', day: d.day, text: e.step, answer: d.answer, id: `d:${e.id}:${d.day}` });
    }
  }
  return out.sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0));
}

export interface GateResult {
  records: number; days: number; span: number;
  ok: { records: boolean; days: boolean; span: boolean };
  enough: boolean;
}

export function checkGate(items: Evidence[]): GateResult {
  const days = [...new Set(items.map((i) => i.day))].sort();
  const span = days.length ? between(days[0]!, days[days.length - 1]!) : 0;
  const ok = { records: items.length >= GATE.records, days: days.length >= GATE.days, span: span >= GATE.span };
  return { records: items.length, days: days.length, span, ok, enough: ok.records && ok.days && ok.span };
}

/** What the person themselves confirmed helped, or now do regularly — their words, newest first. */
export function ownLessons(entries: JourneyEntry[]): { id: string; day: string; text: string }[] {
  const out: { id: string; day: string; text: string }[] = [];
  for (const e of entries) {
    const day = dayOf(e.created_at);
    if (e.helped?.trim()) out.push({ id: `h:${e.id}`, day, text: e.helped.trim() });
    if (e.practice?.trim()) out.push({ id: `p:${e.id}`, day, text: e.practice.trim() });
  }
  return out;
}
