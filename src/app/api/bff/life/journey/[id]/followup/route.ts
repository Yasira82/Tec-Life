import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { forwardLife } from '@/lib/bff/lifeGateway';

// PUT /api/bff/life/journey/:id/followup — the person's answer LATER. Only MEASURED carries
// a number; "I don't know" and "I didn't count" never become one (owner, 2026-10-18).
// The kind (number or 1–5 rating) is the stored measure's — tec-life-service checks it.
const FollowupSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('MEASURED'), value: z.number().finite().min(0).max(1_000_000) }),
  z.object({ status: z.literal('UNKNOWN') }).strict(),
  z.object({ status: z.literal('NOT_MEASURED') }).strict(),
]);

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = FollowupSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
  return forwardLife(req, 'PUT', `/api/identity/life/journey/${encodeURIComponent(id)}/followup`, parsed.data);
}
