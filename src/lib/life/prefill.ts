/**
 * A3 — a goal proposed by TEC AI (C-104 §10.1 · Tec-Life #74).
 *
 * The Hub assistant may link here as `/app?goal=<title>&target=<π>` when the
 * person stated a goal in their own words. Life reads it ONCE, puts it in the
 * Add form as text the person can see and edit, and saves NOTHING until they tap
 * Add — the same POST as a goal typed by hand, owner from the session (P6).
 *
 * Pure: no window, no fetch. The page reads the query; this decides what of it
 * is usable. Only the two whitelisted keys are read; everything else is ignored.
 */

export const GOAL_TITLE_MAX = 200;           // the Add field's own maxLength
const TARGET_MAX = 1_000_000_000;            // the BFF's CreateGoalSchema bound

export interface GoalPrefill { title: string; target?: string }

export function readGoalPrefill(search: string): GoalPrefill | null {
  let q: URLSearchParams;
  try { q = new URLSearchParams(search); } catch { return null; }

  // Collapse whitespace (a newline in a URL is not part of a title), then cap at
  // the field's own limit — a longer title is truncated, never refused, because
  // the person sees it and can still edit it before Add.
  const title = (q.get('goal') ?? '').replace(/\s+/g, ' ').trim().slice(0, GOAL_TITLE_MAX).trim();
  if (!title) return null;

  // A target is kept only when it is a plain positive amount; anything else is
  // dropped rather than guessed — the title still arrives on its own.
  const raw = (q.get('target') ?? '').trim();
  const ok  = /^(?:0|[1-9]\d{0,9})(?:\.\d{1,8})?$/.test(raw) && Number(raw) > 0 && Number(raw) <= TARGET_MAX;

  return ok ? { title, target: raw } : { title };
}

/** The query without the two keys this screen consumed — everything else kept. */
export function withoutGoalPrefill(search: string): string {
  const q = new URLSearchParams(search);
  q.delete('goal');
  q.delete('target');
  const s = q.toString();
  return s ? `?${s}` : '';
}
