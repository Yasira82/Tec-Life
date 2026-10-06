/**
 * L1 — budget + cash flow (C-106 §10 Phase 1). The pure half: period bounds,
 * exact π sums, and the composition rule that keeps "unknown" from reading as 0.
 *
 * Life OWNS the caps (identity-service, L1 backend). It does NOT own what was
 * spent or received: payment truth is tec-payment-service's, payouts are
 * tec-commerce-service's. The BFF reads both with the person's own session and
 * these helpers put them beside the caps — presented, never re-derived into a
 * Life table (C-106 §4, the Activity-timeline rule).
 *
 * Amounts are strings end to end. Sums use integer micro-units (1e8 per π, the
 * DECIMAL(20,8) the platform stores), never floats: 0.1 + 0.2 is a number that
 * a person checks against their wallet.
 */

export const PERIOD = /^\d{4}-(0[1-9]|1[0-2])$/;

export const currentPeriod = (now: Date = new Date()): string =>
  `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;

/** `[from, to)` of a UTC month, as ISO strings for the payment history query. */
export function periodBounds(period: string): { from: string; to: string } {
  const y = Number(period.slice(0, 4));
  const m = Number(period.slice(5, 7));
  const from = new Date(Date.UTC(y, m - 1, 1));
  const to   = new Date(Date.UTC(y, m, 1));
  return { from: from.toISOString(), to: to.toISOString() };
}

const SCALE = 100_000_000n;

/** A decimal string → micro-π, or null when it is not an exact amount. */
export function toMicro(raw: unknown): bigint | null {
  const s = typeof raw === 'number' ? (Number.isFinite(raw) ? String(raw) : '') : typeof raw === 'string' ? raw.trim() : '';
  const m = /^(\d+)(?:\.(\d{1,8}))?$/.exec(s);
  if (!m) return null;
  return BigInt(m[1] ?? '0') * SCALE + BigInt((m[2] ?? '').padEnd(8, '0'));
}

/** micro-π → the shortest exact decimal string ("12.5", "0.00000001", "40"). */
export function fromMicro(v: bigint): string {
  const whole = v / SCALE;
  const frac  = (v % SCALE).toString().padStart(8, '0').replace(/0+$/, '');
  return frac ? `${whole}.${frac}` : `${whole}`;
}

export interface PaymentRow { amount?: unknown; status?: unknown; source?: unknown; created_at?: unknown }

/**
 * Completed payments summed by the app they were for. A row whose amount is not
 * an exact decimal, or whose status is not `completed`, is skipped — and counted,
 * so the caller can say the sum is not the whole story (E1).
 */
export function spentBySource(rows: PaymentRow[]): { by_source: Record<string, string>; total: string; skipped: number } {
  const acc = new Map<string, bigint>();
  let total = 0n;
  let skipped = 0;
  for (const r of rows) {
    if (r.status !== 'completed') { skipped += 1; continue; }
    const v = toMicro(r.amount);
    if (v === null) { skipped += 1; continue; }
    const key = typeof r.source === 'string' && r.source ? r.source : 'other';
    acc.set(key, (acc.get(key) ?? 0n) + v);
    total += v;
  }
  return {
    by_source: Object.fromEntries([...acc.entries()].map(([k, v]) => [k, fromMicro(v)])),
    total:     fromMicro(total),
    skipped,
  };
}

export interface CapRow { category: string; cap_pi: string; updated_at?: string }

export interface BudgetLine {
  category: string;
  cap_pi:   string;
  /** Spent this period against this cap, or null when the owning service could not be read. */
  spent_pi: string | null;
  /** 0–100, or null when spent is unknown. Capped at 100 for the bar; `over` says if it went past. */
  pct:      number | null;
  over:     boolean | null;
}

/**
 * The composition rule. `spent` is the owning service's answer or `null` when
 * it could not be read in full; a null never becomes a 0 on any line.
 */
export function composeBudget(
  caps: CapRow[],
  spent: { by_source: Record<string, string> } | null,
): { lines: BudgetLine[]; unallocated: { source: string; spent_pi: string }[] } {
  const lines: BudgetLine[] = caps.map((c) => {
    if (!spent) return { category: c.category, cap_pi: c.cap_pi, spent_pi: null, pct: null, over: null };
    const s   = spent.by_source[c.category] ?? '0';
    const cap = toMicro(c.cap_pi) ?? 0n;
    const sp  = toMicro(s) ?? 0n;
    const pct = cap > 0n ? Number((sp * 10_000n) / cap) / 100 : 0;
    return { category: c.category, cap_pi: c.cap_pi, spent_pi: s, pct: Math.min(100, pct), over: sp > cap };
  });
  const capped = new Set(caps.map((c) => c.category));
  const unallocated = spent
    ? Object.entries(spent.by_source).filter(([k]) => !capped.has(k)).map(([source, spent_pi]) => ({ source, spent_pi }))
    : [];
  return { lines, unallocated };
}

export interface CashflowSide { total: string; lines: { label: string; amount_pi: string; at: string | null }[] }

/** In − out, only when BOTH sides are known; otherwise null — no net on a guess. */
export function netOf(inn: CashflowSide | null, out: CashflowSide | null): string | null {
  if (!inn || !out) return null;
  const a = toMicro(inn.total); const b = toMicro(out.total);
  if (a === null || b === null) return null;
  const d = a - b;
  return d < 0n ? `-${fromMicro(-d)}` : fromMicro(d);
}

/** Payouts SENT to this person inside the period (commerce-service `payouts/mine`). */
export function payoutsIn(rows: { status?: unknown; amount?: unknown; sent_at?: unknown; created_at?: unknown; source?: unknown }[], period: string): CashflowSide {
  const { from, to } = periodBounds(period);
  const lines: CashflowSide['lines'] = [];
  let total = 0n;
  for (const r of rows) {
    if (r.status !== 'SENT') continue;
    const at = typeof r.sent_at === 'string' ? r.sent_at : typeof r.created_at === 'string' ? r.created_at : null;
    if (!at || at < from || at >= to) continue;
    const v = toMicro(r.amount);
    if (v === null) continue;
    total += v;
    lines.push({ label: r.source === 'asset_listing' ? 'assets' : 'commerce', amount_pi: fromMicro(v), at });
  }
  return { total: fromMicro(total), lines };
}

/** Completed payments inside the period, as the out side. */
export function paymentsOut(rows: PaymentRow[]): CashflowSide {
  const lines: CashflowSide['lines'] = [];
  let total = 0n;
  for (const r of rows) {
    if (r.status !== 'completed') continue;
    const v = toMicro(r.amount);
    if (v === null) continue;
    total += v;
    lines.push({
      label:     typeof r.source === 'string' && r.source ? r.source : 'other',
      amount_pi: fromMicro(v),
      at:        typeof r.created_at === 'string' ? r.created_at : null,
    });
  }
  return { total: fromMicro(total), lines };
}
