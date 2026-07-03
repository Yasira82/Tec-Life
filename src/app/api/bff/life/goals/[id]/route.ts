import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { forwardLife } from '@/lib/bff/lifeGateway';

// PATCH  /api/bff/life/goals/:id  → update own goal (ownership enforced server-side).
// DELETE /api/bff/life/goals/:id  → delete own goal.
const UpdateGoalSchema = z.object({
  title:       z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  status:      z.enum(['ACTIVE', 'DONE', 'ARCHIVED']).optional(),
  target_date: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = UpdateGoalSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
  }
  return forwardLife(req, 'PATCH', `/api/identity/life/goals/${encodeURIComponent(id)}`, parsed.data);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return forwardLife(req, 'DELETE', `/api/identity/life/goals/${encodeURIComponent(id)}`);
}
