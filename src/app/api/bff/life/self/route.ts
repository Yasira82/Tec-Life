import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { forwardLife } from '@/lib/bff/lifeGateway';

// GET /api/bff/life/self — "who I am becoming": the person's one sentence, and whether keeping is on.
// PUT /api/bff/life/self — write it, or clear it with an empty sentence.
// Owner, 2026-10-23 («صفحة أنا بتغيّر»). Only the sentence is forwarded — never an owner;
// tec-life-service takes the owner from the session and refuses the write unless JOURNEY is on.
const SelfSchema = z.object({ statement: z.string().trim().max(200) });

export async function GET(req: NextRequest) {
  return forwardLife(req, 'GET', '/api/identity/life/self');
}

export async function PUT(req: NextRequest) {
  const parsed = SelfSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
  return forwardLife(req, 'PUT', '/api/identity/life/self', { statement: parsed.data.statement });
}
