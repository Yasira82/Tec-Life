import { NextRequest, NextResponse } from 'next/server';
import { forwardLife } from '@/lib/bff/lifeGateway';
import { PERIOD } from '@/lib/life/money';

// DELETE /api/bff/life/budget/:category?period=YYYY-MM → remove one of the
// caller's own caps. The owner is the session; identity-service scopes the
// delete in its WHERE, so a cap that is not the caller's is simply not found.
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ category: string }> }) {
  const { category } = await ctx.params;
  if (!/^[a-z][a-z0-9_-]{0,31}$/.test(category)) return NextResponse.json({ error: 'invalid category' }, { status: 400 });
  const period = req.nextUrl.searchParams.get('period') ?? '';
  if (period && !PERIOD.test(period)) return NextResponse.json({ error: 'period must be YYYY-MM' }, { status: 400 });
  const q = period ? `?period=${period}` : '';
  return forwardLife(req, 'DELETE', `/api/identity/life/budget/${encodeURIComponent(category)}${q}`);
}
