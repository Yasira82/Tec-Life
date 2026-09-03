import { NextRequest } from 'next/server';
import { forwardLife } from '@/lib/bff/lifeGateway';

// GET /api/bff/life/trajectory → the caller's own pace, and what it reaches.
// C-106 §4 gives Life "personal trajectory (where the user is headed)".
//
// The window is the only thing the client may choose; the OWNER is resolved
// server-side from the session by identity-service (P6). Free for everyone —
// this is the user's own arithmetic on their own logged steps, not the Pro
// Goal Insights aggregate.
export async function GET(req: NextRequest) {
  // `Number(null)` is 0, not NaN — so reading the param straight into a clamp
  // turns "no window given" into the MINIMUM window (7 days) instead of the
  // default (30). The absent case is decided before any arithmetic touches it.
  const raw  = req.nextUrl.searchParams.get('window_days');
  const n    = raw === null || raw.trim() === '' ? NaN : Number(raw);
  // Clamped here as well as in the service: a BFF that forwards whatever
  // arrives makes the service's guard the only one, and one guard is a guard
  // that gets refactored away.
  const days = Number.isFinite(n) ? Math.min(365, Math.max(7, Math.floor(n))) : 30;
  return forwardLife(req, 'GET', `/api/identity/life/trajectory?window_days=${days}`);
}
