// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// `readGateway` — the data-returning twin of `forwardLife`, for routes that put
// two services' answers side by side. Same identity rule (the session token and
// nothing else), and a failure is reported as `ok: false` WITH its status, so the
// route can say which half could not be read. It never invents a body.
const GW = 'https://api.example.com';

const req = (cookies?: Record<string, string>) => {
  const headers: Record<string, string> = {};
  if (cookies) headers['Cookie'] = Object.entries(cookies).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('; ');
  return new NextRequest('http://localhost/api/bff/life/x', { headers });
};
const session = { tec_access_token: 'tok' };

beforeEach(() => { vi.restoreAllMocks(); vi.resetModules(); process.env.API_GATEWAY_URL = GW; });

describe('readGateway', () => {
  it('503 before any network call when the gateway is not configured', async () => {
    process.env.API_GATEWAY_URL = '';
    const spy = vi.spyOn(globalThis, 'fetch');
    const { readGateway } = await import('@/lib/bff/lifeGateway');
    expect(await readGateway(req(session), '/api/x')).toEqual({ ok: false, status: 503, data: null });
    expect(spy).not.toHaveBeenCalled();
  });

  it('401 without a session token, before any network call', async () => {
    const spy = vi.spyOn(globalThis, 'fetch');
    const { readGateway } = await import('@/lib/bff/lifeGateway');
    expect(await readGateway(req(), '/api/x')).toEqual({ ok: false, status: 401, data: null });
    expect(spy).not.toHaveBeenCalled();
  });

  it('sends the token as the only identity and unwraps `data`', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true, data: { caps: [] } }) } as Response);
    const { readGateway } = await import('@/lib/bff/lifeGateway');
    const out = await readGateway(req(session), '/api/identity/life/budget');
    expect(out).toEqual({ ok: true, status: 200, data: { caps: [] } });
    const init = spy.mock.calls[0]?.[1] as RequestInit;
    const h = init.headers as Record<string, string>;
    expect(String(spy.mock.calls[0]?.[0])).toBe(`${GW}/api/identity/life/budget`);
    expect(h.Authorization).toBe('Bearer tok');
    expect(h['x-internal-key']).toBeUndefined();
    expect(h['x-user-id']).toBeUndefined();
    expect(init.cache).toBe('no-store');
  });

  it('a non-2xx answer is ok:false with that status and no body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 403, json: async () => ({ error: 'Forbidden' }) } as Response);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { readGateway } = await import('@/lib/bff/lifeGateway');
    expect(await readGateway(req(session), '/api/x')).toEqual({ ok: false, status: 403, data: null });
  });

  it('a network failure is 503, logged, never thrown', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNRESET'));
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { readGateway } = await import('@/lib/bff/lifeGateway');
    expect(await readGateway(req(session), '/api/x')).toEqual({ ok: false, status: 503, data: null });
    expect(err).toHaveBeenCalled();
  });
});
