// The redesign's Today screen — its decisions, as pure functions (Phase 1, owner 2026-11-28).
//
// Today shows three things: the coach, today's step, and the goal closest to done. What each
// says is decided here, from what the existing reads answer — no new endpoint, no stored state.
import type { Goal } from '@/lib-client/life/useLife';
import type { Journey } from '@/lib-client/life/journey';
import type { Conversations } from '@/lib-client/life/conversations';
import { parseSteps } from './steps';

/**
 * What the coach button may promise. It must match what the coach actually receives
 * (Tec-Life api/bff/life/talk): memory only while the journey is kept; the newest full
 * conversation only while BOTH the journey and full conversations are kept.
 *
 *   'unknown' — the journey could not be read: promise nothing about memory.
 *   'off'     — the journey is not kept: every conversation starts fresh.
 *   'first'   — kept, but nothing kept yet.
 *   'saved'   — kept, with at least one kept summary; `topic` is the newest one's problem,
 *               in the person's own confirmed words.
 * `canContinue` — a readable full conversation exists to reopen as it was.
 */
export interface CoachState {
  memory: 'unknown' | 'off' | 'first' | 'saved';
  topic: string | null;
  canContinue: boolean;
}

export function coachState(journey: Journey | null, conversations: Conversations | null): CoachState {
  const canContinue = !!conversations?.keeping && conversations.conversations.some((c) => c.readable);
  if (!journey) return { memory: 'unknown', topic: null, canContinue };
  if (!journey.keeping) return { memory: 'off', topic: null, canContinue };
  const newest = journey.entries[0];
  if (!newest) return { memory: 'first', topic: null, canContinue };
  const topic = typeof newest.problem === 'string' && newest.problem.trim() ? newest.problem.trim() : null;
  return { memory: 'saved', topic, canContinue };
}

/**
 * The goal closest to done, among the active ones:
 *   1. a goal with a π target, by the largest share done (not yet complete);
 *   2. else a goal with steps, by the largest share of steps ticked;
 *   3. else the most recently touched active goal.
 * Null when there is no active goal. Never a DONE or ARCHIVED goal.
 */
export function closestGoal(goals: Goal[]): Goal | null {
  const active = goals.filter((g) => g.status === 'ACTIVE');
  if (active.length === 0) return null;
  const byShare = (share: (g: Goal) => number | null) => {
    let best: Goal | null = null; let bestShare = -1;
    for (const g of active) {
      const s = share(g);
      if (s == null || s >= 1) continue;
      if (s > bestShare || (s === bestShare && best && g.updated_at > best.updated_at)) { best = g; bestShare = s; }
    }
    return best;
  };
  const targeted = byShare((g) => (g.target_amount && g.target_amount > 0 ? g.progress / g.target_amount : null));
  if (targeted) return targeted;
  const stepped = byShare((g) => {
    const steps = parseSteps(g.description ?? '');
    return steps.length ? steps.filter((s) => s.done).length / steps.length : null;
  });
  if (stepped) return stepped;
  return [...active].sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))[0] ?? null;
}

/** The part of the day for a greeting, from the phone's own clock. */
export function partOfDay(hour: number): 'morning' | 'afternoon' | 'evening' {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
}
