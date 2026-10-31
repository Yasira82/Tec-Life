import { NextRequest } from 'next/server';
import { forwardLife } from '@/lib/bff/lifeGateway';

// GET /api/bff/life/future — «مستقبلي»: the person's one-year vision and the life areas they chose
// (owner, 2026-10-31). Owner from the session in tec-life-service; nothing about the person is sent.
export async function GET(req: NextRequest) {
  return forwardLife(req, 'GET', '/api/identity/life/future');
}
