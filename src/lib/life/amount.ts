// One way to read a π amount someone typed (owner reviews of the redesign chain, 28 Nov 2026).
// Used by both places the redesign takes money: logging π on a goal, and a goal's π target.
//
//   • Digits in any of the scripts a phone keyboard here may type: Western (0-9), Arabic-Indic
//     (٠-٩), Extended Arabic-Indic (۰-۹) and Devanagari (०-९).
//   • The decimal point is «.» or the Arabic decimal separator «٫».
//   • A comma of any kind («,» «،» «٬») is REFUSED, never guessed: «1,000» is a thousand to one
//     reader and one to another, and π is money. The screen says how to write it instead.
//   • At most 8 decimals — the platform's π precision (C-71, DECIMAL(20,8)).
//   • At most 15 significant digits. The value travels as a JavaScript number (the routes' Zod
//     schemas take `z.number()`) and is stored by tec-life-service as a Float (double). A double
//     keeps any decimal of 15 significant digits exactly (DBL_DIG = 15); past that, some do not —
//     999999999.12345678 would arrive as …123457. So a longer amount is refused, never rounded.
//   • Above 0, and no more than `max`.
// Nothing else (spaces inside, signs, «1e3», «0x10», «.5») is a number.
//
// The limit, from the code (28 Nov 2026):
//   • a goal's target: the BFF schemas — POST /api/bff/life/goals and PATCH /api/bff/life/goals/:id
//     — take `target_amount` up to 1_000_000_000. AMOUNT_MAX is that number; goal-route-limits.test.ts
//     sends the routes AMOUNT_MAX and just above it, so a change on either side fails a test.
//   • logging π: neither the BFF (POST …/progress) nor tec-life-service sets an upper bound on
//     `delta`; the service caps the goal's progress at its target. Logging is offered only on a goal
//     with a target, and no target exceeds AMOUNT_MAX, so using the same limit refuses no log that
//     could change anything.
export type AmountProblem = 'empty' | 'ambiguous' | 'invalid' | 'too_precise' | 'too_large';
export type AmountResult = { ok: true; value: number } | { ok: false; problem: AmountProblem };

export const AMOUNT_MAX = 1_000_000_000;
export const AMOUNT_DECIMALS = 8;
export const AMOUNT_SIGNIFICANT = 15;

const DIGIT_BLOCKS = [0x0660, 0x06f0, 0x0966]; // ٠ ۰ ०

function toWesternDigits(s: string): string {
  return s.replace(/[٠-٩۰-۹०-९]/g, (ch) => {
    const code = ch.charCodeAt(0);
    const base = DIGIT_BLOCKS.find((b) => code >= b && code <= b + 9)!;
    return String(code - base);
  });
}

/** The digits that carry the value: no leading zeros, no trailing zeros after the point. */
function significantDigits(int: string, frac: string): number {
  const digits = (int + frac.replace(/0+$/, '')).replace(/^0+/, '');
  return digits.length;
}

export function parseAmount(raw: string, max = AMOUNT_MAX): AmountResult {
  const s = toWesternDigits(raw.trim()).replace(/٫/g, '.');
  if (!s) return { ok: false, problem: 'empty' };
  if (/[,،٬]/.test(s)) return { ok: false, problem: 'ambiguous' };
  const m = /^(\d+)(?:\.(\d+))?$/.exec(s);
  if (!m) return { ok: false, problem: 'invalid' };
  const int = m[1]!, frac = m[2] ?? '';
  if (frac.length > AMOUNT_DECIMALS || significantDigits(int, frac) > AMOUNT_SIGNIFICANT) {
    return { ok: false, problem: 'too_precise' };
  }
  const value = Number(s);
  if (!Number.isFinite(value) || value <= 0) return { ok: false, problem: 'invalid' };
  if (value > max) return { ok: false, problem: 'too_large' };
  return { ok: true, value };
}
