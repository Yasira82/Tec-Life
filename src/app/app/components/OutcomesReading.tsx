'use client';

// The owner's reading of whether Life helps (Tec-core-backend: GET /identity/life/admin/outcomes).
// Counts of what people chose — the step and their answer about it, the daily taps, the
// before/after measure, the feelings they picked, who came back. Nothing anyone wrote. Every
// count under 5 comes back as null and reads "fewer than 5". Shown only to an admin: the service
// answers 403 to everyone else, and then this renders nothing.
import { useEffect, useState } from 'react';
import { C } from '@/lib-client/palette';
import { useTranslation } from '@/lib/i18n';
import { outcomesCopy } from '@/lib/life/outcomes-copy';
import { card } from './shared';

type N = number | null;
interface Report {
  people: N; entries: N;
  steps:    { chosen: N; answered: N; done: N; partly: N; not_yet: N };
  daily:    { steps_followed: N; done: N; partly: N; not_yet: N };
  measures: { before_and_after: N; moved: N; unchanged: N; unknown_or_not_counted: N };
  feelings: { both_picked: N; heavy_to_light: N; light_to_heavy: N; same_side: N };
  came_back_after_a_week: N;
}

export function OutcomesReading() {
  const { locale } = useTranslation();
  const o = outcomesCopy(locale);
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    let live = true;
    fetch('/api/bff/life/admin/outcomes', { credentials: 'include', cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { data?: Report } | null) => { if (live && j?.data) setReport(j.data); })
      .catch(() => { /* not an admin, or unreachable — nothing to show */ });
    return () => { live = false; };
  }, []);

  if (!report) return null;
  const n = (v: N | undefined) => (v == null ? o.fewer : String(v));
  const line = (label: string, v: N) => <div>{label}: <bdi>{n(v)}</bdi></div>;
  const head = (t: string) => <div style={{ color: C.text, fontWeight: 700, marginTop: 8 }}>{t}</div>;

  return (
    <section style={{ ...card, marginTop: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 4 }}>{o.title}</div>
      <div style={{ fontSize: 12.5, color: C.subtext, lineHeight: 1.5, marginBottom: 8 }}>{o.hint}</div>
      <div style={{ fontSize: 12.5, color: C.subtext, lineHeight: 1.7 }}>
        {line(o.people, report.people)}
        {line(o.entries, report.entries)}
        {line(o.cameBack, report.came_back_after_a_week)}
        {head(o.steps)}
        {line(o.stepsChosen, report.steps.chosen)}
        {line(o.stepsAnswered, report.steps.answered)}
        {line(o.stepsDone, report.steps.done)}
        {line(o.stepsPartly, report.steps.partly)}
        {line(o.stepsNotYet, report.steps.not_yet)}
        {head(o.daily)}
        {line(o.dailyFollowed, report.daily.steps_followed)}
        {line(o.dailyDone, report.daily.done)}
        {line(o.dailyPartly, report.daily.partly)}
        {line(o.dailyNotYet, report.daily.not_yet)}
        {head(o.feelings)}
        {line(o.feelingsBoth, report.feelings.both_picked)}
        {line(o.heavyToLight, report.feelings.heavy_to_light)}
        {line(o.lightToHeavy, report.feelings.light_to_heavy)}
        {line(o.sameSide, report.feelings.same_side)}
        {head(o.measures)}
        {line(o.measuresBoth, report.measures.before_and_after)}
        {line(o.measuresMoved, report.measures.moved)}
        {line(o.measuresSame, report.measures.unchanged)}
        {line(o.measuresUnknown, report.measures.unknown_or_not_counted)}
        <div style={{ marginTop: 4 }}>{o.movedNote}</div>
      </div>
    </section>
  );
}
