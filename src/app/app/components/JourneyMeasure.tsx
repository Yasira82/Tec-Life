'use client';

// ── "Before and after" v1 (owner, 2026-10-18) ──────────────────────────────────────────────
//
// On one summary of My journey, the person MAY write down one thing they count — their value
// before the step — and later their value again. It closes the loop between doing the step and
// the change, without claiming one caused the other:
//   • wholly optional — no default value, no number suggested, nothing guessed; Skip stores nothing;
//   • "I don't know" and "I didn't count" are answers, never turned into a number;
//   • the step's outcome (DONE / PARTLY / NOT_YET) is shown beside it, never derived from it;
//   • no invented duration — the screen shows the two dates the person recorded, nothing more.
import { useState } from 'react';
import { C } from '@/lib-client/palette';
import type { SessionCopy } from '@/lib/life/session-copy';
import {
  setMeasure, setFollowup, clearMeasure,
  type JourneyEntry, type MeasureKind, type MeasurePeriod, type FollowupDraft,
} from '@/lib-client/life/journey';
import { inputStyle } from './shared';

const btn = {
  background: 'transparent', color: C.subtext, border: `1px solid ${C.border}`, borderRadius: 8,
  padding: '6px 10px', fontSize: 12.5, cursor: 'pointer',
};
const chosen = { ...btn, color: C.text, background: C.surface2 };
const PERIODS: MeasurePeriod[] = ['DAY', 'WEEK', 'MONTH'];

/** A value the person typed, or null — never a default. */
function readValue(kind: MeasureKind, raw: string): number | null {
  const t = raw.trim().replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace('٫', '.').replace(',', '.');
  if (!t) return null;
  const v = Number(t);
  if (!Number.isFinite(v)) return null;
  if (kind === 'RATING_1_5') return Number.isInteger(v) && v >= 1 && v <= 5 ? v : null;
  return v >= 0 && v <= 1_000_000 ? v : null;
}

function ValueInput({ kind, value, onChange, label }: { kind: MeasureKind; value: string; onChange: (v: string) => void; label: string }) {
  if (kind === 'RATING_1_5') {
    return (
      <div role="group" aria-label={label} style={{ display: 'flex', gap: 6 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" aria-pressed={value === String(n)} onClick={() => onChange(String(n))}
            style={value === String(n) ? chosen : btn}>{n}</button>
        ))}
      </div>
    );
  }
  return (
    <input aria-label={label} inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)}
      style={{ ...inputStyle, flex: 'none', width: 120 }} />
  );
}

export function JourneyMeasure({ entry, keeping, s, date, onUpdate }: {
  entry: JourneyEntry; keeping: boolean; s: SessionCopy;
  date: (iso: string) => string; onUpdate: (e: JourneyEntry) => void;
}) {
  const [mode, setMode]     = useState<'view' | 'before' | 'later'>('view');
  const [label, setLabel]   = useState('');
  const [kind, setKind]     = useState<MeasureKind>('NUMBER');
  const [period, setPeriod] = useState<MeasurePeriod>('DAY');
  const [value, setValue]   = useState('');
  const [busy, setBusy]     = useState(false);
  const [failed, setFailed] = useState(false);

  const has = !!entry.measure_kind && entry.baseline_value !== null && entry.baseline_value !== undefined;
  const per = (p: MeasurePeriod | null | undefined) => (p === 'WEEK' ? s.mPerWeek : p === 'MONTH' ? s.mPerMonth : s.mPerDay);
  const show = (v: number) => (entry.measure_kind === 'RATING_1_5' ? s.mOutOf5.replace('{n}', String(v)) : String(v));

  const run = async (p: Promise<JourneyEntry | null>) => {
    setBusy(true); setFailed(false);
    const out = await p;
    setBusy(false);
    if (!out) { setFailed(true); return; }
    onUpdate(out); setMode('view'); setValue('');
  };
  const openBefore = () => {
    setLabel(entry.measure_label ?? ''); setKind(entry.measure_kind ?? 'NUMBER'); setPeriod(entry.measure_period ?? 'DAY');
    setValue(has ? String(entry.baseline_value) : ''); setFailed(false); setMode('before');
  };
  const saveBefore = () => {
    const v = readValue(kind, value);
    if (v === null || !label.trim()) return;
    void run(setMeasure(entry.id, { kind, label: label.trim(), period, value: v }));
  };
  const saveLater = (f: FollowupDraft) => { void run(setFollowup(entry.id, f)); };
  const remove = async () => {
    setBusy(true); setFailed(false);
    const ok = await clearMeasure(entry.id);
    setBusy(false);
    if (!ok) { setFailed(true); return; }
    onUpdate({ ...entry, measure_kind: null, measure_label: null, measure_period: null, baseline_value: null,
      baseline_at: null, followup_value: null, followup_at: null, followup_status: null });
  };

  const error = failed && <div role="alert" style={{ fontSize: 12, color: C.text, marginTop: 6 }}>{s.mFailed}</div>;

  if (mode === 'before') {
    const ready = !!label.trim() && readValue(kind, value) !== null;
    return (
      <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
        <div style={{ fontSize: 12, color: C.subtext, lineHeight: 1.5 }}>{s.mHint}</div>
        <input aria-label={s.mLabel} placeholder={s.mLabelPh} maxLength={60} value={label}
          onChange={(e) => setLabel(e.target.value)} style={inputStyle} />
        <div role="group" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button type="button" aria-pressed={kind === 'NUMBER'} style={kind === 'NUMBER' ? chosen : btn}
            onClick={() => { setKind('NUMBER'); setValue(''); }}>{s.mKindNumber}</button>
          <button type="button" aria-pressed={kind === 'RATING_1_5'} style={kind === 'RATING_1_5' ? chosen : btn}
            onClick={() => { setKind('RATING_1_5'); setValue(''); }}>{s.mKindRating}</button>
        </div>
        <div role="group" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PERIODS.map((p) => (
            <button key={p} type="button" aria-pressed={period === p} style={period === p ? chosen : btn}
              onClick={() => setPeriod(p)}>{per(p)}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, color: C.subtext }}>{s.mValueNow}</span>
          <ValueInput kind={kind} value={value} onChange={setValue} label={s.mValueNow} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" style={ready && !busy ? chosen : { ...btn, opacity: 0.5 }} disabled={!ready || busy} onClick={saveBefore}>{s.mSave}</button>
          <button type="button" style={btn} disabled={busy} onClick={() => setMode('view')}>{s.mSkip}</button>
        </div>
        {error}
      </div>
    );
  }

  if (!has) {
    if (!keeping) return null;
    return (
      <div style={{ marginTop: 8 }}>
        <button type="button" style={btn} onClick={openBefore}>{s.mAdd}</button>
      </div>
    );
  }

  const lineOf = (v: number) => <><bdi>{entry.measure_label}</bdi>: {show(v)} {per(entry.measure_period)}</>;
  const measured = entry.followup_status === 'MEASURED' && entry.followup_value !== null && entry.followup_value !== undefined;
  const later = entry.followup_status === 'UNKNOWN' ? s.mUnknown : entry.followup_status === 'NOT_MEASURED' ? s.mNotMeasured : null;

  return (
    <div translate="no" style={{ marginTop: 10, fontSize: 12.5, color: C.subtext, display: 'grid', gap: 4 }}>
      <div>{s.mBefore}{entry.baseline_at && <> ({date(entry.baseline_at)})</>}: {lineOf(entry.baseline_value!)}</div>
      {measured && <div>{s.mAfter}{entry.followup_at && <> ({date(entry.followup_at)})</>}: {lineOf(entry.followup_value!)}</div>}
      {later && <div>{s.mAfter}{entry.followup_at && <> ({date(entry.followup_at)})</>}: {later}</div>}
      {measured && entry.baseline_at && entry.followup_at && (
        <div style={{ color: C.text, marginTop: 2 }}>
          {s.mChange.replace('{a}', show(entry.baseline_value!)).replace('{b}', show(entry.followup_value!))
            .replace('{d1}', date(entry.baseline_at)).replace('{d2}', date(entry.followup_at))}
          <div style={{ fontSize: 11.5, color: C.faint, marginTop: 2 }}>{s.mClaim}</div>
        </div>
      )}
      {mode === 'later' ? (
        <div style={{ display: 'grid', gap: 8, marginTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span>{s.mValueNow}</span>
            <ValueInput kind={entry.measure_kind!} value={value} onChange={setValue} label={s.mValueNow} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(() => {
              const v = readValue(entry.measure_kind!, value);
              return <button type="button" style={v !== null && !busy ? chosen : { ...btn, opacity: 0.5 }} disabled={v === null || busy}
                onClick={() => v !== null && saveLater({ status: 'MEASURED', value: v })}>{s.mSave}</button>;
            })()}
            <button type="button" style={btn} disabled={busy} onClick={() => saveLater({ status: 'UNKNOWN' })}>{s.mUnknown}</button>
            <button type="button" style={btn} disabled={busy} onClick={() => saveLater({ status: 'NOT_MEASURED' })}>{s.mNotMeasured}</button>
            <button type="button" style={btn} disabled={busy} onClick={() => setMode('view')}>{s.mSkip}</button>
          </div>
        </div>
      ) : keeping && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          <button type="button" style={btn} onClick={() => { setValue(''); setFailed(false); setMode('later'); }}>{s.mFollowCta}</button>
          {!entry.followup_status && <button type="button" style={btn} onClick={openBefore}>{s.mEdit}</button>}
          <button type="button" style={btn} disabled={busy} onClick={() => void remove()}>{s.mRemove}</button>
        </div>
      )}
      {error}
    </div>
  );
}
