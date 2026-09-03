import { NextRequest } from 'next/server';
import { forwardLife } from '@/lib/bff/lifeGateway';

// GET/PUT /api/bff/life/consent — the caller's own consent grants, per data
// category (C-106 §11 P0-1: "consent schema, category-level, timestamped").
//
// The owner is the session, resolved by identity-service. A consent route that
// accepted an owner would let one person answer a privacy question on another's
// behalf, which is the exact opposite of what consent is.
export async function GET(req: NextRequest) {
  return forwardLife(req, 'GET', '/api/identity/life/consent');
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  // Only the map is forwarded. Anything else in the body — an id, a username —
  // is dropped here rather than trusted downstream.
  return forwardLife(req, 'PUT', '/api/identity/life/consent', {
    consent: (body as { consent?: unknown })?.consent ?? {},
  });
}
