import { NextRequest, NextResponse } from 'next/server';
import { forwardLife } from '@/lib/bff/lifeGateway';
import { SESSION_METRICS } from '@/lib-client/life/sessionCounter';

// POST /api/bff/life/session/count — stage 1's aggregate counter (First Session
// Spec §7–§8). Only `metric`, from the closed set, is forwarded; anything else in
// the body is dropped here, so no text can ride along to the service.
export async function POST(req: NextRequest) {
  const body   = await req.json().catch(() => ({}));
  const metric = (body as { metric?: unknown })?.metric;
  if (typeof metric !== 'string' || !(SESSION_METRICS as readonly string[]).includes(metric)) {
    return NextResponse.json({ error: 'Unknown metric' }, { status: 400 });
  }
  return forwardLife(req, 'POST', '/api/identity/life/session/count', { metric });
}
