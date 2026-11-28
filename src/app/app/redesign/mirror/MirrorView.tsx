'use client';

// The redesign's «My mirror» (Phase 1, approved mockup v4, owner 2026-11-28). Three questions:
//   What happened?  — real numbers from Life's own reads, for the chosen period;
//   What did I learn? — only past the evidence rule, and then only the person's own confirmed words;
//   What's next?    — the step they are following now, or the way to the coach.
//
// Phase 1 has NO AI reading here: none can be asked for without a new route, and the owner's
// conditions rule out API changes and any change to what the coach may read. So nothing on this
// screen is inferred — every line is a count or the person's own words, with its date.
//
// Reads are the existing ones: /api/bff/life/trajectory (per period) and /api/bff/life/journey.
// Each part loads and fails on its own, with its own retry; Analytics is not read.
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { C, goldA } from '@/lib-client/palette';
import { useTranslation } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n/locales';
import { readJourney, type Journey } from '@/lib-client/life/journey';
import { followedStep, localDayKey } from '@/lib/life/step-week';
import { fill } from '@/lib/life/today-copy';
import { mirrorCopy, type MirrorCopy } from '@/lib/life/mirror-copy';
import { localDigits } from '@/lib/life/digits';
import {
  PERIODS, PERIOD_DAYS, GATE, checkGate, evidenceIn, ownLessons, stepDaysDone, stepWeek, summariesIn,
  type Period,
} from '@/lib/life/mirror';

const card: CSSProperties = {
  background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: 16,
  display: 'flex', flexDirection: 'column', gap: 10,
};
const h2: CSSProperties = { fontSize: 17, fontWeight: 800, margin: '0 0 8px', color: C.text };
const muted: CSSProperties = { margin: 0, color: C.subtext, fontSize: 13.5, lineHeight: 1.6 };
const btn: CSSProperties = {
  minHeight: 44, borderRadius: 12, border: `1px solid ${C.border}`, background: 'transparent',
  color: C.text, fontSize: 14, cursor: 'pointer', alignSelf: 'flex-start', padding: '0 16px',
};

type Load<T> = { state: 'loading' } | { state: 'failed' } | { state: 'ok'; value: T };
interface Progress { active_days: number; completed_in_window: number }

/** The trajectory for one period, or null when it could not be read (never a zeroed guess). */
export async function readProgress(days: number): Promise<Progress | null> {
  try {
    const res = await fetch(`/api/bff/life/trajectory?window_days=${days}`, { credentials: 'include', cache: 'no-store' });
    if (!res.ok) return null;
    const body = await res.json() as { data?: { trajectory?: Progress }; trajectory?: Progress };
    const t = body?.data?.trajectory ?? body?.trajectory;
    if (!t || typeof t.active_days !== 'number' || typeof t.completed_in_window !== 'number') return null;
    return { active_days: t.active_days, completed_in_window: t.completed_in_window };
  } catch { return null; }
}

export function MirrorView({ onTalk }: { onTalk: () => void }) {
  const { locale } = useTranslation();
  const m = mirrorCopy(locale);
  const [period, setPeriod] = useState<Period>('week');
  const days = PERIOD_DAYS[period];
  // The phone's own calendar day, after mount: the server does not know the person's day.
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => { setToday(localDayKey()); }, []);

  const [journey, setJourney] = useState<Load<Journey>>({ state: 'loading' });
  const loadJourney = useCallback(() => {
    setJourney({ state: 'loading' });
    void readJourney().then((j) => setJourney(j ? { state: 'ok', value: j } : { state: 'failed' }));
  }, []);
  useEffect(() => { loadJourney(); }, [loadJourney]);

  const [progress, setProgress] = useState<Load<Progress>>({ state: 'loading' });
  const asked = useRef(0);
  const loadProgress = useCallback(() => {
    const n = ++asked.current;
    setProgress({ state: 'loading' });
    void readProgress(days).then((p) => {
      if (n !== asked.current) return; // an answer for a period no longer on screen
      setProgress(p ? { state: 'ok', value: p } : { state: 'failed' });
    });
  }, [days]);
  useEffect(() => { loadProgress(); }, [loadProgress]);

  const j = journey.state === 'ok' && today ? journey.value : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div role="group" aria-label={m.periodLabel} style={{ display: 'flex', gap: 6, alignSelf: 'flex-start', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 4 }}>
        {PERIODS.map((p) => {
          const on = p === period;
          return (
            <button key={p} type="button" aria-pressed={on} onClick={() => setPeriod(p)} style={{
              minHeight: 44, minWidth: 64, padding: '0 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: on ? goldA(0.16) : 'transparent', color: on ? C.gold : C.text, fontSize: 14, fontWeight: on ? 700 : 500,
            }}>{m.period[p]}</button>
          );
        })}
      </div>

      <section data-testid="mirror-happened" aria-labelledby="mirror-q1">
        <h2 id="mirror-q1" style={h2}>{m.q1}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div data-testid="mirror-progress">
            {progress.state === 'loading' && <Skeleton h={96} />}
            {progress.state === 'failed' && <Failed m={m} onRetry={loadProgress} />}
            {progress.state === 'ok' && (
              <div style={card}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                  <Stat n={localDigits(locale, progress.value.active_days)} label={m.sDays} id="stat-progress-days" />
                  <Stat n={localDigits(locale, progress.value.completed_in_window)} label={m.sGoals} id="stat-goals-done" />
                </div>
              </div>
            )}
          </div>
          <div data-testid="mirror-journey">
            {(journey.state === 'loading' || (journey.state === 'ok' && !today)) && <Skeleton h={120} />}
            {journey.state === 'failed' && <Failed m={m} onRetry={loadJourney} />}
            {j && today && <JourneyStats m={m} locale={locale} journey={j} today={today} days={days} />}
          </div>
          <p style={{ ...muted, fontSize: 12.5 }}>{m.source}</p>
        </div>
      </section>

      <section data-testid="mirror-learned" aria-labelledby="mirror-q2">
        <h2 id="mirror-q2" style={h2}>{m.q2}</h2>
        {(journey.state === 'loading' || (journey.state === 'ok' && !today)) && <Skeleton h={140} />}
        {journey.state === 'failed' && <Failed m={m} onRetry={loadJourney} />}
        {j && today && <Learned m={m} locale={locale} journey={j} today={today} days={days} />}
      </section>

      <section data-testid="mirror-next" aria-labelledby="mirror-q3">
        <h2 id="mirror-q3" style={h2}>{m.q3}</h2>
        {(journey.state === 'loading' || (journey.state === 'ok' && !today)) && <Skeleton h={96} />}
        {journey.state === 'failed' && <Failed m={m} onRetry={loadJourney} />}
        {j && <Next m={m} journey={j} onTalk={onTalk} />}
      </section>
    </div>
  );
}

function JourneyStats({ m, locale, journey, today, days }: { m: MirrorCopy; locale: Locale; journey: Journey; today: string; days: number }) {
  if (!journey.keeping) return <div style={card}><p style={muted}>{m.journeyOff}</p></div>;
  const s = summariesIn(journey, today, days);
  const done = stepDaysDone(journey, today, days);
  const week = days === 7 ? stepWeek(journey, today, 7) : null;
  return (
    <div style={card}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
        <Stat n={s.atLeast ? fill(m.atLeast, { n: s.n }, locale) : localDigits(locale, s.n)} label={m.sSummaries} id="stat-summaries" />
        {done === null
          ? <Stat n="—" label={m.sSteps} id="stat-step-days" note={m.only14} />
          : <Stat n={localDigits(locale, done)} label={m.sSteps} id="stat-step-days" />}
      </div>
      {week && (
        <div>
          <div style={{ ...muted, fontSize: 12.5 }}>{m.weekDots}</div>
          <div data-testid="mirror-week" aria-hidden="true" style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 44, marginTop: 6 }}>
            {week.map((d) => (
              <span key={d.day} data-answer={d.answer ?? 'none'} style={{
                flex: 1, borderRadius: 6,
                height: d.answer === 'DONE' ? 40 : d.answer === 'PARTLY' ? 24 : 6,
                background: d.answer === 'DONE' ? C.gold : d.answer === 'PARTLY' ? goldA(0.5) : C.surface2,
              }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Learned({ m, locale, journey, today, days }: { m: MirrorCopy; locale: Locale; journey: Journey; today: string; days: number }) {
  const items = useMemo(() => evidenceIn(journey, today, days), [journey, today, days]);
  const gate = checkGate(items);
  if (!journey.keeping) return <div style={card}><p style={muted}>{m.journeyOff}</p></div>;

  if (!gate.enough) {
    const row = (ok: boolean, label: string, have: number) => (
      <li style={{ display: 'flex', gap: 8, alignItems: 'baseline', color: ok ? C.text : C.subtext, fontSize: 13.5 }}>
        <span aria-hidden="true" style={{ color: ok ? C.gold : C.subtext }}>{ok ? '✓' : '○'}</span>
        <span>{label} <span style={{ color: C.subtext }}>({fill(m.have, { n: have }, locale)})</span></span>
      </li>
    );
    return (
      <div data-testid="mirror-not-enough" style={card}>
        <p style={{ margin: 0, color: C.text, fontSize: 14.5, lineHeight: 1.6 }}>{m.notEnough}</p>
        <div style={{ ...muted, fontSize: 12.5 }}>{m.gateTitle}</div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {row(gate.ok.records, fill(m.gRecords, { n: GATE.records }, locale), gate.records)}
          {row(gate.ok.days, fill(m.gDays, { n: GATE.days }, locale), gate.days)}
          {row(gate.ok.span, fill(m.gSpan, { n: GATE.span }, locale), gate.span)}
        </ul>
      </div>
    );
  }

  const inPeriod = summariesIn(journey, today, days).entries;
  const lessons = ownLessons(inPeriod).slice(0, 5);
  const date = (day: string) => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${day}T00:00:00Z`));
  return (
    <div data-testid="mirror-own" style={card}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.subtext }}>{m.ownTitle}</div>
      {lessons.length === 0
        ? <p style={muted}>{m.noLessons}</p>
        : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {lessons.map((l) => (
              <li key={l.id} style={{ fontSize: 14.5, color: C.text, lineHeight: 1.55 }}>
                <bdi translate="no">«{l.text}»</bdi> <span style={{ color: C.subtext, fontSize: 12.5 }}>· {date(l.day)}</span>
              </li>
            ))}
          </ul>
        )}
      <p style={{ ...muted, fontSize: 12.5 }}>{m.ownNote}</p>
      <details data-testid="mirror-records">
        <summary style={{ minHeight: 44, display: 'flex', alignItems: 'center', cursor: 'pointer', color: C.text, fontSize: 13.5 }}>
          {fill(m.records, { n: items.length }, locale)}
        </summary>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((i) => (
            <li key={i.id} style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>
              <span style={{ color: C.subtext }}>{date(i.day)} · {i.kind === 'summary' ? m.kSummary : i.answer === 'DONE' ? m.kDone : m.kPartly}:</span>{' '}
              <bdi translate="no">{i.text}</bdi>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function Next({ m, journey, onTalk }: { m: MirrorCopy; journey: Journey; onTalk: () => void }) {
  if (!journey.keeping) return <div style={card}><p style={muted}>{m.stepOff}</p></div>;
  const entry = followedStep(journey.entries);
  if (entry?.step) return (
    <div data-testid="mirror-step" style={card}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.subtext }}>{m.nowStep}</div>
      <div translate="no" style={{ fontSize: 16, fontWeight: 700, color: C.text, lineHeight: 1.5 }}><bdi>{entry.step}</bdi></div>
    </div>
  );
  return (
    <div style={card}>
      <p style={muted}>{m.noStep}</p>
      <button type="button" onClick={onTalk} style={btn}>{m.talk}</button>
    </div>
  );
}

function Stat({ n, label, id, note }: { n: string; label: string; id: string; note?: string }) {
  return (
    <div data-testid={id} style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <b style={{ fontSize: 24, fontWeight: 800, color: n === '—' ? C.subtext : C.text }}>{n}</b>
      <span style={{ fontSize: 12.5, color: C.subtext, lineHeight: 1.45 }}>{label}</span>
      {note && <span style={{ fontSize: 11.5, color: C.subtext, lineHeight: 1.45 }}>{note}</span>}
    </div>
  );
}

function Skeleton({ h }: { h: number }) {
  return <div aria-busy="true" style={{ height: h, borderRadius: 18, background: C.surface, border: `1px solid ${C.border}`, opacity: 0.6 }} />;
}

function Failed({ m, onRetry }: { m: MirrorCopy; onRetry: () => void }): ReactNode {
  return (
    <div role="alert" style={card}>
      <p style={{ margin: 0, color: C.text, fontSize: 14 }}>{m.failed}</p>
      <button type="button" onClick={onRetry} style={btn}>{m.retry}</button>
    </div>
  );
}
