'use client';

// ── Life's conversation — only what the person confirms is kept ─────────────
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
//   • Life memory v1 (owner, 2026-10-17): at the end, and only if the person asks,
//     Life writes a summary (`summarise()`); the person edits it and keeps it — or
//     not. Keeping needs the JOURNEY permission, turned on by that same tap and
//     named beside it. The conversation itself is never kept.
//   • Full conversations (owner, 2026-10-18) are kept ONLY when the person turned
//     "Keep my full conversations" on — then each answered turn is saved, encrypted
//     by tec-life-service, so a closed page loses nothing and it can be continued.
//   • Capabilities v1 (owner, 2026-10-20): after a yes to a step, Life's reply may carry one
//     proposal — a goal or a skill. It is written only when the person taps Add (ProposalCard).
//   • The text field turns off the browser's own ways of moving text:
//     `autoComplete="off"`, `spellCheck={false}`, and `translate="no"` on everything
//     that shows the conversation.
import { useEffect, useRef, useState } from 'react';
import { C, goldA } from '@/lib-client/palette';
import { useTranslation } from '@/lib/i18n';
import { sessionCopy } from '@/lib/life/session-copy';
import { countSession } from '@/lib-client/life/sessionCounter';
import { talk, summarise, MAX_MESSAGES, type Turn } from '@/lib-client/life/lifeTalk';
import {
  readJourney, keepEntry, turnKeepingOn, setOutcome,
  MEMORY_FIELDS, type Journey, type JourneyOutcome, type Feeling,
} from '@/lib-client/life/journey';
import {
  listConversations, readConversation, saveConversation, turnConversationsOn, newConversationId, onConversationDeleted,
  type ConversationListing,
} from '@/lib-client/life/conversations';
import { card, goldBtn } from './shared';
import { ProposalCard } from './ProposalCard';
import type { Proposal } from '@/lib-client/life/proposals';
import { MenuButton } from './JourneyDrawer';
import { FeelingPicker } from './FeelingPicker';

type Step = 'intro' | 'chat' | 'end';

const MAX_CHARS = 1000;

const textArea = {
  width: '100%', minHeight: 72, resize: 'vertical' as const,
  background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10,
  padding: '10px 12px', fontSize: 14, lineHeight: 1.5, fontFamily: 'inherit',
};
const ghostBtn = {
  background: 'transparent', color: C.subtext, border: `1px solid ${C.border}`, borderRadius: 10,
  padding: '10px 14px', fontSize: 14, cursor: 'pointer',
};

/** A kept conversation to continue: its id and its messages so far. */
export interface Resume { id: string; messages: Turn[] }

export function ProblemSession({ onClose, resume, onMenu }: { onClose: () => void; resume?: Resume; onMenu?: () => void }) {
  const { locale } = useTranslation();
  const s = sessionCopy(locale);

  const [step, setStep]         = useState<Step>(resume ? 'chat' : 'intro');
  const [turns, setTurns]       = useState<Turn[]>(resume?.messages ?? []);
  const [draft, setDraft]       = useState('');
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [clearer, setClearer]   = useState<'yes' | 'somewhat' | 'no' | null>(null);
  const [copied, setCopied]     = useState(false);
  const counted = useRef<{ s2: boolean; s7: boolean }>({ s2: false, s7: false });
  // Life memory v1 — the person's own journey, read from Life (never from storage).
  const [journey, setJourney]   = useState<Journey | null>(null);
  const [answered, setAnswered] = useState(false);
  const [keep, setKeep] = useState<'idle' | 'writing' | 'editing' | 'saving' | 'saved' | 'failed'>('idle');
  const [summaryFailed, setSummaryFailed] = useState(false);
  const EMPTY = { problem: '', understanding: '', step: '', tried: '', helped: '', triggers: '', reason: '', practice: '', words: '' };
  const [fields, setFields] = useState(EMPTY);
  // Feelings are chosen, not typed: Life may preselect one the person named; they change it.
  const [feelings, setFeelings] = useState<{ feeling_start: Feeling | null; feeling_end: Feeling | null }>({ feeling_start: null, feeling_end: null });
  // Capabilities v1: Life's one proposal after a yes — shown under the reply it came with.
  const [proposal, setProposal] = useState<Proposal | null>(null);
  // «مش ده قصدي» (owner, 2026-10-30): a misreading is corrected in the person's OWN new words.
  // The tap starts the box with the phrase and asks them to say it another way — the model is
  // never left to guess again from a bare "no".
  const [correcting, setCorrecting] = useState(false);
  const box = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { void readJourney().then(setJourney); }, []);
  // Full conversations: kept only while the person has turned it on.
  const convId = useRef<string>(resume?.id ?? newConversationId());
  const [keepingFull, setKeepingFull] = useState(!!resume);
  const [fullAvailable, setFullAvailable] = useState(false);
  const [fullSaveFailed, setFullSaveFailed] = useState(false);
  useEffect(() => {
    void listConversations().then((c) => {
      if (!c) return;
      setFullAvailable(c.configured);
      if (c.keeping && c.configured) setKeepingFull(true);
    });
  }, []);
  const turnFullOn = async () => { if (await turnConversationsOn()) setKeepingFull(true); };
  const keepFull = async (all: Turn[]) => {
    if (!keepingFull) return;
    setFullSaveFailed(!(await saveConversation(convId.current, all)));
  };
  const last = journey?.keeping ? journey.entries[0] : undefined;
  // Not when continuing a kept conversation: the person is already back in it.
  const askLastStep = !resume && !!last?.step && !last.step_outcome && !answered;
  const spoke = turns.some((t) => t.role === 'user');

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
    setTurns(next); setDraft(''); setBusy(true); setError(null); setProposal(null); setCorrecting(false);
    const out = await talk(next);
    setBusy(false);
    if (out.ok) {
      const all: Turn[] = [...next, { role: 'assistant', content: out.reply }];
      setTurns(all);
      setProposal(out.proposal);
      void keepFull(all);
      return;
    }
    // Not answered: take the message back into the box so nothing the person wrote is lost.
    setTurns(turns); setDraft(text);
    setError(out.reason === 'busy' ? s.errBusy : out.reason === 'limit' ? s.errLimit : out.reason === 'capacity' ? s.errCapacity : s.errUnavailable);
  };

  const notMeant = () => {
    const lead = `${s.notMeant}. `;
    setDraft((d) => (d.trim().startsWith(s.notMeant) ? d : (lead + d.trim()).slice(0, MAX_CHARS)));
    setCorrecting(true);
    setProposal(null);
    box.current?.focus();
  };
  // Only under Life's latest reply, after the person has said something — never under the opener.
  const lastTurn = turns[turns.length - 1];
  const canCorrect = spoke && lastTurn?.role === 'assistant' && !busy;

  const finish = () => {
    // Drop every word before leaving, rather than trusting unmount to.
    setTurns([]); setDraft(''); setClearer(null); setProposal(null);
    setFields(EMPTY); setFeelings({ feeling_start: null, feeling_end: null });
    onClose();
  };
  // Deleting the conversation that is open here closes it: its words leave the screen and
  // it is not written back by the next reply (owner, 2026-10-18).
  const finishRef = useRef(finish); finishRef.current = finish;
  useEffect(() => onConversationDeleted((id) => { if (id === convId.current) finishRef.current(); }), []);


  const answerLastStep = async (o: JourneyOutcome) => {
    if (!last) return;
    setAnswered(true);
    await setOutcome(last.id, o);
  };

  // The summary is written only when the person asks; if Life cannot write it, the
  // person may write it themselves — the fields are theirs either way.
  const writeSummary = async () => {
    setKeep('writing'); setSummaryFailed(false);
    const sm = await summarise(turns);
    if (sm) setFields({
      problem: sm.problem, understanding: sm.understanding, step: sm.step ?? '',
      tried: sm.tried ?? '', helped: sm.helped ?? '', triggers: sm.triggers ?? '', reason: sm.reason ?? '',
      practice: sm.practice ?? '', words: sm.words ?? '',
    });
    if (sm) setFeelings({ feeling_start: sm.feeling_start, feeling_end: sm.feeling_end });
    else setSummaryFailed(true);
    setKeep('editing');
  };

  const canKeep = fields.problem.trim().length > 0 && fields.understanding.trim().length > 0;
  const keepIt = async () => {
    if (!canKeep) return;
    setKeep('saving');
    // Turning keeping on is the person's tap on "Turn on and keep", named beside it.
    if (!journey?.keeping && !(await turnKeepingOn())) { setKeep('failed'); return; }
    const saved = await keepEntry({
      problem: fields.problem.trim(), understanding: fields.understanding.trim(), step: fields.step.trim() || null,
      // Only the memory the person left filled is kept; an empty field sends nothing.
      ...Object.fromEntries(MEMORY_FIELDS.map((k) => [k, fields[k].trim()]).filter(([, v]) => v)),
      ...Object.fromEntries(Object.entries(feelings).filter(([, v]) => v)),
    });
    if (!saved) { setKeep('failed'); return; }
    setJourney((j) => ({ keeping: true, entries: [saved, ...(j?.entries ?? [])] }));
    setKeep('saved');
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
      {onMenu && (
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
          <MenuButton onClick={onMenu} />
        </div>
      )}
      {step === 'intro' && (
        <>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.gold, marginBottom: 10 }}>{s.introTitle}</h2>
          <p style={{ fontSize: 14, color: C.text, lineHeight: 1.55, marginBottom: 8 }}>{s.introIs}</p>
          <p style={{ fontSize: 14, color: C.subtext, lineHeight: 1.55, marginBottom: 10 }}>{s.introIsNot}</p>
          <p role="note" style={{ fontSize: 13.5, color: C.text, lineHeight: 1.55, marginBottom: 8 }}>{s.introAi}</p>
          <p role="note" style={{ fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.55 }}>
            {keepingFull ? s.fullOn : s.introNothingSaved}
          </p>
          {!keepingFull && fullAvailable && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 13, color: C.text, marginBottom: 6 }}>{s.fullOff}</div>
              <button type="button" style={ghostBtn} onClick={() => void turnFullOn()}>{s.fullTurnOn}</button>
              <p role="note" style={{ fontSize: 12, color: C.subtext, lineHeight: 1.5, marginTop: 6 }}>{s.fullTurnOnNote}</p>
            </div>
          )}
          {journey?.keeping && journey.entries.length > 0 && (
            <p role="note" style={{ fontSize: 13, color: C.subtext, lineHeight: 1.55, marginTop: 8 }}>{s.memoryNote}</p>
          )}
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
          {/* Personal memory (owner, 2026-10-23): the person sees that Life coaches from what they kept. */}
          {journey?.keeping && journey.entries.length > 0 && (
            <div role="note" style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: '8px 12px', marginTop: 8 }}>
              <div style={{ fontSize: 12.5, color: C.subtext, lineHeight: 1.5 }}>{s.memStrip}</div>
              {onMenu && (
                <button type="button" onClick={onMenu}
                  style={{ ...ghostBtn, padding: '6px 10px', fontSize: 12.5, marginTop: 6 }}>{s.memStripEdit}</button>
              )}
            </div>
          )}
          {!resume && last?.step && (askLastStep || answered) && (
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 12px', marginTop: 10 }}>
              {askLastStep ? (
                <>
                  <div translate="no" style={{ fontSize: 13.5, color: C.text, lineHeight: 1.55, marginBottom: 8 }}>
                    <bdi>{s.lastStepQ.replace('{step}', last.step)}</bdi>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" style={ghostBtn} onClick={() => void answerLastStep('DONE')}>{s.outDone}</button>
                    <button type="button" style={ghostBtn} onClick={() => void answerLastStep('PARTLY')}>{s.outPartly}</button>
                    <button type="button" style={ghostBtn} onClick={() => void answerLastStep('NOT_YET')}>{s.outNotYet}</button>
                  </div>
                </>
              ) : (
                <div role="status" style={{ fontSize: 13, color: C.subtext }}>{s.outThanks}</div>
              )}
            </div>
          )}
          <div>{turns.map(bubble)}</div>
          {canCorrect && !correcting && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 6 }}>
              <button type="button" onClick={notMeant}
                style={{ ...ghostBtn, padding: '6px 10px', fontSize: 12.5 }}>{s.notMeant}</button>
            </div>
          )}
          {proposal && !busy && <ProposalCard proposal={proposal} s={s} onDone={() => setProposal(null)} />}
          {busy && <div role="status" style={{ fontSize: 12.5, color: C.subtext, marginTop: 10 }}>{s.thinking}</div>}
          {error && <div role="alert" style={{ fontSize: 13, color: C.text, marginTop: 10 }}>{error}</div>}
          {correcting && !busy && <div role="status" style={{ fontSize: 12.5, color: C.subtext, marginTop: 10 }}>{s.notMeantHint}</div>}
          {fullSaveFailed && <div role="status" style={{ fontSize: 12, color: C.subtext, marginTop: 6 }}>{s.fullSaveFailed}</div>}
          {/* At the length cap, the way on is the summary — one tap to end and write it. */}
          {error === s.errLimit && spoke && (
            <button type="button" style={{ ...goldBtn, marginTop: 10 }}
              onClick={() => { setError(null); setStep('end'); void writeSummary(); }}>{s.endAndKeep}</button>
          )}
          <textarea
            ref={box}
            value={draft} onChange={(e) => setDraft(e.target.value.slice(0, MAX_CHARS))} maxLength={MAX_CHARS}
            placeholder={correcting ? s.notMeantHint : s.placeholder} aria-label={s.placeholder} disabled={busy}
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
          <p role="note" style={{ fontSize: 13.5, fontWeight: 700, color: C.text, lineHeight: 1.5 }}>
            {keepingFull && spoke ? s.fullKeptEnd : s.notSaved}
          </p>
          <div style={{ marginTop: 10 }}>
            <button type="button" style={ghostBtn} onClick={copy}>{copied ? s.copied : s.copy}</button>
          </div>

          {/* Life memory v1 — only on request, only what the person confirms. */}
          {spoke && (
            <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 18, paddingTop: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 6 }}>{s.keepTitle}</div>
              <p style={{ fontSize: 12.5, color: C.subtext, lineHeight: 1.5, marginBottom: 10 }}>{s.keepHint}</p>
              {keep === 'idle' && <button type="button" style={ghostBtn} onClick={() => void writeSummary()}>{s.keepWrite}</button>}
              {keep === 'writing' && <div role="status" style={{ fontSize: 12.5, color: C.subtext }}>{s.keepWriting}</div>}
              {(keep === 'editing' || keep === 'saving' || keep === 'failed') && (
                <>
                  {summaryFailed && <div role="alert" style={{ fontSize: 13, color: C.text, marginBottom: 10 }}>{s.keepSummaryFailed}</div>}
                  {([['problem', s.fProblem, 300], ['understanding', s.fUnderstanding, 800], ['step', s.fStep, 300],
                    ['tried', s.fTried, 300], ['helped', s.fHelped, 300], ['triggers', s.fTriggers, 300], ['reason', s.fReason, 300],
                    ['practice', s.fPractice, 300], ['words', s.fWords, 300]] as const).map(([k, label, max]) => (
                    <label key={k} style={{ display: 'block', marginTop: 10 }}>
                      <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.subtext, marginBottom: 4 }}>{label}</span>
                      <textarea
                        value={fields[k]} maxLength={max} disabled={keep === 'saving'}
                        onChange={(e) => setFields((f) => ({ ...f, [k]: e.target.value.slice(0, max) }))}
                        autoComplete="off" spellCheck={false} translate="no" style={{ ...textArea, minHeight: k === 'understanding' ? 88 : 56 }}
                      />
                    </label>
                  ))}
                  <FeelingPicker label={s.fFeelStart} value={feelings.feeling_start} s={s} disabled={keep === 'saving'}
                    onChange={(f) => setFeelings((x) => ({ ...x, feeling_start: f }))} />
                  <FeelingPicker label={s.fFeelEnd} value={feelings.feeling_end} s={s} disabled={keep === 'saving'}
                    onChange={(f) => setFeelings((x) => ({ ...x, feeling_end: f }))} />
                  {!journey?.keeping && (
                    <p role="note" style={{ fontSize: 12.5, color: C.subtext, lineHeight: 1.5, marginTop: 10 }}>{s.keepConsent}</p>
                  )}
                  {keep === 'failed' && <div role="alert" style={{ fontSize: 13, color: C.text, marginTop: 10 }}>{s.keepFailed}</div>}
                  <div style={{ marginTop: 10 }}>
                    <button type="button" style={{ ...goldBtn, opacity: canKeep && keep !== 'saving' ? 1 : 0.5 }}
                      disabled={!canKeep || keep === 'saving'} onClick={() => void keepIt()}>
                      {journey?.keeping ? s.keepSave : s.keepSaveOn}
                    </button>
                  </div>
                </>
              )}
              {keep === 'saved' && <div role="status" style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{s.keepSaved}</div>}
            </div>
          )}

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

/**
 * The entry on Home: a door into the conversation. When the person keeps full
 * conversations, the last one is offered first — a page that closed (Pi Browser does)
 * should not mean starting over.
 */
export function ProblemSessionEntry({ onStart, onContinue, onMenu }: { onStart: () => void; onContinue?: (r: Resume) => void; onMenu?: () => void }) {
  const { locale } = useTranslation();
  const s = sessionCopy(locale);
  const [last, setLast] = useState<ConversationListing | null>(null);
  const [opening, setOpening] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!onContinue) return;
    void listConversations().then((c) => setLast(c?.conversations.find((x) => x.readable) ?? null));
  }, [onContinue]);
  const continueLast = async () => {
    if (!last || !onContinue) return;
    setOpening(true); setFailed(false);
    const messages = await readConversation(last.id);
    setOpening(false);
    if (messages && messages.length > 0) onContinue({ id: last.id, messages });
    else setFailed(true);
  };
  // The hero of Home: the conversation is what Life is for, so it is the first and the
  // largest thing on the screen — a warm wash from the corner, the last thing said shown
  // as a quote, and one full-width action. Starting over is there, but quieter.
  const wide = { width: '100%', minHeight: 50, borderRadius: 14, fontSize: 15.5 } as const;
  return (
    <section className="tec-rise" style={{
      ...card, marginTop: 16, borderRadius: 22, padding: '20px 20px 18px',
      backgroundImage: `radial-gradient(110% 120% at 100% 0%, ${goldA(0.10)}, transparent 60%)`,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text, flex: 1, lineHeight: 1.4 }}>{s.entryTitle}</div>
        {onMenu && <MenuButton onClick={onMenu} />}
      </div>
      <div style={{ fontSize: 13, color: C.subtext, lineHeight: 1.6, marginBottom: 14 }}>{s.entryHint}</div>
      {last && (
        <div style={{ marginBottom: 10 }}>
          {last.preview && (
            <div translate="no" style={{
              fontSize: 14, color: C.text, lineHeight: 1.65, marginBottom: 12,
              background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 14, padding: '12px 14px',
              display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}><bdi>{last.preview}</bdi></div>
          )}
          <button type="button" style={{ ...goldBtn, ...wide }} disabled={opening} onClick={() => void continueLast()}>
            {opening ? s.cLoading : s.continueLast}
          </button>
          {failed && <div role="alert" style={{ fontSize: 12, color: C.text, marginTop: 6 }}>{s.cOpenFailed}</div>}
        </div>
      )}
      <button type="button" style={last ? { ...ghostBtn, ...wide, fontSize: 14 } : { ...goldBtn, ...wide }} onClick={onStart}>
        {last ? s.startNew : s.entryCta}
      </button>
    </section>
  );
}
