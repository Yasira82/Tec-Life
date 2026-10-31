import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { forwardLife } from '@/lib/bff/lifeGateway';

// PUT /api/bff/life/future/vision — write the vision sentence, or clear it with an empty one.
// Only the sentence is forwarded; tec-life-service takes the owner from the session.
const VisionSchema = z.object({ statement: z.string().trim().max(300) });

export async function PUT(req: NextRequest) {
  const parsed = VisionSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
  return forwardLife(req, 'PUT', '/api/identity/life/future/vision', { statement: parsed.data.statement });
}
