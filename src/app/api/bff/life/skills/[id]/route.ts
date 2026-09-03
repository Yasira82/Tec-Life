import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { forwardLife } from '@/lib/bff/lifeGateway';

// PATCH  /api/bff/life/skills/:id → edit a skill the caller owns.
// DELETE /api/bff/life/skills/:id → remove one.
//
// Ownership is NOT checked here. It is enforced in the service's WHERE clause
// against the session identity resolved from the token — a non-owner matches
// nothing. Re-checking it in the BFF from anything the client sent would be the
// weaker of the two answers pretending to be the stronger one (P5/P6).
const UpdateSkillSchema = z.object({
  level: z.enum(['LEARNING', 'PRACTISING', 'PROFICIENT', 'EXPERT']).optional(),
  note:  z.string().max(160).nullable().optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const parsed = UpdateSkillSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
  }
  return forwardLife(req, 'PATCH', `/api/identity/life/skills/${encodeURIComponent(id)}`, parsed.data);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return forwardLife(req, 'DELETE', `/api/identity/life/skills/${encodeURIComponent(id)}`);
}
