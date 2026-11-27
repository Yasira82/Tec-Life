// @vitest-environment node
/**
 * The coach remembers the person (owner, 27 Nov 2026: «عاوز يشوف كل المحادثات مش بس آخر 3 … اليوزر لو مش عاوز
 * أي محادثة يمسحها»). Chosen: every kept summary, and the full text of the newest kept conversation — not the one
 * being had now. And the coach is told whether its memory is on, so «review all our conversations» with
 * «Keep my journey» off gets "it is switched off", not "there is nothing". Deleting stays in My journey.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const GW = 'https://api.example.com';
const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => data } as Response);
const entry = (i: number) => ({ id: `e${i}`, problem: `problem ${i}`, understanding: 'u', step: null, step_outcome: null, created_at: `2026-11-${String(20 - i).padStart(2, '0')}T10:00:00.000Z` });
const makeReq = (body: unknown) => new NextRequest('http://localhost/api/bff/life/talk', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: 'tec_access_token=tok' }, body: JSON.stringify(body),
});

interface Setup { keeping: boolean; entries?: number; convKeeping?: boolean; convs?: { id: string; updated_at: string; created_at?: string; readable?: boolean }[] }
const route = ({ keeping, entries = 0, convKeeping = true, convs = [] }: Setup) => vi.spyOn(globalThis, 'fetch').mockImplementation(async (u) => {
  const url = String(u);
  if (url.endsWith('/life/journey')) return ok({ data: { keeping, entries: Array.from({ length: entries }, (_, i) => entry(i)) } });
  if (url.endsWith('/life/conversations')) return ok({ data: { keeping: convKeeping, configured: true, conversations: convs.map((c) => ({ message_count: 2, preview: null, readable: true, created_at: c.updated_at, ...c })) } });
  const one = url.match(/\/life\/conversations\/([^/]+)$/);
  if (one) return ok({ data: { messages: [{ role: 'user', content: `words of ${one[1]}` }, { role: 'assistant', content: 'reply' }] } });
  if (/\/life\/(goals|future|skills|self)$/.test(url)) return ok({ data: {} });
  return ok({ data: { reply: 'hi' } });
});
const sent = (spy: { mock: { calls: unknown[][] } }) =>
  JSON.parse(String((spy.mock.calls.find((c) => String(c[0]).endsWith('/ai/life/talk'))?.[1] as RequestInit).body));
const talk = async (body: unknown) => { const { POST } = await import('@/app/api/bff/life/talk/route'); await POST(makeReq(body)); };

describe('what the coach is sent', () => {
  beforeEach(() => { vi.restoreAllMocks(); vi.resetModules(); process.env.API_GATEWAY_URL = GW; });

  it('every kept summary, not three', async () => {
    const spy = route({ keeping: true, entries: 12 });
    await talk({ messages: [{ role: 'user', content: 'hi' }] });
    expect(sent(spy).memory).toHaveLength(12);
    expect(sent(spy).memory_state).toBe('on');
  });

  it('the newest kept conversation in full — never the one being had now', async () => {
    const spy = route({ keeping: true, entries: 1, convs: [
      { id: 'now', updated_at: '2026-11-27T12:00:00.000Z' },
      { id: 'yesterday', updated_at: '2026-11-26T09:00:00.000Z' },
      { id: 'older', updated_at: '2026-11-20T09:00:00.000Z' },
    ] });
    await talk({ messages: [{ role: 'user', content: 'hi' }], conversation_id: 'now' });
    expect(sent(spy).last_conversation).toEqual({ created_at: '2026-11-26T09:00:00.000Z', messages: [{ role: 'user', content: 'words of yesterday' }, { role: 'assistant', content: 'reply' }] });
  });

  it('a conversation that cannot be read is skipped; with full conversations off, none is read', async () => {
    let spy = route({ keeping: true, convs: [{ id: 'locked', updated_at: '2026-11-27T12:00:00.000Z', readable: false }] });
    await talk({ messages: [{ role: 'user', content: 'hi' }] });
    expect(sent(spy).last_conversation).toBeUndefined();
    vi.restoreAllMocks(); vi.resetModules();
    spy = route({ keeping: true, convKeeping: false, convs: [{ id: 'x', updated_at: '2026-11-27T12:00:00.000Z' }] });
    await talk({ messages: [{ role: 'user', content: 'hi' }] });
    expect(sent(spy).last_conversation).toBeUndefined();
  });

  it('«Keep my journey» off → the coach is told it is off, and nothing of the past is read', async () => {
    const spy = route({ keeping: false, entries: 5, convs: [{ id: 'x', updated_at: '2026-11-27T12:00:00.000Z' }] });
    await talk({ messages: [{ role: 'user', content: 'review all our conversations' }] });
    const body = sent(spy);
    expect(body.memory_state).toBe('off');
    expect(body.memory).toBeUndefined();
    expect(body.last_conversation).toBeUndefined();
    expect(spy.mock.calls.some((c) => /\/life\/conversations/.test(String(c[0])))).toBe(false);
  });

  it('the page id is only used to leave a conversation out — it is not forwarded', async () => {
    const spy = route({ keeping: true });
    await talk({ messages: [{ role: 'user', content: 'hi' }], conversation_id: 'now' });
    expect(sent(spy).conversation_id).toBeUndefined();
  });
});

describe('the page sends which conversation it is', () => {
  it('talk() carries the conversation id', async () => {
    vi.restoreAllMocks(); vi.resetModules();
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(ok({ data: { reply: 'hi' } }));
    const { talk: say } = await import('@/lib-client/life/lifeTalk');
    await say([{ role: 'user', content: 'hi' }], 'conv-1');
    expect(JSON.parse(String((spy.mock.calls[0]![1] as RequestInit).body)).conversation_id).toBe('conv-1');
  });
});

describe('the person is told', () => {
  it('in English and Arabic: every summary kept, and the last kept conversation in full', async () => {
    const { sessionCopy } = await import('@/lib/life/session-copy');
    expect(sessionCopy('en').memoryNote).toMatch(/all the summaries you kept/);
    expect(sessionCopy('en').memoryNote).toMatch(/your last kept conversation/);
    expect(sessionCopy('ar').memoryNote).toMatch(/كل خلاصاتك/);
    expect(sessionCopy('ar').memoryNote).toMatch(/آخر محادثة/);
  });
  it('the privacy page names it', async () => {
    const { readFileSync } = await import('node:fs');
    const page = readFileSync(`${process.cwd()}/src/app/privacy/page.tsx`, 'utf8');
    expect(page).toMatch(/every summary you kept, the full text of your last kept conversation/);
  });
});
