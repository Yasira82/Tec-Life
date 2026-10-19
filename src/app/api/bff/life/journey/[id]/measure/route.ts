import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { forwardLife } from '@/lib/bff/lifeGateway';

// PUT    /api/bff/life/journey/:id/measure — the person's value BEFORE the step.
// DELETE /api/bff/life/journey/:id/measure — remove the measure, keep the summary.
// "Before and after" v1 (owner, 2026-10-18): optional and typed by the person — there is
// no NONE kind (a skip sends nothing). tec-life-service re-checks every rule and takes the
// owner from the session.
const MeasureSchema = z.object({
  kind:   z.enum(['NUMBER', 'RATING_1_5']),
  label:  z.string().trim().min(1).max(60),
  period: z.enum(['DAY', 'WEEK', 'MONTH']),
  value:  z.number().finite().min(0).max(1_000_000),
}).refine((m) => m.kind !== 'RATING_1_5' || (Number.isInteger(m.value) && m.value >= 1 && m.value <= 5));

const path = (id: string) => `/api/identity/life/journey/${encodeURIComponent(id)}/measure`;

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = MeasureSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
  return forwardLife(req, 'PUT', path(id), parsed.data);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return forwardLife(req, 'DELETE', path(id));
}
