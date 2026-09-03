import type { Goal } from './useLife';

// Which goal the Home screen puts in front of you.
//
// "Closest to done" rather than newest or largest: a home screen has room for
// exactly one goal, and the one a single nudge finishes is the one worth the
// space. A goal with no π target has nothing to be close to — it can still be
// shown (it is what the person is working on) but it never outranks a tracked
// one, because there is no progress to compare.
//
// Pure, and separate from the component, so the rule can be argued with in a
// test instead of by reading JSX.

export const goalPercent = (g: Goal): number => {
  const target = g.target_amount ?? 0;
  if (!(target > 0)) return 0;
  return Math.min(100, ((g.progress ?? 0) / target) * 100);
};

export function pickFocusGoal(goals: Goal[]): Goal | null {
  const active = goals.filter((g) => g.status === 'ACTIVE');
  if (active.length === 0) return null;

  const targeted = active.filter((g) => (g.target_amount ?? 0) > 0);
  if (targeted.length === 0) return active[0] ?? null;

  // Ties keep the earlier goal: a stable pick means the card does not swap
  // under someone's thumb between two equal goals on every reload.
  return targeted.reduce((best, g) => (goalPercent(g) > goalPercent(best) ? g : best));
}
