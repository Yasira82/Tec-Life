/**
 * L1 — the pure half of budget + cash flow (lib/life/money.ts).
 *
 * Exact π arithmetic (micro-units, never floats), UTC month bounds, and the one
 * rule that matters most: an amount that could not be read is `null`, and a
 * null never becomes a 0 on any line (C-47 §10 E1).
 */
import { describe, it, expect } from 'vitest';
import {
  currentPeriod, periodBounds, toMicro, fromMicro, spentBySource, composeBudget, netOf, payoutsIn, paymentsOut,
} from '@/lib/life/money';

describe('periods', () => {
  it('names the UTC month and bounds it as [first, next first)', () => {
    expect(currentPeriod(new Date('2026-10-06T23:30:00Z'))).toBe('2026-10');
    expect(currentPeriod(new Date('2026-12-31T23:59:59Z'))).toBe('2026-12');
    expect(periodBounds('2026-10')).toEqual({ from: '2026-10-01T00:00:00.000Z', to: '2026-11-01T00:00:00.000Z' });
    expect(periodBounds('2026-12')).toEqual({ from: '2026-12-01T00:00:00.000Z', to: '2027-01-01T00:00:00.000Z' });
  });
});

describe('exact π', () => {
  it('round-trips decimals without float drift', () => {
    expect(fromMicro(toMicro('0.1')! + toMicro('0.2')!)).toBe('0.3');
    expect(fromMicro(toMicro('12.5')!)).toBe('12.5');
    expect(fromMicro(toMicro('40')!)).toBe('40');
    expect(fromMicro(toMicro('0.00000001')!)).toBe('0.00000001');
    expect(fromMicro(toMicro(100)!)).toBe('100');
  });

  it('refuses what is not an exact amount', () => {
    for (const bad of ['', 'abc', '-1', '1e3', '1.123456789', '1,5', null, undefined, NaN, Infinity]) {
      expect(toMicro(bad)).toBeNull();
    }
  });
});

describe('spentBySource — completed payments by the app they were for', () => {
  it('sums per source and in total, and counts what it had to skip', () => {
    const out = spentBySource([
      { amount: '10', status: 'completed', source: 'ecommerce' },
      { amount: '2.5', status: 'completed', source: 'ecommerce' },
      { amount: '5', status: 'completed', source: 'assets' },
      { amount: '7', status: 'completed' },                       // no source → other
      { amount: '99', status: 'cancelled', source: 'ecommerce' }, // not completed → skipped
      { amount: 'x', status: 'completed', source: 'assets' },     // not an amount → skipped
    ]);
    expect(out.by_source).toEqual({ ecommerce: '12.5', assets: '5', other: '7' });
    expect(out.total).toBe('24.5');
    expect(out.skipped).toBe(2);
  });
});

describe('composeBudget — a null never becomes a 0', () => {
  const caps = [{ category: 'ecommerce', cap_pi: '40' }, { category: 'assets', cap_pi: '10' }];

  it('puts the owning service\'s number beside each cap, with a bar and an over flag', () => {
    const { lines, unallocated } = composeBudget(caps, { by_source: { ecommerce: '12.5', assets: '12', tec: '3' } });
    expect(lines).toEqual([
      { category: 'ecommerce', cap_pi: '40', spent_pi: '12.5', pct: 31.25, over: false },
      { category: 'assets',    cap_pi: '10', spent_pi: '12',   pct: 100,   over: true },
    ]);
    expect(unallocated).toEqual([{ source: 'tec', spent_pi: '3' }]);
  });

  it('a cap with nothing spent against it reads 0 ONLY when spending was read', () => {
    const { lines } = composeBudget(caps, { by_source: {} });
    expect(lines[0]).toMatchObject({ spent_pi: '0', pct: 0, over: false });
  });

  it('when spending could not be read, every line is null — no bar, no over, no 0', () => {
    const { lines, unallocated } = composeBudget(caps, null);
    for (const l of lines) expect(l).toMatchObject({ spent_pi: null, pct: null, over: null });
    expect(unallocated).toEqual([]);
    expect(JSON.stringify(lines)).not.toMatch(/"spent_pi":"0"/);
  });
});

describe('cash flow', () => {
  it('in = payouts SENT to this person inside the month, named by the marketplace', () => {
    const inn = payoutsIn([
      { status: 'SENT', amount: '3', sent_at: '2026-10-02T10:00:00Z', source: 'order' },
      { status: 'SENT', amount: '1.5', sent_at: '2026-10-20T10:00:00Z', source: 'asset_listing' },
      { status: 'OWED', amount: '9', created_at: '2026-10-03T10:00:00Z', source: 'order' },     // not sent → not in
      { status: 'SENT', amount: '4', sent_at: '2026-09-30T23:59:59Z', source: 'order' },        // last month
    ], '2026-10');
    expect(inn.total).toBe('4.5');
    expect(inn.lines.map((l) => l.label)).toEqual(['commerce', 'assets']);
  });

  it('out = completed payments, named by the app', () => {
    const out = paymentsOut([
      { amount: '10', status: 'completed', source: 'ecommerce', created_at: '2026-10-05T00:00:00Z' },
      { amount: '1', status: 'failed', source: 'ecommerce' },
    ]);
    expect(out).toEqual({ total: '10', lines: [{ label: 'ecommerce', amount_pi: '10', at: '2026-10-05T00:00:00Z' }] });
  });

  it('net exists only when BOTH sides are known, and carries its sign', () => {
    const inn = { total: '4.5', lines: [] }; const out = { total: '10', lines: [] };
    expect(netOf(inn, out)).toBe('-5.5');
    expect(netOf({ total: '12', lines: [] }, out)).toBe('2');
    expect(netOf(null, out)).toBeNull();
    expect(netOf(inn, null)).toBeNull();
  });
});
