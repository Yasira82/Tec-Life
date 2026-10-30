/**
 * Awareness (owner, 2026-10-30 — «وعي مدرّب Life»): the talk BFF tells the coach where the person's
 * life is now, read with their session, only while they keep their journey. The page sends its clock.
 */
import { describe, it, expect } from 'vitest';
import { buildAwareness, parseClock, clockNow } from '@/lib/life/awareness';
import type { JourneyEntry } from '@/lib-client/life/journey';

const NOW = new Date('2026-10-30T20:00:00Z');
const entry = (over: Partial<JourneyEntry> = {}): JourneyEntry => ({
  id: 'j1', problem: 'p', understanding: 'u', step: 'Phone in the kitchen at 11', step_outcome: null,
  created_at: '2026-10-25T10:00:00Z',
  days: [{ day: '2026-10-28', answer: 'DONE' }, { day: '2026-10-29', answer: 'NOT_YET' }, { day: '2026-10-30', answer: 'PARTLY' }],
  ...over,
});

describe('the clock the page sends', () => {
  it('an hour, a weekday and a day within a day of ours — or nothing', () => {
    expect(parseClock({ hour: 22, weekday: 4, today: '2026-10-30' }, NOW)).toEqual({ hour: 22, weekday: 4, today: '2026-10-30' });
    expect(parseClock({ hour: 1, weekday: 5, today: '2026-10-31' }, NOW)).not.toBeNull();
    for (const bad of [null, {}, { hour: 24, weekday: 1, today: '2026-10-30' }, { hour: 1, weekday: 7, today: '2026-10-30' },
      { hour: 1, weekday: 1, today: '2026-10-20' }, { hour: 1, weekday: 1, today: 'today' }]) {
      expect(parseClock(bad, NOW)).toBeNull();
    }
    const c = clockNow(new Date(2026, 9, 30, 23, 15));
    expect(c).toEqual({ hour: 23, weekday: 5, today: '2026-10-30' });
  });
});

describe('what the coach is told', () => {
  it('days since the last conversation, the step\'s week from the person\'s day, active goals with their next step', () => {
    const a = buildAwareness({
      entries: [entry()],
      goals: [
        { title: 'Save 500π', status: 'ACTIVE', progress: 120, target_amount: 500, description: '- [x] open wallet\n- [ ] put 20π aside', updated_at: '2026-10-29' },
        { title: 'Old', status: 'COMPLETED', updated_at: '2026-10-30' },
        { title: 'Learn', status: 'ACTIVE', progress: 0, target_amount: null, description: null, updated_at: '2026-10-20' },
      ],
      clock: { hour: 22, weekday: 4, today: '2026-10-30' },
      now: NOW,
    })!;
    expect(a).toEqual({
      hour: 22, weekday: 4, since: 5,
      step: { text: 'Phone in the kitchen at 11', done: 1, partly: 1, notYet: 1, today: 'PARTLY', finished: false },
      goals: [
        { title: 'Save 500π', progress: 120, target: 500, next: 'put 20π aside' },
        { title: 'Learn', progress: 0, target: null, next: null },
      ],
    });
  });

  it('no step after DONE; at most three goals; nothing at all → null', () => {
    const a = buildAwareness({ entries: [entry({ step_outcome: 'DONE' })], goals: Array.from({ length: 5 }, (_, i) => ({ title: `g${i}`, status: 'ACTIVE' })), clock: null, now: NOW })!;
    expect(a.step).toBeUndefined();
    expect(a.goals).toHaveLength(3);
    expect(buildAwareness({ entries: [], goals: [], clock: null, now: NOW })).toBeNull();
  });
});

describe('the person is told', () => {
  it('every language says the coach also sees the step, the goals and the time — and that they are sent', async () => {
    const { sessionCopy } = await import('@/lib/life/session-copy');
    const { LOCALES } = await import('@/lib/i18n/locales');
    for (const { code } of LOCALES) {
      expect(sessionCopy(code).awareNote, code).toBeTruthy();
      if (code !== 'en') expect(sessionCopy(code).awareNote, code).not.toBe(sessionCopy('en').awareNote);
    }
  });
});
