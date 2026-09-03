import { describe, it, expect } from 'vitest';
import { pickFocusGoal, goalPercent } from '@/lib-client/life/focus';
import type { Goal } from '@/lib-client/life/useLife';

// The Home screen shows exactly ONE goal. Which one is the only real decision
// in the redesign that replaced Home's four navigation cards — the ones that
// duplicated the tab bar — with the user's actual state.

const g = (p: Partial<Goal> & { id: string }): Goal => ({
  title: p.id, description: null, status: 'ACTIVE', target_date: null,
  target_amount: null, progress: 0, created_at: '', updated_at: '', ...p,
});

describe('pickFocusGoal', () => {
  it('picks the goal closest to done, not the biggest or the newest', () => {
    const goals = [
      g({ id: 'big',   target_amount: 1000, progress: 300 }), // 30%, largest π
      g({ id: 'near',  target_amount: 10,   progress: 9   }), // 90%
      g({ id: 'fresh', target_amount: 50,   progress: 5   }), // 10%, added last
    ];
    expect(pickFocusGoal(goals)?.id).toBe('near');
  });

  it('never shows a finished or archived goal', () => {
    const goals = [
      g({ id: 'done',     status: 'DONE',     target_amount: 10, progress: 10 }),
      g({ id: 'archived', status: 'ARCHIVED', target_amount: 10, progress: 10 }),
      g({ id: 'open',     target_amount: 10,  progress: 1 }),
    ];
    expect(pickFocusGoal(goals)?.id).toBe('open');
  });

  it('falls back to an untargeted goal only when no tracked one is active', () => {
    // An untargeted goal has no percentage, so it can never win on progress —
    // but it is still what the person is working on when it is all they have.
    expect(pickFocusGoal([g({ id: 'plain' })])?.id).toBe('plain');
    expect(pickFocusGoal([
      g({ id: 'plain' }),
      g({ id: 'tracked', target_amount: 100, progress: 1 }), // 1% still outranks it
    ])?.id).toBe('tracked');
  });

  it('is stable on a tie — the card must not swap under a thumb', () => {
    const goals = [
      g({ id: 'first',  target_amount: 10, progress: 5 }),
      g({ id: 'second', target_amount: 20, progress: 10 }),
    ];
    expect(pickFocusGoal(goals)?.id).toBe('first');
    expect(pickFocusGoal([...goals].reverse())?.id).toBe('second'); // honest: order-dependent by design
  });

  it('returns null when there is nothing active — Home then invites you to add one', () => {
    expect(pickFocusGoal([])).toBeNull();
    expect(pickFocusGoal([g({ id: 'done', status: 'DONE' })])).toBeNull();
  });
});

describe('goalPercent', () => {
  it('clamps over-funding to 100 rather than printing 340%', () => {
    expect(goalPercent(g({ id: 'x', target_amount: 10, progress: 34 }))).toBe(100);
  });

  it('is 0 — never NaN or Infinity — without a usable target', () => {
    // A bar fed NaN renders at width "NaN%", which the browser drops silently:
    // a progress bar that is simply missing, with nothing in the console.
    for (const target of [null, 0, -5]) {
      const pct = goalPercent(g({ id: 'x', target_amount: target, progress: 5 }));
      expect(Number.isFinite(pct)).toBe(true);
      expect(pct).toBe(0);
    }
  });
});
