import { NextRequest, NextResponse } from 'next/server';
import { forwardLife, readGateway } from '@/lib/bff/lifeGateway';
import { buildProfile } from '@/lib/life/profile';
import { buildAwareness, parseClock } from '@/lib/life/awareness';
import { parseFuture } from '@/lib/life/future';

// POST /api/bff/life/talk — Life's conversation. Only `messages` (and the page's clock) come from the page;
// the AI service checks its shape, answers from Groq, and stores nothing. This route
// logs nothing of the body: `forwardLife` logs the path and the status only.
//
// Life memory: when the person keeps a journey, EVERY summary they confirmed (owner, 27 Nov 2026 — not
// only the three newest; the AI service keeps thirty within a budget), the whole record built from them
// (lib/life/profile.ts), and the full text of their newest kept conversation — never the one being had
// now — are read here, server-side, with their own session, and sent along — so Life can continue
// from where they were. What they delete in My journey is gone from the next reply. The page cannot supply a memory, and the
// memory never travels through the browser. Keeping off (or the read failing) → the
// conversation goes on without it; a memory that could not be read must not stop it.
const MEMORY_NOTES = 30;

type Entry = Record<string, unknown>;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const messages = (body as { messages?: unknown })?.messages;
  // Which conversation this is — used only to leave it out of «the last kept conversation», never forwarded.
  const current = (body as { conversation_id?: unknown })?.conversation_id;
  if (!Array.isArray(messages)) return NextResponse.json({ error: 'Invalid conversation' }, { status: 400 });

  const [journey, self] = await Promise.all([readGateway(req, '/api/identity/life/journey'), readGateway(req, '/api/identity/life/self')]);
  const data = journey.ok ? (journey.data as { keeping?: unknown; entries?: Entry[] } | null) : null;
  const keeping = data?.keeping === true && Array.isArray(data.entries);
  const entries = keeping ? data!.entries! : [];
  // Every kept conversation — what each was about; the whole record goes in `profile`.
  const memory = entries.slice(0, MEMORY_NOTES).map(({ problem, understanding, step, step_outcome, created_at }) =>
    ({ problem, understanding, step, step_outcome, created_at }));
  const statement = self.ok ? (self.data as { statement?: unknown } | null)?.statement : null;
  const profile = keeping ? buildProfile(entries, statement) : null;
  // Awareness (owner, 2026-10-30): where their life is now — the step's week, their active goals,
  // days since the last kept conversation, their part of the day. Same switch as the memory: only
  // while the journey is kept. The page sends its clock and nothing else; a failed goals read only
  // leaves the goals out.
  let awareness = null;
  let lastConversation: { created_at: string; messages: unknown[] } | null = null;
  if (keeping) {
    lastConversation = await newestKept(req, typeof current === 'string' ? current : null);
    const [goals, future, skills] = await Promise.all([readGateway(req, '/api/identity/life/goals'), readGateway(req, '/api/identity/life/future'), readGateway(req, '/api/identity/life/skills')]);
    const skillRows = skills.ok ? ((skills.data as { skills?: unknown } | null)?.skills ?? []) : [];
    const rows = goals.ok ? ((goals.data as { goals?: unknown } | null)?.goals ?? []) : [];
    awareness = buildAwareness({
      entries: entries as never,
      goals: Array.isArray(rows) ? rows as never : [],
      // «مستقبلي» (owner, 2026-10-31): their vision and chosen areas; a failed read leaves them out.
      future: future.ok ? parseFuture(future.data) : null,
      skills: Array.isArray(skillRows) ? skillRows as never : [],
      clock: parseClock((body as { clock?: unknown })?.clock),
    });
  }

  return forwardLife(req, 'POST', '/api/identity/ai/life/talk', {
    messages, ...(memory.length ? { memory } : {}), ...(profile ? { profile } : {}), ...(awareness ? { awareness } : {}),
    ...(lastConversation ? { last_conversation: lastConversation } : {}),
    // What the coach may say it remembers: off, or on. A journey that could not be read says neither.
    ...(journey.ok ? { memory_state: keeping ? 'on' : 'off' } : {}),
  });
}

/** The newest kept conversation that is not this one, in full — or null (full conversations off, none, unreadable). */
async function newestKept(req: NextRequest, current: string | null): Promise<{ created_at: string; messages: unknown[] } | null> {
  const list = await readGateway(req, '/api/identity/life/conversations');
  const d = list.ok ? (list.data as { keeping?: unknown; conversations?: unknown } | null) : null;
  if (d?.keeping !== true || !Array.isArray(d.conversations)) return null;
  const rows = (d.conversations as { id?: unknown; updated_at?: unknown; readable?: unknown }[])
    .filter((c) => typeof c.id === 'string' && c.id !== current && c.readable !== false && typeof c.updated_at === 'string')
    .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
  const newest = rows[0];
  if (!newest) return null;
  const one = await readGateway(req, `/api/identity/life/conversations/${encodeURIComponent(newest.id as string)}`);
  const messages = one.ok ? (one.data as { messages?: unknown } | null)?.messages : null;
  return Array.isArray(messages) && messages.length ? { created_at: newest.updated_at as string, messages } : null;
}
