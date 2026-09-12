import { NextRequest, NextResponse } from 'next/server';
import { isTestnetHost } from '@/lib/pi-network';
import { forwardLife } from '@/lib/bff/lifeGateway';

// GET /api/bff/subscription — the caller's subscription (plan + status), read from
// commerce-service (the Subscription owner — C-47 Canonical Entities). Identity is the
// session, resolved server-side (P6). Life reads this to reflect Pro entitlement; it
// never owns or invents the plan. forwardLife just proxies to the gateway with the
// user's auth (the "life" in its name is historical — it forwards any gateway path).
// A Testnet host activates NOTHING: commerce refuses to grant PRO from a payment
// marked `testnet` (Test-Pi never buys anything real). So this host must not
// DISPLAY an entitlement either — otherwise the owner's real Mainnet subscription
// shows through on the test network, and the screen says "You're on Pro" about a
// plan nothing here can grant, renew or expire. Same envelope as a real answer, so
// every reader parses one shape.
const FREE_ON_TESTNET = {
  success: true,
  data: {
    subscription: {
      plan: 'FREE', status: 'ACTIVE', isActive: false, isExpired: false,
      current_period_end: null, daysRemaining: null, testnet: true,
    },
  },
};

export async function GET(req: NextRequest) {
  // From THIS ROUTE'S OWN Host header, server-side — never the client, and never
  // a build constant: one build serves both hosts.
  if (isTestnetHost(req.headers.get('host'))) {
    return NextResponse.json(FREE_ON_TESTNET, { status: 200 });
  }
  return forwardLife(req, 'GET', '/api/commerce/subscriptions/status');
}
