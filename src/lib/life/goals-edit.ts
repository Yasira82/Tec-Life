// The redesign's My goals — the pure part (Phase 1, approved mockup «أهدافي», owner 2026-11-28).
//
// One goal is shown large (the one closest to done, the same choice Today makes), the rest as one
// line each, and adding or editing happens in a bottom sheet. Everything here becomes a body for
// the EXISTING routes — POST /api/bff/life/goals and PATCH /api/bff/life/goals/:id — whose schemas
// already accept title, description, target_amount and area. No new field, no new endpoint.
import type { Goal } from '@/lib-client/life/useLife';
import type { LifeArea } from './future-copy';
import { STEP_MAX, cleanStep, parseSteps, withSteps } from './steps';
import { closestGoal } from './today';

export interface GoalDraft {
  title: string;
  area: LifeArea | '';
  /** π target as typed; only a money goal (or one with no area) has one. */
  target: string;
  /** Steps as typed, one per line. */
  steps: string;
}

/** π belongs to a money goal only (owner, 2026-10-31) — or to a goal with no area yet. */
export const takesTarget = (area: LifeArea | '') => area === '' || area === 'MONEY';

export const emptyDraft = (prefill?: { title?: string; target?: string; steps?: string[] } | null): GoalDraft => ({
  title: prefill?.title ?? '', area: '', target: prefill?.target ?? '', steps: (prefill?.steps ?? []).join('\n'),
});

export const draftOf = (g: Goal): GoalDraft => ({
  title: g.title,
  area: g.area ?? '',
  target: g.target_amount && g.target_amount > 0 ? String(g.target_amount) : '',
  steps: parseSteps(g.description).map((s) => s.text).join('\n'),
});

export type DraftProblem = 'no_title' | 'bad_target';

const stepLines = (text: string) =>
  text.split('\n').map(cleanStep).filter(Boolean).slice(0, STEP_MAX);

function targetOf(d: GoalDraft): number | null | 'bad' {
  if (!takesTarget(d.area)) return null;
  const raw = d.target.trim().replace(',', '.');
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 && n <= 1_000_000_000 ? n : 'bad';
}

/** The body for a new goal, or why it cannot be saved. */
export function createBody(d: GoalDraft):
  { ok: true; title: string; target?: number; description?: string; area: LifeArea | null } | { ok: false; problem: DraftProblem } {
  const title = d.title.trim().slice(0, 200);
  if (!title) return { ok: false, problem: 'no_title' };
  const target = targetOf(d);
  if (target === 'bad') return { ok: false, problem: 'bad_target' };
  const steps = stepLines(d.steps);
  return {
    ok: true, title,
    ...(target ? { target } : {}),
    ...(steps.length ? { description: withSteps('', steps.map((text) => ({ text, done: false }))) } : {}),
    area: d.area || null,
  };
}

export interface GoalPatch { title?: string; description?: string | null; target_amount?: number | null; area?: LifeArea | null }

/**
 * Only what changed. A step that keeps its text keeps its tick; every line of the description
 * that is not a step stays as it was (steps.ts). Nothing the person did not touch is sent.
 */
export function patchBody(g: Goal, d: GoalDraft): { ok: true; patch: GoalPatch } | { ok: false; problem: DraftProblem } {
  const title = d.title.trim().slice(0, 200);
  if (!title) return { ok: false, problem: 'no_title' };
  const target = targetOf(d);
  if (target === 'bad') return { ok: false, problem: 'bad_target' };
  const patch: GoalPatch = {};
  if (title !== g.title) patch.title = title;
  const area = d.area || null;
  if (area !== (g.area ?? null)) patch.area = area;
  // A goal moved out of money keeps its old target untouched rather than losing it silently.
  if (takesTarget(d.area) && (target ?? null) !== (g.target_amount && g.target_amount > 0 ? g.target_amount : null)) {
    patch.target_amount = target;
  }
  const before = parseSteps(g.description);
  const texts = stepLines(d.steps);
  const steps = texts.map((text) => ({ text, done: before.find((s) => s.text === text)?.done ?? false }));
  const same = steps.length === before.length && steps.every((s, i) => s.text === before[i]?.text && s.done === before[i]?.done);
  if (!same) {
    const description = withSteps(g.description, steps);
    patch.description = description.trim() ? description : null;
  }
  return { ok: true, patch };
}

/** The screen's three groups: the goal shown large, the rest (filtered by area), the finished ones. */
export function splitGoals(goals: Goal[], area: LifeArea | 'ALL') {
  const priority = closestGoal(goals);
  const others = goals
    .filter((g) => g.status === 'ACTIVE' && g !== priority && (area === 'ALL' || g.area === area))
    .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
  const done = goals.filter((g) => g.status === 'DONE');
  const areas = [...new Set(goals.filter((g) => g.status === 'ACTIVE' && g !== priority && g.area).map((g) => g.area as LifeArea))];
  return { priority, others, done, areas };
}

/** A goal's share done, 0–1: of its π target, else of its steps; null when it has neither. */
export function shareOf(g: Goal): number | null {
  if (g.target_amount && g.target_amount > 0) return Math.min(1, g.progress / g.target_amount);
  const steps = parseSteps(g.description);
  return steps.length ? steps.filter((s) => s.done).length / steps.length : null;
}
