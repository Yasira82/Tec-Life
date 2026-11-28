// @vitest-environment node
/**
 * The four states of the two keep switches, as the coach sees them (Life redesign, Phase 1;
 * owner 2026-11-28: «لازم اختبار الحالات الأربع … وليس الاكتفاء بتغيير شكل المفاتيح»).
 *
 * JOURNEY and CONVERSATIONS are two independent consents in tec-life-service. What the coach
 * receives is decided HERE, in the talk route, from what the two reads answer:
 *
 *   JOURNEY  CONVERSATIONS   the coach gets
 *   on       on              memory + awareness + the newest kept conversation in full
 *   on       off             memory + awareness, no conversation
 *   off      on              nothing — conversations stay kept for the person, unread by the coach
 *   off      off             nothing
 *
 * And `memory_state` tells the coach which of on/off it may say — never "on" when the journey is off.
 * (What each switch DELETES when turned off is pinned on the backend, life.service consent specs.)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const GW = 'https://api.example.com';
const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => data } as Response);
const req = () => new NextRequest('http://localhost/api/bff/life/talk', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: 'tec_access_token=tok' },
  body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }], conversation_id: 'current-one' }),
});

const ENTRY = { problem: 'My Pi is gone as soon as it arrives', understanding: 'It happens on the day it arrives', step: 'Set 1π aside', step_outcome: null, created_at: '2026-11-20T10:00:00.000Z' };
const KEPT = { id: 'older-one', updated_at: '2026-11-21T10:00:00.000Z', readable: true };

function backend(journey: boolean, conversations: boolean) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (u) => {
    const url = String(u);
    if (url.endsWith('/life/journey')) return ok({ data: { keeping: journey, entries: journey ? [ENTRY] : [] } });
    if (url.endsWith('/life/self')) return ok({ data: { statement: null } });
    if (url.endsWith('/life/goals')) return ok({ data: { goals: [] } });
    if (url.endsWith('/life/future')) return ok({ data: { vision: null, areas: [] } });
    if (url.endsWith('/life/skills')) return ok({ data: { skills: [] } });
    if (url.endsWith('/life/conversations')) return ok({ data: { keeping: conversations, configured: true, conversations: conversations ? [KEPT] : [] } });
    if (url.endsWith('/life/conversations/older-one')) return ok({ data: { messages: [{ role: 'user', content: 'earlier' }] } });
    return ok({ data: { reply: 'hi' } });
  });
}
const sentToCoach = (spy: ReturnType<typeof backend>) =>
  JSON.parse(String((spy.mock.calls.find((c) => String(c[0]).endsWith('/ai/life/talk'))?.[1] as RequestInit).body));
const read = (spy: ReturnType<typeof backend>, path: string) => spy.mock.calls.some((c) => String(c[0]).endsWith(path));

beforeEach(() => { vi.restoreAllMocks(); vi.resetModules(); process.env.API_GATEWAY_URL = GW; });

describe('JOURNEY × CONVERSATIONS — what the coach receives', () => {
  it('on / on: memory, awareness, and the newest kept conversation in full', async () => {
    const spy = backend(true, true);
    const { POST } = await import('@/app/api/bff/life/talk/route');
    await POST(req());
    const body = sentToCoach(spy);
    expect(body.memory).toHaveLength(1);
    expect(body.awareness).toBeDefined();
    expect(body.last_conversation).toEqual({ created_at: KEPT.updated_at, messages: [{ role: 'user', content: 'earlier' }] });
    expect(body.memory_state).toBe('on');
  });

  it('on / off: memory and awareness, but no conversation', async () => {
    const spy = backend(true, false);
    const { POST } = await import('@/app/api/bff/life/talk/route');
    await POST(req());
    const body = sentToCoach(spy);
    expect(body.memory).toHaveLength(1);
    expect(body.awareness).toBeDefined();
    expect(body.last_conversation).toBeUndefined();
    expect(read(spy, '/life/conversations/older-one')).toBe(false); // listed as not kept → never opened
    expect(body.memory_state).toBe('on');
  });

  it('off / on: nothing reaches the coach, and the kept conversations are not even listed', async () => {
    const spy = backend(false, true);
    const { POST } = await import('@/app/api/bff/life/talk/route');
    await POST(req());
    const body = sentToCoach(spy);
    expect(body.memory).toBeUndefined();
    expect(body.profile).toBeUndefined();
    expect(body.awareness).toBeUndefined();
    expect(body.last_conversation).toBeUndefined();
    expect(read(spy, '/life/conversations')).toBe(false);
    expect(read(spy, '/life/goals')).toBe(false);
    expect(body.memory_state).toBe('off');
  });

  it('off / off: nothing reaches the coach', async () => {
    const spy = backend(false, false);
    const { POST } = await import('@/app/api/bff/life/talk/route');
    await POST(req());
    const body = sentToCoach(spy);
    expect(body.memory).toBeUndefined();
    expect(body.awareness).toBeUndefined();
    expect(body.last_conversation).toBeUndefined();
    expect(body.memory_state).toBe('off');
  });

  it('a journey that cannot be read says neither on nor off', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (u) => {
      if (String(u).endsWith('/life/journey')) return { ok: false, status: 503, json: async () => ({}) } as Response;
      return ok({ data: { reply: 'hi', statement: null } });
    });
    const spy = vi.mocked(globalThis.fetch) as unknown as ReturnType<typeof backend>;
    const { POST } = await import('@/app/api/bff/life/talk/route');
    await POST(req());
    expect(sentToCoach(spy).memory_state).toBeUndefined();
  });
});
