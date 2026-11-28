'use client';

// The redesign's budget, in «Me» (A1 — owner, 2026-11-28; KB audits/LIFE_INTELLIGENCE_IMPLEMENTATION_PLAN_2026-11-28.md
// §4 A1). The same data and the same routes the current design uses — nothing new on the server:
//   caps   ← tec-life-service (Life owns them)          via the existing /api/bff/life/budget (useBudget)
//   spent  ← payment-service history, completed only   presented beside each cap, never copied into Life
//
// What the screen keeps from the current design, and why:
//   • a spend that could not be read is SAID («couldn't read»), never drawn as 0 or as «under the cap»;
//   • a month with more payments than one read holds is 'partial', and the amounts are not shown;
//   • over a cap is stated in words («over the cap by 2π») — never by colour alone.
// What it adds: the amount is read by the one π parser (src/lib/life/amount.ts), errors stay beside the
// field, and the cap is sent as the exact decimal typed (amountString) — never a rounded or "1e-8" number.
// No money is shown next to a goal: a cap belongs to an app, not to a goal (owner, 2026-11-28).
import { useState, type CSSProperties } from 'react';
import { TEC_APPS } from '@yasser172/tec-ui';
import { C, errorA, goldA } from '@/lib-client/palette';
import { useTranslation } from '@/lib/i18n';
import { useBudget, type BudgetLine } from '@/lib-client/life/useLife';
import { appLabel } from '../../components/Money';
import { budgetCopy } from '@/lib/life/budget-copy';
import { goalsCopy } from '@/lib/life/goals-copy';
import { fill } from '@/lib/life/today-copy';
import { localDigits } from '@/lib/life/digits';
import { parseAmount, amountString, CAP_MAX } from '@/lib/life/amount';
import { toMicro, fromMicro } from '@/lib/life/money';

const card: CSSProperties = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: '4px 16px' };
const quiet: CSSProperties = { minHeight: 44, borderRadius: 12, border: `1px solid ${C.border}`, background: 'transparent', color: C.text, fontSize: 14, cursor: 'pointer', padding: '0 14px' };
const field: CSSProperties = { minHeight: 44, fontSize: 16, background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 12, padding: '0 10px' };

/** The difference of two exact decimal strings, or null when either is not one. */
function minus(a: string, b: string): string | null {
  const x = toMicro(a); const y = toMicro(b);
  return x === null || y === null ? null : fromMicro(x - y < 0n ? y - x : x - y);
}

export function MeBudget() {
  const { t, locale } = useTranslation();
  const b = t.life.budget;
  const k = budgetCopy(locale);
  const g = goalsCopy(locale);
  const { budget: read, loading, busy, reload, setCap, removeCap } = useBudget();
  // A response that is not the expected shape is treated as unread — said with a retry — never trusted
  // half-way: one missing list must not take the whole Me screen down with it.
  const budget = read && /^\d{4}-\d{2}$/.test(read.period ?? '') && Array.isArray(read.lines) && Array.isArray(read.unallocated)
    ? read : null;
  const [adding, setAdding] = useState(false);
  const [app, setApp] = useState('');
  const [amount, setAmount] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  // A change the server did not accept: said here, and the list is read again so it shows what IS saved.
  const [saveFailed, setSaveFailed] = useState(false);
  const after = (ok: boolean) => {
    setSaveFailed(!ok);
    if (ok) { setAdding(false); setApp(''); setAmount(''); } else reload();
  };
  const pi = (v: string) => localDigits(locale, v);

  const month = budget
    ? new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' }).format(new Date(`${budget.period}-01T00:00:00Z`))
    : '';
  const choices = budget
    ? [...new Set([...budget.unallocated.map((u) => u.source), ...TEC_APPS.map((a) => a.id), 'other'])]
        .filter((s) => !budget.lines.some((l) => l.category === s))
    : [];

  const submit = () => {
    const r = parseAmount(amount, CAP_MAX);
    if (!r.ok) {
      setProblem(r.problem === 'ambiguous' ? g.amountAmbiguous : r.problem === 'too_precise' ? g.amountTooPrecise
        : r.problem === 'too_large' ? g.amountTooLarge : g.amountInvalid);
      return;
    }
    const exact = amountString(amount, CAP_MAX);
    if (!app || !exact) return;
    void setCap(app, exact).then(after);
  };

  let body;
  if (loading && !budget) {
    body = <div aria-busy="true" style={{ height: 96 }} />;
  } else if (!budget) {
    // A budget that could not be read is said, with a retry — never shown as «no caps».
    body = (
      <div role="alert" data-testid="budget-failed" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 0' }}>
        <span style={{ fontSize: 14, color: C.text }}>{b.unavailable}</span>
        <button type="button" onClick={reload} style={quiet}>{k.retry}</button>
      </div>
    );
  } else {
    const unknown = budget.spent_status !== null && budget.spent_status !== undefined;
    body = (
      <>
        {unknown && (
          <p data-testid="budget-spent-unknown" style={{ margin: '12px 0 4px', fontSize: 13, color: C.subtext, lineHeight: 1.6 }}>
            {budget.spent_status === 'partial' ? b.spentPartial : b.spentUnknown}
          </p>
        )}
        {budget.lines.length === 0 && <p style={{ margin: '12px 0', fontSize: 14, color: C.subtext }}>{b.empty}</p>}
        {budget.lines.map((l, i) => <Line key={l.category} line={l} first={i === 0} busy={busy} pi={pi}
          name={appLabel(l.category, b.other)} unknownText={b.lineUnknown} k={k} onRemove={() => { void removeCap(l.category).then(after); }} />)}
      </>
    );
  }

  return (
    <section data-testid="me-budget" aria-labelledby="me-budget-h" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h2 id="me-budget-h" style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text }}>{budget ? fill(k.heading, { month }) : b.title}</h2>
      <div style={card}>{body}</div>

      {budget && budget.unallocated.length > 0 && (
        <p data-testid="budget-unallocated" style={{ margin: 0, fontSize: 13, color: C.subtext, lineHeight: 1.6 }}>
          {b.noCap}: {budget.unallocated.map((u) => `${appLabel(u.source, b.other)} ${pi(u.spent_pi)}π`).join(' · ')}
        </p>
      )}

      {budget && saveFailed && (
        <p role="alert" data-testid="budget-save-failed" style={{ margin: 0, fontSize: 13, color: C.text }}>{k.saveFailed}</p>
      )}

      {budget && (adding ? (
        <div data-testid="budget-add" style={{ ...card, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: C.subtext }}>
            {k.chooseApp}
            <select value={app} onChange={(e) => setApp(e.target.value)} style={field}>
              <option value="">—</option>
              {choices.map((s) => <option key={s} value={s}>{appLabel(s, b.other)}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: C.subtext }}>
            {b.capPlaceholder}
            <input value={amount} inputMode="decimal" style={{ ...field, borderColor: problem ? C.error : C.border }}
              aria-invalid={problem ? true : undefined} aria-describedby={problem ? 'budget-amount-problem' : undefined}
              onChange={(e) => { setAmount(e.target.value); setProblem(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} />
          </label>
          {problem && <span id="budget-amount-problem" role="alert" style={{ fontSize: 13, color: C.text }}>{problem}</span>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={submit} disabled={busy || !app || !amount.trim()}
              style={{ ...quiet, background: C.gold, color: C.onGold, border: 'none', fontWeight: 800, opacity: busy || !app || !amount.trim() ? 0.6 : 1 }}>{k.save}</button>
            <button type="button" onClick={() => { setAdding(false); setProblem(null); }} style={quiet}>{k.cancel}</button>
          </div>
        </div>
      ) : (
        <button type="button" data-testid="budget-add-open" onClick={() => setAdding(true)} disabled={busy} style={{ ...quiet, alignSelf: 'flex-start' }}>{k.add}</button>
      ))}

      <p style={{ margin: 0, fontSize: 12, color: C.subtext, lineHeight: 1.6 }}>{k.source}</p>
    </section>
  );
}

function Line({ line, first, busy, pi, name, unknownText, k, onRemove }: {
  line: BudgetLine; first: boolean; busy: boolean; pi: (v: string) => string; name: string; unknownText: string;
  k: ReturnType<typeof budgetCopy>; onRemove: () => void;
}) {
  const known = line.spent_pi !== null;
  const diff = known ? minus(line.cap_pi, line.spent_pi!) : null;
  return (
    <div data-testid={`budget-${line.category}`} style={{ padding: '12px 0', borderTop: first ? 'none' : `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600, color: C.text }}>{name}</span>
        <span style={{ fontSize: 13.5, fontWeight: line.over ? 700 : 400, color: line.over ? C.error : C.subtext, whiteSpace: 'nowrap' }}>
          {known ? `${pi(line.spent_pi!)} / ${pi(line.cap_pi)}π` : `${pi(line.cap_pi)}π`}
        </span>
        <button type="button" onClick={onRemove} disabled={busy} aria-label={fill(k.removeApp, { app: name })}
          style={{ width: 44, minHeight: 44, flex: 'none', border: 'none', background: 'transparent', color: C.subtext, fontSize: 18, cursor: 'pointer' }}>×</button>
      </div>
      {line.pct !== null && (
        <div aria-hidden="true" style={{ height: 8, borderRadius: 999, background: C.surface2, overflow: 'hidden' }}>
          <div style={{ width: `${line.pct}%`, height: '100%', borderRadius: 999, background: line.over ? errorA(0.85) : goldA(1) }} />
        </div>
      )}
      <span data-testid={`budget-${line.category}-state`} style={{ fontSize: 12.5, color: line.over ? C.error : C.subtext, fontWeight: line.over ? 700 : 400 }}>
        {!known ? unknownText : line.over ? fill(k.overBy, { n: pi(diff ?? '') }) : fill(k.left, { n: pi(diff ?? '') })}
      </span>
    </div>
  );
}
