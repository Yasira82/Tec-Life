// @vitest-environment node
/**
 * The coach reads the skills the person listed (owner, 27 Nov 2026: «ابدأ بالمدرب يقرا المهارات»). Until now
 * the Skills tab was a list nobody read: the coach saw the goals and «مستقبلي», never what the person said
 * they can already do. Same switch as the rest of the awareness — only while they keep their journey — and
 * the screen says so in every language.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { buildAwareness } from '@/lib/life/awareness';

const NOW = new Date('2026-11-27T12:00:00Z');
const skill = (name: string, level: string, updated_at = '2026-11-20') => ({ name, level, source: 'SELF_DECLARED', updated_at });

describe('what the coach is told about their skills', () => {
  it('name and rung, newest first, at most five; a nameless or rung-less row is left out', () => {
    const a = buildAwareness({
      entries: [], goals: [], clock: null, now: NOW,
      skills: [skill('Budgeting', 'LEARNING', '2026-11-26'), skill('Graphic design', 'PROFICIENT', '2026-11-27'),
        skill('', 'EXPERT'), { name: 'Cooking' }, skill('A', 'PRACTISING', '2026-11-01'), skill('B', 'PRACTISING', '2026-11-02'),
        skill('C', 'PRACTISING', '2026-11-03'), skill('D', 'PRACTISING', '2026-11-04')],
    })!;
    expect(a.skills).toEqual([
      { name: 'Graphic design', level: 'PROFICIENT' }, { name: 'Budgeting', level: 'LEARNING' },
      { name: 'D', level: 'PRACTISING' }, { name: 'C', level: 'PRACTISING' }, { name: 'B', level: 'PRACTISING' },
    ]);
  });

  it('skills alone are an awareness; no skills, no key', () => {
    expect(buildAwareness({ entries: [], goals: [], clock: null, now: NOW, skills: [skill('Sewing', 'EXPERT')] })).toEqual({ skills: [{ name: 'Sewing', level: 'EXPERT' }] });
    expect(buildAwareness({ entries: [], goals: [], clock: null, now: NOW, skills: [] })).toBeNull();
  });
});

const GW = 'https://api.example.com';
const makeReq = (body: unknown) => new NextRequest('http://localhost/api/bff/life/talk', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: 'tec_access_token=tok' }, body: JSON.stringify(body),
});
const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => data } as Response);

describe('the talk route — only while the journey is kept', () => {
  beforeEach(() => { vi.restoreAllMocks(); vi.resetModules(); process.env.API_GATEWAY_URL = GW; });
  const route = (keeping: boolean) => vi.spyOn(globalThis, 'fetch').mockImplementation(async (u) => {
    const url = String(u);
    if (url.endsWith('/life/journey')) return ok({ data: { keeping, entries: [] } });
    if (url.endsWith('/life/skills')) return ok({ data: { skills: [skill('Graphic design', 'PROFICIENT')] } });
    if (url.endsWith('/life/goals')) return ok({ data: { goals: [] } });
    if (url.endsWith('/life/future')) return ok({ data: { vision: null, areas: [] } });
    return ok({ data: { reply: 'hi' } });
  });
  const talk = (spy: { mock: { calls: unknown[][] } }) =>
    JSON.parse(String((spy.mock.calls.find((c) => String(c[0]).endsWith('/ai/life/talk'))?.[1] as RequestInit).body));

  it('kept → their skills are in the awareness', async () => {
    const spy = route(true);
    const { POST } = await import('@/app/api/bff/life/talk/route');
    await POST(makeReq({ messages: [{ role: 'user', content: 'hi' }] }));
    expect(talk(spy).awareness).toMatchObject({ skills: [{ name: 'Graphic design', level: 'PROFICIENT' }] });
  });

  it('not kept → not even read', async () => {
    const spy = route(false);
    const { POST } = await import('@/app/api/bff/life/talk/route');
    await POST(makeReq({ messages: [{ role: 'user', content: 'hi' }] }));
    expect(talk(spy).awareness).toBeUndefined();
    expect(spy.mock.calls.some((c) => String(c[0]).endsWith('/life/skills'))).toBe(false);
  });
});

describe('the person is told', () => {
  it('the note says the coach also sees their skills — in English and Arabic', async () => {
    const { sessionCopy } = await import('@/lib/life/session-copy');
    expect(sessionCopy('en').awareNote).toMatch(/skills/);
    expect(sessionCopy('ar').awareNote).toMatch(/مهاراتك/);
  });
});

describe('the privacy page', () => {
  it('names everything the coach can see — My future and the skills included', async () => {
    const { readFileSync } = await import('node:fs');
    const page = readFileSync(`${process.cwd()}/src/app/privacy/page.tsx`, 'utf8');
    expect(page).toMatch(/what you chose to let the coach see \(every summary you kept, the full text of your last kept conversation, your goals, your step this week, what you wrote in My future and the skills you listed;/);
  });
});
