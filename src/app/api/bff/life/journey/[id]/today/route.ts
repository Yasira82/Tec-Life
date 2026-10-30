import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { forwardLife } from '@/lib/bff/lifeGateway';

// PUT /api/bff/life/journey/:id/today — today's answer about the step (owner, 2026-10-30).
// A closed set, never text; the day is the person's own calendar day. tec-life-service
// re-checks every rule (±1 day of its own, JOURNEY on, the caller's entry, a step to follow)
// and takes the owner from the session.
const TodaySchema = z.object({
  day:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  answer: z.enum(['DONE', 'PARTLY', 'NOT_YET']),
}).strict();

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = TodaySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
  return forwardLife(req, 'PUT', `/api/identity/life/journey/${encodeURIComponent(id)}/today`, parsed.data);
}
