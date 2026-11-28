/**
 * The redesign's My goals — the bodies it sends (Phase 1, owner 2026-11-28). Only the existing
 * routes and fields; only what changed; nothing the person typed or ticked is lost.
 */
import { describe, it, expect } from 'vitest';
import { createBody, draftOf, emptyDraft, patchBody, shareOf, splitGoals } from '@/lib/life/goals-edit';
import type { Goal } from '@/lib-client/life/useLife';

const goal = (over: Partial<Goal>): Goal => ({
  id: 'g', title: 'Save for a phone', description: null, status: 'ACTIVE', target_date: null, target_amount: null,
  progress: 0, area: null, created_at: '2026-11-01T00:00:00.000Z', updated_at: '2026-11-01T00:00:00.000Z', ...over,
});

describe('createBody', () => {
  it('needs a name', () => {
    expect(createBody({ ...emptyDraft(), title: '   ' })).toEqual({ ok: false, problem: 'no_title' });
  });
  it('a π target must be a number above 0', () => {
    expect(createBody({ ...emptyDraft(), title: 'x', target: 'abc' })).toEqual({ ok: false, problem: 'bad_target' });
    expect(createBody({ ...emptyDraft(), title: 'x', target: '-2' })).toEqual({ ok: false, problem: 'bad_target' });
    expect(createBody({ ...emptyDraft(), title: 'x', target: '2,5' })).toMatchObject({ ok: true, target: 2.5 });
  });
  it('only a money goal (or one with no area) carries a target', () => {
    expect(createBody({ title: 'Walk', area: 'HEALTH', target: '10', steps: '' })).toEqual({ ok: true, title: 'Walk', area: 'HEALTH' });
  });
  it('steps: cleaned, one per line, at most five, saved as the checklist', () => {
    const b = createBody({ title: 'x', area: '', target: '', steps: '- [ ] one\n\n two \nthree\nfour\nfive\nsix' });
    expect(b).toMatchObject({ ok: true, description: '- [ ] one\n- [ ] two\n- [ ] three\n- [ ] four\n- [ ] five' });
  });
});

describe('patchBody — only what changed', () => {
  it('nothing changed → an empty patch', () => {
    const g = goal({ description: 'my note\n- [x] one\n- [ ] two', target_amount: 10, area: 'MONEY' });
    expect(patchBody(g, draftOf(g))).toEqual({ ok: true, patch: {} });
  });
  it('a renamed goal sends the title only', () => {
    const g = goal({});
    expect(patchBody(g, { ...draftOf(g), title: 'Save 10π' })).toEqual({ ok: true, patch: { title: 'Save 10π' } });
  });
  it('a step that keeps its text keeps its tick, and the note above the steps stays', () => {
    const g = goal({ description: 'my note\n- [x] one\n- [ ] two' });
    const r = patchBody(g, { ...draftOf(g), steps: 'one\ntwo\nthree' });
    expect(r).toEqual({ ok: true, patch: { description: 'my note\n- [x] one\n- [ ] two\n- [ ] three' } });
  });
  it('emptying the target clears it; moving out of money leaves it untouched', () => {
    const g = goal({ target_amount: 10, area: 'MONEY' });
    expect(patchBody(g, { ...draftOf(g), target: '' })).toEqual({ ok: true, patch: { target_amount: null } });
    expect(patchBody(g, { ...draftOf(g), area: 'HEALTH' })).toEqual({ ok: true, patch: { area: 'HEALTH' } });
  });
  it('refuses an empty name or a bad target', () => {
    const g = goal({});
    expect(patchBody(g, { ...draftOf(g), title: '' })).toEqual({ ok: false, problem: 'no_title' });
    expect(patchBody(g, { ...draftOf(g), target: '0' })).toEqual({ ok: false, problem: 'bad_target' });
  });
});

describe('splitGoals', () => {
  const a = goal({ id: 'a', target_amount: 10, progress: 8, area: 'MONEY' });
  const b = goal({ id: 'b', area: 'HEALTH', updated_at: '2026-11-20T00:00:00.000Z' });
  const c = goal({ id: 'c', area: 'MONEY', updated_at: '2026-11-10T00:00:00.000Z' });
  const d = goal({ id: 'd', status: 'DONE' });

  it('the priority is shown once, never again in the list; finished goals apart', () => {
    const s = splitGoals([a, b, c, d], 'ALL');
    expect(s.priority?.id).toBe('a');
    expect(s.others.map((x) => x.id)).toEqual(['b', 'c']);
    expect(s.done.map((x) => x.id)).toEqual(['d']);
    expect(s.areas.sort()).toEqual(['HEALTH', 'MONEY']);
  });
  it('the filter narrows the list only', () => {
    expect(splitGoals([a, b, c, d], 'HEALTH').others.map((x) => x.id)).toEqual(['b']);
  });
});

describe('shareOf', () => {
  it('of the target, else of the steps, else none', () => {
    expect(shareOf(goal({ target_amount: 10, progress: 4 }))).toBe(0.4);
    expect(shareOf(goal({ target_amount: 10, progress: 40 }))).toBe(1);
    expect(shareOf(goal({ description: '- [x] a\n- [ ] b' }))).toBe(0.5);
    expect(shareOf(goal({}))).toBeNull();
  });
});
