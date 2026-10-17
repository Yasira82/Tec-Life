// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { LIFE_DATA_CATEGORIES } from '@/lib-client/life/useLife';
import { DICTIONARIES } from '@/lib/i18n/dictionaries';
import { LOCALES } from '@/lib/i18n/locales';

// Life memory v1 (owner, 2026-10-17) — the BFF side. What is pinned:
//   • only the three summary fields reach tec-life-service, never an owner;
//   • the memory sent to the AI comes from Life, server-side, and only while keeping
//     is on — the page cannot supply one;
//   • the JOURNEY switch is named, explained and says turning it off deletes.
const GW = 'https://api.example.com';
const session = { tec_access_token: 'tok' };
const makeReq = (method: string, cookies?: Record<string, string>, body?: unknown) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cookies) headers['Cookie'] = Object.entries(cookies).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('; ');
  return new NextRequest('http://localhost/api/bff/life/x', { method, headers, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
};
const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => data } as Response);
const NOTE = { id: 'j1', problem: 'p', understanding: 'u', step: 's', step_outcome: 'DONE', created_at: '2026-10-10T09:00:00.000Z' };

beforeEach(() => { vi.restoreAllMocks(); vi.resetModules(); process.env.API_GATEWAY_URL = GW; });

describe('POST /api/bff/life/journey', () => {
  it('forwards only the three fields — an owner or a conversation in the body goes nowhere', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(ok({ data: { entry: {} } }));
    const { POST } = await import('@/app/api/bff/life/journey/route');
    await POST(makeReq('POST', session, { problem: ' p ', understanding: 'u', step: '', user_id: 'u2', messages: ['x'] }));
    expect(String(spy.mock.calls[0]?.[0])).toBe(`${GW}/api/identity/life/journey`);
    expect(JSON.parse(String(spy.mock.calls[0]?.[1]?.body))).toEqual({ problem: 'p', understanding: 'u', step: null });
  });

  it('refuses a summary that is too long or missing, and no session', async () => {
    const spy = vi.spyOn(globalThis, 'fetch');
    const { POST } = await import('@/app/api/bff/life/journey/route');
    expect((await POST(makeReq('POST', session, { problem: 'p', understanding: 'x'.repeat(801) }))).status).toBe(400);
    expect((await POST(makeReq('POST', session, { understanding: 'u' }))).status).toBe(400);
    expect((await POST(makeReq('POST', undefined, { problem: 'p', understanding: 'u' }))).status).toBe(401);
    expect(spy).not.toHaveBeenCalled();
  });

  it('the outcome is a closed set', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(ok({}));
    const { PATCH } = await import('@/app/api/bff/life/journey/[id]/route');
    const params = Promise.resolve({ id: 'j1' });
    expect((await PATCH(makeReq('PATCH', session, { step_outcome: 'I did it' }), { params })).status).toBe(400);
    await PATCH(makeReq('PATCH', session, { step_outcome: 'NOT_YET' }), { params: Promise.resolve({ id: 'j1' }) });
    expect(String(spy.mock.calls[0]?.[0])).toBe(`${GW}/api/identity/life/journey/j1`);
  });
});

describe('POST /api/bff/life/talk — the memory comes from Life, not from the page', () => {
  const talkBody = (spy: { mock: { calls: unknown[][] } }) =>
    JSON.parse(String((spy.mock.calls.find((c) => String(c[0]).endsWith('/ai/life/talk'))?.[1] as RequestInit).body));

  it('keeping on → the three newest kept summaries are attached', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (u) =>
      String(u).endsWith('/life/journey') ? ok({ data: { keeping: true, entries: [NOTE, NOTE, NOTE, NOTE] } }) : ok({ data: { reply: 'hi' } }));
    const { POST } = await import('@/app/api/bff/life/talk/route');
    await POST(makeReq('POST', session, { messages: [{ role: 'user', content: 'x' }] }));
    const body = talkBody(spy);
    expect(body.memory).toHaveLength(3);
    expect(Object.keys(body.memory[0]).sort()).toEqual(['created_at', 'problem', 'step', 'step_outcome', 'understanding']);
  });

  it('keeping off, or the read failing → no memory; a memory sent by the page is ignored', async () => {
    for (const journey of [ok({ data: { keeping: false, entries: [NOTE] } }), { ok: false, status: 503, json: async () => ({}) } as Response]) {
      vi.resetModules();
      const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (u) =>
        String(u).endsWith('/life/journey') ? journey : ok({ data: { reply: 'hi' } }));
      const { POST } = await import('@/app/api/bff/life/talk/route');
      await POST(makeReq('POST', session, { messages: [{ role: 'user', content: 'x' }], memory: [{ problem: 'injected' }] }));
      expect(Object.keys(talkBody(spy))).toEqual(['messages']);
      spy.mockRestore();
    }
  });
});

describe('the JOURNEY switch', () => {
  it('is a category — absence is a NO — named and explained in every language', () => {
    expect(LIFE_DATA_CATEGORIES).toContain('JOURNEY');
    for (const { code } of LOCALES) {
      const p = DICTIONARIES[code].life.privacy as Record<string, string>;
      expect(p.journey && p.journeyDesc, code).toBeTruthy();
    }
    expect(DICTIONARIES.en.life.privacy.journeyDesc).toMatch(/deletes all/);
    expect(DICTIONARIES.ar.life.privacy.journeyDesc).toMatch(/يحذفها/);
  });
});
