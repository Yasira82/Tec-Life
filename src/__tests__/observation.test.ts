/**
 * The Observation Contract (C0 — owner, 2026-11-28): every Life Intelligence observation carries its
 * records, period, method, independent-day count, evidence status, when it was made and when it expires.
 */
import { describe, it, expect } from 'vitest';
import {
  makeObservation, independentDays, evidenceStatus, reviewAt, isStale, canShow,
  PATTERN_MIN_DAYS_PER_GROUP, REVIEW_AFTER_DAYS, type SourceRecord,
} from '@/lib/life/observation';

const NOW = new Date('2026-11-28T10:00:00.000Z');
const rec = (id: string, day: string, kind: SourceRecord['kind'] = 'step_day'): SourceRecord => ({ kind, id, day });
const PERIOD = { from: '2026-11-15', to: '2026-11-28' };

describe('independent days, not answers', () => {
  it('three records on one day are one day', () => {
    expect(independentDays([rec('a', '2026-11-20'), rec('b', '2026-11-20'), rec('c', '2026-11-20')])).toBe(1);
    expect(independentDays([rec('a', '2026-11-20'), rec('b', '2026-11-21')])).toBe(2);
    expect(independentDays([])).toBe(0);
  });

  it('evidence_count is computed from the records, never passed in', () => {
    const o = makeObservation({
      kind: 'friction', method: 'not_yet_3_in_a_row', value: null, now: NOW, period: PERIOD,
      source_records: [rec('a', '2026-11-26'), rec('b', '2026-11-27'), rec('c', '2026-11-27')],
    });
    expect(o.evidence_count).toBe(2);
  });
});

describe('evidence status — the owner’s minimum is 5 days in EVERY group', () => {
  it('the minimum is 5, not 4', () => { expect(PATTERN_MIN_DAYS_PER_GROUP).toBe(5); });
  it.each([
    [[5, 6], 'preliminary'],
    [[5, 5], 'preliminary'],
    [[4, 9], 'insufficient'],   // one group short → the whole comparison is
    [[9, 4], 'insufficient'],
    [[0, 0], 'insufficient'],
    [[], 'insufficient'],
  ])('%j → %s', (groups, status) => { expect(evidenceStatus(groups as number[])).toBe(status); });

  it('never a percentage, never "stable": only the two statuses exist', () => {
    const o = makeObservation({
      kind: 'pattern', method: 'after_conversation', value: null, now: NOW, period: PERIOD, groupDays: [5, 6],
      source_records: [rec('a', '2026-11-20')],
    });
    expect(['insufficient', 'preliminary']).toContain(o.evidence_status);
    expect(Object.keys(o).sort()).toEqual(['evidence_count', 'evidence_status', 'generated_at', 'kind', 'method', 'period', 'review_at', 'source_records', 'value']);
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
    const o = makeObservation({
      kind: 'friction', method: 'no_steps', value: null, now: NOW, period: PERIOD, source_records: [rec('g', '2026-11-20', 'goal')],
    });
    expect(isStale(o, new Date('2026-12-05T09:59:59.999Z'))).toBe(false);
    expect(isStale(o, new Date('2026-12-05T10:00:00.000Z'))).toBe(true);
    expect(canShow(o, new Date('2026-12-06T00:00:00.000Z'))).toBe(false);
  });

  it('Memory is a record of the past: never stale', () => {
    const o = makeObservation({
      kind: 'memory', method: 'helped', value: null, now: NOW, period: { from: '2026-11-12', to: '2026-11-12' },
      source_records: [rec('s', '2026-11-12', 'summary')],
    });
    expect(o.review_at).toBeNull();
    expect(canShow(o, new Date('2030-01-01T00:00:00Z'))).toBe(true);
  });
});

describe('canShow — no Pattern without enough evidence', () => {
  const pattern = (groupDays: number[]) => makeObservation({
    kind: 'pattern', method: 'after_conversation', value: null, now: NOW, period: PERIOD, groupDays,
    source_records: [rec('a', '2026-11-20')],
  });
  it('preliminary and current → shown', () => { expect(canShow(pattern([5, 6]), NOW)).toBe(true); });
  it('insufficient → never shown', () => { expect(canShow(pattern([4, 6]), NOW)).toBe(false); });
  it('a Friction point needs no minimum, but still expires', () => {
    const f = makeObservation({ kind: 'friction', method: 'no_steps', value: null, now: NOW, period: PERIOD, source_records: [rec('g', '2026-11-28', 'goal')] });
    expect(canShow(f, NOW)).toBe(true);
  });
});

describe('makeObservation refuses what would say more than the records', () => {
  const base = { kind: 'friction' as const, method: 'no_steps', value: null, now: NOW, period: PERIOD };
  it.each([
    ['no records', { ...base, source_records: [] }],
    ['no method', { ...base, method: '', source_records: [rec('a', '2026-11-20')] }],
    ['a record outside the period', { ...base, source_records: [rec('a', '2026-11-29')] }],
    ['a record before the period', { ...base, source_records: [rec('a', '2026-11-14')] }],
    ['a day that is not real', { ...base, source_records: [rec('a', '2026-02-30')] }],
    ['a period backwards', { ...base, period: { from: '2026-11-28', to: '2026-11-15' }, source_records: [rec('a', '2026-11-20')] }],
    ['a pattern with one group', { ...base, kind: 'pattern' as const, groupDays: [7], source_records: [rec('a', '2026-11-20')] }],
    ['a pattern with no groups', { ...base, kind: 'pattern' as const, source_records: [rec('a', '2026-11-20')] }],
  ])('%s', (_name, input) => { expect(() => makeObservation(input)).toThrow(); });
});

describe('records', () => {
  it('newest first, and the caller’s array is not reordered', () => {
    const input = [rec('old', '2026-11-16'), rec('new', '2026-11-27'), rec('mid', '2026-11-20')];
    const o = makeObservation({ kind: 'friction', method: 'no_steps', value: null, now: NOW, period: PERIOD, source_records: input });
    expect(o.source_records.map((r) => r.id)).toEqual(['new', 'mid', 'old']);
    expect(input.map((r) => r.id)).toEqual(['old', 'new', 'mid']);
  });

  it('generated_at is the clock it was given', () => {
    const o = makeObservation({ kind: 'friction', method: 'no_steps', value: null, now: NOW, period: PERIOD, source_records: [rec('a', '2026-11-20')] });
    expect(o.generated_at).toBe(NOW.toISOString());
  });
});
