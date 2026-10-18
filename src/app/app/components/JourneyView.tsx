'use client';

// ── My journey — Life memory v1 (owner, 2026-10-17) ──────────────────────────
//
// "Building the human" needs the person to see their own stages. This is them: the
// summaries the person read, edited and chose to keep, newest first — never a
// conversation. Each can be deleted here; all of them can be downloaded as a file
// on the person's own device. Turning "Keep my journey" off in Privacy deletes them.
import { useEffect, useState } from 'react';
import { C } from '@/lib-client/palette';
import { useTranslation } from '@/lib/i18n';
import { sessionCopy } from '@/lib/life/session-copy';
import { readJourney, deleteEntry, type Journey, type JourneyEntry } from '@/lib-client/life/journey';
import {
  listConversations, readConversation, deleteConversation, type Conversations,
} from '@/lib-client/life/conversations';
import type { Resume } from './ProblemSession';
import { card } from './shared';

const SHOWN = 3;
const smallBtn = {
  background: 'transparent', color: C.subtext, border: `1px solid ${C.border}`, borderRadius: 8,
  padding: '6px 10px', fontSize: 12.5, cursor: 'pointer',
};

export function JourneyView({ onContinue }: { onContinue?: (r: Resume) => void }) {
  const { locale } = useTranslation();
  const s = sessionCopy(locale);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [all, setAll]         = useState(false);
  const [armed, setArmed]     = useState<string | null>(null);

  useEffect(() => { void readJourney().then(setJourney); }, []);
  const [convs, setConvs] = useState<Conversations | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  useEffect(() => { void listConversations().then(setConvs); }, []);
  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(null), 6000);
    return () => clearTimeout(id);
  }, [armed]);

  const date = (iso: string) => new Date(iso).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });

  const removeConv = async (id: string) => {
    if (armed !== id) { setArmed(id); return; }
    setArmed(null);
    if (await deleteConversation(id)) setConvs((c) => c && { ...c, conversations: c.conversations.filter((x) => x.id !== id) });
  };

  const continueConv = async (id: string) => {
    setOpening(id);
    const messages = await readConversation(id);
    setOpening(null);
    if (messages && onContinue) onContinue({ id, messages });
  };

  // The person's own file, on their own device: every kept conversation, read back.
  const downloadConvs = async () => {
    if (!convs) return;
    const all = [];
    for (const c of convs.conversations) all.push({ id: c.id, created_at: c.created_at, updated_at: c.updated_at, messages: await readConversation(c.id) });
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'tec-life-conversations.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const showConvs = !!convs && (convs.keeping || convs.conversations.length > 0);
  const convSection = showConvs && convs && (
    <section style={{ ...card, marginTop: 16 }} aria-label={s.cTitle}>
      <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 4 }}>{s.cTitle}</div>
      <div style={{ fontSize: 12.5, color: C.subtext, lineHeight: 1.5 }}>{s.cHint}</div>
      {convs.conversations.length === 0 ? (
        <div style={{ fontSize: 13, color: C.subtext, marginTop: 10 }}>{s.cEmpty}</div>
      ) : (
        <>
          <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0' }}>
            {convs.conversations.map((c) => (
              <li key={c.id} translate="no" style={{ borderTop: `1px solid ${C.border}`, padding: '10px 0' }}>
                <div style={{ fontSize: 11, color: C.faint }}>{date(c.updated_at)} · {s.cMessages.replace('{n}', String(c.message_count))}</div>
                <div style={{ fontSize: 13.5, color: C.text, marginTop: 2 }}>
                  {c.readable ? <bdi>{c.preview ?? ''}</bdi> : s.cUnreadable}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  {c.readable && onContinue && (
                    <button type="button" style={smallBtn} disabled={opening === c.id} onClick={() => void continueConv(c.id)}>
                      {opening === c.id ? s.cLoading : s.cContinue}
                    </button>
                  )}
                  <button type="button" style={smallBtn} onClick={() => void removeConv(c.id)}>
                    {armed === c.id ? s.jConfirm : s.jDelete}
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button type="button" style={{ ...smallBtn, marginTop: 8 }} onClick={() => void downloadConvs()}>{s.cDownload}</button>
        </>
      )}
    </section>
  );

  // Unreadable is not the same as empty: show nothing rather than "nothing kept".
  if (!journey) return convSection || null;

  const outcome = (e: JourneyEntry) =>
    e.step_outcome === 'DONE' ? s.outDone : e.step_outcome === 'PARTLY' ? s.outPartly : e.step_outcome === 'NOT_YET' ? s.outNotYet : null;

  const remove = async (id: string) => {
    if (armed !== id) { setArmed(id); return; }
    setArmed(null);
    if (await deleteEntry(id)) setJourney((j) => j && { ...j, entries: j.entries.filter((e) => e.id !== id) });
  };

  // The person's own file, on their own device — nothing leaves for anywhere else.
  const download = () => {
    const blob = new Blob([JSON.stringify(journey.entries, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'tec-life-journey.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const shown = all ? journey.entries : journey.entries.slice(0, SHOWN);

  return (
    <>
    <section style={{ ...card, marginTop: 16 }} aria-label={s.jTitle}>
      <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 4 }}>{s.jTitle}</div>
      <div style={{ fontSize: 12.5, color: C.subtext, lineHeight: 1.5 }}>{s.jHint}</div>
      {!journey.keeping && <div style={{ fontSize: 12.5, color: C.subtext, marginTop: 6 }}>{s.jOff}</div>}
      {journey.entries.length === 0 ? (
        <div style={{ fontSize: 13, color: C.subtext, marginTop: 10 }}>{s.jEmpty}</div>
      ) : (
        <>
          <ol style={{ listStyle: 'none', padding: 0, margin: '12px 0 0' }}>
            {shown.map((e) => (
              <li key={e.id} translate="no" style={{ borderTop: `1px solid ${C.border}`, padding: '10px 0' }}>
                <div style={{ fontSize: 11, color: C.faint }}>{date(e.created_at)}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginTop: 2 }}><bdi>{e.problem}</bdi></div>
                <div style={{ fontSize: 13, color: C.text, lineHeight: 1.55, marginTop: 4, whiteSpace: 'pre-wrap' }}><bdi>{e.understanding}</bdi></div>
                {e.step && (
                  <div style={{ fontSize: 12.5, color: C.subtext, marginTop: 4 }}>
                    {s.jStep}: <bdi>{e.step}</bdi>{outcome(e) && <> — {outcome(e)}</>}
                  </div>
                )}
                <button type="button" style={{ ...smallBtn, marginTop: 8 }} onClick={() => void remove(e.id)}>
                  {armed === e.id ? s.jConfirm : s.jDelete}
                </button>
              </li>
            ))}
          </ol>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {journey.entries.length > SHOWN && (
              <button type="button" style={smallBtn} onClick={() => setAll((v) => !v)}>{all ? s.jLess : s.jMore}</button>
            )}
            <button type="button" style={smallBtn} onClick={download}>{s.jDownload}</button>
          </div>
        </>
      )}
    </section>
    {convSection}
    </>
  );
}
