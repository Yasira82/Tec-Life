// Life's capabilities, v1 (owner, 2026-10-20). After the person agrees to a step, Life's reply
// may carry ONE proposal — a goal with its steps, or a skill (tec-ai-service proposal.ts). The
// page shows it as a card; nothing is written unless the person taps Add, and then it is
// written here, through Life's own goal/skill routes with the person's session — the same
// doors the Goals and Skills tabs use. The AI service never writes.
import { cleanStep, withSteps } from '@/lib/life/steps';

export type Proposal =
  | { kind: 'goal'; title: string; steps: string[] }
  | { kind: 'skill'; name: string };

const GOAL_TITLE_MAX = 80;
const SKILL_NAME_MAX = 60;

/** What the AI service sent, checked again here — a malformed proposal shows no card. */
export function readProposal(raw: unknown): Proposal | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const str = (v: unknown, max: number) => (typeof v === 'string' && v.trim() && v.trim().length <= max ? v.trim() : null);
  if (o.kind === 'goal') {
    const title = str(o.title, GOAL_TITLE_MAX);
    const steps = (Array.isArray(o.steps) ? o.steps : [])
      .map((v) => (typeof v === 'string' ? cleanStep(v) : ''))
      .filter(Boolean)
      .slice(0, 3);
    return title && steps.length ? { kind: 'goal', title, steps } : null;
  }
  if (o.kind === 'skill') {
    const name = str(o.name, SKILL_NAME_MAX);
    return name ? { kind: 'skill', name } : null;
  }
  return null;
}

/** The person tapped Add. True when Life kept it. */
export async function acceptProposal(p: Proposal): Promise<boolean> {
  const body = p.kind === 'goal'
    ? { url: '/api/bff/life/goals', json: { title: p.title, description: withSteps(null, p.steps.map((text) => ({ text, done: false }))) } }
    : { url: '/api/bff/life/skills', json: { name: p.name } };
  try {
    const res = await fetch(body.url, {
      method: 'POST', credentials: 'include', cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body.json),
    });
    return res.ok;
  } catch {
    return false;
  }
}
