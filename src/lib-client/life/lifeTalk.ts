// Life's conversation, the browser side: one POST with the conversation so far.
// The words go to Life's own BFF and nowhere else (the BFF forwards them to the AI
// service, which answers from Groq and keeps nothing). Kept out of the component so
// the component holds state and this file holds the one network door.
export interface Turn { role: 'user' | 'assistant'; content: string }

export type TalkResult =
  | { ok: true; reply: string }
  | { ok: false; reason: 'busy' | 'limit' | 'unavailable' };

export async function talk(messages: Turn[]): Promise<TalkResult> {
  try {
    const res = await fetch('/api/bff/life/talk', {
      method: 'POST', credentials: 'include', cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
    if (res.status === 429) return { ok: false, reason: 'busy' };
    if (res.status === 400) return { ok: false, reason: 'limit' };
    if (!res.ok) return { ok: false, reason: 'unavailable' };
    const json = await res.json() as { data?: { reply?: unknown } };
    const reply = json?.data?.reply;
    return typeof reply === 'string' && reply.trim() ? { ok: true, reply } : { ok: false, reason: 'unavailable' };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}
