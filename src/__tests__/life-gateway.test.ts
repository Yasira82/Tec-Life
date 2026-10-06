/**
 * forwardLife — the one door every /api/bff/life/* route goes through.
 *
 * Identity is the session token and nothing else. It used to add `x-user-id`
 * from the `tec_user` cookie (client-controlled; the gateway discards it) and
 * `x-internal-key` (the gateway adds it itself, and it marks the caller as a
 * SERVICE — a ServiceActor-gated Life route would have been open to every
 * signed-in user). Pinned here so neither comes back.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// `API_GATEWAY_URL` is read once, when the module loads — so load it AFTER the env is set.
type Forward = typeof import('../lib/bff/lifeGateway')['forwardLife'];
let forwardLife: Forward;

const req = (cookies: Record<string, string> = {}) => {
  const r = new NextRequest('http://life.test/api/bff/life/goals');
  for (const [k, v] of Object.entries(cookies)) r.cookies.set(k, v);
  return r;
};

const saved = { gw: process.env.API_GATEWAY_URL, secret: process.env.INTERNAL_SECRET };
beforeEach(async () => {
  process.env.API_GATEWAY_URL = 'http://gw.test';
  process.env.INTERNAL_SECRET = 'a-secret-that-must-not-be-forwarded-by-the-bff';
  vi.resetModules();
  ({ forwardLife } = await import('../lib/bff/lifeGateway'));
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ goals: [] }) })));
});
afterEach(() => {
  vi.unstubAllGlobals();
  process.env.API_GATEWAY_URL = saved.gw;
  process.env.INTERNAL_SECRET = saved.secret;
});

describe('forwardLife', () => {
  it('401 without a session token — even with a tec_user cookie', async () => {
    const res = await forwardLife(req({ tec_user: encodeURIComponent('{"id":"u1"}') }), 'GET', '/api/identity/life/goals');
    expect(res.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('sends the token as the only identity — no x-user-id, no x-internal-key', async () => {
    const res = await forwardLife(
      req({ tec_access_token: 'tok', tec_user: encodeURIComponent('{"id":"someone-else"}') }),
      'GET', '/api/identity/life/goals',
    );
    expect(res.status).toBe(200);
    const [url, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://gw.test/api/identity/life/goals');
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer tok');
    expect(Object.keys(headers).map((k) => k.toLowerCase())).not.toContain('x-user-id');
    expect(Object.keys(headers).map((k) => k.toLowerCase())).not.toContain('x-internal-key');
    expect(JSON.stringify(init)).not.toContain(process.env.INTERNAL_SECRET);
  });

  it('a signed-in user without the tec_user cookie is not turned away', async () => {
    const res = await forwardLife(req({ tec_access_token: 'tok' }), 'GET', '/api/identity/life/goals');
    expect(res.status).toBe(200);
  });

  it('503 when the gateway is not configured, before any network call', async () => {
    process.env.API_GATEWAY_URL = '';
    vi.resetModules();
    const { forwardLife: fresh } = await import('../lib/bff/lifeGateway');
    const res = await fresh(req({ tec_access_token: 'tok' }), 'GET', '/api/identity/life/goals');
    expect(res.status).toBe(503);
    expect(fetch).not.toHaveBeenCalled();
  });
});
