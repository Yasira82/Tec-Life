/**
 * «My mirror» arithmetic (Phase 1, owner 2026-11-28): Life's own reads only, counted honestly, and
 * nothing read into the records until the evidence rule passes.
 */
import { describe, it, expect } from 'vitest';
import type { Journey, JourneyEntry } from '@/lib-client/life/journey';
import {
  checkGate, evidenceIn, ownLessons, periodStart, stepDaysDone, stepWeek, summariesIn, GATE,
} from '@/lib/life/mirror';
import { localDayKey, shiftDay } from '@/lib/life/step-week';
import { mirrorCopy } from '@/lib/life/mirror-copy';
import { LOCALES } from '@/lib/i18n/locales';

const TODAY = '2026-11-28';
// Noon local time, so the local calendar day is the intended one in any time zone.
const at = (day: string) => new Date(`${day}T12:00:00`).toISOString();
const ago = (n: number) => shiftDay(TODAY, -n);
const entry = (id: string, n: number, extra: Partial<JourneyEntry> = {}): JourneyEntry =>
  ({ id, problem: `p${id}`, understanding: 'u', step: null, step_outcome: null, created_at: at(ago(n)), ...extra });
const J = (entries: JourneyEntry[], keeping = true): Journey => ({ keeping, entries });

describe('summaries in a period', () => {
  it('counts by the day the summary was kept, inside the period only', () => {
    const j = J([entry('a', 0), entry('b', 6), entry('c', 7), entry('d', 40)]);
    expect(summariesIn(j, TODAY, 7)).toMatchObject({ n: 2, atLeast: false });
    expect(summariesIn(j, TODAY, 30).n).toBe(3);
    expect(summariesIn(j, TODAY, 90).n).toBe(4);
    expect(periodStart(TODAY, 7)).toBe(ago(6));
    expect(localDayKey(new Date(at(TODAY)))).toBe(TODAY);
  });

  it('«at least» only when the capped read may have cut the period short', () => {
    const full = Array.from({ length: 500 }, (_, i) => entry(`e${i}`, Math.floor(i / 10)));
    // Oldest of the 500 is 49 days back: inside 90 days → the true count may be higher.
    expect(summariesIn(J(full), TODAY, 90)).toMatchObject({ n: 500, atLeast: true });
    // A month is fully covered by what was read → exact.
    expect(summariesIn(J(full), TODAY, 30)).toMatchObject({ n: 300, atLeast: false });
  });
});

describe('«at least» at the 500 read cap, with future-dated records', () => {
  const ahead = (n: number) => entry(`f${n}`, -n);

  it('a full read that is all in the future proves nothing about the period', () => {
    const allFuture = Array.from({ length: 500 }, (_, i) => ahead(i + 1));
    expect(summariesIn(J(allFuture), TODAY, 90)).toMatchObject({ n: 0, atLeast: false });
  });

  it('future records filling part of the cap: «at least» follows the oldest real one', () => {
    const mixed = [...Array.from({ length: 450 }, (_, i) => ahead(i + 1)), ...Array.from({ length: 50 }, (_, i) => entry(`r${i}`, i))];
    // Oldest is 49 days back: inside 90 days, so records older than it may be missing.
    expect(summariesIn(J(mixed), TODAY, 90)).toMatchObject({ n: 50, atLeast: true });
    // A week holds only real records 0–6 days back, and the read reaches past it: exact.
    expect(summariesIn(J(mixed), TODAY, 7)).toMatchObject({ n: 7, atLeast: false });
  });

  it('the oldest is found, not taken from the list’s order', () => {
    const shuffled = [entry('old', 120), ...Array.from({ length: 499 }, (_, i) => entry(`n${i}`, i % 60))];
    expect(summariesIn(J(shuffled), TODAY, 90).atLeast).toBe(false);
  });
});

describe('the step answers', () => {
  const j = J([
    entry('new', 1, { step: 's1', days: [{ day: ago(0), answer: 'DONE' }, { day: ago(2), answer: 'NOT_YET' }, { day: ago(9), answer: 'DONE' }] }),
    entry('old', 5, { step: 's0', days: [{ day: ago(2), answer: 'PARTLY' }, { day: ago(3), answer: 'DONE' }] }),
  ]);

  it('one answer per day across steps, the best of them', () => {
    const w = stepWeek(j, TODAY, 7);
    expect(w).toHaveLength(7);
    expect(w[6]).toEqual({ day: TODAY, answer: 'DONE' });
    expect(w.find((d) => d.day === ago(2))?.answer).toBe('PARTLY');
  });

  it('days with the step done: counted for a week, never stretched past the 14 days Life keeps', () => {
    expect(stepDaysDone(j, TODAY, 7)).toBe(2);
    expect(stepDaysDone(j, TODAY, 30)).toBeNull();
    expect(stepDaysDone(j, TODAY, 90)).toBeNull();
  });
});

describe('the evidence rule', () => {
  it('evidence is dated: kept summaries and steps done or partly — never a «not yet»', () => {
    const j = J([entry('a', 1, { step: 's', days: [{ day: ago(1), answer: 'DONE' }, { day: ago(2), answer: 'PARTLY' }, { day: ago(3), answer: 'NOT_YET' }] })]);
    const ev = evidenceIn(j, TODAY, 7);
    expect(ev.map((e) => `${e.kind}:${e.day}`)).toEqual([`summary:${ago(1)}`, `step:${ago(1)}`, `step:${ago(2)}`]);
  });

  it('answers on a step-less entry and outside the period do not count', () => {
    const j = J([entry('a', 40, { days: [{ day: ago(1), answer: 'DONE' }] })]);
    expect(evidenceIn(j, TODAY, 7)).toEqual([]);
  });

  it(`needs ${GATE.records}+ records, on ${GATE.days}+ days, spanning ${GATE.span}+ days — each condition alone is not enough`, () => {
    const many = (days: number[]) => evidenceIn(J(days.map((d, i) => entry(`x${i}`, d))), TODAY, 90);
    // Plenty on one day.
    expect(checkGate(many([1, 1, 1, 1, 1, 1])).ok).toEqual({ records: true, days: false, span: false });
    // Three days, but only six days apart.
    expect(checkGate(many([1, 2, 3, 4, 7])).enough).toBe(false);
    // Long span, too few records.
    expect(checkGate(many([1, 20])).ok).toEqual({ records: false, days: false, span: true });
    // All three.
    const g = checkGate(many([1, 5, 9, 12, 15]));
    expect(g).toMatchObject({ records: 5, days: 5, span: 14, enough: true });
  });

  it('nothing at all is not enough', () => {
    expect(checkGate([])).toMatchObject({ records: 0, days: 0, span: 0, enough: false });
  });
});

describe('a record dated after today counts nowhere', () => {
  const ahead = (n: number) => shiftDay(TODAY, n);

  it('a summary dated in the future is not a kept summary of the period', () => {
    const j = J([entry('f', -3), entry('a', 1)]);
    expect(summariesIn(j, TODAY, 7).n).toBe(1);
    expect(summariesIn(j, TODAY, 90).entries.map((e) => e.id)).toEqual(['a']);
  });

  it('neither a future summary nor a future step answer is evidence', () => {
    const j = J([
      entry('f', -2, { step: 's', days: [{ day: ahead(2), answer: 'DONE' }] }),
      entry('a', 1, { step: 's', days: [{ day: ahead(1), answer: 'PARTLY' }, { day: ago(1), answer: 'DONE' }] }),
    ]);
    expect(evidenceIn(j, TODAY, 90).map((e) => `${e.kind}:${e.day}`)).toEqual([`summary:${ago(1)}`, `step:${ago(1)}`]);
  });

  it('future records cannot carry the gate over the days or the 14-day span', () => {
    // Real: 5 records on 2 days, 1 day apart — not enough.
    const real = [entry('a', 1), entry('b', 1), entry('c', 1), entry('d', 2), entry('e', 2)];
    // With future-dated records on 10 more days, as far as 20 days ahead, it would pass if they counted.
    const future = Array.from({ length: 10 }, (_, i) => entry(`f${i}`, -(i * 2 + 2)));
    const g = checkGate(evidenceIn(J([...future, ...real]), TODAY, 90));
    expect(g).toMatchObject({ records: 5, days: 2, span: 1, enough: false });
  });
});

describe('days with the step done', () => {
  it('counts DONE only, and every language says «fully»', () => {
    const j = J([entry('a', 0, { step: 's', days: [{ day: ago(0), answer: 'DONE' }, { day: ago(1), answer: 'PARTLY' }] })]);
    expect(stepDaysDone(j, TODAY, 7)).toBe(1);
    expect(mirrorCopy('en').sSteps).toBe('Days you fully did your step');
    expect(mirrorCopy('ar').sSteps).toBe('أيام نفّذت فيها خطوتك كاملة');
    expect(new Set(LOCALES.map(({ code }) => mirrorCopy(code).sSteps)).size).toBe(12);
  });
});

describe('own words', () => {
  it('what the person confirmed helped or now practise — nothing else, nothing inferred', () => {
    const out = ownLessons([
      entry('a', 1, { helped: ' small steps ', practice: 'save on payday', tried: 'not this' }),
      entry('b', 2, { helped: '   ' }),
    ]);
    expect(out.map((l) => l.text)).toEqual(['small steps', 'save on payday']);
  });
});

describe('copy', () => {
  it('every language has every line', () => {
    const keys = Object.keys(mirrorCopy('en'));
    for (const { code } of LOCALES) {
      const c = mirrorCopy(code);
      for (const k of keys) expect(c[k as keyof typeof c], `${code}.${k}`).toBeTruthy();
    }
    expect(mirrorCopy('ar').ownNote).toContain('ليست قراءة من المدرب');
  });
});
