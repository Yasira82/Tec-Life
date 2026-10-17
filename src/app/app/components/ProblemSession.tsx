'use client';

// ── Stage 1: "talk it through without saving" ───────────────────────────────
//
// KB audits/LIFE_FIRST_SESSION_SPEC_DRAFT_2026-10-17.md — §2 (S1–S3, S6-A, S7)
// and §8 stage 1, approved by the owner on 2026-10-17.
//
// The one rule this file exists to keep: the person's words never leave the
// page. They live in this component's state and nowhere else — no fetch, no
// localStorage/sessionStorage/IndexedDB, no URL, no log. Closing the page or
// pressing Finish drops them. The only network call is `countSession`, whose
// body is one word from a closed set. `e2e/session.spec.ts` (G5, browser side)
// types a marker into every field and fails if it appears in any request.
//
// The text fields also turn off the browser's own ways of carrying text
// elsewhere: `autoComplete="off"` (form history is text stored on the device),
// `spellCheck={false}` (enhanced spell-check sends text to a server), and
// `translate="no"` on everything that shows their words (page translation
// sends the page's text out).
import { useEffect, useRef, useState } from 'react';
import { C } from '@/lib-client/palette';
import { useTranslation } from '@/lib/i18n';
import { sessionCopy } from '@/lib/life/session-copy';
import { countSession } from '@/lib-client/life/sessionCounter';
import { card, goldBtn } from './shared';

type Step =
  | 'intro' | 'problem'
  | 'when1' | 'did1' | 'another'
  | 'when2' | 'did2'
  | 'plan' | 'summary';

/** S3 asks at most 5 questions: two for the first time, "another?", two for the second. */
interface Occurrence { when: string; did: string }

const MAX = 1000;

const textArea = {
  width: '100%', minHeight: 96, resize: 'vertical' as const,
  background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10,
  padding: '10px 12px', fontSize: 14, lineHeight: 1.5, fontFamily: 'inherit',
};
const ghostBtn = {
  background: 'transparent', color: C.subtext, border: `1px solid ${C.border}`, borderRadius: 10,
  padding: '10px 14px', fontSize: 14, cursor: 'pointer',
};

export function ProblemSession({ onClose }: { onClose: () => void }) {
  const { locale } = useTranslation();
  const s = sessionCopy(locale);

  const [step, setStep]       = useState<Step>('intro');
  const [problem, setProblem] = useState('');
  const [occ, setOcc]         = useState<Occurrence[]>([{ when: '', did: '' }]);
  const [clearer, setClearer] = useState<'yes' | 'somewhat' | 'no' | null>(null);
  const [copied, setCopied]   = useState(false);
  const counted = useRef<{ s2: boolean; s7: boolean }>({ s2: false, s7: false });

  // M1's two counts, each once per session.
  useEffect(() => {
    if (step === 'problem' && !counted.current.s2) { counted.current.s2 = true; countSession('s2_started'); }
    if (step === 'summary' && !counted.current.s7) { counted.current.s7 = true; countSession('s7_reached'); }
  }, [step]);

  const setOccField = (i: number, k: keyof Occurrence, v: string) =>
    setOcc((o) => o.map((x, j) => (j === i ? { ...x, [k]: v.slice(0, MAX) } : x)));

  const finish = () => {
    // Drop every word before leaving, rather than trusting unmount to.
    setProblem(''); setOcc([{ when: '', did: '' }]); setClearer(null);
    onClose();
  };

  const answerClearer = (v: 'yes' | 'somewhat' | 'no') => {
    if (clearer) return; // one answer per session
    setClearer(v);
    countSession(v === 'yes' ? 'm6_yes' : v === 'somewhat' ? 'm6_somewhat' : 'm6_no');
  };

  const summaryText = () => {
    const lines = [`${s.problemLabel}: ${problem.trim()}`];
    occ.filter((o) => o.when.trim() || o.did.trim()).forEach((o, i) => {
      lines.push(`${s.timeLabel} ${i + 1}: ${o.when.trim()}${o.did.trim() ? ` — ${o.did.trim()}` : ''}`);
    });
    lines.push('', `${s.dontKnow}: ${s.dontKnowBody}`, '', s.planIntro, ...s.planItems.map((p) => `• ${p}`));
    return lines.join('\n');
  };

  const copy = async () => {
    // The clipboard is the person's own device — the one place their words may go.
    try { await navigator.clipboard.writeText(summaryText()); setCopied(true); } catch { /* nothing to report */ }
  };

  const field = (value: string, onChange: (v: string) => void, label: string, hint?: string) => (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.text, lineHeight: 1.45, marginBottom: 6 }}>{label}</div>
      {hint && <div style={{ fontSize: 12.5, color: C.subtext, marginBottom: 8, lineHeight: 1.45 }}>{hint}</div>}
      <textarea
        value={value} onChange={(e) => onChange(e.target.value.slice(0, MAX))} maxLength={MAX}
        autoComplete="off" spellCheck={false} translate="no" style={textArea}
      />
    </label>
  );

  const nav = (next: () => void, canNext: boolean, back?: () => void, optional = false) => (
    <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
      {back && <button type="button" style={ghostBtn} onClick={back}>{s.back}</button>}
      <button type="button" style={{ ...goldBtn, opacity: canNext ? 1 : 0.5 }} disabled={!canNext} onClick={next}>{s.next}</button>
      {optional && <button type="button" style={ghostBtn} onClick={next}>{s.skip}</button>}
    </div>
  );

  const told = occ.filter((o) => o.when.trim() || o.did.trim());
  const first  = occ[0] ?? { when: '', did: '' };
  const second = occ[1];

  return (
    <section aria-live="polite" style={{ ...card, marginTop: 16 }}>
      {step === 'intro' && (
        <>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.gold, marginBottom: 10 }}>{s.introTitle}</h2>
          <p style={{ fontSize: 14, color: C.text, lineHeight: 1.55, marginBottom: 8 }}>{s.introIs}</p>
          <p style={{ fontSize: 14, color: C.subtext, lineHeight: 1.55, marginBottom: 12 }}>{s.introIsNot}</p>
          <p role="note" style={{ fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.55 }}>{s.introNothingSaved}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button type="button" style={goldBtn} onClick={() => setStep('problem')}>{s.start}</button>
            <button type="button" style={ghostBtn} onClick={finish}>{s.cancel}</button>
          </div>
        </>
      )}

      {step === 'problem' && (
        <>
          {field(problem, setProblem, s.problemQ, s.problemHint)}
          {nav(() => setStep('when1'), problem.trim().length > 0, () => setStep('intro'))}
        </>
      )}

      {step === 'when1' && (
        <>
          <p style={{ fontSize: 12.5, color: C.subtext, lineHeight: 1.5, marginBottom: 12 }}>{s.rolesNote}</p>
          {field(first.when, (v) => setOccField(0, 'when', v), s.whenWhatQ, s.whenWhatHint)}
          {nav(() => setStep('did1'), first.when.trim().length > 0, () => setStep('problem'))}
        </>
      )}

      {step === 'did1' && (
        <>
          {field(first.did, (v) => setOccField(0, 'did', v), s.didFollowedQ, s.didFollowedHint)}
          {nav(() => setStep('another'), first.did.trim().length > 0, () => setStep('when1'))}
        </>
      )}

      {step === 'another' && (
        <>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, lineHeight: 1.45, marginBottom: 12 }}>{s.anotherQ}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Only a "yes, a different time" opens a second occurrence: two accounts of
                the same incident are one occurrence (§2 S3). */}
            <button type="button" style={goldBtn} onClick={() => { setOcc([first, { when: '', did: '' }]); setStep('when2'); }}>{s.anotherYes}</button>
            <button type="button" style={ghostBtn} onClick={() => { setOcc([first]); setStep('plan'); }}>{s.anotherSame}</button>
            <button type="button" style={ghostBtn} onClick={() => { setOcc([first]); setStep('plan'); }}>{s.anotherNone}</button>
          </div>
          <div style={{ marginTop: 12 }}><button type="button" style={ghostBtn} onClick={() => setStep('did1')}>{s.back}</button></div>
        </>
      )}

      {step === 'when2' && second && (
        <>
          {field(second.when, (v) => setOccField(1, 'when', v), s.secondWhenWhatQ, s.whenWhatHint)}
          {nav(() => setStep('did2'), second.when.trim().length > 0, () => setStep('another'))}
        </>
      )}

      {step === 'did2' && second && (
        <>
          {field(second.did, (v) => setOccField(1, 'did', v), s.secondDidFollowedQ, s.didFollowedHint)}
          {nav(() => setStep('plan'), second.did.trim().length > 0, () => setStep('when2'))}
        </>
      )}

      {step === 'plan' && (
        <>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: C.gold, marginBottom: 10 }}>{s.planTitle}</h2>
          <p style={{ fontSize: 14, color: C.text, lineHeight: 1.55, marginBottom: 8 }}>{s.planIntro}</p>
          <ul style={{ paddingInlineStart: 20, color: C.text, fontSize: 14, lineHeight: 1.7 }}>
            {s.planItems.map((p) => <li key={p}>{p}</li>)}
          </ul>
          <p style={{ fontSize: 12.5, color: C.subtext, lineHeight: 1.5, marginTop: 8 }}>{s.planNote}</p>
          {nav(() => setStep('summary'), true, () => setStep(second ? 'did2' : 'another'))}
        </>
      )}

      {step === 'summary' && (
        <>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.gold, marginBottom: 12 }}>{s.summaryTitle}</h2>

          <h3 style={{ fontSize: 13, fontWeight: 800, color: C.subtext, letterSpacing: 0.4, marginBottom: 6 }}>{s.toldMe}</h3>
          <div translate="no" style={{ fontSize: 14, color: C.text, lineHeight: 1.55, marginBottom: 14, whiteSpace: 'pre-wrap' }}>
            <div><strong>{s.problemLabel}:</strong> <bdi>{problem.trim()}</bdi></div>
            {told.map((o, i) => (
              <div key={i} style={{ marginTop: 6 }}>
                <strong>{s.timeLabel} {i + 1}:</strong> <bdi>{o.when.trim()}</bdi>
                {o.did.trim() && <> — <bdi>{o.did.trim()}</bdi></>}
              </div>
            ))}
          </div>

          <h3 style={{ fontSize: 13, fontWeight: 800, color: C.subtext, letterSpacing: 0.4, marginBottom: 6 }}>{s.mightExplain}</h3>
          <p style={{ fontSize: 14, color: C.text, lineHeight: 1.55, marginBottom: 14 }}>{s.mightExplainBody}</p>

          <h3 style={{ fontSize: 13, fontWeight: 800, color: C.subtext, letterSpacing: 0.4, marginBottom: 6 }}>{s.dontKnow}</h3>
          <p style={{ fontSize: 14, color: C.text, lineHeight: 1.55, marginBottom: 14 }}>{s.dontKnowBody}</p>

          <p role="note" style={{ fontSize: 13.5, fontWeight: 700, color: C.text, lineHeight: 1.5 }}>{s.notSaved}</p>
          <div style={{ marginTop: 10 }}>
            <button type="button" style={ghostBtn} onClick={copy}>{copied ? s.copied : s.copy}</button>
          </div>

          {/* M6 — optional; a skipped question writes nothing (§7). */}
          <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 18, paddingTop: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 10 }}>{s.clearerQ}</div>
            {clearer ? (
              <div role="status" style={{ fontSize: 13.5, color: C.subtext }}>{s.thanks}</div>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" style={ghostBtn} onClick={() => answerClearer('yes')}>{s.clearerYes}</button>
                <button type="button" style={ghostBtn} onClick={() => answerClearer('somewhat')}>{s.clearerSomewhat}</button>
                <button type="button" style={ghostBtn} onClick={() => answerClearer('no')}>{s.clearerNo}</button>
              </div>
            )}
          </div>

          <div style={{ marginTop: 18 }}>
            <button type="button" style={goldBtn} onClick={finish}>{s.finish}</button>
          </div>
        </>
      )}
    </section>
  );
}

/** The entry on Home: a door into the session, nothing more. */
export function ProblemSessionEntry({ onStart }: { onStart: () => void }) {
  const { locale } = useTranslation();
  const s = sessionCopy(locale);
  return (
    <section style={{ ...card, marginTop: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 4 }}>{s.entryTitle}</div>
      <div style={{ fontSize: 12.5, color: C.subtext, lineHeight: 1.5, marginBottom: 12 }}>{s.entryHint}</div>
      <button type="button" style={goldBtn} onClick={onStart}>{s.entryCta}</button>
    </section>
  );
}
