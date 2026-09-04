import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { forwardLife } from '@/lib/bff/lifeGateway';

// Feedback → tec-identity-service (feedback module), through the gateway.
// Identity is the session, resolved server-side from the token by the service.

// The app label is set HERE, server-side, and the client's is discarded.
// It is only a triage label — nothing is authorized on it — but a label that
// anyone can set is a label nobody can sort by.
const APP = 'life';

const SubmitSchema = z.object({
  // Mirrors the service's own bounds so an over-long message is refused in the
  // browser's own round-trip rather than after a gateway hop. The SERVICE is
  // still the authority (P5 — the pre-validation never weakens it).
  message: z.string().trim().min(3).max(2000),
  // Where in the app they were. Optional, because insisting on it would make
  // the form heavier than the thing it collects.
  page: z.string().max(120).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = SubmitSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  // `app` last, so a client that sent one cannot override it.
  return forwardLife(req, 'POST', '/api/identity/feedback', { ...parsed.data, app: APP });
}

// The caller's own messages — so a person can see that theirs landed, and
// whether anyone has looked at it.
export async function GET(req: NextRequest) {
  return forwardLife(req, 'GET', '/api/identity/feedback/mine');
}
