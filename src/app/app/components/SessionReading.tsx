'use client';

// The owner's stage 1 reading (First Session Spec §8): counts by week, the stage
// 1 verdict computed by the service. Shown only to an admin — the service answers
// 403 to everyone else, and then this renders nothing. Every count under 5 comes
// back as null and is shown as "fewer than 5"; there is no person and no text in
// any of it.
import { useEffect, useState } from 'react';
import { C } from '@/lib-client/palette';
import { useTranslation } from '@/lib/i18n';
import { sessionCopy } from '@/lib/life/session-copy';
import { card } from './shared';

type Metric = 's2_started' | 's7_reached' | 'm6_yes' | 'm6_somewhat' | 'm6_no'
  | 'j_kept' | 'c_resumed' | 'm_before' | 'm_after' | 'm_unknown' | 'g_from_step';
type Shown = Partial<Record<Metric, number | null>>;
interface Report {
  weeks:  { week_start: string; counts: Shown }[];
  total:  Shown;
  stage1: { m1: number | null; m6_clearer: number | null; m6_no: number | null; result: string };
  /** The bar the owner set before seeing any number (Tec-core-backend #454). Absent on an older service. */
  real_use?: { reached: number | null; after: number | null; met: boolean; bar: { weeks: number; reached: number; after: number } };
}

const pct = (v: number | null) => (v == null ? '—' : `${Math.round(v * 100)}%`);

export function SessionReading() {
  const { locale } = useTranslation();
  const s = sessionCopy(locale);
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    let live = true;
    fetch('/api/bff/life/admin/session-counts', { credentials: 'include', cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { data?: Report } | null) => { if (live && j?.data) setReport(j.data); })
      .catch(() => { /* not an admin, or unreachable — nothing to show */ });
    return () => { live = false; };
  }, []);

  if (!report) return null;
  const n = (v: number | null | undefined) => (v == null ? s.readingFewer : String(v));
  const clearerCount = (c: Shown) =>
    c.m6_yes == null && c.m6_somewhat == null ? null : (c.m6_yes ?? 0) + (c.m6_somewhat ?? 0);

  return (
    <section style={{ ...card, marginTop: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 4 }}>{s.readingTitle}</div>
      <div style={{ fontSize: 12.5, color: C.subtext, lineHeight: 1.5, marginBottom: 12 }}>{s.readingHint}</div>

      <div role="status" style={{ fontSize: 14, fontWeight: 700, color: C.gold, marginBottom: 6 }}>
        {s.readingResult[report.stage1.result] ?? report.stage1.result}
      </div>
      {/* One figure per line, each value isolated with <bdi>: "M1", "%" and "—" are
          left-to-right, and run together on one Arabic line they reorder into noise. */}
      <dl style={{ fontSize: 13, color: C.text, marginBottom: 12, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px' }}>
        <dt>M1</dt><dd><bdi>{pct(report.stage1.m1)}</bdi></dd>
        <dt>M6 · {s.readingClearer}</dt><dd><bdi>{pct(report.stage1.m6_clearer)}</bdi></dd>
        <dt>M6 · {s.readingNo}</dt><dd><bdi>{pct(report.stage1.m6_no)}</bdi></dd>
      </dl>

      {report.real_use && (
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8, marginBottom: 10 }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: C.text }}>{s.realUseTitle}</div>
          <div role="status" style={{ fontSize: 13.5, fontWeight: 700, color: report.real_use.met ? C.gold : C.subtext, margin: '2px 0 4px' }}>
            {report.real_use.met ? s.realUseMet : s.realUseNotYet}
          </div>
          <div style={{ fontSize: 12, color: C.subtext, lineHeight: 1.5 }}>
            {s.realUseBar.replace('{reached}', String(report.real_use.bar.reached)).replace('{after}', String(report.real_use.bar.after))}
          </div>
          <div style={{ fontSize: 12.5, color: C.text, marginTop: 4 }}>
            {s.readingReached}: <bdi>{n(report.real_use.reached)}</bdi> · {s.readingAfter}: <bdi>{n(report.real_use.after)}</bdi>
          </div>
        </div>
      )}

      {report.weeks.map((w) => (
        <div key={w.week_start} style={{ fontSize: 12.5, color: C.subtext, lineHeight: 1.7, borderTop: `1px solid ${C.border}`, paddingTop: 6, marginTop: 6 }}>
          <div style={{ color: C.text, fontWeight: 700 }}>{s.readingWeek} <bdi>{w.week_start}</bdi></div>
          <div>{s.readingStarted}: <bdi>{n(w.counts.s2_started)}</bdi></div>
          <div>{s.readingReached}: <bdi>{n(w.counts.s7_reached)}</bdi></div>
          <div>{s.readingClearer}: <bdi>{n(clearerCount(w.counts))}</bdi></div>
          <div>{s.readingNo}: <bdi>{n(w.counts.m6_no)}</bdi></div>
          <div style={{ color: C.text, marginTop: 4 }}>{s.readingLoop}</div>
          <div>{s.readingKept}: <bdi>{n(w.counts.j_kept)}</bdi></div>
          <div>{s.readingResumed}: <bdi>{n(w.counts.c_resumed)}</bdi></div>
          <div>{s.readingBefore}: <bdi>{n(w.counts.m_before)}</bdi></div>
          <div>{s.readingAfter}: <bdi>{n(w.counts.m_after)}</bdi></div>
          <div>{s.readingUnknown}: <bdi>{n(w.counts.m_unknown)}</bdi></div>
          <div>{s.readingGoal}: <bdi>{n(w.counts.g_from_step)}</bdi></div>
        </div>
      ))}
    </section>
  );
}
