/**
 * The redesign's Today — its decisions (Phase 1, owner 2026-11-28). The coach button may promise
 * only what the coach really receives (talk route: memory only while the journey is kept), and the
 * goal on Today is the one closest to done, never a finished one.
 */
import { describe, it, expect } from 'vitest';
import { closestGoal, coachState, partOfDay } from '@/lib/life/today';
import type { Goal } from '@/lib-client/life/useLife';
import type { Journey, JourneyEntry } from '@/lib-client/life/journey';
import type { Conversations } from '@/lib-client/life/conversations';

const entry = (problem: string) => ({ id: 'e1', problem, understanding: 'u', step: 's', step_outcome: null, created_at: '2026-11-27T10:00:00.000Z' }) as unknown as JourneyEntry;
const journey = (keeping: boolean, entries: JourneyEntry[] = []): Journey => ({ keeping, entries });
const convs = (keeping: boolean, readable = true): Conversations => ({
  keeping, configured: true,
  conversations: [{ id: 'c1', message_count: 3, created_at: '', updated_at: '', preview: 'p', readable }],
});

describe('coachState — what the coach button may promise', () => {
  it('journey unreadable → promises nothing about memory', () => {
    expect(coachState(null, convs(true))).toEqual({ memory: 'unknown', topic: null, canContinue: true });
  });
  it('journey not kept → every conversation starts fresh', () => {
    expect(coachState(journey(false), null).memory).toBe('off');
  });
  it('kept but empty → first conversation', () => {
    expect(coachState(journey(true), null).memory).toBe('first');
  });
  it('kept with a summary → remembers, naming the newest problem in their own words', () => {
    expect(coachState(journey(true, [entry('  My Pi is gone on arrival '), entry('older')]), null))
      .toEqual({ memory: 'saved', topic: 'My Pi is gone on arrival', canContinue: false });
  });
  it('a conversation can be reopened only when full conversations are kept and one is readable', () => {
    expect(coachState(journey(true), convs(false)).canContinue).toBe(false);
    expect(coachState(journey(true), convs(true, false)).canContinue).toBe(false);
    expect(coachState(journey(true), convs(true, true)).canContinue).toBe(true);
  });
  it('journey off never claims memory, even with conversations kept', () => {
    const st = coachState(journey(false, [entry('x')]), convs(true));
    expect(st.memory).toBe('off');
    expect(st.topic).toBeNull();
  });
});

const goal = (over: Partial<Goal>): Goal => ({
  id: 'g', title: 't', description: null, status: 'ACTIVE', target_date: null, target_amount: null,
  progress: 0, created_at: '2026-11-01T00:00:00.000Z', updated_at: '2026-11-01T00:00:00.000Z', ...over,
});

describe('closestGoal', () => {
  it('no active goal → none (DONE and ARCHIVED never count)', () => {
    expect(closestGoal([goal({ status: 'DONE' }), goal({ status: 'ARCHIVED' })])).toBeNull();
    expect(closestGoal([])).toBeNull();
  });
  it('a π target wins, by the largest share done, and a completed target is skipped', () => {
    const a = goal({ id: 'a', target_amount: 10, progress: 4 });
    const b = goal({ id: 'b', target_amount: 10, progress: 8 });
    const full = goal({ id: 'full', target_amount: 5, progress: 5 });
    expect(closestGoal([a, full, b])?.id).toBe('b');
  });
  it('else steps, by the share ticked', () => {
    const a = goal({ id: 'a', description: '- [x] one\n- [ ] two\n- [ ] three' });
    const b = goal({ id: 'b', description: '- [x] one\n- [ ] two' });
    expect(closestGoal([a, b])?.id).toBe('b');
  });
  it('else the most recently touched', () => {
    const a = goal({ id: 'a', updated_at: '2026-11-02T00:00:00.000Z' });
    const b = goal({ id: 'b', updated_at: '2026-11-20T00:00:00.000Z' });
    expect(closestGoal([a, b])?.id).toBe('b');
  });
});

describe('partOfDay', () => {
  it.each([[4, 'evening'], [5, 'morning'], [11, 'morning'], [12, 'afternoon'], [16, 'afternoon'], [17, 'evening'], [23, 'evening']] as const)(
    '%i h → %s', (h, p) => { expect(partOfDay(h)).toBe(p); });
});
