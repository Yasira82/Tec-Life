// What the redesign's budget (A1) may show, read strictly from the BFF's answer (owner review of #136).
//
// The BFF (/api/bff/life/budget) answers { period, lines, unallocated, spent_total, spent_status }:
//   spent_status === null      the whole month's completed payments were read → every amount is complete,
//                              and an app with no payment this month spent exactly 0 (composeBudget);
//   spent_status === 'partial' the month has more payments than one read returns;
//   spent_status === <number>  the payment service answered with that error status.
// Only the FIRST case is a complete reading. In any other case NO spending figure is shown as final — not a
// spend, not a bar, not «left», not «over», not «spent with no cap» — even when the answer carries numbers:
// numbers being present does not make them complete.
//
// Every item is checked, field by field; `undefined` is not `null`. One item of the wrong shape makes the
// whole answer unread (said with a retry), never a half-trusted list and never «no caps».
// «Over» and «left» are computed here from the exact decimals (cap − spent), not taken from the answer.
import { toMicro, fromMicro } from './money';

export interface BudgetViewLine {
  category: string;
  cap: string;
  /** Only when the reading is complete; null otherwise. */
  spent: string | null;
  /** 0–100, only when complete. */
  pct: number | null;
  over: boolean | null;
  /** |cap − spent|: what is left, or how far over — only when complete. */
  diff: string | null;
}

export interface BudgetView {
  period: string;
  /** True only when spent_status is exactly null. */
  complete: boolean;
  /** 'partial' | 'unknown' when not complete — which message to show. */
  incomplete: 'partial' | 'unknown' | null;
  lines: BudgetViewLine[];
  /** Spending with no cap — shown only when complete; empty otherwise. */
  unallocated: { source: string; spent: string }[];
}

const SLUG = /^[a-z][a-z0-9_-]{0,31}$/;
const PERIOD = /^\d{4}-(0[1-9]|1[0-2])$/;
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const has = (o: Record<string, unknown>, k: string) => Object.prototype.hasOwnProperty.call(o, k);
const isAmount = (v: unknown): v is string => typeof v === 'string' && toMicro(v) !== null;

/** The answer as the screen may show it, or null when any part of it is not the expected shape. */
export function readBudgetView(raw: unknown): BudgetView | null {
  if (!isObj(raw)) return null;
  const { period, lines, unallocated, spent_status } = raw;
  if (typeof period !== 'string' || !PERIOD.test(period)) return null;
  if (!Array.isArray(lines) || !Array.isArray(unallocated)) return null;
  if (!has(raw, 'spent_status')) return null;
  const status = spent_status;
  if (!(status === null || status === 'partial' || (Number.isInteger(status) && (status as number) >= 100 && (status as number) <= 599))) return null;
  const complete = status === null;

  const out: BudgetViewLine[] = [];
  const seen = new Set<string>();
  for (const l of lines) {
    if (!isObj(l)) return null;
    if (typeof l.category !== 'string' || !SLUG.test(l.category) || seen.has(l.category)) return null;
    seen.add(l.category);
    if (!isAmount(l.cap_pi) || toMicro(l.cap_pi)! <= 0n) return null;
    for (const f of ['spent_pi', 'pct', 'over']) if (!has(l, f)) return null;     // undefined is not null
    if (!(l.spent_pi === null || isAmount(l.spent_pi))) return null;
    if (!(l.pct === null || (typeof l.pct === 'number' && Number.isFinite(l.pct)))) return null;
    if (!(l.over === null || typeof l.over === 'boolean')) return null;
    // A complete reading must carry a spend for every cap (composeBudget writes '0' for an app with none).
    if (complete && l.spent_pi === null) return null;

    if (!complete) { out.push({ category: l.category, cap: l.cap_pi, spent: null, pct: null, over: null, diff: null }); continue; }
    const cap = toMicro(l.cap_pi)!; const sp = toMicro(l.spent_pi as string)!;
    const over = sp > cap;
    const pct = Math.min(100, Number((sp * 10_000n) / cap) / 100);
    out.push({ category: l.category, cap: l.cap_pi, spent: l.spent_pi as string, pct, over, diff: fromMicro(over ? sp - cap : cap - sp) });
  }

  const free: { source: string; spent: string }[] = [];
  for (const u of unallocated) {
    if (!isObj(u)) return null;
    if (typeof u.source !== 'string' || u.source === '' || !isAmount(u.spent_pi)) return null;
    if (complete) free.push({ source: u.source, spent: u.spent_pi });
  }

  return { period, complete, incomplete: complete ? null : status === 'partial' ? 'partial' : 'unknown', lines: out, unallocated: free };
}
