/**
 * Reading a π amount someone typed (owner review of the redesign chain, 28 Nov 2026): one parser for
 * logging π and a goal's target. Any script's digits, «.» or «٫»; a comma is refused, never guessed.
 */
import { describe, it, expect } from 'vitest';
import { parseAmount, AMOUNT_MAX } from '@/lib/life/amount';

const value = (s: string) => { const r = parseAmount(s); return r.ok ? r.value : r.problem; };

describe('parseAmount — accepted', () => {
  it.each([
    ['5', 5], ['2.5', 2.5], [' 10 ', 10], ['0.00000001', 0.00000001], ['007', 7],
    ['٥', 5], ['١٠', 10], ['٢٫٥', 2.5], ['٢.٥', 2.5],   // Arabic-Indic, Arabic decimal separator
    ['۵', 5], ['۱۲٫۵', 12.5],                           // Extended Arabic-Indic
    ['५', 5], ['१०.५', 10.5],                           // Devanagari
  ])('%s → %s', (input, expected) => { expect(value(input)).toBe(expected); });
});

describe('parseAmount — refused', () => {
  it.each([
    ['1,000', 'ambiguous'], ['2,5', 'ambiguous'], ['1،000', 'ambiguous'], ['١٬٠٠٠', 'ambiguous'], ['1,000.5', 'ambiguous'],
    ['', 'empty'], ['   ', 'empty'],
    ['0', 'invalid'], ['0.0', 'invalid'], ['-1', 'invalid'], ['+1', 'invalid'], ['abc', 'invalid'],
    ['1.2.3', 'invalid'], ['1 000', 'invalid'], ['1e3', 'invalid'], ['0x10', 'invalid'], ['Infinity', 'invalid'],
    ['.5', 'invalid'], ['5.', 'invalid'], ['1.123456789', 'invalid'],
    ['2000000000', 'too_large'],
  ])('%s → %s', (input, problem) => { expect(value(input)).toBe(problem); });

  it('the limit is the caller’s', () => {
    expect(value(String(AMOUNT_MAX))).toBe(AMOUNT_MAX);
    expect(parseAmount('11', 10)).toEqual({ ok: false, problem: 'too_large' });
  });
});
