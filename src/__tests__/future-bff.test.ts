// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// «مستقبلي» — the BFF side (owner, 2026-10-31): only the sentence, the areas from the closed list,
// and a goal's area reach tec-life-service — never an owner. The talk route adds them to the
// coach's awareness only while the journey is kept.
const GW = 'https://api.example.com';
const session = { tec_access_token: 'tok' };
const makeReq = (method: string, body?: unknown) => new NextRequest('http://localhost/api/bff/life/x', {
  method, headers: { 'Content-Type': 'application/json', Cookie: 'tec_access_token=tok' }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
});
const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => data } as Response);
const sent = (spy: { mock: { calls: unknown[][] } }, i = 0) => JSON.parse(String((spy.mock.calls[i]?.[1] as RequestInit).body));

beforeEach(() => { vi.restoreAllMocks(); vi.resetModules(); process.env.API_GATEWAY_URL = GW; void session; });

describe('the future routes', () => {
  it('the vision: only the trimmed sentence; too long is refused', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(ok({ data: {} }));
    const { PUT } = await import('@/app/api/bff/life/future/vision/route');
    await PUT(makeReq('PUT', { statement: '  أكون أهدى ', user_id: 'u2' }));
    expect(String(spy.mock.calls[0]?.[0])).toBe(`${GW}/api/identity/life/future/vision`);
    expect(sent(spy)).toEqual({ statement: 'أكون أهدى' });
    expect((await PUT(makeReq('PUT', { statement: 'x'.repeat(301) }))).status).toBe(400);
  });

  it('the areas: a closed list, a short line each, nothing else', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(ok({ data: {} }));
    const { PUT } = await import('@/app/api/bff/life/future/areas/route');
    await PUT(makeReq('PUT', { areas: [{ area: 'HEALTH', note: ' ' }, { area: 'FAITH', note: 'صلاة الفجر' }], user_id: 'u2' }));
    expect(sent(spy)).toEqual({ areas: [{ area: 'HEALTH', note: null }, { area: 'FAITH', note: 'صلاة الفجر' }] });
    expect((await PUT(makeReq('PUT', { areas: [{ area: 'HOBBIES' }] }))).status).toBe(400);
    expect((await PUT(makeReq('PUT', { areas: [{ area: 'HEALTH', note: 'x'.repeat(161) }] }))).status).toBe(400);
  });

  it('a goal carries an area from the list, or none', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(ok({ data: {} }));
    const { PATCH } = await import('@/app/api/bff/life/goals/[id]/route');
    await PATCH(makeReq('PATCH', { area: 'WORK' }), { params: Promise.resolve({ id: 'g1' }) });
    expect(sent(spy)).toEqual({ area: 'WORK' });
    await PATCH(makeReq('PATCH', { area: null }), { params: Promise.resolve({ id: 'g1' }) });
    expect(sent(spy, 1)).toEqual({ area: null });
    expect((await PATCH(makeReq('PATCH', { area: 'HOBBIES' }), { params: Promise.resolve({ id: 'g1' }) })).status).toBe(400);
  });
});

describe('the coach is told — only while the journey is kept', () => {
  const route = (keeping: boolean) => vi.spyOn(globalThis, 'fetch').mockImplementation(async (u) => {
    const url = String(u);
    if (url.endsWith('/life/journey')) return ok({ data: { keeping, entries: [] } });
    if (url.endsWith('/life/future')) return ok({ data: { vision: 'أكون أهدى', areas: [{ area: 'FAMILY', note: null }] } });
    if (url.endsWith('/life/goals')) return ok({ data: { goals: [] } });
    return ok({ data: { reply: 'hi' } });
  });
  const talk = (spy: { mock: { calls: unknown[][] } }) =>
    JSON.parse(String((spy.mock.calls.find((c) => String(c[0]).endsWith('/ai/life/talk'))?.[1] as RequestInit).body));

  it('kept → the vision and the areas are in the awareness', async () => {
    const spy = route(true);
    const { POST } = await import('@/app/api/bff/life/talk/route');
    await POST(makeReq('POST', { messages: [{ role: 'user', content: 'hi' }] }));
    expect(talk(spy).awareness).toMatchObject({ vision: 'أكون أهدى', areas: [{ area: 'FAMILY', note: null }] });
  });

  it('not kept → not even read', async () => {
    const spy = route(false);
    const { POST } = await import('@/app/api/bff/life/talk/route');
    await POST(makeReq('POST', { messages: [{ role: 'user', content: 'hi' }] }));
    expect(talk(spy).awareness).toBeUndefined();
    expect(spy.mock.calls.some((c) => String(c[0]).endsWith('/life/future'))).toBe(false);
  });
});
