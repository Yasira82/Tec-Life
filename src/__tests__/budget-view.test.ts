/**
 * What the redesign's budget may show (owner review of Tec-Life #136): a spending figure only from a
 * COMPLETE reading; every item checked, field by field; one bad item → the whole answer unread.
 */
import { describe, it, expect } from 'vitest';
import { readBudgetView } from '@/lib/life/budget-view';
import { composeBudget } from '@/lib/life/money';

const line = (o: Record<string, unknown> = {}) => ({ category: 'ecommerce', cap_pi: '40', spent_pi: '30', pct: 75, over: false, ...o });
const answer = (o: Record<string, unknown> = {}) => ({
  period: '2026-11', lines: [line()], unallocated: [{ source: 'tec', spent_pi: '8' }], spent_total: '38', spent_status: null, ...o,
});

describe('a complete reading (spent_status === null)', () => {
  it('shows the spend, the bar, what is left — computed from the exact decimals', () => {
    const v = readBudgetView(answer())!;
    expect(v.complete).toBe(true);
    expect(v.lines[0]).toEqual({ category: 'ecommerce', cap: '40', spent: '30', pct: 75, over: false, diff: '10' });
    expect(v.unallocated).toEqual([{ source: 'tec', spent: '8' }]);
  });

  it('over and left come from cap − spent, not from the answer’s own flags', () => {
    const v = readBudgetView(answer({ lines: [line({ cap_pi: '10', spent_pi: '12.5', pct: 3, over: false })] }))!;
    expect(v.lines[0]).toMatchObject({ over: true, diff: '2.5', pct: 100 });
  });

  it('missing source with a complete read: the app spent exactly 0 (composeBudget writes "0")', () => {
    const { lines } = composeBudget([{ category: 'commerce', cap_pi: '20' }], { by_source: { ecommerce: '5' } });
    expect(lines[0]).toMatchObject({ spent_pi: '0' });
    const v = readBudgetView(answer({ lines }))!;
    expect(v.lines[0]).toMatchObject({ spent: '0', diff: '20', over: false });
  });

  it('a complete reading that has a line with no spend is not trusted', () => {
    expect(readBudgetView(answer({ lines: [line({ spent_pi: null, pct: null, over: null })] }))).toBeNull();
  });
});

describe('an incomplete reading: numbers present do not make them complete', () => {
  it.each([['partial', 'partial'], [502, 'unknown']])('spent_status %s → no spend, no bar, no left/over, no unallocated', (status, incomplete) => {
    const v = readBudgetView(answer({ spent_status: status, lines: [line({ spent_pi: '30', pct: 75, over: true })], unallocated: [{ source: 'tec', spent_pi: '8' }] }))!;
    expect(v.complete).toBe(false);
    expect(v.incomplete).toBe(incomplete);
    expect(v.lines[0]).toEqual({ category: 'ecommerce', cap: '40', spent: null, pct: null, over: null, diff: null });
    expect(v.unallocated).toEqual([]);
  });

  it('missing source with an incomplete read is unknown, never 0', () => {
    const { lines } = composeBudget([{ category: 'commerce', cap_pi: '20' }], null);
    const v = readBudgetView(answer({ spent_status: 'partial', lines, unallocated: [] }))!;
    expect(v.lines[0]!.spent).toBeNull();
  });
});

describe('every item checked; one bad item → the whole answer unread', () => {
  it.each([
    ['not an object', null],
    ['no period', answer({ period: undefined })],
    ['a period that is not a month', answer({ period: '2026-13' })],
    ['lines not a list', answer({ lines: {} })],
    ['unallocated not a list', answer({ unallocated: null })],
    ['spent_status missing (undefined is not null)', (() => { const a: Record<string, unknown> = answer(); delete a.spent_status; return a; })()],
    ['spent_status of another kind', answer({ spent_status: 'ok' })],
    ['a line that is not an object', answer({ lines: ['x'] })],
    ['a line with no category', answer({ lines: [line({ category: undefined })] })],
    ['a line with a category that is not a slug', answer({ lines: [line({ category: 'Bad App' })] })],
    ['two lines for one app', answer({ lines: [line(), line()] })],
    ['a cap that is not an exact amount', answer({ lines: [line({ cap_pi: 40 })] })],
    ['a zero cap', answer({ lines: [line({ cap_pi: '0' })] })],
    ['spent_pi missing (undefined is not null)', answer({ lines: [(() => { const l: Record<string, unknown> = line(); delete l.spent_pi; return l; })()] })],
    ['spent_pi a number', answer({ lines: [line({ spent_pi: 30 })] })],
    ['spent_pi not an amount', answer({ lines: [line({ spent_pi: 'abc' })] })],
    ['pct missing', answer({ lines: [(() => { const l: Record<string, unknown> = line(); delete l.pct; return l; })()] })],
    ['pct not a number', answer({ lines: [line({ pct: '75' })] })],
    ['over missing', answer({ lines: [(() => { const l: Record<string, unknown> = line(); delete l.over; return l; })()] })],
    ['over not a boolean', answer({ lines: [line({ over: 'no' })] })],
    ['an unallocated item that is not an object', answer({ unallocated: [3] })],
    ['an unallocated item with no source', answer({ unallocated: [{ spent_pi: '8' }] })],
    ['an unallocated item with no amount', answer({ unallocated: [{ source: 'tec' }] })],
    ['an unallocated amount as a number', answer({ unallocated: [{ source: 'tec', spent_pi: 8 }] })],
  ])('%s', (_name, raw) => { expect(readBudgetView(raw)).toBeNull(); });

  it('a bad unallocated item is refused even when the reading is incomplete', () => {
    expect(readBudgetView(answer({ spent_status: 'partial', unallocated: [{ source: 'tec' }] }))).toBeNull();
  });

  it('no caps and nothing spent is a valid, empty budget', () => {
    expect(readBudgetView(answer({ lines: [], unallocated: [] }))).toMatchObject({ complete: true, lines: [], unallocated: [] });
  });
});
