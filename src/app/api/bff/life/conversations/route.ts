import { NextRequest } from 'next/server';
import { forwardLife } from '@/lib/bff/lifeGateway';

// GET /api/bff/life/conversations — the caller's kept conversations: when, how long,
// how they began; and whether keeping full conversations is on (owner, 2026-10-18).
export async function GET(req: NextRequest) {
  return forwardLife(req, 'GET', '/api/identity/life/conversations');
}
