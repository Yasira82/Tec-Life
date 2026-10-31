import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { forwardLife } from '@/lib/bff/lifeGateway';
import { LIFE_AREAS } from '@/lib/life/future-copy';

// PUT /api/bff/life/future/areas — the whole set of chosen life areas, each with an optional line.
// An area not sent is no longer chosen. Owner from the session in tec-life-service.
const AreasSchema = z.object({
  areas: z.array(z.object({ area: z.enum(LIFE_AREAS), note: z.string().trim().max(160).nullable().optional() })).max(LIFE_AREAS.length),
});

export async function PUT(req: NextRequest) {
  const parsed = AreasSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
  const areas = parsed.data.areas.map((a) => ({ area: a.area, note: a.note || null }));
  return forwardLife(req, 'PUT', '/api/identity/life/future/areas', { areas });
}
