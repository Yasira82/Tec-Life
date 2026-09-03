import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { forwardLife } from '@/lib/bff/lifeGateway';

// GET  /api/bff/life/skills → the caller's own skills (C-106 §4; scoped by session).
// POST /api/bff/life/skills → declare a skill.
//
// There is no read-by-username here and there never will be: C-106 §6 gives
// other users NO access to Life data, so the endpoint has nowhere to exist.
export async function GET(req: NextRequest) {
  return forwardLife(req, 'GET', '/api/identity/life/skills');
}

// The ladder is pinned HERE as well as in the service, and that is not
// duplication for its own sake: this is the untrusted boundary, and a value the
// backend has to reject is a round trip that should not have left the phone.
// The service still validates — the backend is the authority (P5), this is
// pre-validation.
const Level = z.enum(['LEARNING', 'PRACTISING', 'PROFICIENT', 'EXPERT']);

const AddSkillSchema = z.object({
  name:  z.string().trim().min(2).max(80),
  level: Level.optional(),
  note:  z.string().max(160).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = AddSkillSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
  }
  return forwardLife(req, 'POST', '/api/identity/life/skills', parsed.data);
}
