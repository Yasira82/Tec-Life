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
