import { NextRequest } from 'next/server';
import { forwardLife } from '@/lib/bff/lifeGateway';

// GET /api/bff/subscription — the caller's subscription (plan + status), read from
// commerce-service (the Subscription owner — C-47 Canonical Entities). Identity is the
// session, resolved server-side (P6). Life reads this to reflect Pro entitlement; it
// never owns or invents the plan. forwardLife just proxies to the gateway with the
// user's auth (the "life" in its name is historical — it forwards any gateway path).
export async function GET(req: NextRequest) {
  return forwardLife(req, 'GET', '/api/commerce/subscriptions/status');
}
