/**
 * The Life hooks (lib-client/life/useLife.ts) — goals, skills, trajectory,
 * preferences, consent, intent, purge, subscription, activity.
 *
 * None of these had a unit test: the screens were tested, the hooks were
 * exercised only through them. Pinned here, per hook: the BFF path it reads,
 * the shape it hands the screen, that a write goes through the BFF and is
 * followed by a fresh read (or rolled back to the server's truth on a
 * refusal), and that a failed read fails closed — to nothing, never to a stale
 * or invented value.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import {
  useGoals, useSkills, useTrajectory, usePreferences, useConsent, useIntent, purgeLifeData, useSubscription, useActivity,
  LIFE_DATA_CATEGORIES,
} from '@/lib-client/life/useLife';

type Call = [RequestInfo | URL, RequestInit | undefined];
const respond = (answer: (url: string, init?: RequestInit) => [number, unknown]) =>
  vi.fn(async (u: RequestInfo | URL, init?: RequestInit) => {
    const [status, body] = answer(String(u), init);
    return { ok: status < 400, status, json: async () => body } as Response;
  });
const calls  = (f: ReturnType<typeof respond>) => f.mock.calls as unknown as Call[];
const writes = (f: ReturnType<typeof respond>) => calls(f).filter((c) => c[1]?.method && c[1].method !== 'GET');
const reads  = (f: ReturnType<typeof respond>) => calls(f).filter((c) => !c[1]?.method || c[1].method === 'GET');
const ok = (data: unknown): [number, unknown] => [200, { success: true, data }];

afterEach(() => vi.unstubAllGlobals());

const goal = { id: 'g1', title: 'Save', description: null, status: 'ACTIVE' as const, target_date: null, target_amount: 10, progress: 2, created_at: 'x', updated_at: 'x' };

describe('useGoals', () => {
  it('reads the caller\'s goals and hands them over', async () => {
    const f = respond(() => ok({ goals: [goal] })); vi.stubGlobal('fetch', f);
    const { result } = renderHook(() => useGoals());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(String(calls(f)[0]?.[0])).toBe('/api/bff/life/goals');
    expect(result.current.goals).toEqual([goal]);
  });

  it('every write goes through the BFF and is followed by a fresh read', async () => {
    const f = respond((u, i) => i?.method && i.method !== 'GET' ? ok({ goal }) : ok({ goals: [goal] })); vi.stubGlobal('fetch', f);
    const { result } = renderHook(() => useGoals());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.addGoal('Save', 10); });
    await act(async () => { await result.current.addGoal('Just a goal'); });
    await act(async () => { await result.current.addProgress('g1', 2.5); });
    await act(async () => { await result.current.setStatus('g1', 'DONE'); });
    await act(async () => { await result.current.removeGoal('g1'); });

    const w = writes(f);
    expect(w.map((c) => [String(c[0]), c[1]?.method])).toEqual([
      ['/api/bff/life/goals', 'POST'], ['/api/bff/life/goals', 'POST'],
      ['/api/bff/life/goals/g1/progress', 'POST'], ['/api/bff/life/goals/g1', 'PATCH'], ['/api/bff/life/goals/g1', 'DELETE'],
    ]);
    expect(JSON.parse(String(w[0]?.[1]?.body))).toEqual({ title: 'Save', target_amount: 10 });
    expect(JSON.parse(String(w[1]?.[1]?.body))).toEqual({ title: 'Just a goal' }); // no target → no key, not 0
    expect(JSON.parse(String(w[2]?.[1]?.body))).toEqual({ delta: 2.5 });
    expect(JSON.parse(String(w[3]?.[1]?.body))).toEqual({ status: 'DONE' });
    expect(reads(f)).toHaveLength(6); // one first read + one after each of five writes
    expect(result.current.busy).toBe(false);
  });

  it('a refused write surfaces the sentence; a failed read fails closed to nothing', async () => {
    const f = respond((u, i) => i?.method === 'POST' ? [409, { error: 'Goal cap reached' }] : ok({ goals: [] })); vi.stubGlobal('fetch', f);
    const { result } = renderHook(() => useGoals());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.addGoal('One more'); });
    expect(result.current.error).toBe('Goal cap reached');

    vi.stubGlobal('fetch', respond(() => [500, {}]));
    const r2 = renderHook(() => useGoals());
    await waitFor(() => expect(r2.result.current.loading).toBe(false));
    expect(r2.result.current.goals).toEqual([]);
    expect(r2.result.current.error).toBe('Request failed (500)');
  });
});

describe('useSkills', () => {
  const skill = { id: 's1', name: 'Design', level: 'LEARNING' as const, source: 'SELF_DECLARED' as const, note: null, created_at: 'x', updated_at: 'x' };

  it('reads, adds (with and without a level), raises, removes — each followed by a read', async () => {
    const f = respond((u, i) => i?.method && i.method !== 'GET' ? ok({ skill }) : ok({ skills: [skill] })); vi.stubGlobal('fetch', f);
    const { result } = renderHook(() => useSkills());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.skills).toEqual([skill]);
    await act(async () => { await result.current.addSkill('Design'); });
    await act(async () => { await result.current.addSkill('Design', 'EXPERT'); });
    await act(async () => { await result.current.setLevel('s1', 'PRACTISING'); });
    await act(async () => { await result.current.removeSkill('s1'); });
    const w = writes(f);
    expect(w.map((c) => [String(c[0]), c[1]?.method])).toEqual([
      ['/api/bff/life/skills', 'POST'], ['/api/bff/life/skills', 'POST'], ['/api/bff/life/skills/s1', 'PATCH'], ['/api/bff/life/skills/s1', 'DELETE'],
    ]);
    expect(JSON.parse(String(w[0]?.[1]?.body))).toEqual({ name: 'Design' });
    expect(JSON.parse(String(w[1]?.[1]?.body))).toEqual({ name: 'Design', level: 'EXPERT' });
    expect(JSON.parse(String(w[2]?.[1]?.body))).toEqual({ level: 'PRACTISING' });
    expect(reads(f)).toHaveLength(5);
  });

  it('a refused write and a failed read', async () => {
    const f = respond((u, i) => i?.method === 'PATCH' ? [422, { error: 'Not on the ladder' }] : ok({ skills: [] })); vi.stubGlobal('fetch', f);
    const { result } = renderHook(() => useSkills());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.setLevel('s1', 'EXPERT'); });
    expect(result.current.error).toBe('Not on the ladder');
    vi.stubGlobal('fetch', respond(() => [503, { error: 'Service unavailable' }]));
    const r2 = renderHook(() => useSkills());
    await waitFor(() => expect(r2.result.current.error).toBe('Service unavailable'));
    expect(r2.result.current.skills).toEqual([]);
  });
});

describe('useTrajectory', () => {
  it('asks for the window and hands the pace over; a failure is null, not a guess', async () => {
    const traj = { window_days: 14, entries: 3, active_days: 2, pi_logged: 5, pi_per_week: 17.5, first_entry_at: 'x', completed_in_window: 0, projectable: true, goals: [] };
    const f = respond(() => ok({ trajectory: traj })); vi.stubGlobal('fetch', f);
    const { result } = renderHook(() => useTrajectory(14));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(String(calls(f)[0]?.[0])).toBe('/api/bff/life/trajectory?window_days=14');
    expect(result.current.trajectory).toEqual(traj);

    vi.stubGlobal('fetch', respond(() => [500, {}]));
    const r2 = renderHook(() => useTrajectory());
    await waitFor(() => expect(r2.result.current.loading).toBe(false));
    expect(r2.result.current.trajectory).toBeNull();
  });
});

describe('usePreferences', () => {
  it('reads, saves optimistically, and settles on what the server stored', async () => {
    const f = respond((u, i) => i?.method === 'PUT' ? ok({ preferences: { focus: 'Saving', language: 'en' } }) : ok({ preferences: { focus: 'Building' } })); vi.stubGlobal('fetch', f);
    const { result } = renderHook(() => usePreferences());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.prefs).toEqual({ focus: 'Building' });
    await act(async () => { await result.current.save({ focus: 'Saving' }); });
    expect(JSON.parse(String(writes(f)[0]?.[1]?.body))).toEqual({ preferences: { focus: 'Saving' } });
    expect(result.current.prefs).toEqual({ focus: 'Saving', language: 'en' });
    expect(result.current.saving).toBe(false);
  });

  it('a refused save rolls back to the server\'s truth', async () => {
    const f = respond((u, i) => i?.method === 'PUT' ? [400, { error: 'Unknown preference' }] : ok({ preferences: { focus: 'Building' } })); vi.stubGlobal('fetch', f);
    const { result } = renderHook(() => usePreferences());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.save({ focus: 'Nope' }); });
    await waitFor(() => expect(result.current.prefs).toEqual({ focus: 'Building' }));
    expect(reads(f)).toHaveLength(2); // the rollback read — which also clears the error, so the
                                      // refusal is not shown; pinned as it is, not as it should be
    expect(result.current.saving).toBe(false);
  });

  it('a failed read keeps an empty map and the sentence', async () => {
    vi.stubGlobal('fetch', respond(() => [500, {}]));
    const { result } = renderHook(() => usePreferences());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.prefs).toEqual({});
    expect(result.current.error).toBe('Request failed (500)');
  });
});

describe('useConsent', () => {
  const entries = LIFE_DATA_CATEGORIES.map((category) => ({ category, granted: false, updated_at: null }));

  it('lists every category including BUDGET, grants through the BFF, and settles on the server\'s answer', async () => {
    const f = respond((u, i) => i?.method === 'PUT'
      ? ok({ consent: entries.map((e) => e.category === 'BUDGET' ? { ...e, granted: true, updated_at: 'now' } : e) })
      : ok({ consent: entries })); vi.stubGlobal('fetch', f);
    const { result } = renderHook(() => useConsent());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.consent.map((c) => c.category)).toContain('BUDGET');
    await act(async () => { await result.current.grant('BUDGET', true); });
    expect(JSON.parse(String(writes(f)[0]?.[1]?.body))).toEqual({ consent: { BUDGET: true } });
    expect(result.current.consent.find((c) => c.category === 'BUDGET')?.granted).toBe(true);
  });

  it('a refused grant rolls the switch back to the server\'s truth', async () => {
    const f = respond((u, i) => i?.method === 'PUT' ? [500, { error: 'Could not save' }] : ok({ consent: entries })); vi.stubGlobal('fetch', f);
    const { result } = renderHook(() => useConsent());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.grant('GOALS', true); });
    await waitFor(() => expect(result.current.consent.find((c) => c.category === 'GOALS')?.granted).toBe(false));
    expect(result.current.error).toBe('Could not save');
  });

  it('a failed read shows NO switches — a switch drawn OFF because a fetch failed is a lie about a permission', async () => {
    vi.stubGlobal('fetch', respond(() => [503, {}]));
    const { result } = renderHook(() => useConsent());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.consent).toEqual([]);
    expect(result.current.error).toBeTruthy();
  });
});

describe('useIntent · purgeLifeData', () => {
  it('reads the live window; a failure is null', async () => {
    vi.stubGlobal('fetch', respond(() => ok({ intent: { signals: [], intent: 'GOAL_CREATED', expires_in: 900 } })));
    const { result } = renderHook(() => useIntent());
    await waitFor(() => expect(result.current?.intent).toBe('GOAL_CREATED'));
    vi.stubGlobal('fetch', respond(() => [500, {}]));
    const r2 = renderHook(() => useIntent());
    await new Promise((r) => setTimeout(r, 0));
    expect(r2.result.current).toBeNull();
  });

  it('purge DELETEs /life/data and reports the counts, budgets included', async () => {
    const f = respond(() => ok({ purged: true, deleted: { goals: 3, skills: 2, preferences: 1, budgets: 2, consents: 4 } })); vi.stubGlobal('fetch', f);
    expect(await purgeLifeData()).toEqual({ goals: 3, skills: 2, preferences: 1, budgets: 2, consents: 4 });
    expect(String(calls(f)[0]?.[0])).toBe('/api/bff/life/data');
    expect(calls(f)[0]?.[1]?.method).toBe('DELETE');
    vi.stubGlobal('fetch', respond(() => ok({})));
    expect(await purgeLifeData()).toEqual({ goals: 0, skills: 0, preferences: 0, budgets: 0, consents: 0 });
  });
});

describe('useSubscription — fails closed to FREE', () => {
  const sub = (s: Record<string, unknown>) => ok({ subscription: s });

  it('an active plan with days remaining', async () => {
    vi.stubGlobal('fetch', respond(() => sub({ plan: 'PRO', isActive: true, isExpired: false, daysRemaining: 12 })));
    const { result } = renderHook(() => useSubscription());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current).toMatchObject({ plan: 'PRO', daysRemaining: 12, isExpired: false });
  });

  it('expired or inactive reads as FREE; days are computed from the period end when not given', async () => {
    vi.stubGlobal('fetch', respond(() => sub({ plan: 'PRO', isExpired: true })));
    const a = renderHook(() => useSubscription());
    await waitFor(() => expect(a.result.current.loading).toBe(false));
    expect(a.result.current.plan).toBe('FREE');
    expect(a.result.current.isExpired).toBe(true);

    const end = new Date(Date.now() + 3 * 86_400_000).toISOString();
    vi.stubGlobal('fetch', respond(() => sub({ plan: 'PRO', isActive: false, current_period_end: end })));
    const b = renderHook(() => useSubscription());
    await waitFor(() => expect(b.result.current.loading).toBe(false));
    expect(b.result.current.plan).toBe('FREE');
    expect(b.result.current.daysRemaining).toBe(3);
  });

  it('a failed read is no plan at all — never an invented one', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('down'); }));
    const { result } = renderHook(() => useSubscription());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.plan).toBeNull();
    expect(result.current.daysRemaining).toBeNull();
  });
});

describe('useActivity', () => {
  const ev = { id: 'e1', type: 'payment.completed', payload: { amount: 1 }, created_at: 'x' };

  it('accepts the list bare or under data, asks for the limit, and fails closed', async () => {
    const f = respond(() => [200, { data: [ev] }]); vi.stubGlobal('fetch', f);
    const a = renderHook(() => useActivity(3));
    await waitFor(() => expect(a.result.current.loading).toBe(false));
    expect(String(calls(f)[0]?.[0])).toBe('/api/bff/life/activity?limit=3');
    expect(a.result.current.events).toEqual([ev]);

    vi.stubGlobal('fetch', respond(() => [200, { data: { data: [ev] } }]));
    const b = renderHook(() => useActivity());
    await waitFor(() => expect(b.result.current.events).toEqual([ev]));

    vi.stubGlobal('fetch', respond(() => [500, {}]));
    const c = renderHook(() => useActivity());
    await waitFor(() => expect(c.result.current.loading).toBe(false));
    expect(c.result.current.events).toEqual([]);
    expect(c.result.current.error).toBe('Request failed (500)');
  });
});
