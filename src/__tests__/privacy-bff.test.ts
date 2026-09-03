// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// TEC Life — consent (C-106 §11 P0-1) and the right to delete (§5).
//
// Both routes are own-scope: the session decides whose consent is answered and
// whose data is erased. A consent route that accepted an owner would let one
// person answer a privacy question on another's behalf; a purge route that did
// would let them delete a stranger's life.
const GW = 'https://api.example.com';
process.env.API_GATEWAY_URL = GW;
process.env.INTERNAL_SECRET = 'secret';

const session = { tec_access_token: 'tok', tec_user: JSON.stringify({ id: 'u1' }) };

const makeReq = (method: string, cookies?: Record<string, string>, body?: unknown) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cookies) {
    headers['Cookie'] = Object.entries(cookies)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('; ');
  }
  return new NextRequest('http://localhost/api/bff/life/x', {
    method, headers, ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
};
const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => data } as Response);

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  process.env.API_GATEWAY_URL = GW;
  process.env.INTERNAL_SECRET = 'secret';
});

describe('consent', () => {
  it('401 without a session, on both the read and the write', async () => {
    const { GET, PUT } = await import('@/app/api/bff/life/consent/route');
    expect((await GET(makeReq('GET'))).status).toBe(401);
    expect((await PUT(makeReq('PUT', undefined, { consent: { GOALS: true } }))).status).toBe(401);
  });

  it('reads the caller’s own grants', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(ok({ data: { consent: [] } }));
    const { GET } = await import('@/app/api/bff/life/consent/route');
    await GET(makeReq('GET', session));
    expect(String(spy.mock.calls[0]?.[0])).toBe(`${GW}/api/identity/life/consent`);
    spy.mockRestore();
  });

  it('forwards ONLY the consent map — nothing else in the body is trusted', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(ok({ data: { consent: [] } }));
    const { PUT } = await import('@/app/api/bff/life/consent/route');
    await PUT(makeReq('PUT', session, {
      consent: { GOALS: true },
      user_id: 'someone-else',   // ignored
      username: 'victim',        // ignored
    }));
    const sent = JSON.parse(String(spy.mock.calls[0]?.[1]?.body));
    expect(sent).toEqual({ consent: { GOALS: true } });
    spy.mockRestore();
  });

  it('sends an empty map rather than undefined when the body is junk', async () => {
    // The service treats an empty map as "change nothing". Forwarding
    // `undefined` would make it a 400 for a caller who simply sent nothing.
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(ok({ data: { consent: [] } }));
    const { PUT } = await import('@/app/api/bff/life/consent/route');
    await PUT(makeReq('PUT', session));
    expect(JSON.parse(String(spy.mock.calls[0]?.[1]?.body))).toEqual({ consent: {} });
    spy.mockRestore();
  });
});

describe('purge', () => {
  it('401 without a session — this one deletes things', async () => {
    const { DELETE } = await import('@/app/api/bff/life/data/route');
    expect((await DELETE(makeReq('DELETE'))).status).toBe(401);
  });

  it('DELETEs the caller’s Life data and nothing that names an owner', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(ok({ data: { purged: true } }));
    const { DELETE } = await import('@/app/api/bff/life/data/route');
    await DELETE(makeReq('DELETE', session));
    const [url, init] = spy.mock.calls[0] ?? [];
    expect(String(url)).toBe(`${GW}/api/identity/life/data`);
    expect((init as RequestInit)?.method).toBe('DELETE');
    // No body at all: the only input is the session.
    expect((init as RequestInit)?.body).toBeUndefined();
    spy.mockRestore();
  });

  it('targets /data, not the whole of Life — the path names what it deletes', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(ok({ data: { purged: true } }));
    const { DELETE } = await import('@/app/api/bff/life/data/route');
    await DELETE(makeReq('DELETE', session));
    expect(String(spy.mock.calls[0]?.[0])).toMatch(/\/life\/data$/);
    spy.mockRestore();
  });
});
