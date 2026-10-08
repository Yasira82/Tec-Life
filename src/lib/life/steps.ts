/**
 * A goal's steps — a small checklist kept inside the goal's own description.
 *
 * TEC AI may propose a goal WITH the steps toward it (C-104 §10.1 · Hub `[[go:life:goal?…&steps=…]]`).
 * The steps are stored as plain lines in `description`, the field the goal already has:
 *
 *   - [ ] Open a savings goal
 *   - [x] Put 5π aside on Friday
 *
 * Inside the goal, not as goals of their own: a plan of five steps would otherwise fill
 * the free plan's active-goal cap by itself and push the goal it serves off the screen.
 * No schema change, and the text stays readable anywhere the description is shown.
 *
 * Pure: no fetch. A description with no step lines has no steps; every other line is
 * kept exactly as written, so nothing the person typed is lost by ticking a box.
 */

export const STEP_MAX = 5;
export const STEP_TEXT_MAX = 80;

export interface Step { text: string; done: boolean }

const LINE = /^- \[( |x)\] (.+)$/;

/** One step's text, as it may be stored: one line, no checklist syntax, capped. */
export function cleanStep(raw: string): string {
  return raw.replace(/\s+/g, ' ').replace(/^[-*\d.)\s]*\[[ x]?\]\s*/i, '').trim().slice(0, STEP_TEXT_MAX).trim();
}

export function parseSteps(description: string | null | undefined): Step[] {
  const out: Step[] = [];
  for (const line of (description ?? '').split('\n')) {
    const m = LINE.exec(line.trim());
    if (m) out.push({ done: m[1] === 'x', text: (m[2] ?? '').trim() });
  }
  return out;
}

/** Write the steps back, keeping every non-step line where it was (steps go at the end). */
export function withSteps(description: string | null | undefined, steps: Step[]): string {
  const rest = (description ?? '').split('\n').filter((l) => !LINE.test(l.trim()));
  while (rest.length && !(rest[rest.length - 1] ?? '').trim()) rest.pop();
  const lines = steps.map((s) => `- [${s.done ? 'x' : ' '}] ${s.text}`);
  return [...rest, ...lines].join('\n');
}

/** Tick or untick step `i`. */
export function toggleStep(description: string | null | undefined, i: number): string {
  const steps = parseSteps(description);
  const step = steps[i];
  if (!step) return description ?? '';
  steps[i] = { ...step, done: !step.done };
  return withSteps(description, steps);
}
