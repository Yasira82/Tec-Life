import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { forwardLife } from '@/lib/bff/lifeGateway';

// GET  /api/bff/life/goals  → the caller's own goals (C-106; scoped by session).
// POST /api/bff/life/goals  → create a self-declared goal.
export async function GET(req: NextRequest) {
  return forwardLife(req, 'GET', '/api/identity/life/goals');
}

const CreateGoalSchema = z.object({
  title:         z.string().min(1).max(200),
  description:   z.string().max(2000).optional(),
  target_date:   z.string().optional(),
  target_amount: z.number().positive().max(1_000_000_000).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = CreateGoalSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
  }
  return forwardLife(req, 'POST', '/api/identity/life/goals', parsed.data);
}
