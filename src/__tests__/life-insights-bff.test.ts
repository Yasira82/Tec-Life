// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// TEC Life — Goal Insights BFF (C-106). Life Pro's standalone service: a DEEPER aggregate
// of the caller's OWN goals. Identity is the session (P6 — backend resolves it from the
// token); the aggregate is gated behind the caller's LIVE subscription (P5). A non-Pro
// sees `{ pro: false }` (teaser), a Pro sees the insights.
const GW = 'https://api.example.com';
process.env.API_GATEWAY_URL = GW;
process.env.INTERNAL_SECRET = 'secret';

const makeReq = (cookies?: Record<string, string>) => {
  const cookieStr = cookies ? Object.entries(cookies).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('; ') : '';
  const headers: Record<string, string> = {};
  if (cookieStr) headers['Cookie'] = cookieStr;
  return new NextRequest('http://localhost/api/bff/life/goals/insights', { method: 'GET', headers });
};
const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => data } as Response);

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  process.env.API_GATEWAY_URL = GW;
  process.env.INTERNAL_SECRET = 'secret';
});

describe('GET /api/bff/life/goals/insights (Pro Goal Insights, gated)', () => {
  it('401 without a session', async () => {
    const { GET } = await import('@/app/api/bff/life/goals/insights/route');
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it('non-Pro → { pro:false } and NEVER fetches the insights aggregate (P5 gate)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(ok({ data: { plan: 'FREE', isActive: true } })); // sub = not Pro
    const { GET } = await import('@/app/api/bff/life/goals/insights/route');
    const res  = await GET(makeReq({ tec_access_token: 'tok' }));
    const json = await res.json();
    expect(json.pro).toBe(false);
    expect(json.insights).toBeNull();
    expect(fetchSpy.mock.calls.every(([u]) => !String(u).includes('/life/goals/insights'))).toBe(true);
    fetchSpy.mockRestore();
  });

  it('Pro → returns the owner’s goal insights', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(ok({ data: { plan: 'PRO', isActive: true, isExpired: false } }))          // sub = Pro
      .mockResolvedValueOnce(ok({ data: { insights: { total: 4, completionRate: 33, reached: 1 } } })); // insights
    const { GET } = await import('@/app/api/bff/life/goals/insights/route');
    const res  = await GET(makeReq({ tec_access_token: 'tok' }));
    const json = await res.json();
    expect(json.pro).toBe(true);
    expect(json.insights.total).toBe(4);
    const insightsCall = fetchSpy.mock.calls.find(([u]) => String(u).includes('/api/identity/life/goals/insights'));
    expect(insightsCall).toBeDefined();
    fetchSpy.mockRestore();
  });
});
