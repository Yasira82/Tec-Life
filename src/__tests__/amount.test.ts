/**
 * Reading a π amount someone typed (owner review of the redesign chain, 28 Nov 2026): one parser for
 * logging π and a goal's target. Any script's digits, «.» or «٫»; a comma is refused, never guessed.
 */
import { describe, it, expect } from 'vitest';
import { parseAmount, TARGET_MAX, PROGRESS_MAX } from '@/lib/life/amount';

const value = (s: string, max = TARGET_MAX) => { const r = parseAmount(s, max); return r.ok ? r.value : r.problem; };

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
    ['.5', 'invalid'], ['5.', 'invalid'], ['1.123456789', 'too_precise'],
    ['2000000000', 'too_large'],
  ])('%s → %s', (input, problem) => { expect(value(input)).toBe(problem); });

  it('the limit is the caller’s', () => {
    expect(value(String(TARGET_MAX))).toBe(TARGET_MAX);
    expect(parseAmount('11', 10)).toEqual({ ok: false, problem: 'too_large' });
  });
});

describe('parseAmount — precision near the limit (owner review of ec0fdc0)', () => {
  // The value travels as a JSON number and is stored as a double: what is accepted must arrive
  // exactly as typed. A double keeps every decimal of up to 15 significant digits.
  const exact = (typed: string) => {
    const r = parseAmount(typed, TARGET_MAX);
    if (!r.ok) throw new Error(`${typed} refused: ${r.problem}`);
    const sent = JSON.parse(JSON.stringify({ delta: r.value })).delta as number;
    const frac = typed.split('.')[1]?.length ?? 0;
    return { same: sent === r.value, back: sent.toFixed(frac) };
  };

  it.each([
    '1000000000', '999999999.999999', '999999999.123456', '123456789.012345', '0.00000001', '1.50000000', '10.12345678',
  ])('%s is accepted and arrives exactly as typed', (typed) => {
    expect(exact(typed)).toEqual({ same: true, back: typed });
  });

  it.each([
    ['999999999.12345678', 'too_precise'],  // 17 significant digits: a double makes it …1234568
    ['999999999.1234567', 'too_precise'],   // 16
    ['1000000000.00000001', 'too_precise'],
    ['1000000000.1', 'too_large'],
  ])('%s → %s', (typed, problem) => { expect(value(typed)).toBe(problem); });

  it('every accepted amount round-trips — 5,000 generated near and below the limit', () => {
    let seed = 42;
    const rnd = (n: number) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
    for (let i = 0; i < 5000; i++) {
      const int = String(rnd(2) ? 999_999_000 + rnd(1000) : rnd(1_000_000_000));
      const room = Math.max(0, Math.min(8, 15 - int.replace(/^0+/, '').length));
      const frac = Array.from({ length: rnd(room + 1) }, () => rnd(10)).join('');
      const typed = frac ? `${int}.${frac}` : int;
      const r = parseAmount(typed, TARGET_MAX);
      if (!r.ok) { expect(r.problem === 'invalid' && Number(typed) === 0).toBe(true); continue; }
      expect(exact(typed)).toEqual({ same: true, back: typed });
    }
  });
});

describe('each field its own limit (owner review of 4e5b688)', () => {
  it('a target stops at the BFF’s 1,000,000,000; logged π does not', () => {
    expect(value('1500000000', TARGET_MAX)).toBe('too_large');
    expect(value('1500000000', PROGRESS_MAX)).toBe(1_500_000_000);
  });

  it('logged π: bounded only by the 15-significant-digit rule — always an exact integer range', () => {
    expect(value('999999999999999', PROGRESS_MAX)).toBe(999_999_999_999_999);
    expect(Number.isSafeInteger(999_999_999_999_999)).toBe(true);
    expect(value('1000000000000000', PROGRESS_MAX)).toBe('too_precise');
    expect(value('99999999999.99999', PROGRESS_MAX)).toBe('too_precise');
  });
});

describe('logged π across its whole range — PROGRESS_MAX (owner review of 2cf8643)', () => {
  // Same check as for a target, but with the log's own limit: accepted means it arrives exactly.
  const exactLog = (typed: string) => {
    const r = parseAmount(typed, PROGRESS_MAX);
    if (!r.ok) throw new Error(`${typed} refused: ${r.problem}`);
    const sent = JSON.parse(JSON.stringify({ delta: r.value })).delta as number;
    const frac = typed.split('.')[1]?.length ?? 0;
    return { same: sent === r.value, back: sent.toFixed(frac) };
  };

  it.each([
    '1500000000.12345',      // above the target's limit, with decimals (15 significant)
    '999999999999999',       // the largest 15-digit integer
    '99999999999999.9',      // a decimal just under 10^14, 15 significant
    '12345678901234.5',
    '500000000000.125',
    '1000000000000.01',
  ])('%s is accepted and arrives exactly as typed', (typed) => {
    expect(exactLog(typed)).toEqual({ same: true, back: typed });
  });

  it.each([
    ['1500000000.123456', 'too_precise'],   // 16 significant digits
    ['1500000000.1234567', 'too_precise'],  // 17 — this one happens to survive as a double; the rule is a
                                            // guarantee (15 always do), not a per-number check, so it is refused too
    ['999999999999999.9', 'too_precise'],
    ['1000000000000000', 'too_precise'],
    ['9007199254740993', 'too_precise'],    // 16 digits that do NOT survive: a double makes it …992
  ])('%s → %s — refused, never rounded and sent', (typed, problem) => {
    expect(value(typed, PROGRESS_MAX)).toBe(problem);
  });

  it('past 15 digits some numbers change on the way — why the rule exists', () => {
    // Without the rule, each of these would travel as a different number than the one typed.
    for (const typed of ['999999999.12345678', '9007199254740993', '1234567890.12345678', '99999999999999999']) {
      expect(String(Number(typed))).not.toBe(typed);
      expect(parseAmount(typed, PROGRESS_MAX)).toEqual({ ok: false, problem: 'too_precise' });
    }
  });

  it('every accepted log round-trips — 5,000 generated from 1 up to 10^15', () => {
    let seed = 7;
    const rnd = (n: number) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
    for (let i = 0; i < 5000; i++) {
      const len = 1 + rnd(15);                                   // 1–15 integer digits
      const int = String(1 + rnd(9)) + Array.from({ length: len - 1 }, () => rnd(10)).join('');
      const room = Math.min(8, 15 - int.length);
      const frac = Array.from({ length: rnd(room + 1) }, () => rnd(10)).join('');
      const typed = frac ? `${int}.${frac}` : int;
      expect(exactLog(typed)).toEqual({ same: true, back: typed });
    }
  });
});

