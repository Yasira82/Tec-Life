'use client';

// ── The small step, day by day (owner, 2026-10-30: «حاجات مفيدة من غير AI») ─────
//
// The newest kept conversation ended on one small step. Until now Life asked about it once, at
// the next conversation. This card asks every day, with one tap — did it, partly, not yet — and
// shows the last seven days as dots and the week in a few plain words. No model is involved:
// it works the same on a day the AI cannot answer.
//
// Like «أنا بتغيّر»: no score and no streak. A missed day is an empty dot; a slower week is
// said as "a new week can start today", never as a loss. Shown only while the person keeps
// their journey, and only for a step under a month old that they have not said is DONE.
import { useEffect, useState } from 'react';
import { C, goldA, successA } from '@/lib-client/palette';
import { useTranslation } from '@/lib/i18n';
import { sessionCopy } from '@/lib/life/session-copy';
import { stepCopy } from '@/lib/life/step-copy';
import { readJourney, setStepToday, type JourneyEntry, type JourneyOutcome } from '@/lib-client/life/journey';
import { followedStep, lastDays, localDayKey, weekReview, type StepDay } from '@/lib/life/step-week';
import { card } from './shared';

const ANSWERS: JourneyOutcome[] = ['DONE', 'PARTLY', 'NOT_YET'];

const dotColor = (a: JourneyOutcome | null) =>
  a === 'DONE' ? C.success : a === 'PARTLY' ? successA(0.45) : a === 'NOT_YET' ? C.subtext : 'transparent';

export function StepToday() {
  const { locale } = useTranslation();
  const s = sessionCopy(locale);
  const c = stepCopy(locale);
  const [entry, setEntry] = useState<JourneyEntry | null>(null);
  const [days, setDays] = useState<StepDay[]>([]);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<'idle' | 'saved' | 'failed'>('idle');

  useEffect(() => {
    void readJourney().then((j) => {
      if (!j?.keeping) return;
      const e = followedStep(j.entries);
      if (!e) return;
      setEntry(e);
      setDays(e.days ?? []);
    });
  }, []);

  if (!entry?.step) return null;

  const today = localDayKey();
  const mine = days.find((d) => d.day === today)?.answer ?? null;
  const dots = lastDays(days, today, 7);
  const review = weekReview(days, today);

  const answer = async (a: JourneyOutcome) => {
    if (busy) return;
    setBusy(true); setState('idle');
    const ok = await setStepToday(entry.id, today, a);
    setBusy(false);
    if (!ok) { setState('failed'); return; }
    setDays((ds) => [...ds.filter((d) => d.day !== today), { day: today, answer: a }]);
    setState('saved');
  };

  const label = (a: JourneyOutcome) => (a === 'DONE' ? s.outDone : a === 'PARTLY' ? s.outPartly : s.outNotYet);

  return (
    <section className="tec-rise" data-testid="step-today" style={{ ...card, marginTop: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, marginBottom: 4 }}>{c.title}</div>
      <div translate="no" style={{ fontSize: 15, fontWeight: 700, color: C.text, lineHeight: 1.5 }}><bdi>{entry.step}</bdi></div>

      <div style={{ fontSize: 13, color: C.subtext, marginTop: 10, marginBottom: 8 }}>{c.question}</div>
      <div role="group" aria-label={c.question} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {ANSWERS.map((a) => {
          const on = mine === a;
          return (
            <button key={a} type="button" aria-pressed={on} disabled={busy} onClick={() => void answer(a)}
              style={{
                background: on ? goldA(0.16) : 'transparent', color: on ? C.gold : C.text,
                border: `1px solid ${on ? C.gold : C.border}`, borderRadius: 10,
                padding: '8px 14px', fontSize: 14, fontWeight: on ? 700 : 500, cursor: 'pointer',
              }}>
              {label(a)}
            </button>
          );
        })}
      </div>
      {state === 'saved' && <div role="status" style={{ fontSize: 12, color: C.subtext, marginTop: 8 }}>{c.saved}</div>}
      {state === 'failed' && <div role="alert" style={{ fontSize: 12.5, color: C.text, marginTop: 8 }}>{c.failed}</div>}

      <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 14, paddingTop: 12 }}>
        <div style={{ fontSize: 11.5, color: C.subtext, marginBottom: 8 }}>{c.last7}</div>
        <div style={{ display: 'flex', gap: 8 }} aria-label={c.last7}>
          {dots.map((d) => (
            <span key={d.day} data-testid={`dot-${d.day}`} title={`${d.day} · ${c.dayLabel[d.answer ?? 'none']}`}
              aria-label={`${d.day} · ${c.dayLabel[d.answer ?? 'none']}`}
              style={{
                width: 14, height: 14, borderRadius: 999, display: 'inline-block',
                background: dotColor(d.answer), border: `1px solid ${d.answer ? dotColor(d.answer) : C.border}`,
                outline: d.day === today ? `2px solid ${goldA(0.5)}` : 'none', outlineOffset: 2,
              }} />
          ))}
        </div>
        <div data-testid="step-week" style={{ fontSize: 13, color: C.text, lineHeight: 1.6, marginTop: 10 }}>
          {c.week(review.done, review.partly)} {c.trend[review.trend](review.before)}
        </div>
      </div>
    </section>
  );
}
