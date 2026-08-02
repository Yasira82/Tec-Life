import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { forwardLife } from '@/lib/bff/lifeGateway';

// POST /api/bff/life/goals/:id/progress — log π progress toward a goal's target.
// Owner-scoped server-side (C-106 / P6); the client never sends identity. `delta`
// is a non-zero number (positive to log, negative to correct); the engine clamps.
const ProgressSchema = z.object({ delta: z.number().finite().refine((n) => n !== 0, 'delta must be non-zero') });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = ProgressSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
  }
  return forwardLife(req, 'POST', `/api/identity/life/goals/${encodeURIComponent(id)}/progress`, parsed.data);
}
