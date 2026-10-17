import { NextRequest } from 'next/server';
import { forwardLife } from '@/lib/bff/lifeGateway';

// GET /api/bff/life/admin/session-counts — the owner's stage 1 reading. The
// service decides who is an admin, from the verified token; a person gets 403.
export async function GET(req: NextRequest) {
  return forwardLife(req, 'GET', '/api/identity/life/admin/session-counts');
}
