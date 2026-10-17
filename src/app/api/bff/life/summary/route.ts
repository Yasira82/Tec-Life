import { NextRequest, NextResponse } from 'next/server';
import { forwardLife } from '@/lib/bff/lifeGateway';

// POST /api/bff/life/summary — the closing summary of a conversation, as three fields
// the person will read and edit (Life memory v1). Only `messages` is forwarded; the AI
// service answers from Groq and stores nothing. Nothing is kept until the person
// confirms it through /api/bff/life/journey.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const messages = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(messages)) return NextResponse.json({ error: 'Invalid conversation' }, { status: 400 });
  return forwardLife(req, 'POST', '/api/identity/ai/life/summary', { messages });
}
