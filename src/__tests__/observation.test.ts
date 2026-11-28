/**
 * The Observation Contract (C0 — owner, 2026-11-28): every Life Intelligence observation carries its
 * records, period, method, independent-day count, evidence status, when it was made and when it expires.
 * Owner review of #135: a Pattern's evidence is counted per group FROM ITS RECORDS — never from numbers
 * the caller passes in.
 */
import { describe, it, expect } from 'vitest';
import {
  makeObservation, independentDays, daysPerGroup, evidenceStatus, reviewAt, isStale, canShow, METHODS,
  PATTERN_MIN_DAYS_PER_GROUP, REVIEW_AFTER_DAYS, type SourceRecord, type MethodKey,
} from '@/lib/life/observation';

const NOW = new Date('2026-11-28T10:00:00.000Z');
const PERIOD = { from: '2026-11-01', to: '2026-11-28' };
const rec = (id: string, day: string, kind: SourceRecord['kind'] = 'step_day', group?: string): SourceRecord =>
  (group === undefined ? { kind, id, day } : { kind, id, day, group });
const day = (n: number) => `2026-11-${String(n).padStart(2, '0')}`;
/** `n` records on `n` different days, in one group, starting at day `start`. */
const groupOf = (group: string, n: number, start: number) =>
  Array.from({ length: n }, (_, i) => rec(`${group}${i}`, day(start + i), 'step_day', group));

const pattern = (records: SourceRecord[]) =>
  makeObservation({ kind: 'pattern', method: 'after_conversation', value: null, now: NOW, period: PERIOD, source_records: records });
const friction = (records: SourceRecord[], method: MethodKey = 'no_steps') =>
  makeObservation({ kind: 'friction', method, value: null, now: NOW, period: PERIOD, source_records: records });

describe('independent days, not answers', () => {
  it('three records on one day are one day', () => {
    expect(independentDays([rec('a', day(20)), rec('b', day(20)), rec('c', day(20))])).toBe(1);
    expect(independentDays([rec('a', day(20)), rec('b', day(21))])).toBe(2);
    expect(independentDays([])).toBe(0);
  });

  it('per group, from the records', () => {
    expect(daysPerGroup([
      rec('a', day(1), 'step_day', 'after'), rec('b', day(1), 'step_day', 'after'), rec('c', day(2), 'step_day', 'after'),
      rec('d', day(3), 'step_day', 'other'),
    ])).toEqual({ after: 2, other: 1 });
  });
});

describe('a Pattern is preliminary only when its RECORDS show 5 days in EVERY group (owner review of #135)', () => {
  it('the minimum is 5, not 4', () => { expect(PATTERN_MIN_DAYS_PER_GROUP).toBe(5); });

  it('5 + 6 days in the records → preliminary, with the counts the records show', () => {
    const o = pattern([...groupOf('after', 5, 1), ...groupOf('other', 6, 10)]);
    expect(o.evidence_status).toBe('preliminary');
    expect(o.group_days).toEqual({ after: 5, other: 6 });
    expect(o.evidence_count).toBe(11);
    expect(canShow(o, NOW)).toBe(true);
  });

  it('one group at 4 → insufficient, never shown', () => {
    const o = pattern([...groupOf('after', 4, 1), ...groupOf('other', 9, 10)]);
    expect(o.evidence_status).toBe('insufficient');
    expect(canShow(o, NOW)).toBe(false);
  });

  it('many answers on few days do not make 5 days', () => {
    // 10 records in "after", but on 2 days only.
    const many = Array.from({ length: 10 }, (_, i) => rec(`m${i}`, day(1 + (i % 2)), 'step_day', 'after'));
    const o = pattern([...many, ...groupOf('other', 6, 10)]);
    expect(o.group_days).toEqual({ after: 2, other: 6 });
    expect(o.evidence_status).toBe('insufficient');
  });

  it('there is no way to pass day counts in: extra input is ignored, the records decide', () => {
    const forged = { kind: 'pattern', method: 'after_conversation', value: null, now: NOW, period: PERIOD,
      groupDays: [5, 6], source_records: [rec('a', day(20), 'step_day', 'after'), rec('b', day(21), 'step_day', 'other')] };
    const o = makeObservation(forged as unknown as Parameters<typeof makeObservation>[0]);
    expect(o.group_days).toEqual({ after: 1, other: 1 });
    expect(o.evidence_status).toBe('insufficient');
    expect(canShow(o, NOW)).toBe(false);
  });

  it('a Pattern record without a group is refused', () => {
    expect(() => pattern([rec('a', day(1))])).toThrow(/no group/);
  });

  it('only the method\u2019s own groups: invented names are refused even with 5 days each (owner review of #135)', () => {
    expect(METHODS.after_conversation.groups).toEqual(['after', 'other']);
    expect(() => pattern([...groupOf('group_a', 5, 1), ...groupOf('group_b', 5, 10)])).toThrow(/not defined for after_conversation/);
    expect(() => pattern([...groupOf('after', 5, 1), ...groupOf('other', 5, 10), rec('x', day(20), 'step_day', 'third')])).toThrow(/not defined/);
  });

  it('a defined group with no records counts as 0 days — insufficient, never shown', () => {
    const o = pattern(groupOf('after', 9, 1));
    expect(o.group_days).toEqual({ after: 9, other: 0 });
    expect(o.evidence_status).toBe('insufficient');
    expect(canShow(o, NOW)).toBe(false);
  });

  it('a group on a non-Pattern record is refused', () => {
    expect(() => friction([rec('a', day(1), 'goal', 'after')])).toThrow(/group outside a pattern/);
  });

  it('only the two statuses exist; no percentage, no "stable"', () => {
    const o = pattern([...groupOf('after', 5, 1), ...groupOf('other', 5, 10)]);
    expect(['insufficient', 'preliminary']).toContain(o.evidence_status);
    expect(Object.keys(o).sort()).toEqual(['evidence_count', 'evidence_status', 'generated_at', 'group_days', 'kind', 'method', 'period', 'review_at', 'source_records', 'value']);
  });
});

describe('evidenceStatus refuses what is not a day count', () => {
  it.each([[[5, 6], 'preliminary'], [[5, 5, 5], 'preliminary'], [[4, 9], 'insufficient'], [[9], 'insufficient'], [[], 'insufficient']])(
    '%j → %s', (groups, status) => { expect(evidenceStatus(groups as number[])).toBe(status); });
  it.each([[[5, NaN]], [[5, -1]], [[5, 5.5]], [[5, Infinity]]])('%j → refused', (groups) => {
    expect(() => evidenceStatus(groups as number[])).toThrow(/not a day count/);
  });
  it('the minimum cannot be lowered by the caller (owner review of #135)', () => {
    expect(evidenceStatus.length).toBe(1);
    const lowered = (evidenceStatus as unknown as (g: number[], min: number) => string)([2, 2], 0);
    expect(lowered).toBe('insufficient');
  });
});

describe('method — a closed list, each with its definition in plain words', () => {
  it('every method has a kind and a definition', () => {
    for (const [key, m] of Object.entries(METHODS)) {
      expect(['pattern', 'friction', 'memory']).toContain(m.kind);
      expect(m.definition.length, key).toBeGreaterThan(20);
    }
  });
  it('the four Friction rules the current data supports, and one fixed Pattern comparison', () => {
    const of = (k: string) => Object.entries(METHODS).filter(([, m]) => m.kind === k).map(([key]) => key).sort();
    expect(of('friction')).toEqual(['measure_without_followup', 'no_steps', 'not_yet_3_in_a_row', 'steps_none_ticked']);
    expect(of('pattern')).toEqual(['after_conversation']);
  });
  it('after_conversation groups by DATE, whatever the answer; "done" is what is compared (owner, 28 Nov)', () => {
    const d = METHODS.after_conversation.definition;
    expect(d).toMatch(/^Groups by date, whatever the answer:/);
    expect(d).toContain('`after` = answered days that are the day immediately after a day a summary was kept');
    expect(d).toContain('`other` = every other answered day');
    expect(d).toContain('Compared: the days answered "done" in each group');
    expect(d).toContain('derived by C2 from the source dates, never passed in');
    // The earlier wording put "done" into the group itself; it must not come back.
    expect(d).not.toMatch(/^Days the step was fully done/);
  });
  it('an unknown method, or one of another kind, is refused', () => {
    expect(() => makeObservation({ kind: 'friction', method: 'made_up' as MethodKey, value: null, now: NOW, period: PERIOD, source_records: [rec('a', day(1))] })).toThrow(/unknown method/);
    expect(() => makeObservation({ kind: 'friction', method: 'helped', value: null, now: NOW, period: PERIOD, source_records: [rec('a', day(1))] })).toThrow(/not a friction method/);
  });
});

describe('review and expiry', () => {
  it('Patterns and Friction expire after 7 days; Memory never', () => {
    expect(REVIEW_AFTER_DAYS).toBe(7);
    expect(reviewAt('pattern', NOW)).toBe('2026-12-05T10:00:00.000Z');
    expect(reviewAt('friction', NOW)).toBe('2026-12-05T10:00:00.000Z');
    expect(reviewAt('memory', NOW)).toBeNull();
  });

  it('a stale observation is never shown as current', () => {
    const o = friction([rec('g', day(20), 'goal')]);
    expect(isStale(o, new Date('2026-12-05T09:59:59.999Z'))).toBe(false);
    expect(isStale(o, new Date('2026-12-05T10:00:00.000Z'))).toBe(true);
    expect(canShow(o, new Date('2026-12-06T00:00:00.000Z'))).toBe(false);
  });

  it('an unreadable clock or review time counts as stale (when in doubt, not current)', () => {
    const o = friction([rec('g', day(20), 'goal')]);
    expect(isStale(o, new Date('nonsense'))).toBe(true);
    expect(isStale({ review_at: 'nonsense' }, NOW)).toBe(true);
  });

  it('Memory is a record of the past: never stale', () => {
    const o = makeObservation({ kind: 'memory', method: 'helped', value: null, now: NOW, period: { from: day(12), to: day(12) }, source_records: [rec('s', day(12), 'summary')] });
    expect(o.review_at).toBeNull();
    expect(o.group_days).toBeNull();
    expect(canShow(o, new Date('2030-01-01T00:00:00Z'))).toBe(true);
  });

  it('Friction and Memory are "preliminary" — a reading of records, with no minimum', () => {
    expect(friction([rec('g', day(28), 'goal')]).evidence_status).toBe('preliminary');
  });
});

describe('makeObservation refuses what would say more than the records', () => {
  const base = { kind: 'friction' as const, method: 'no_steps' as const, value: null, now: NOW, period: PERIOD };
  it.each([
    ['no records', { ...base, source_records: [] }],
    ['a record after the period', { ...base, source_records: [rec('a', '2026-11-29')] }],
    ['a record before the period', { ...base, source_records: [rec('a', '2026-10-31')] }],
    ['a day that is not real', { ...base, source_records: [rec('a', '2026-02-30')] }],
    ['a period backwards', { ...base, period: { from: day(28), to: day(15) }, source_records: [rec('a', day(20))] }],
    ['a clock that is not a real time', { ...base, now: new Date('nonsense'), source_records: [rec('a', day(20))] }],
  ])('%s', (_name, input) => { expect(() => makeObservation(input)).toThrow(); });
});

describe('records', () => {
  it('newest first; the caller’s array and records are not changed', () => {
    const input = [rec('old', day(16)), rec('new', day(27)), rec('mid', day(20))];
    const o = friction(input);
    expect(o.source_records.map((r) => r.id)).toEqual(['new', 'mid', 'old']);
    expect(input.map((r) => r.id)).toEqual(['old', 'new', 'mid']);
    expect(o.source_records[0]).not.toBe(input[1]);
  });

  it('generated_at is the clock it was given', () => {
    expect(friction([rec('a', day(20))]).generated_at).toBe(NOW.toISOString());
  });
});
