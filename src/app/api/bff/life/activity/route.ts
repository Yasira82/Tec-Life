import { NextRequest } from 'next/server';
import { forwardLife } from '@/lib/bff/lifeGateway';

// GET /api/bff/life/activity → the caller's own recent activity (C-106 §4:
// activity signals come from Analytics). Forwards to the analytics strict
// own-scope endpoint, which scopes to the session user and fails closed —
// Life only PRESENTS this, it never stores or re-derives transaction truth.
export async function GET(req: NextRequest) {
  const limit = req.nextUrl.searchParams.get('limit') ?? '25';
  return forwardLife(req, 'GET', `/api/analytics/me/activity?limit=${encodeURIComponent(limit)}`);
}
