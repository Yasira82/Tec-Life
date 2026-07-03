import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { forwardLife } from '@/lib/bff/lifeGateway';

// GET /api/bff/life/preferences → the caller's own preference map.
// PUT /api/bff/life/preferences → upsert a batch of preferences.
export async function GET(req: NextRequest) {
  return forwardLife(req, 'GET', '/api/identity/life/preferences');
}

const PrefsSchema = z.object({
  preferences: z.record(z.string(), z.string().max(1000)),
});

export async function PUT(req: NextRequest) {
  const parsed = PrefsSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
  }
  return forwardLife(req, 'PUT', '/api/identity/life/preferences', parsed.data);
}
