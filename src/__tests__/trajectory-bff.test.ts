// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// TEC Life — trajectory BFF (C-106 §4, "where the user is headed").
//
// The window is the ONLY thing a caller may choose. The owner is resolved from
// the session by identity-service and is never in the URL — a trajectory route
// that accepted a user id would hand one person another's pace, goals and
// deadlines in a single GET.
const GW = 'https://api.example.com';
process.env.API_GATEWAY_URL = GW;
process.env.INTERNAL_SECRET = 'secret';

const makeReq = (query = '', cookies?: Record<string, string>) => {
  const headers: Record<string, string> = {};
  if (cookies) {
    headers['Cookie'] = Object.entries(cookies)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('; ');
  }
  return new NextRequest(`http://localhost/api/bff/life/trajectory${query}`, { method: 'GET', headers });
};
const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => data } as Response);

const callWith = async (query: string) => {
  const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(ok({ data: { trajectory: {} } }));
  const { GET } = await import('@/app/api/bff/life/trajectory/route');
  await GET(makeReq(query, { tec_access_token: 'tok', tec_user: JSON.stringify({ id: 'u1' }) }));
  const url = String(spy.mock.calls.at(-1)?.[0] ?? '');
  spy.mockRestore();
  return url;
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  process.env.API_GATEWAY_URL = GW;
  process.env.INTERNAL_SECRET = 'secret';
});

describe('GET /api/bff/life/trajectory', () => {
  it('401 without a session — a pace is personal data (P6)', async () => {
    const { GET } = await import('@/app/api/bff/life/trajectory/route');
    expect((await GET(makeReq())).status).toBe(401);
  });

  it('forwards to the own-scope identity route with the default window', async () => {
    expect(await callWith('')).toBe(`${GW}/api/identity/life/trajectory?window_days=30`);
  });

  it('passes a sane window through', async () => {
    expect(await callWith('?window_days=90')).toContain('window_days=90');
  });

  it('clamps rather than forwarding whatever arrived', async () => {
    // Clamped here AND in the service. One guard is a guard that gets
    // refactored away by someone who cannot see the other side.
    expect(await callWith('?window_days=100000')).toContain('window_days=365');
    expect(await callWith('?window_days=1')).toContain('window_days=7');
    expect(await callWith('?window_days=-30')).toContain('window_days=7');
    expect(await callWith('?window_days=banana')).toContain('window_days=30');
    // `Number(null)` is 0, not NaN. Reading the param straight into the clamp
    // turned "no window given" into the SMALLEST window — a seven-day pace
    // presented as the thirty-day one, which is not a rounding error, it is a
    // different number with the same label.
    expect(await callWith('?window_days=')).toContain('window_days=30');
  });

  it('never lets a caller name the owner', async () => {
    // The extra params are dropped on the floor: the forwarded URL is built
    // from the clamped window alone, so there is nothing to smuggle through.
    const url = await callWith('?window_days=30&user_id=someone-else&username=victim');
    expect(url).toBe(`${GW}/api/identity/life/trajectory?window_days=30`);
    expect(url).not.toMatch(/user|victim/i);
  });
});
