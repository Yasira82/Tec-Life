import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { forwardLife } from '@/lib/bff/lifeGateway';
import { FEELINGS } from '@/lib-client/life/journey';

// PUT /api/bff/life/journey/:id/memory — change what Life remembers on one kept summary:
// what the person tried, what helped, when it gets hard, why it matters, what they now practise,
// a sentence of theirs, and the feelings they chose (owner, 2026-10-23).
// Typed by the person; an empty field clears it. tec-life-service re-checks every rule,
// requires keeping (JOURNEY) on and takes the owner from the session — never from here.
const field = z.string().trim().max(300).nullable().optional().transform((v) => v || null);
const feeling = z.enum(FEELINGS).nullable().optional().transform((v) => v ?? null);
const MemorySchema = z.object({
  tried: field, helped: field, triggers: field, reason: field, practice: field, words: field,
  feeling_start: feeling, feeling_end: feeling,
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = MemorySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
  return forwardLife(req, 'PUT', `/api/identity/life/journey/${encodeURIComponent(id)}/memory`, parsed.data);
}
