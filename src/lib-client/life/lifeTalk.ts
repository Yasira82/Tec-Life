// Life's conversation, the browser side: one POST with the conversation so far, and —
// only when the person asks for it at the end — one POST for the closing summary.
// The words go to Life's own BFF and nowhere else (the BFF forwards them to the AI
// service, which answers from Groq and keeps nothing). Kept out of the component so
// the component holds state and this file holds the one network door.
export interface Turn { role: 'user' | 'assistant'; content: string }

/**
 * The conversation lasts until the person ends it (owner, 2026-10-18). 400 messages is
 * only the AI service's guard against an unbounded body — hours of talk. The cost of
 * each reply stays flat there: Life sees the first message and the most recent part.
 */
export const MAX_MESSAGES = 400;

export type TalkResult =
  | { ok: true; reply: string }
  | { ok: false; reason: 'busy' | 'limit' | 'capacity' | 'unavailable' };

export async function talk(messages: Turn[]): Promise<TalkResult> {
  try {
    const res = await fetch('/api/bff/life/talk', {
      method: 'POST', credentials: 'include', cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
    if (res.status === 429) return { ok: false, reason: 'busy' };
    if (res.status === 400) return { ok: false, reason: 'limit' };
    if (!res.ok) {
      // The AI service says `capacity` when Groq's free daily budget is spent.
      const body = await res.json().catch(() => ({})) as { error?: unknown };
      return { ok: false, reason: body?.error === 'capacity' ? 'capacity' : 'unavailable' };
    }
    const json = await res.json() as { data?: { reply?: unknown } };
    const reply = json?.data?.reply;
    return typeof reply === 'string' && reply.trim() ? { ok: true, reply } : { ok: false, reason: 'unavailable' };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

export interface Summary { problem: string; understanding: string; step: string | null }

/**
 * The closing summary, written by Life for the person to read and edit (Life memory v1).
 * Asked for only when the person taps "Write the summary". Nothing is kept by asking:
 * the summary is kept only when the person confirms it (lib-client/life/journey.ts).
 */
export async function summarise(messages: Turn[]): Promise<Summary | null> {
  try {
    const res = await fetch('/api/bff/life/summary', {
      method: 'POST', credentials: 'include', cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
    if (!res.ok) return null;
    const json = await res.json() as { data?: { summary?: Partial<Summary> } };
    const sm = json?.data?.summary;
    if (typeof sm?.problem !== 'string' || typeof sm?.understanding !== 'string') return null;
    return { problem: sm.problem, understanding: sm.understanding, step: typeof sm.step === 'string' ? sm.step : null };
  } catch {
    return null;
  }
}
