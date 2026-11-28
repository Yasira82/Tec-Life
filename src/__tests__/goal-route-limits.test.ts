/**
 * TARGET_MAX is the BFF's limit on a goal's π target — not a number of our own (owner review of
 * ec0fdc0). The real POST and PATCH handlers are sent the limit and just above it: if either side
 * changes, this fails.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { TARGET_MAX, PROGRESS_MAX, parseAmount } from '@/lib/life/amount';

const forwarded = vi.fn();
vi.mock('@/lib/bff/lifeGateway', () => ({
  forwardLife: (_req: unknown, method: string, path: string, body: unknown) => {
    forwarded({ method, path, body });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  },
}));

const { POST } = await import('../app/api/bff/life/goals/route');
const { PATCH } = await import('../app/api/bff/life/goals/[id]/route');
const { POST: PROGRESS } = await import('../app/api/bff/life/goals/[id]/progress/route');

const req = (method: string, body: unknown) =>
  new NextRequest('http://localhost/api/bff/life/goals', { method, body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
const params = { params: Promise.resolve({ id: 'g1' }) };
const top = (() => { const r = parseAmount(String(TARGET_MAX), TARGET_MAX); if (!r.ok) throw new Error('limit refused'); return r.value; })();

beforeEach(() => forwarded.mockClear());

describe('the π target limit is the BFF’s', () => {
  it('create: the largest amount the screen accepts is forwarded; one above it is refused', async () => {
    expect((await POST(req('POST', { title: 'x', target_amount: top }))).status).toBe(200);
    expect(forwarded).toHaveBeenCalledOnce();
    expect((await POST(req('POST', { title: 'x', target_amount: TARGET_MAX + 0.01 }))).status).toBe(400);
    expect(forwarded).toHaveBeenCalledOnce();
  });

  it('edit: the same limit', async () => {
    expect((await PATCH(req('PATCH', { target_amount: top }), params)).status).toBe(200);
    expect((await PATCH(req('PATCH', { target_amount: TARGET_MAX + 0.01 }), params)).status).toBe(400);
    expect(forwarded).toHaveBeenCalledOnce();
  });

  it('the screen refuses what the BFF would refuse', () => {
    expect(parseAmount(String(TARGET_MAX + 0.01), TARGET_MAX)).toEqual({ ok: false, problem: 'too_large' });
  });
});

describe('logged π has no such limit — the service caps progress at the target', () => {
  it('a log above the target’s limit is read by the screen and forwarded by the BFF', async () => {
    const r = parseAmount('1500000000', PROGRESS_MAX);
    expect(r).toEqual({ ok: true, value: 1_500_000_000 });
    const res = await PROGRESS(req('POST', { delta: 1_500_000_000 }), params);
    expect(res.status).toBe(200);
    expect(forwarded).toHaveBeenCalledWith(expect.objectContaining({ body: { delta: 1_500_000_000 } }));
  });
});

