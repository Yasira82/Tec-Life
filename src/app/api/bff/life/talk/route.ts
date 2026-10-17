import { NextRequest, NextResponse } from 'next/server';
import { forwardLife } from '@/lib/bff/lifeGateway';

// POST /api/bff/life/talk — Life's conversation. Only `messages` is forwarded; the
// AI service checks its shape, answers from Groq, and stores nothing. This route
// logs nothing of the body: `forwardLife` logs the path and the status only.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const messages = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(messages)) return NextResponse.json({ error: 'Invalid conversation' }, { status: 400 });
  return forwardLife(req, 'POST', '/api/identity/ai/life/talk', { messages });
}
