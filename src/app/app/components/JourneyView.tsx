'use client';

// ── My journey — one compact list (owner, 2026-10-18: "all of this should be one list") ──
//
// "Building the human" needs the person to see their own stages. One card holds both
// halves of the memory — the summaries they confirmed, and the full conversations they
// chose to keep — behind two tabs. Each item is one line (date · title); tapping it
// opens its details and its actions. Nothing is a conversation unless the person kept
// it; deleting takes two taps; download saves on the person's own device.
import { useEffect, useState } from 'react';
import { C } from '@/lib-client/palette';
import { useTranslation } from '@/lib/i18n';
import { sessionCopy } from '@/lib/life/session-copy';
import { readJourney, deleteEntry, type Journey, type JourneyEntry } from '@/lib-client/life/journey';
import {
  listConversations, readConversation, deleteConversation, type Conversations,
} from '@/lib-client/life/conversations';
import type { Resume } from './ProblemSession';
import { JourneyMeasure } from './JourneyMeasure';
import { JourneyMemory } from './JourneyMemory';
import { card } from './shared';

const smallBtn = {
  background: 'transparent', color: C.subtext, border: `1px solid ${C.border}`, borderRadius: 8,
  padding: '6px 10px', fontSize: 12.5, cursor: 'pointer',
};
const oneLine = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const };

type Tab = 'summaries' | 'conversations';

function saveFile(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export function JourneyView({ onContinue, onMakeGoal, embedded = false }: {
  onContinue?: (r: Resume) => void; onMakeGoal?: (step: string) => void; embedded?: boolean;
}) {
  const { locale } = useTranslation();
  const s = sessionCopy(locale);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [convs, setConvs]     = useState<Conversations | null>(null);
  const [tab, setTab]         = useState<Tab>('summaries');
  const [open, setOpen]       = useState<string | null>(null);   // the item whose details show
  const [armed, setArmed]     = useState<string | null>(null);   // the item one tap from deletion
  const [opening, setOpening] = useState<string | null>(null);
  const [openFailed, setOpenFailed] = useState<string | null>(null);
  const [deleteFailed, setDeleteFailed] = useState<string | null>(null);

  useEffect(() => { void readJourney().then(setJourney); }, []);
  useEffect(() => { void listConversations().then(setConvs); }, []);
  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(null), 6000);
    return () => clearTimeout(id);
  }, [armed]);

  const date = (iso: string) => new Date(iso).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
  const outcome = (e: JourneyEntry) =>
    e.step_outcome === 'DONE' ? s.outDone : e.step_outcome === 'PARTLY' ? s.outPartly : e.step_outcome === 'NOT_YET' ? s.outNotYet : null;

  const entries = journey?.entries ?? [];
  const kept = convs?.conversations ?? [];
  const showConvTab = !!convs && (convs.keeping || kept.length > 0);
  // Unreadable is not the same as empty: with nothing readable, show nothing at all.
  if (!journey && !showConvTab) return null;

  const removeEntry = async (id: string) => {
    if (armed !== id) { setArmed(id); return; }
    setArmed(null);
    if (await deleteEntry(id)) setJourney((j) => j && { ...j, entries: j.entries.filter((e) => e.id !== id) });
  };
  const removeConv = async (id: string) => {
    if (armed !== id) { setArmed(id); return; }
    setArmed(null);
    setDeleteFailed(null);
    if (await deleteConversation(id)) setConvs((c) => c && { ...c, conversations: c.conversations.filter((x) => x.id !== id) });
    else setDeleteFailed(id);
  };
  const continueConv = async (id: string) => {
    setOpening(id); setOpenFailed(null);
    const messages = await readConversation(id);
    setOpening(null);
    // A conversation that cannot be opened says so — a button that does nothing
    // reads as "the conversation is gone" (owner, 2026-10-18).
    if (!messages || messages.length === 0) { setOpenFailed(id); return; }
    onContinue?.({ id, messages });
  };
  const downloadConvs = async () => {
    const all = [];
    for (const c of kept) all.push({ id: c.id, created_at: c.created_at, updated_at: c.updated_at, messages: await readConversation(c.id) });
    saveFile('tec-life-conversations.json', all);
  };

  const row = (id: string, when: string, title: string, meta?: string) => (
    <button type="button" onClick={() => setOpen(open === id ? null : id)} aria-expanded={open === id}
      style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 10, background: 'transparent', border: 'none',
        padding: '10px 0', cursor: 'pointer', color: C.text, textAlign: 'start' }}>
      <span style={{ fontSize: 11, color: C.faint, flexShrink: 0 }}>{when}</span>
      <span translate="no" style={{ fontSize: 13.5, flex: 1, minWidth: 0, ...oneLine }}><bdi>{title}</bdi></span>
      {meta && <span style={{ fontSize: 11, color: C.faint, flexShrink: 0 }}>{meta}</span>}
      <span aria-hidden style={{ fontSize: 11, color: C.faint, flexShrink: 0 }}>{open === id ? '▴' : '▾'}</span>
    </button>
  );

  const tabBtn = (t: Tab, label: string, n: number) => (
    <button type="button" role="tab" aria-selected={tab === t} onClick={() => { setTab(t); setOpen(null); }}
      style={{ flex: 1, padding: '8px 10px', fontSize: 13, fontWeight: 700, cursor: 'pointer', borderRadius: 8,
        background: tab === t ? C.surface2 : 'transparent', color: tab === t ? C.text : C.subtext,
        border: `1px solid ${tab === t ? C.border : 'transparent'}` }}>
      {label} <span style={{ color: C.faint, fontWeight: 600 }}>({n})</span>
    </button>
  );

  return (
    <section style={embedded ? undefined : { ...card, marginTop: 16 }} aria-label={s.jTitle}>
      {!embedded && <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 10 }}>{s.jTitle}</div>}
      {showConvTab && (
        <div role="tablist" style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          {tabBtn('summaries', s.jSummaries, entries.length)}
          {tabBtn('conversations', s.cTitle, kept.length)}
        </div>
      )}

      {tab === 'summaries' && (
        <div role={showConvTab ? 'tabpanel' : undefined}>
          {journey && !journey.keeping && <div style={{ fontSize: 12, color: C.subtext, marginTop: 4 }}>{s.jOff}</div>}
          {entries.length === 0 ? (
            <div style={{ fontSize: 13, color: C.subtext, marginTop: 8 }}>{s.jEmpty}</div>
          ) : (
            <>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {entries.map((e) => (
                  <li key={e.id} style={{ borderTop: `1px solid ${C.border}` }}>
                    {row(e.id, date(e.created_at), e.problem, outcome(e) ?? undefined)}
                    {open === e.id && (
                      <div translate="no" style={{ paddingBottom: 10 }}>
                        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}><bdi>{e.understanding}</bdi></div>
                        {e.step && (
                          <div style={{ fontSize: 12.5, color: C.subtext, marginTop: 4 }}>
                            {s.jStep}: <bdi>{e.step}</bdi>{outcome(e) && <> — {outcome(e)}</>}
                          </div>
                        )}
                        {e.step && onMakeGoal && (
                          // One tap from a step to a goal (owner, 2026-10-18). Nothing is saved
                          // here: the Goals tab opens with the step in its Add field, editable.
                          <button type="button" style={{ ...smallBtn, marginTop: 8 }} onClick={() => onMakeGoal(e.step!)}>{s.jMakeGoal}</button>
                        )}
                        <JourneyMemory entry={e} keeping={!!journey?.keeping} s={s}
                          onUpdate={(n) => setJourney((j) => j && { ...j, entries: j.entries.map((x) => (x.id === n.id ? { ...x, ...n } : x)) })} />
                        <JourneyMeasure entry={e} keeping={!!journey?.keeping} s={s} date={date}
                          onUpdate={(n) => setJourney((j) => j && { ...j, entries: j.entries.map((x) => (x.id === n.id ? { ...x, ...n } : x)) })} />
                        <button type="button" style={{ ...smallBtn, marginTop: 8 }} onClick={() => void removeEntry(e.id)}>
                          {armed === e.id ? s.jConfirm : s.jDelete}
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <button type="button" style={{ ...smallBtn, marginTop: 8 }} onClick={() => saveFile('tec-life-journey.json', entries)}>{s.jDownload}</button>
            </>
          )}
        </div>
      )}

      {tab === 'conversations' && showConvTab && (
        <div role="tabpanel">
          {kept.length === 0 ? (
            <div style={{ fontSize: 13, color: C.subtext, marginTop: 8 }}>{s.cEmpty}</div>
          ) : (
            <>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {kept.map((c) => (
                  <li key={c.id} style={{ borderTop: `1px solid ${C.border}` }}>
                    {row(c.id, date(c.updated_at), c.readable ? (c.preview ?? '') : s.cUnreadable, s.cMessages.replace('{n}', String(c.message_count)))}
                    {open === c.id && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingBottom: 10 }}>
                        {c.readable && onContinue && (
                          <button type="button" style={smallBtn} disabled={opening === c.id} onClick={() => void continueConv(c.id)}>
                            {opening === c.id ? s.cLoading : s.cContinue}
                          </button>
                        )}
                        <button type="button" style={smallBtn} onClick={() => void removeConv(c.id)}>
                          {armed === c.id ? s.jConfirm : s.jDelete}
                        </button>
                        {openFailed === c.id && <span role="alert" style={{ fontSize: 12, color: C.text, alignSelf: 'center' }}>{s.cOpenFailed}</span>}
                        {deleteFailed === c.id && <span role="alert" style={{ fontSize: 12, color: C.text, alignSelf: 'center' }}>{s.cDeleteFailed}</span>}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <button type="button" style={{ ...smallBtn, marginTop: 8 }} onClick={() => void downloadConvs()}>{s.cDownload}</button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
