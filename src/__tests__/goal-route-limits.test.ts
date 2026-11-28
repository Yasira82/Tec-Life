/**
 * AMOUNT_MAX is the BFF's limit on a goal's π target — not a number of our own (owner review of
 * ec0fdc0). The real POST and PATCH handlers are sent the limit and just above it: if either side
 * changes, this fails.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { AMOUNT_MAX, parseAmount } from '@/lib/life/amount';

const forwarded = vi.fn();
vi.mock('@/lib/bff/lifeGateway', () => ({
  forwardLife: (_req: unknown, method: string, path: string, body: unknown) => {
    forwarded({ method, path, body });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  },
}));

const { POST } = await import('../app/api/bff/life/goals/route');
const { PATCH } = await import('../app/api/bff/life/goals/[id]/route');

const req = (method: string, body: unknown) =>
  new NextRequest('http://localhost/api/bff/life/goals', { method, body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
const params = { params: Promise.resolve({ id: 'g1' }) };
const top = (() => { const r = parseAmount(String(AMOUNT_MAX)); if (!r.ok) throw new Error('limit refused'); return r.value; })();

beforeEach(() => forwarded.mockClear());

describe('the π target limit is the BFF’s', () => {
  it('create: the largest amount the screen accepts is forwarded; one above it is refused', async () => {
    expect((await POST(req('POST', { title: 'x', target_amount: top }))).status).toBe(200);
    expect(forwarded).toHaveBeenCalledOnce();
    expect((await POST(req('POST', { title: 'x', target_amount: AMOUNT_MAX + 0.01 }))).status).toBe(400);
    expect(forwarded).toHaveBeenCalledOnce();
  });

  it('edit: the same limit', async () => {
    expect((await PATCH(req('PATCH', { target_amount: top }), params)).status).toBe(200);
    expect((await PATCH(req('PATCH', { target_amount: AMOUNT_MAX + 0.01 }), params)).status).toBe(400);
    expect(forwarded).toHaveBeenCalledOnce();
  });

  it('the screen refuses what the BFF would refuse', () => {
    expect(parseAmount(String(AMOUNT_MAX + 0.01))).toEqual({ ok: false, problem: 'too_large' });
  });
});
