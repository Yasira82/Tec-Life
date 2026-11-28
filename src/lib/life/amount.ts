// One way to read a π amount someone typed (owner review of the redesign chain, 28 Nov 2026).
// Used by both places the redesign takes money: logging π on a goal, and a goal's π target.
//
//   • Digits in any of the scripts a phone keyboard here may type: Western (0-9), Arabic-Indic
//     (٠-٩), Extended Arabic-Indic (۰-۹) and Devanagari (०-९).
//   • The decimal point is «.» or the Arabic decimal separator «٫».
//   • A comma of any kind («,» «،» «٬») is REFUSED, never guessed: «1,000» is a thousand to one
//     reader and one to another, and π is money. The screen says how to write it instead.
//   • At most 8 decimals — what the ledger keeps (DECIMAL(20,8)); more is not silently rounded.
//   • Above 0, and no more than `max`. Nothing else (spaces inside, signs, «1e3», «0x10») is a number.
export type AmountProblem = 'empty' | 'ambiguous' | 'invalid' | 'too_large';
export type AmountResult = { ok: true; value: number } | { ok: false; problem: AmountProblem };

export const AMOUNT_MAX = 1_000_000_000;

const DIGIT_BLOCKS = [0x0660, 0x06f0, 0x0966]; // ٠ ۰ ०

function toWesternDigits(s: string): string {
  return s.replace(/[٠-٩۰-۹०-९]/g, (ch) => {
    const code = ch.charCodeAt(0);
    const base = DIGIT_BLOCKS.find((b) => code >= b && code <= b + 9)!;
    return String(code - base);
  });
}

export function parseAmount(raw: string, max = AMOUNT_MAX): AmountResult {
  const s = toWesternDigits(raw.trim()).replace(/٫/g, '.');
  if (!s) return { ok: false, problem: 'empty' };
  if (/[,،٬]/.test(s)) return { ok: false, problem: 'ambiguous' };
  if (!/^\d+(\.\d{1,8})?$/.test(s)) return { ok: false, problem: 'invalid' };
  const value = Number(s);
  if (!Number.isFinite(value) || value <= 0) return { ok: false, problem: 'invalid' };
  if (value > max) return { ok: false, problem: 'too_large' };
  return { ok: true, value };
}
