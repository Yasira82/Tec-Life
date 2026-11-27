// What Life reads from its BFF is checked once, where it is read (owner, 27 Nov 2026). A reader used to cast the
// answer to the type it hoped for (`as unknown as Budget`), and `{}` reached `budget.lines.length`, taking the whole
// app down. A wrong shape here is «not available» (null) or an empty list — never a half object a screen trusts.
import type { Budget, BudgetLine, Cashflow, CashflowSide } from './useLife';

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const bool = (v: unknown): boolean | null => (typeof v === 'boolean' ? v : null);
const status = (v: unknown): number | 'partial' | null => (v === 'partial' ? 'partial' : num(v));

/** A list of objects; anything else is an empty list. */
export function asList<T = Record<string, unknown>>(v: unknown): T[] {
  return Array.isArray(v) ? (v.filter(isObj) as T[]) : [];
}

export function asBudget(v: unknown): Budget | null {
  if (!isObj(v) || typeof v.period !== 'string' || !Array.isArray(v.lines)) return null;
  const lines: BudgetLine[] = asList(v.lines)
    .filter((l) => typeof l.category === 'string' && typeof l.cap_pi === 'string')
    .map((l) => ({ category: l.category as string, cap_pi: l.cap_pi as string, spent_pi: str(l.spent_pi), pct: num(l.pct), over: bool(l.over) }));
  const unallocated = asList(v.unallocated)
    .filter((u) => typeof u.source === 'string' && typeof u.spent_pi === 'string')
    .map((u) => ({ source: u.source as string, spent_pi: u.spent_pi as string }));
  return { period: v.period, lines, unallocated, spent_total: str(v.spent_total), spent_status: status(v.spent_status) };
}

function asSide(v: unknown): CashflowSide | null | undefined {
  if (v === null || v === undefined) return null;
  if (!isObj(v) || typeof v.total !== 'string' || !Array.isArray(v.lines)) return undefined; // malformed
  return {
    total: v.total,
    lines: asList(v.lines).filter((l) => typeof l.label === 'string' && typeof l.amount_pi === 'string')
      .map((l) => ({ label: l.label as string, amount_pi: l.amount_pi as string, at: str(l.at) })),
  };
}

export function asCashflow(v: unknown): Cashflow | null {
  if (!isObj(v) || typeof v.period !== 'string') return null;
  const inSide = asSide(v.in); const outSide = asSide(v.out);
  if (inSide === undefined || outSide === undefined) return null;
  return { period: v.period, in: inSide, in_status: num(v.in_status), out: outSide, out_status: status(v.out_status), net: str(v.net) };
}
