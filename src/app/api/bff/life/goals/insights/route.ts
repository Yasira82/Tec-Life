import { NextRequest, NextResponse } from 'next/server';
import { resolveGoalInsights, resolveProStatus } from '@/lib/life/insights';

// GET /api/bff/life/goals/insights — Life Pro "Goal Insights" (C-106). A DEEPER aggregate
// of the caller's OWN goals than the free overview strip. Identity is the `tec_user`
// session (P6 — the backend resolves it from the token). The aggregate is gated behind
// the caller's LIVE subscription (P5 — Life never stores billing); a non-Pro gets
// `{ pro: false }` so the UI can show a teaser.
export async function GET(req: NextRequest) {
  const token = req.cookies.get('tec_access_token')?.value ?? null;
  if (!token) return NextResponse.json({ pro: false, insights: null }, { status: 401 });

  const isPro = await resolveProStatus(token);
  if (!isPro) return NextResponse.json({ pro: false, insights: null }, { headers: { 'Cache-Control': 'private, max-age=15' } });

  const insights = await resolveGoalInsights(token);
  return NextResponse.json({ pro: true, insights }, { headers: { 'Cache-Control': 'private, max-age=30' } });
}
