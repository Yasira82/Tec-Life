/**
 * What Life reads from its BFF is checked before a screen uses it (owner, 27 Nov 2026). A reader cast the answer
 * to the type it hoped for (`as unknown as Budget`), and `{}` reached `budget.lines.length`. Each shape is now
 * checked once, where it is read: a wrong shape is «not available» (null) or an empty list — never a half object.
 */
import { describe, it, expect } from 'vitest';
import { asBudget, asCashflow, asList } from '@/lib-client/life/shapes';

describe('asBudget', () => {
  it('a real budget passes; lines and unallocated are lists', () => {
    const b = { period: '2026-11', lines: [{ category: 'apps', cap_pi: '5', spent_pi: '1', pct: 20, over: false }], unallocated: [], spent_total: '1', spent_status: null };
    expect(asBudget(b)).toEqual(b);
  });
  it.each([{}, null, [], { period: '2026-11' }, { period: '2026-11', lines: {} }, 'x'])('%j → null', (v) => expect(asBudget(v)).toBeNull());
  it('a malformed line is dropped, a missing unallocated is empty', () => {
    expect(asBudget({ period: 'p', lines: [{ category: 'apps', cap_pi: '5' }, null, { cap_pi: 3 }], spent_total: null, spent_status: null }))
      .toEqual({ period: 'p', lines: [{ category: 'apps', cap_pi: '5', spent_pi: null, pct: null, over: null }], unallocated: [], spent_total: null, spent_status: null });
  });
});

describe('asCashflow', () => {
  it('a real one passes', () => {
    const c = { period: 'p', in: null, in_status: 503, out: { total: '2', lines: [] }, out_status: null, net: null };
    expect(asCashflow(c)).toEqual(c);
  });
  it.each([{}, null, { period: 'p', out: 'x' }, { period: 'p', out: { total: 2, lines: [] } }])('%j → null', (v) => expect(asCashflow(v)).toBeNull());
});

describe('asList', () => {
  it('a list stays; anything else is empty; non-objects inside are dropped', () => {
    expect(asList([{ id: 1 }, null, 'x', { id: 2 }])).toEqual([{ id: 1 }, { id: 2 }]);
    expect(asList({})).toEqual([]);
    expect(asList(undefined)).toEqual([]);
  });
});
