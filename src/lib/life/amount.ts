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
//     schemas take `z.number()`) and tec-life-service stores it as a Float (a binary double). A
//     double does NOT hold most decimal fractions exactly — 2.5 does, 0.1 does not. What it does
//     guarantee is decimal round-trip precision: any decimal of up to 15 significant digits
//     (DBL_DIG = 15), turned into the nearest double and printed back to that many digits, comes
//     back as the same decimal. Past 15 it depends on the number — 999999999.12345678 comes back
//     as …1234568 and 9007199254740993 as …992, while 1500000000.1234567 happens to survive. One
//     rule a person can be told beats a per-number check, so past 15 everything is refused, never
//     rounded. (amount.test.ts checks the JSON hop; the database holds the same double, and Postgres
//     16 returned every accepted amount unchanged from float8 — owner review, 28 Nov 2026.)
//   • Above 0, and no more than the limit of the field it is typed into (below).
// Nothing else (spaces inside, signs, «1e3», «0x10», «.5») is a number.
//
// The limits are each field's own, from the code (28 Nov 2026):
//   • a goal's target — TARGET_MAX: the BFF schemas (POST /api/bff/life/goals, PATCH …/goals/:id)
//     take `target_amount` up to 1_000_000_000. goal-route-limits.test.ts sends the real handlers
//     that number and just above it, so a change on either side fails a test.
//   • logging π — PROGRESS_MAX: neither the BFF (POST …/goals/:id/progress) nor tec-life-service sets
//     an upper bound on `delta`; the service caps the goal's progress at its target. So a log larger
//     than any target is valid (it completes the goal) and is NOT refused here. The only bound is the
//     15-significant-digit rule above, which keeps it below 10^15 — well inside the integers a number
//     holds exactly (2^53 ≈ 9.007 × 10^15).
export type AmountProblem = 'empty' | 'ambiguous' | 'invalid' | 'too_precise' | 'too_large';
export type AmountResult = { ok: true; value: number } | { ok: false; problem: AmountProblem };

/** A goal's π target: the BFF's own limit on `target_amount`. */
export const TARGET_MAX = 1_000_000_000;
/** Logged π: no server limit; the 15-significant-digit rule is the bound. */
export const PROGRESS_MAX = Number.POSITIVE_INFINITY;
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

/** `max` is the field's limit and is required: a target and a log do not share one. */
export function parseAmount(raw: string, max: number): AmountResult {
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
