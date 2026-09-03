import { NextRequest } from 'next/server';
import { forwardLife } from '@/lib/bff/lifeGateway';

// GET /api/bff/life/intent — the caller's own live intent window (C-106 §4).
//
// Ephemeral by construction: Redis with a 30-minute TTL, no durable copy. It
// comes back empty when Redis is unavailable, and that is the correct failure
// for a store whose entire value is that it forgets.
//
// Read-only on purpose. There is no "report my intent" write here or upstream:
// a client-fed signal is a client-controlled claim about a person, with nothing
// to verify it against. The signals are facts Life recorded about its OWN
// writes, server-side, as they happened.
export async function GET(req: NextRequest) {
  return forwardLife(req, 'GET', '/api/identity/life/intent');
}
