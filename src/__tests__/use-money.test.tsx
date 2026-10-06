/**
 * L1 — the budget and cash-flow hooks (lib-client/life/useLife.ts).
 *
 * What they promise the screen: the BFF's answer as-is (a null stays a null),
 * a failed read leaves NO data behind (never a stale number under a new error),
 * a write goes through the BFF and is followed by a fresh read.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useBudget, useCashflow } from '@/lib-client/life/useLife';

type Call = [RequestInfo | URL, RequestInit | undefined];
const respond = (answer: (url: string, init?: RequestInit) => [number, unknown]) =>
  vi.fn(async (u: RequestInfo | URL, init?: RequestInit) => {
    const [status, body] = answer(String(u), init);
    return { ok: status < 400, status, json: async () => body } as Response;
  });
const calls = (f: ReturnType<typeof respond>) => f.mock.calls as unknown as Call[];

afterEach(() => vi.unstubAllGlobals());

const BUDGET = { period: '2026-10', lines: [{ category: 'ecommerce', cap_pi: '40', spent_pi: null, pct: null, over: null }], unallocated: [], spent_total: null, spent_status: 503 };

describe('useBudget', () => {
  it('reads this month by default, and hands the BFF answer over untouched — a null stays a null', async () => {
    const f = respond(() => [200, { success: true, data: BUDGET }]);
    vi.stubGlobal('fetch', f);
    const { result } = renderHook(() => useBudget());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(String(calls(f)[0]?.[0])).toBe('/api/bff/life/budget');
    expect(calls(f)[0]?.[1]?.credentials).toBe('include');
    expect(result.current.budget).toEqual(BUDGET);
    expect(result.current.budget?.lines[0]?.spent_pi).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('asks for the period it was given', async () => {
    const f = respond(() => [200, { success: true, data: { ...BUDGET, period: '2026-09' } }]);
    vi.stubGlobal('fetch', f);
    const { result } = renderHook(() => useBudget('2026-09'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(String(calls(f)[0]?.[0])).toBe('/api/bff/life/budget?period=2026-09');
  });

  it('a failed read leaves no budget behind and carries the service\'s sentence', async () => {
    vi.stubGlobal('fetch', respond(() => [503, { error: 'Service unavailable' }]));
    const { result } = renderHook(() => useBudget());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.budget).toBeNull();
    expect(result.current.error).toBe('Service unavailable');
  });

  it('setCap PUTs the slug, the exact amount and the period, then reads again', async () => {
    const f = respond((url, init) => init?.method === 'PUT' ? [200, { success: true, data: { period: '2026-10', caps: [] } }] : [200, { success: true, data: BUDGET }]);
    vi.stubGlobal('fetch', f);
    const { result } = renderHook(() => useBudget('2026-10'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.setCap('ecommerce', '12.5'); });
    const put = calls(f).find((c) => c[1]?.method === 'PUT');
    expect(String(put?.[0])).toBe('/api/bff/life/budget');
    expect(JSON.parse(String(put?.[1]?.body))).toEqual({ category: 'ecommerce', cap_pi: '12.5', period: '2026-10' });
    expect(calls(f).filter((c) => !c[1]?.method || c[1]?.method === 'GET')).toHaveLength(2); // the first read, and the one after the write
    expect(result.current.busy).toBe(false);
  });

  it('removeCap DELETEs the category for the period, then reads again', async () => {
    const f = respond((url, init) => init?.method === 'DELETE' ? [200, { success: true, data: { removed: true } }] : [200, { success: true, data: BUDGET }]);
    vi.stubGlobal('fetch', f);
    const { result } = renderHook(() => useBudget('2026-10'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.removeCap('ecommerce'); });
    const del = calls(f).find((c) => c[1]?.method === 'DELETE');
    expect(String(del?.[0])).toBe('/api/bff/life/budget/ecommerce?period=2026-10');
    expect(calls(f).filter((c) => !c[1]?.method || c[1]?.method === 'GET')).toHaveLength(2);
  });

  it('a refused write surfaces the refusal and does not pretend', async () => {
    const f = respond((url, init) => init?.method === 'PUT' ? [400, { error: 'cap_pi must be positive' }] : [200, { success: true, data: BUDGET }]);
    vi.stubGlobal('fetch', f);
    const { result } = renderHook(() => useBudget());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.setCap('ecommerce', '0'); });
    expect(result.current.error).toBe('cap_pi must be positive');
    expect(result.current.busy).toBe(false);
  });

  it('reload reads again on demand', async () => {
    const f = respond(() => [200, { success: true, data: BUDGET }]);
    vi.stubGlobal('fetch', f);
    const { result } = renderHook(() => useBudget());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.reload());
    await waitFor(() => expect(calls(f)).toHaveLength(2));
  });
});

describe('useCashflow', () => {
  const FLOW = { period: '2026-10', in: null, in_status: 502, out: { total: '12.5', lines: [] }, out_status: null, net: null };

  it('reads the month and keeps an unknown side unknown', async () => {
    const f = respond(() => [200, { success: true, data: FLOW }]);
    vi.stubGlobal('fetch', f);
    const { result } = renderHook(() => useCashflow('2026-10'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(String(calls(f)[0]?.[0])).toBe('/api/bff/life/cashflow?period=2026-10');
    expect(result.current.cashflow).toEqual(FLOW);
    expect(result.current.cashflow?.in).toBeNull();
    expect(result.current.cashflow?.net).toBeNull();
  });

  it('a failed read leaves nothing behind', async () => {
    vi.stubGlobal('fetch', respond(() => [500, {}]));
    const { result } = renderHook(() => useCashflow());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.cashflow).toBeNull();
    expect(result.current.error).toBe('Request failed (500)');
  });
});
