'use client';

// ── «أنا بتغيّر» — I'm changing (owner, 2026-10-23) ──────────────────────────
//
// "Building the human" needs the person to see who they are becoming, not only what went
// wrong. This page is built ONLY from what they chose to keep — their summaries and one
// sentence of their own — and shows it as evidence: what they managed, what works for them,
// what they now do, why it matters, their own words, and how they felt. Nothing here is a
// score, a streak or a judgement: a slip never takes anything away from this page.
//
// Read from Life with the session (never from storage); nothing at all when it cannot be read.
import { useEffect, useState } from 'react';
import { C } from '@/lib-client/palette';
import { useTranslation } from '@/lib/i18n';
import { sessionCopy } from '@/lib/life/session-copy';
import { readJourney, readSelf, setSelf, type Journey, type Self } from '@/lib-client/life/journey';
import { card } from './shared';

const SHOW = 3;
const smallBtn = {
  background: 'transparent', color: C.subtext, border: `1px solid ${C.border}`, borderRadius: 8,
  padding: '6px 10px', fontSize: 12.5, cursor: 'pointer',
};

function Section({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: C.gold, marginBottom: 4 }}>{title}</div>
      <ul translate="no" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.slice(0, SHOW).map((t, i) => (
          <li key={i} style={{ fontSize: 13.5, color: C.text, lineHeight: 1.55, marginTop: 2 }}><bdi>{t}</bdi></li>
        ))}
      </ul>
    </div>
  );
}

export function Becoming() {
  const { locale } = useTranslation();
  const s = sessionCopy(locale);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [self, setSelfState]  = useState<Self | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState('');
  const [saving, setSaving]   = useState(false);
  const [failed, setFailed]   = useState(false);

  useEffect(() => { void readJourney().then(setJourney); void readSelf().then(setSelfState); }, []);
  // Only for a person who keeps their journey: without it there is nothing of theirs to show.
  if (!journey?.keeping) return null;

  const entries = journey.entries;
  const uniq = (xs: (string | null | undefined)[]) => [...new Set(xs.filter((x): x is string => !!x && !!x.trim()))];
  const did = uniq([
    ...entries.filter((e) => e.step && (e.step_outcome === 'DONE' || e.step_outcome === 'PARTLY'))
      .map((e) => (e.step_outcome === 'DONE' ? e.step! : `${e.step} — ${s.outPartly}`)),
    // Before → after, exactly as they recorded it; no arrow says better or worse for them.
    ...entries.filter((e) => e.measure_label && e.followup_status === 'MEASURED' && e.baseline_value != null && e.followup_value != null)
      .map((e) => `${e.measure_label}: ${e.baseline_value} → ${e.followup_value}`),
  ]);
  const helped   = uniq(entries.map((e) => e.helped));
  const practice = uniq(entries.map((e) => e.practice));
  const reasons  = uniq(entries.map((e) => e.reason));
  const words    = uniq(entries.map((e) => e.words)).map((w) => `«${w}»`);
  const feelings = entries.filter((e) => e.feeling_start || e.feeling_end).slice(0, SHOW)
    .map((e) => `${e.feeling_start ? s.feel[e.feeling_start] : '—'} → ${e.feeling_end ? s.feel[e.feeling_end] : '—'}`);
  const empty = !self?.statement && [did, helped, practice, reasons, words, feelings].every((x) => x.length === 0);

  const save = async () => {
    setSaving(true); setFailed(false);
    const out = await setSelf(draft.trim());
    setSaving(false);
    if (!out) { setFailed(true); return; }
    setSelfState(out); setEditing(false);
  };

  return (
    <section aria-label={s.bTitle} style={{ ...card, marginTop: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{s.bTitle}</div>
      <div style={{ fontSize: 12, color: C.subtext, marginTop: 2 }}>{s.bHint}</div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: C.gold, marginBottom: 4 }}>{s.bStatementLabel}</div>
        {editing ? (
          <>
            <textarea value={draft} maxLength={200} disabled={saving} placeholder={s.bStatementPh} aria-label={s.bStatementLabel}
              onChange={(e) => setDraft(e.target.value.slice(0, 200))} autoComplete="off" spellCheck={false} translate="no"
              style={{ width: '100%', minHeight: 56, background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8,
                padding: '8px 10px', fontSize: 14, lineHeight: 1.5, fontFamily: 'inherit', resize: 'vertical' }} />
            {failed && <div role="alert" style={{ fontSize: 12.5, color: C.text, marginTop: 6 }}>{s.jMemFailed}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button type="button" style={smallBtn} disabled={saving} onClick={() => void save()}>{s.jMemSave}</button>
              <button type="button" style={smallBtn} disabled={saving} onClick={() => setEditing(false)}>{s.jMemCancel}</button>
            </div>
          </>
        ) : (
          <>
            {self?.statement
              ? <div translate="no" style={{ fontSize: 15, fontWeight: 700, color: C.text, lineHeight: 1.5 }}><bdi>{self.statement}</bdi></div>
              : <div style={{ fontSize: 13, color: C.subtext, lineHeight: 1.5 }}>{s.bStatementEmpty}</div>}
            {self && (
              <button type="button" style={{ ...smallBtn, marginTop: 8 }}
                onClick={() => { setDraft(self.statement ?? ''); setFailed(false); setEditing(true); }}>{s.bEdit}</button>
            )}
          </>
        )}
      </div>

      <Section title={s.bDid} items={did} />
      <Section title={s.bHelped} items={helped} />
      <Section title={s.bPractice} items={practice} />
      <Section title={s.bReasons} items={reasons} />
      <Section title={s.bWords} items={words} />
      <Section title={s.bFeelings} items={feelings} />
      {empty && <div style={{ fontSize: 13, color: C.subtext, lineHeight: 1.55, marginTop: 12 }}>{s.bEmpty}</div>}
    </section>
  );
}
