import { NextRequest, NextResponse } from 'next/server';
import { forwardLife, readGateway } from '@/lib/bff/lifeGateway';

// POST /api/bff/life/talk — Life's conversation. Only `messages` comes from the page;
// the AI service checks its shape, answers from Groq, and stores nothing. This route
// logs nothing of the body: `forwardLife` logs the path and the status only.
//
// Life memory v1: when the person keeps a journey, the three newest summaries THEY
// confirmed — with what they tried, what helped, when it gets hard and their reason —
// are read here, server-side, with their own session, and sent along — so
// Life can continue from where they were. The page cannot supply a memory, and the
// memory never travels through the browser. Keeping off (or the read failing) → the
// conversation goes on without it; a memory that could not be read must not stop it.
const MEMORY_NOTES = 3;

type Entry = {
  problem?: unknown; understanding?: unknown; step?: unknown; step_outcome?: unknown; created_at?: unknown;
  tried?: unknown; helped?: unknown; triggers?: unknown; reason?: unknown;
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const messages = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(messages)) return NextResponse.json({ error: 'Invalid conversation' }, { status: 400 });

  const journey = await readGateway(req, '/api/identity/life/journey');
  const data = journey.ok ? (journey.data as { keeping?: unknown; entries?: Entry[] } | null) : null;
  const memory = data?.keeping === true && Array.isArray(data.entries)
    ? data.entries.slice(0, MEMORY_NOTES).map(({ problem, understanding, step, step_outcome, created_at, tried, helped, triggers, reason }) =>
        ({ problem, understanding, step, step_outcome, created_at, tried, helped, triggers, reason }))
    : [];

  return forwardLife(req, 'POST', '/api/identity/ai/life/talk', memory.length ? { messages, memory } : { messages });
}
