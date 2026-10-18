import { NextRequest, NextResponse } from 'next/server';
import { forwardLife } from '@/lib/bff/lifeGateway';

// GET/PUT/DELETE /api/bff/life/conversations/:id — one kept conversation of the caller.
// PUT forwards only `messages`; tec-life-service refuses it unless the person turned
// keeping full conversations on, encrypts it, and takes the owner from the session.
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const path = (id: string) => `/api/identity/life/conversations/${encodeURIComponent(id)}`;
type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!ID.test(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  return forwardLife(req, 'GET', path(id));
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!ID.test(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const messages = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(messages)) return NextResponse.json({ error: 'Invalid conversation' }, { status: 400 });
  return forwardLife(req, 'PUT', path(id), { messages });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!ID.test(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  return forwardLife(req, 'DELETE', path(id));
}
