'use client';

// ── Life's conversation — nothing saved ─────────────────────────────────────
//
// KB audits/LIFE_FIRST_SESSION_SPEC_DRAFT_2026-10-17.md §2, §5, §8. Stage 1 asked
// fixed questions; on the owner's own phone it read as a form ("I want someone to
// talk to me and understand me", 2026-10-17), so it became a conversation.
//
// The rules this file keeps:
//   • Consent first. Nothing is sent before the person has read that their words go
//     to an AI model (Groq) and agreed.
//   • The conversation lives in this component's state and nowhere else — no
//     localStorage/sessionStorage/IndexedDB, no URL, no log. Finish or closing the
//     page drops it. Its only way out is `talk()` → Life's BFF → the AI service,
//     which answers from Groq and keeps nothing (tec-core-backend #439).
//   • `e2e/session.spec.ts` (G5, browser side) fails if a word appears in any other
//     request, or in any storage.
//   • The text field turns off the browser's own ways of moving text:
//     `autoComplete="off"`, `spellCheck={false}`, and `translate="no"` on everything
//     that shows the conversation.
import { useEffect, useRef, useState } from 'react';
import { C } from '@/lib-client/palette';
import { useTranslation } from '@/lib/i18n';
import { sessionCopy } from '@/lib/life/session-copy';
import { countSession } from '@/lib-client/life/sessionCounter';
import { talk, type Turn } from '@/lib-client/life/lifeTalk';
import { card, goldBtn } from './shared';

type Step = 'intro' | 'chat' | 'end';

const MAX_CHARS = 1000;
/** The AI service accepts 24 messages; the opener is one of them. */
const MAX_MESSAGES = 24;

const textArea = {
  width: '100%', minHeight: 72, resize: 'vertical' as const,
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

  const [step, setStep]         = useState<Step>('intro');
  const [turns, setTurns]       = useState<Turn[]>([]);
  const [draft, setDraft]       = useState('');
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [clearer, setClearer]   = useState<'yes' | 'somewhat' | 'no' | null>(null);
  const [copied, setCopied]     = useState(false);
  const counted = useRef<{ s2: boolean; s7: boolean }>({ s2: false, s7: false });

  useEffect(() => {
    if (step === 'end' && !counted.current.s7) { counted.current.s7 = true; countSession('s7_reached'); }
  }, [step]);

  const start = () => { setTurns([{ role: 'assistant', content: s.opener }]); setStep('chat'); };

  const send = async () => {
    const text = draft.trim().slice(0, MAX_CHARS);
    if (!text || busy) return;
    if (turns.length + 1 > MAX_MESSAGES) { setError(s.errLimit); return; }
    if (!counted.current.s2) { counted.current.s2 = true; countSession('s2_started'); }
    const next: Turn[] = [...turns, { role: 'user', content: text }];
    setTurns(next); setDraft(''); setBusy(true); setError(null);
    const out = await talk(next);
    setBusy(false);
    if (out.ok) { setTurns([...next, { role: 'assistant', content: out.reply }]); return; }
    // Not answered: take the message back into the box so nothing the person wrote is lost.
    setTurns(turns); setDraft(text);
    setError(out.reason === 'busy' ? s.errBusy : out.reason === 'limit' ? s.errLimit : s.errUnavailable);
  };

  const finish = () => {
    // Drop every word before leaving, rather than trusting unmount to.
    setTurns([]); setDraft(''); setClearer(null);
    onClose();
  };

  const answerClearer = (v: 'yes' | 'somewhat' | 'no') => {
    if (clearer) return; // one answer per conversation
    setClearer(v);
    countSession(v === 'yes' ? 'm6_yes' : v === 'somewhat' ? 'm6_somewhat' : 'm6_no');
  };

  const copy = async () => {
    // The clipboard is the person's own device — the one other place their words may go.
    const text = turns.map((t) => `${t.role === 'user' ? s.you : s.life}: ${t.content}`).join('\n\n');
    try { await navigator.clipboard.writeText(text); setCopied(true); } catch { /* nothing to report */ }
  };

  const bubble = (t: Turn, i: number) => (
    <div key={i} style={{ display: 'flex', justifyContent: t.role === 'user' ? 'flex-end' : 'flex-start', marginTop: 10 }}>
      <div translate="no" style={{
        maxWidth: '88%', whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.6, padding: '10px 12px', borderRadius: 12,
        background: t.role === 'user' ? C.surface2 : 'transparent',
        border: t.role === 'user' ? 'none' : `1px solid ${C.border}`, color: C.text,
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: t.role === 'user' ? C.subtext : C.gold, marginBottom: 2 }}>
          {t.role === 'user' ? s.you : s.life}
        </div>
        <bdi>{t.content}</bdi>
      </div>
    </div>
  );

  return (
    <section aria-live="polite" style={{ ...card, marginTop: 16 }}>
      {step === 'intro' && (
        <>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.gold, marginBottom: 10 }}>{s.introTitle}</h2>
          <p style={{ fontSize: 14, color: C.text, lineHeight: 1.55, marginBottom: 8 }}>{s.introIs}</p>
          <p style={{ fontSize: 14, color: C.subtext, lineHeight: 1.55, marginBottom: 10 }}>{s.introIsNot}</p>
          <p role="note" style={{ fontSize: 13.5, color: C.text, lineHeight: 1.55, marginBottom: 8 }}>{s.introAi}</p>
          <p role="note" style={{ fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.55 }}>{s.introNothingSaved}</p>
          {/* Always shown, never triggered by what was written. */}
          <p style={{ fontSize: 12.5, color: C.subtext, lineHeight: 1.5, marginTop: 12 }}>{s.support}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <button type="button" style={goldBtn} onClick={start}>{s.agree}</button>
            <button type="button" style={ghostBtn} onClick={finish}>{s.cancel}</button>
          </div>
        </>
      )}

      {step === 'chat' && (
        <>
          <p style={{ fontSize: 12.5, color: C.subtext, lineHeight: 1.5 }}>{s.rolesNote}</p>
          <div>{turns.map(bubble)}</div>
          {busy && <div role="status" style={{ fontSize: 12.5, color: C.subtext, marginTop: 10 }}>{s.thinking}</div>}
          {error && <div role="alert" style={{ fontSize: 13, color: C.text, marginTop: 10 }}>{error}</div>}
          <textarea
            value={draft} onChange={(e) => setDraft(e.target.value.slice(0, MAX_CHARS))} maxLength={MAX_CHARS}
            placeholder={s.placeholder} aria-label={s.placeholder} disabled={busy}
            autoComplete="off" spellCheck={false} translate="no" style={{ ...textArea, marginTop: 12 }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <button type="button" style={{ ...goldBtn, opacity: draft.trim() && !busy ? 1 : 0.5 }}
              disabled={!draft.trim() || busy} onClick={send}>{s.send}</button>
            <button type="button" style={ghostBtn} disabled={busy} onClick={() => setStep('end')}>{s.endChat}</button>
          </div>
        </>
      )}

      {step === 'end' && (
        <>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.gold, marginBottom: 12 }}>{s.endTitle}</h2>
          <p style={{ fontSize: 12.5, color: C.subtext, lineHeight: 1.5, marginBottom: 12 }}>{s.support}</p>
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

/** The entry on Home: a door into the conversation, nothing more. */
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
