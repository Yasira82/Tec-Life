'use client';

// The redesign's Today (Phase 1, approved mockup «اليوم», owner 2026-11-28). Three things, in
// this order, and nothing else: a short greeting, the coach, today's step, the closest goal.
//
// Each part loads and fails on its own: a journey that cannot be read hides nothing but the
// step (the coach still opens, it just promises no memory), and goals that cannot be read
// say so in their own card with a retry. Reads are the existing ones — /api/bff/life/journey,
// /conversations, /goals — and the step's answer is the existing setStepToday: no new endpoint,
// and the screen changes only after the server says yes.
import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { C, goldA } from '@/lib-client/palette';
import { useTranslation } from '@/lib/i18n';
import { useMe } from '@/lib-client/hooks/useMe';
import { useGoals } from '@/lib-client/life/useLife';
import { readJourney, setStepToday, type Journey, type JourneyOutcome } from '@/lib-client/life/journey';
import { listConversations, readConversation, type Conversations } from '@/lib-client/life/conversations';
import { followedStep, localDayKey, weekReview, type StepDay } from '@/lib/life/step-week';
import { parseSteps } from '@/lib/life/steps';
import { sessionCopy } from '@/lib/life/session-copy';
import { stepCopy } from '@/lib/life/step-copy';
import { todayCopy, fill } from '@/lib/life/today-copy';
import { closestGoal, coachState, partOfDay } from '@/lib/life/today';
import type { Resume } from '../../components/ProblemSession';

const card: CSSProperties = {
  background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: 16,
  display: 'flex', flexDirection: 'column', gap: 10,
};
const eyebrow: CSSProperties = { fontSize: 12, fontWeight: 700, color: C.subtext, letterSpacing: 0.2 };
const ANSWERS: JourneyOutcome[] = ['DONE', 'PARTLY', 'NOT_YET'];

type Load<T> = { state: 'loading' } | { state: 'failed' } | { state: 'ok'; value: T };

export function TodayView({ onTalk, onContinue, onGoals, onMenu }: {
  onTalk: () => void;
  onContinue: (r: Resume) => void;
  onGoals: () => void;
  onMenu: () => void;
}) {
  const { locale } = useTranslation();
  const t = todayCopy(locale);
  const me = useMe();
  // The phone's clock, after mount: the server does not know the person's part of the day.
  const [part, setPart] = useState<'morning' | 'afternoon' | 'evening' | null>(null);
  useEffect(() => { setPart(partOfDay(new Date().getHours())); }, []);

  const [journey, setJourney] = useState<Load<Journey>>({ state: 'loading' });
  const [convs, setConvs] = useState<Conversations | null>(null);
  const loadJourney = useCallback(() => {
    setJourney({ state: 'loading' });
    void readJourney().then((j) => setJourney(j ? { state: 'ok', value: j } : { state: 'failed' }));
  }, []);
  useEffect(() => {
    loadJourney();
    void listConversations().then(setConvs);
  }, [loadJourney]);

  const greet = part ? t.greet[part] : '';
  const name = me.username ? `@${me.username}` : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h1 suppressHydrationWarning style={{ fontSize: 24, fontWeight: 800, margin: 0, color: C.text, lineHeight: 1.3 }}>
          {greet && name ? <Greeting pattern={t.withName} greet={greet} name={name} /> : (greet || '\u00a0')}
        </h1>
        <p style={{ fontSize: 14.5, color: C.subtext, margin: '4px 0 0' }}>{t.sub}</p>
      </div>

      <CoachCard journey={journey.state === 'ok' ? journey.value : null} known={journey.state !== 'loading'}
        convs={convs} onTalk={onTalk} onContinue={onContinue} onMenu={onMenu} />

      <section data-testid="today-step" aria-labelledby="today-step-h">
        {journey.state === 'loading' && <Skeleton h={132} />}
        {journey.state === 'failed' && <Failed text={t.failed} retry={t.retry} onRetry={loadJourney} />}
        {journey.state === 'ok' && <StepCard journey={journey.value} />}
      </section>

      <GoalCard onGoals={onGoals} />
    </div>
  );
}

/** The coach: the one gold action on the screen, saying only what the coach will really get. */
function CoachCard({ journey, known, convs, onTalk, onContinue, onMenu }: {
  journey: Journey | null; known: boolean; convs: Conversations | null;
  onTalk: () => void; onContinue: (r: Resume) => void; onMenu: () => void;
}) {
  const { locale } = useTranslation();
  const t = todayCopy(locale);
  const s = sessionCopy(locale);
  const state = coachState(known ? journey : null, convs);
  const hint = !known || state.memory === 'unknown' ? t.hint.unknown
    : state.memory === 'off' ? t.hint.off
    : state.memory === 'first' ? t.hint.first
    : state.topic ? fill(t.hint.savedTopic, { t: state.topic }) : t.hint.saved;
  const [opening, setOpening] = useState(false);
  const [openFailed, setOpenFailed] = useState(false);

  const last = convs?.keeping ? convs.conversations.find((c) => c.readable) ?? null : null;
  const continueLast = async () => {
    if (!last) return;
    setOpening(true); setOpenFailed(false);
    const messages = await readConversation(last.id);
    setOpening(false);
    if (messages && messages.length > 0) onContinue({ id: last.id, messages });
    else setOpenFailed(true);
  };

  return (
    <section data-testid="today-coach" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
        <button type="button" onClick={onTalk} style={{
          flex: 1, minHeight: 68, borderRadius: 18, border: 'none', cursor: 'pointer', textAlign: 'start',
          background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: C.onGold,
          padding: '12px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2,
        }}>
          <span style={{ fontSize: 17, fontWeight: 800 }}>{t.talk}</span>
          <span data-testid="coach-hint" style={{ fontSize: 13, fontWeight: 500, opacity: 0.85, lineHeight: 1.45 }}><bdi>{hint}</bdi></span>
        </button>
        <button type="button" onClick={onMenu} aria-label={s.menu} title={s.menu} style={{
          width: 52, minHeight: 52, flexShrink: 0, borderRadius: 18, border: `1px solid ${C.border}`,
          background: 'transparent', color: C.text, fontSize: 20, cursor: 'pointer',
        }}>☰</button>
      </div>
      {last && state.canContinue && (
        <button type="button" onClick={() => void continueLast()} disabled={opening} style={{
          minHeight: 44, borderRadius: 14, border: `1px solid ${C.border}`, background: 'transparent',
          color: C.text, fontSize: 14, cursor: 'pointer',
        }}>
          {opening ? s.cLoading : s.continueLast}
        </button>
      )}
      {openFailed && <div role="alert" style={{ fontSize: 12.5, color: C.text }}>{s.cOpenFailed}</div>}
    </section>
  );
}

/** Today's step: the step from the newest kept conversation, answered for today. */
function StepCard({ journey }: { journey: Journey }) {
  const { locale } = useTranslation();
  const t = todayCopy(locale);
  const c = stepCopy(locale);
  const s = sessionCopy(locale);
  const entry = journey.keeping ? followedStep(journey.entries) : null;
  const [days, setDays] = useState<StepDay[]>(entry?.days ?? []);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<'idle' | 'saved' | 'failed'>('idle');

  if (!journey.keeping) return <div style={card}><div id="today-step-h" style={eyebrow}>{c.title}</div><p style={{ margin: 0, color: C.subtext, fontSize: 14 }}>{t.stepOff}</p></div>;
  if (!entry?.step) return <div style={card}><div id="today-step-h" style={eyebrow}>{c.title}</div><p style={{ margin: 0, color: C.subtext, fontSize: 14 }}>{t.noStep}</p></div>;

  const today = localDayKey();
  const mine = days.find((d) => d.day === today)?.answer ?? null;
  const review = weekReview(days, today);
  const label = (a: JourneyOutcome) => (a === 'DONE' ? s.outDone : a === 'PARTLY' ? s.outPartly : s.outNotYet);
  const answer = async (a: JourneyOutcome) => {
    if (busy) return;
    setBusy(true); setSaved('idle');
    const ok = await setStepToday(entry.id, today, a);
    setBusy(false);
    // Nothing on screen changes until the server has kept it.
    if (!ok) { setSaved('failed'); return; }
    setDays((ds) => [...ds.filter((d) => d.day !== today), { day: today, answer: a }]);
    setSaved('saved');
  };

  return (
    <div style={card}>
      <div id="today-step-h" style={eyebrow}>{c.title}</div>
      <div translate="no" style={{ fontSize: 17, fontWeight: 700, color: C.text, lineHeight: 1.5 }}><bdi>{entry.step}</bdi></div>
      <div style={{ fontSize: 13.5, color: C.subtext }}>{c.question}</div>
      <div role="group" aria-label={c.question} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        {ANSWERS.map((a) => {
          const on = mine === a;
          return (
            <button key={a} type="button" aria-pressed={on} disabled={busy} onClick={() => void answer(a)} style={{
              minHeight: 48, borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: on ? 700 : 500,
              background: on ? goldA(0.16) : 'transparent', color: on ? C.gold : C.text,
              border: `1px solid ${on ? C.gold : C.border}`, padding: '0 6px',
            }}>{label(a)}</button>
          );
        })}
      </div>
      {saved === 'saved' && <div role="status" style={{ fontSize: 12.5, color: C.subtext }}>{c.saved}</div>}
      {saved === 'failed' && <div role="alert" style={{ fontSize: 12.5, color: C.text }}>{c.failed}</div>}
      <div data-testid="today-week" style={{ fontSize: 13, color: C.subtext, lineHeight: 1.6 }}>{c.week(review.done, review.partly)}</div>
    </div>
  );
}

/** The goal closest to done — a way into My goals, not a second goals screen. */
function GoalCard({ onGoals }: { onGoals: () => void }) {
  const { locale } = useTranslation();
  const t = todayCopy(locale);
  const { goals, loading, error, reload } = useGoals();
  const g = closestGoal(goals);

  let body: ReactNode;
  if (loading && goals.length === 0) body = <Skeleton h={104} />;
  else if (error) body = <Failed text={t.failed} retry={t.retry} onRetry={reload} />;
  else if (!g) body = (
    <div style={card}>
      <div style={eyebrow}>{t.closest}</div>
      <p style={{ margin: 0, color: C.subtext, fontSize: 14 }}>{t.noGoals}</p>
      <button type="button" onClick={onGoals} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${C.border}`, background: 'transparent', color: C.text, fontSize: 14, cursor: 'pointer', alignSelf: 'flex-start', padding: '0 16px' }}>
        {t.addGoal}
      </button>
    </div>
  );
  else {
    const steps = parseSteps(g.description ?? '');
    const hasTarget = !!g.target_amount && g.target_amount > 0;
    const share = hasTarget ? g.progress / g.target_amount! : steps.length ? steps.filter((x) => x.done).length / steps.length : null;
    body = (
      <button type="button" onClick={onGoals} aria-label={`${t.closest}: ${g.title}. ${t.openGoals}`} style={{ ...card, cursor: 'pointer', textAlign: 'start', color: C.text, width: '100%' }}>
        <div style={eyebrow}>{t.closest}</div>
        <div translate="no" style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.45 }}><bdi>{g.title}</bdi></div>
        {share != null && (
          <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(share * 100)}
            style={{ height: 8, borderRadius: 999, background: C.surface2, overflow: 'hidden' }}>
            <span style={{ display: 'block', height: '100%', width: `${Math.round(share * 100)}%`, background: C.gold, borderRadius: 999 }} />
          </div>
        )}
        <div style={{ fontSize: 13, color: C.subtext }}>
          {hasTarget
            ? `${fill(t.ofTarget, { p: g.progress, t: g.target_amount! })} · ${fill(t.left, { n: Math.max(0, g.target_amount! - g.progress) })}`
            : steps.length ? fill(t.steps, { d: steps.filter((x) => x.done).length, n: steps.length }) : t.openGoals}
        </div>
      </button>
    );
  }
  return <section data-testid="today-goal">{body}</section>;
}

/** The greeting with the name isolated on its own, so an @handle keeps its order in Arabic. */
function Greeting({ pattern, greet, name }: { pattern: string; greet: string; name: string }) {
  const [before, after = ''] = pattern.replace('{g}', greet).split('{n}');
  return <>{before}<bdi dir="ltr">{name}</bdi>{after}</>;
}

function Skeleton({ h }: { h: number }) {
  return <div aria-busy="true" style={{ height: h, borderRadius: 18, background: C.surface, border: `1px solid ${C.border}`, opacity: 0.6 }} />;
}

function Failed({ text, retry, onRetry }: { text: string; retry: string; onRetry: () => void }) {
  return (
    <div role="alert" style={{ ...card, borderColor: C.border }}>
      <p style={{ margin: 0, color: C.text, fontSize: 14 }}>{text}</p>
      <button type="button" onClick={onRetry} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${C.border}`, background: 'transparent', color: C.text, fontSize: 14, cursor: 'pointer', alignSelf: 'flex-start', padding: '0 16px' }}>
        {retry}
      </button>
    </div>
  );
}
