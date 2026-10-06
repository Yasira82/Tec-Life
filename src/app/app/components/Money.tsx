'use client';

import { useState } from 'react';
import { TEC_APPS } from '@yasser172/tec-ui';
import { C, errorA } from '@/lib-client/palette';
import { useBudget, useCashflow } from '@/lib-client/life/useLife';
import { useTranslation } from '@/lib/i18n';
import { card, goldBtn, inputStyle } from './shared';

/**
 * L1 — Budget and Cash flow on Home (C-106 §10 Phase 1).
 *
 * The caps are the person's own; the amounts beside them come from the services
 * that hold the truth, and the copy says so. A line whose amount could not be
 * read says "couldn't read this month" — it is never drawn as 0, never as
 * "under budget", and the cash flow shows no net while a side is unknown
 * (C-47 §10 E1). Colour is the palette only; the bar turns to the status red
 * only when a cap was actually passed.
 */

const APP_NAME = new Map(TEC_APPS.map((a) => [a.id, a.name]));
export const appLabel = (slug: string, other: string): string =>
  slug === 'other' ? other : (APP_NAME.get(slug as never) ?? (slug.charAt(0).toUpperCase() + slug.slice(1)));

const SLUG = /^[a-z][a-z0-9_-]{0,31}$/;

export function Budget() {
  const { t } = useTranslation();
  const b = t.life.budget;
  const { budget, loading, error, busy, setCap, removeCap } = useBudget();
  const [cat, setCat] = useState('');
  const [amt, setAmt] = useState('');

  const add = () => {
    const c = cat.trim().toLowerCase();
    if (!SLUG.test(c) || !/^(?:0|[1-9]\d{0,11})(?:\.\d{1,8})?$/.test(amt.trim()) || Number(amt) <= 0) return;
    setCat(''); setAmt('');
    void setCap(c, amt.trim());
  };

  const unknown = budget?.spent_status !== null && budget?.spent_status !== undefined;

  return (
    <section style={{ ...card, marginTop: 12 }} aria-labelledby="life-budget" data-testid="budget">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span id="life-budget" style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: C.gold }}>{b.title}</span>
        {budget && <span style={{ fontSize: 11, color: C.faint }}>{budget.period}</span>}
      </div>
      <p style={{ fontSize: 12, color: C.subtext, margin: '4px 0 10px', lineHeight: 1.5 }}>{b.note}</p>

      {loading ? (
        <p style={{ fontSize: 13, color: C.subtext, margin: 0 }}>{t.common.loading}</p>
      ) : error || !budget ? (
        <p role="alert" style={{ fontSize: 12.5, color: C.subtext, margin: 0 }}>{b.unavailable}</p>
      ) : (
        <>
          {unknown && (
            <p data-testid="budget-spent-unknown" style={{ fontSize: 12, color: C.subtext, margin: '0 0 8px', lineHeight: 1.5 }}>
              {budget.spent_status === 'partial' ? b.spentPartial : b.spentUnknown}
            </p>
          )}
          {budget.lines.length === 0 && (
            <p style={{ fontSize: 12.5, color: C.subtext, margin: '0 0 8px', lineHeight: 1.5 }}>{b.empty}</p>
          )}
          {budget.lines.map((l, i) => (
            <div key={l.category} data-testid={`budget-${l.category}`}
              style={{ padding: '10px 0', borderTop: i === 0 ? 'none' : `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {appLabel(l.category, b.other)}
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: l.over ? C.error : C.text, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                  {l.spent_pi === null ? b.lineUnknown : `π ${l.spent_pi}`}
                  <span style={{ color: C.faint, fontWeight: 600 }}> / π {l.cap_pi}</span>
                </span>
                <button onClick={() => void removeCap(l.category)} disabled={busy} title={b.remove} aria-label={`${b.remove} ${appLabel(l.category, b.other)}`}
                  style={{ background: 'none', border: 'none', color: C.subtext, cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>×</button>
              </div>
              {l.pct !== null && (
                <div style={{ height: 6, borderRadius: 999, background: C.bg, overflow: 'hidden', marginTop: 7 }}>
                  <div style={{ width: `${l.pct}%`, height: '100%', borderRadius: 999,
                                background: l.over ? errorA(0.85) : `linear-gradient(90deg, ${C.gold}, ${C.goldDark})`, transition: 'width .3s' }} />
                </div>
              )}
              {l.over && <div style={{ fontSize: 11, color: C.error, marginTop: 4, fontWeight: 700 }}>{b.over}</div>}
            </div>
          ))}
          {budget.unallocated.length > 0 && (
            <div style={{ fontSize: 11.5, color: C.faint, marginTop: 8, lineHeight: 1.5 }} data-testid="budget-unallocated">
              {b.noCap}: {budget.unallocated.map((u) => `${appLabel(u.source, b.other)} π ${u.spent_pi}`).join(' · ')}
            </div>
          )}

          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            <input
              list="life-budget-apps"
              style={{ ...inputStyle, flex: '1 1 0', padding: '9px 10px', fontSize: 13 }}
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              placeholder={b.appPlaceholder}
              aria-label={b.appPlaceholder}
            />
            <datalist id="life-budget-apps">
              {[...new Set([...budget.unallocated.map((u) => u.source), ...TEC_APPS.map((a) => a.id), 'other'])]
                .filter((s) => !budget.lines.some((l) => l.category === s))
                .map((s) => <option key={s} value={s}>{appLabel(s, b.other)}</option>)}
            </datalist>
            <input
              style={{ ...inputStyle, flex: '0 0 96px', padding: '9px 10px', fontSize: 13 }}
              value={amt}
              onChange={(e) => setAmt(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
              inputMode="decimal"
              placeholder={b.capPlaceholder}
              aria-label={b.capPlaceholder}
            />
            <button onClick={add} disabled={busy} style={{ ...goldBtn, padding: '9px 14px', fontSize: 13, opacity: busy ? 0.6 : 1 }}>{b.set}</button>
          </div>
        </>
      )}
    </section>
  );
}

export function Cashflow() {
  const { t } = useTranslation();
  const f = t.life.cashflow;
  const { cashflow, loading, error } = useCashflow();

  const side = (label: string, s: { total: string } | null, status: number | 'partial' | null, testId: string) => (
    <div style={{ flex: 1, minWidth: 0 }} data-testid={testId}>
      <div style={{ fontSize: 10.5, color: C.faint, letterSpacing: 0.3, textTransform: 'uppercase', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: s ? C.text : C.subtext, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', lineHeight: 1.2, marginTop: 2 }}>
        {s ? `π ${s.total}` : (status === 'partial' ? f.partial : f.unknown)}
      </div>
    </div>
  );

  return (
    <section style={{ ...card, marginTop: 12, padding: '16px 20px' }} aria-labelledby="life-cashflow" data-testid="cashflow">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span id="life-cashflow" style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: C.gold }}>{f.title}</span>
        {cashflow && <span style={{ fontSize: 11, color: C.faint }}>{cashflow.period}</span>}
      </div>
      {loading ? (
        <p style={{ fontSize: 13, color: C.subtext, margin: '8px 0 0' }}>{t.common.loading}</p>
      ) : error || !cashflow ? (
        <p role="alert" style={{ fontSize: 12.5, color: C.subtext, margin: '8px 0 0' }}>{f.unavailable}</p>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
            {side(f.in, cashflow.in, cashflow.in_status, 'cashflow-in')}
            <div style={{ width: 1, background: C.border }} />
            {side(f.out, cashflow.out, cashflow.out_status, 'cashflow-out')}
            <div style={{ width: 1, background: C.border }} />
            <div style={{ flex: 1, minWidth: 0 }} data-testid="cashflow-net">
              <div style={{ fontSize: 10.5, color: C.faint, letterSpacing: 0.3, textTransform: 'uppercase', fontWeight: 700 }}>{f.net}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: cashflow.net === null ? C.subtext : cashflow.net.startsWith('-') ? C.error : C.gold,
                            fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', lineHeight: 1.2, marginTop: 2 }}>
                {cashflow.net === null ? f.noNet : `π ${cashflow.net}`}
              </div>
            </div>
          </div>
          <p style={{ fontSize: 11, color: C.faint, margin: '10px 0 0', lineHeight: 1.5 }}>{f.source}</p>
        </>
      )}
    </section>
  );
}
