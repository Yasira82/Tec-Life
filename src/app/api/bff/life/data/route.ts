import { NextRequest } from 'next/server';
import { forwardLife } from '@/lib/bff/lifeGateway';

// DELETE /api/bff/life/data — purge the caller's own Life data (C-106 §5).
//
// Goals, skills, preferences and the consent grants. NOT the TEC account and
// NOT payment records: Life does not own those and may not remove them (C-106
// §4). The path says `data` for that reason — this is "delete my Life data",
// not "delete my account", and the difference is the whole point.
//
// Irreversible, so there is no request body to get wrong: the only input is the
// session, and the confirmation lives in the UI where a person can read it.
export async function DELETE(req: NextRequest) {
  return forwardLife(req, 'DELETE', '/api/identity/life/data');
}
