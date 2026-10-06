// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// L1 — the budget and cash-flow BFF (C-106 §10 Phase 1 · Tec-Life #73).
//
// The caps come from identity-service (Life's own); spending and payouts come
// from the services that own them and are PRESENTED beside the caps. The two
// are read with the session as the only identity, each half can fail alone,
// and a half that could not be read is null with its status — never a 0.
const GW = 'https://api.example.com';
process.env.API_GATEWAY_URL = GW;

const session = { tec_access_token: 'tok', tec_user: JSON.stringify({ id: 'u1' }) };

const makeReq = (path: string, method = 'GET', cookies?: Record<string, string>, body?: unknown) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cookies) headers['Cookie'] = Object.entries(cookies).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('; ');
  return new NextRequest(`http://localhost${path}`, { method, headers, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
};
const res = (status: number, body: unknown) => ({ ok: status < 400, status, json: async () => body } as Response);

const CAPS = { success: true, data: { period: '2026-10', caps: [{ category: 'ecommerce', cap_pi: '40', updated_at: 'x' }] } };
const PAYS = { success: true, data: { payments: [{ amount: '12.5', status: 'completed', source: 'ecommerce', created_at: '2026-10-05T00:00:00Z' }], pagination: { hasNext: false } } };

beforeEach(() => { vi.restoreAllMocks(); vi.resetModules(); process.env.API_GATEWAY_URL = GW; });

describe('GET /api/bff/life/budget', () => {
  it('401 without a session — a budget is personal data (P6)', async () => {
    const { GET } = await import('@/app/api/bff/life/budget/route');
    expect((await GET(makeReq('/api/bff/life/budget'))).status).toBe(401);
  });

  it('400 on a period that is not a month', async () => {
    const { GET } = await import('@/app/api/bff/life/budget/route');
    expect((await GET(makeReq('/api/bff/life/budget?period=2026-13', 'GET', session))).status).toBe(400);
  });

  it('reads the caps from identity and the month\'s completed payments from payment-service, with the session only', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (u) => String(u).includes('/identity/') ? res(200, CAPS) : res(200, PAYS));
    const { GET } = await import('@/app/api/bff/life/budget/route');
    const r = await GET(makeReq('/api/bff/life/budget?period=2026-10', 'GET', session));
    const body = await r.json();
    const urls = spy.mock.calls.map((c) => String(c[0]));
    expect(urls).toContain(`${GW}/api/identity/life/budget?period=2026-10`);
    expect(urls.find((u) => u.includes('/api/payment/history'))).toMatch(/status=completed&from=2026-10-01T00%3A00%3A00\.000Z&to=2026-11-01T00%3A00%3A00\.000Z&limit=100/);
    for (const c of spy.mock.calls) {
      const h = (c[1] as RequestInit).headers as Record<string, string>;
      expect(h.Authorization).toBe('Bearer tok');
      expect(h['x-internal-key']).toBeUndefined();
      expect(h['x-user-id']).toBeUndefined();
    }
    expect(body.data.lines).toEqual([{ category: 'ecommerce', cap_pi: '40', spent_pi: '12.5', pct: 31.25, over: false }]);
    expect(body.data.spent_total).toBe('12.5');
    expect(body.data.spent_status).toBeNull();
  });

  it('a payment-service failure leaves the caps and makes spending null with its status — never 0', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (u) => String(u).includes('/identity/') ? res(200, CAPS) : res(503, {}));
    const { GET } = await import('@/app/api/bff/life/budget/route');
    const body = await (await GET(makeReq('/api/bff/life/budget', 'GET', session))).json();
    expect(body.data.lines[0]).toMatchObject({ cap_pi: '40', spent_pi: null, pct: null, over: null });
    expect(body.data.spent_total).toBeNull();
    expect(body.data.spent_status).toBe(503);
  });

  it('more payments than one page is "partial" — an understated sum would read as under budget', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (u) => String(u).includes('/identity/')
      ? res(200, CAPS) : res(200, { data: { payments: PAYS.data.payments, pagination: { hasNext: true } } }));
    const { GET } = await import('@/app/api/bff/life/budget/route');
    const body = await (await GET(makeReq('/api/bff/life/budget', 'GET', session))).json();
    expect(body.data.spent_status).toBe('partial');
    expect(body.data.lines[0].spent_pi).toBeNull();
  });

  it('an identity failure fails the route — the caps are the screen\'s own data', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (u) => String(u).includes('/identity/') ? res(500, {}) : res(200, PAYS));
    const { GET } = await import('@/app/api/bff/life/budget/route');
    expect((await GET(makeReq('/api/bff/life/budget', 'GET', session))).status).toBe(500);
  });
});

describe('PUT /api/bff/life/budget · DELETE /api/bff/life/budget/:category', () => {
  it('validates the cap before forwarding, then forwards to identity with the session only', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(res(200, CAPS));
    const { PUT } = await import('@/app/api/bff/life/budget/route');
    expect((await PUT(makeReq('/api/bff/life/budget', 'PUT', session, { category: 'Shop', cap_pi: 1 }))).status).toBe(400);
    expect((await PUT(makeReq('/api/bff/life/budget', 'PUT', session, { category: 'ecommerce', cap_pi: '0' }))).status).toBe(400);
    expect((await PUT(makeReq('/api/bff/life/budget', 'PUT', session, { category: 'ecommerce', cap_pi: '1e3' }))).status).toBe(400);
    expect(spy).not.toHaveBeenCalled();

    const r = await PUT(makeReq('/api/bff/life/budget', 'PUT', session, { category: 'ecommerce', cap_pi: '40', period: '2026-10' }));
    expect(r.status).toBe(200);
    const call = spy.mock.calls[0]!;
    const init = call[1] as RequestInit;
    expect(String(call[0])).toBe(`${GW}/api/identity/life/budget`);
    expect(init.method).toBe('PUT');
    expect(JSON.parse(String(init.body))).toEqual({ category: 'ecommerce', cap_pi: '40', period: '2026-10' });
    expect((init.headers as Record<string, string>)['x-internal-key']).toBeUndefined();
  });

  it('DELETE forwards the category and period; a bad category never reaches the gateway', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(res(200, { data: { removed: true } }));
    const { DELETE } = await import('@/app/api/bff/life/budget/[category]/route');
    const bad = await DELETE(makeReq('/api/bff/life/budget/Shop', 'DELETE', session), { params: Promise.resolve({ category: 'Shop' }) });
    expect(bad.status).toBe(400);
    expect(spy).not.toHaveBeenCalled();
    await DELETE(makeReq('/api/bff/life/budget/ecommerce?period=2026-10', 'DELETE', session), { params: Promise.resolve({ category: 'ecommerce' }) });
    expect(String(spy.mock.calls[0]?.[0])).toBe(`${GW}/api/identity/life/budget/ecommerce?period=2026-10`);
  });
});

describe('GET /api/bff/life/cashflow', () => {
  const PAYOUTS = { success: true, data: { owed: '0', sent: '3', payouts: [{ status: 'SENT', amount: '3', sent_at: '2026-10-02T10:00:00Z', source: 'order' }] } };

  it('401 without a session', async () => {
    const { GET } = await import('@/app/api/bff/life/cashflow/route');
    expect((await GET(makeReq('/api/bff/life/cashflow'))).status).toBe(401);
  });

  it('in from commerce payouts, out from payments, net only when both are known', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (u) => String(u).includes('/commerce/payouts/mine') ? res(200, PAYOUTS) : res(200, PAYS));
    const { GET } = await import('@/app/api/bff/life/cashflow/route');
    const body = await (await GET(makeReq('/api/bff/life/cashflow?period=2026-10', 'GET', session))).json();
    expect(body.data.in.total).toBe('3');
    expect(body.data.out.total).toBe('12.5');
    expect(body.data.net).toBe('-9.5');
  });

  it('a side that could not be read is null with its status, and there is no net', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (u) => String(u).includes('/commerce/payouts/mine') ? res(502, {}) : res(200, PAYS));
    const { GET } = await import('@/app/api/bff/life/cashflow/route');
    const body = await (await GET(makeReq('/api/bff/life/cashflow', 'GET', session))).json();
    expect(body.data.in).toBeNull();
    expect(body.data.in_status).toBe(502);
    expect(body.data.out.total).toBe('12.5');
    expect(body.data.net).toBeNull();
  });
});

describe('the routes forward the person, never a service credential', () => {
  const read = (p: string) => readFileSync(join(process.cwd(), 'src', p), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  for (const p of ['app/api/bff/life/budget/route.ts', 'app/api/bff/life/budget/[category]/route.ts', 'app/api/bff/life/cashflow/route.ts', 'lib/bff/lifeGateway.ts']) {
    it(`${p} carries no x-internal-key and no INTERNAL_SECRET`, () => {
      const src = read(p);
      expect(src).not.toContain('x-internal-key');
      expect(src).not.toContain('INTERNAL_SECRET');
    });
  }
});
