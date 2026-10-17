import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { forwardLife } from '@/lib/bff/lifeGateway';

// PATCH  /api/bff/life/journey/:id — the person's answer about the step (a closed set).
// DELETE /api/bff/life/journey/:id — delete one kept summary. Ownership is enforced by
// tec-life-service from the session; someone else's id is a 404 there.
const OutcomeSchema = z.object({ step_outcome: z.enum(['DONE', 'PARTLY', 'NOT_YET']) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = OutcomeSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
  return forwardLife(req, 'PATCH', `/api/identity/life/journey/${encodeURIComponent(id)}`, parsed.data);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return forwardLife(req, 'DELETE', `/api/identity/life/journey/${encodeURIComponent(id)}`);
}
