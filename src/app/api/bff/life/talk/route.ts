import { NextRequest, NextResponse } from 'next/server';
import { forwardLife, readGateway } from '@/lib/bff/lifeGateway';
import { buildProfile } from '@/lib/life/profile';

// POST /api/bff/life/talk — Life's conversation. Only `messages` comes from the page;
// the AI service checks its shape, answers from Groq, and stores nothing. This route
// logs nothing of the body: `forwardLife` logs the path and the status only.
//
// Life memory v1: when the person keeps a journey, the three newest summaries THEY
// confirmed — and the whole record built from all of them (lib/life/profile.ts) — are read
// here, server-side, with their own session, and sent along — so Life can continue
// from where they were. The page cannot supply a memory, and the
// memory never travels through the browser. Keeping off (or the read failing) → the
// conversation goes on without it; a memory that could not be read must not stop it.
const MEMORY_NOTES = 3;

type Entry = Record<string, unknown>;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const messages = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(messages)) return NextResponse.json({ error: 'Invalid conversation' }, { status: 400 });

  const [journey, self] = await Promise.all([readGateway(req, '/api/identity/life/journey'), readGateway(req, '/api/identity/life/self')]);
  const data = journey.ok ? (journey.data as { keeping?: unknown; entries?: Entry[] } | null) : null;
  const keeping = data?.keeping === true && Array.isArray(data.entries);
  const entries = keeping ? data!.entries! : [];
  // The three newest conversations — what each was about; the whole record goes in `profile`.
  const memory = entries.slice(0, MEMORY_NOTES).map(({ problem, understanding, step, step_outcome, created_at }) =>
    ({ problem, understanding, step, step_outcome, created_at }));
  const statement = self.ok ? (self.data as { statement?: unknown } | null)?.statement : null;
  const profile = keeping ? buildProfile(entries, statement) : null;

  return forwardLife(req, 'POST', '/api/identity/ai/life/talk', {
    messages, ...(memory.length ? { memory } : {}), ...(profile ? { profile } : {}),
  });
}
