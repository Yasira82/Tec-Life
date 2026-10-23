import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { forwardLife } from '@/lib/bff/lifeGateway';

// GET  /api/bff/life/journey — the caller's own kept summaries, and whether keeping is on.
// POST /api/bff/life/journey — keep ONE summary the person read, edited and confirmed.
//
// Life memory v1 (owner, 2026-10-17). Only the summary's fields are forwarded: never a
// conversation, never an owner. tec-life-service refuses the POST unless the person
// has turned keeping (JOURNEY) on, and takes the owner from the session token.
const EntrySchema = z.object({
  problem:       z.string().trim().min(1).max(300),
  understanding: z.string().trim().min(1).max(800),
  step:          z.string().trim().max(300).nullable().optional(),
  // Personal memory (owner, 2026-10-23) — each optional, each confirmed by the person.
  tried:         z.string().trim().max(300).nullable().optional(),
  helped:        z.string().trim().max(300).nullable().optional(),
  triggers:      z.string().trim().max(300).nullable().optional(),
  reason:        z.string().trim().max(300).nullable().optional(),
});

export async function GET(req: NextRequest) {
  return forwardLife(req, 'GET', '/api/identity/life/journey');
}

export async function POST(req: NextRequest) {
  const parsed = EntrySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
  const { problem, understanding, step, tried, helped, triggers, reason } = parsed.data;
  // Only the memory fields the person filled travel; an empty one is not sent.
  const memory = Object.fromEntries(Object.entries({ tried, helped, triggers, reason }).filter(([, v]) => v));
  return forwardLife(req, 'POST', '/api/identity/life/journey', { problem, understanding, step: step || null, ...memory });
}
