import { NextRequest, NextResponse } from 'next/server';

// Server-only proxy to tec-identity-service (Life store) through the API Gateway.
//   gateway: ${GW}/api/identity/life/* → identity-service /identity/life/*
//   auth:    the user's Bearer token (cookie) + x-internal-key. Identity is the
//            session — resolved server-side by the service from the token, never a
//            body/query param (C-106 §6 / P6). Fail closed: no session → 401.
const GW = process.env.API_GATEWAY_URL ?? '';


type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

/** Forward an authenticated Life request to the gateway, passing the response through. */
export async function forwardLife(
  req: NextRequest,
  method: Method,
  gatewayPath: string,
  body?: unknown,
): Promise<NextResponse> {
  if (!GW) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  // The session token is the ONLY identity sent. identity-service verifies it
  // (HS256) and takes the owner from it; the gateway strips any caller-supplied
  // x-user-id and rewrites it from the verified token. This used to send
  // `x-user-id` read from the `tec_user` cookie — a client-controlled value the
  // gateway discarded — and `x-internal-key`, which the gateway adds itself on
  // every proxied request and which marks the caller as a SERVICE. A Life route
  // gated on ServiceActor would have been open to every signed-in user through
  // here (the Hub's campaign routes avoid the key for the same reason).
  const token = req.cookies.get('tec_access_token')?.value ?? '';
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization:  `Bearer ${token}`,
    'x-request-id': crypto.randomUUID(),
  };

  const init: RequestInit = { method, headers, cache: 'no-store' };
  if (body !== undefined) init.body = JSON.stringify(body);

  try {
    const res  = await fetch(`${GW}${gatewayPath}`, init);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) console.error('[bff/life] gateway error:', res.status, method, gatewayPath);
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[bff/life] network error:', (err as Error).message, gatewayPath);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}
