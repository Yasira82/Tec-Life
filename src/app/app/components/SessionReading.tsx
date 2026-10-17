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

type Shown = Record<'s2_started' | 's7_reached' | 'm6_yes' | 'm6_somewhat' | 'm6_no', number | null>;
interface Report {
  weeks:  { week_start: string; counts: Shown }[];
  total:  Shown;
  stage1: { m1: number | null; m6_clearer: number | null; m6_no: number | null; result: string };
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
  const n = (v: number | null) => (v == null ? s.readingFewer : String(v));
  const clearerCount = (c: Shown) =>
    c.m6_yes == null && c.m6_somewhat == null ? null : (c.m6_yes ?? 0) + (c.m6_somewhat ?? 0);

  return (
    <section style={{ ...card, marginTop: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 4 }}>{s.readingTitle}</div>
      <div style={{ fontSize: 12.5, color: C.subtext, lineHeight: 1.5, marginBottom: 12 }}>{s.readingHint}</div>

      <div role="status" style={{ fontSize: 14, fontWeight: 700, color: C.gold, marginBottom: 6 }}>
        {s.readingResult[report.stage1.result] ?? report.stage1.result}
      </div>
      <div style={{ fontSize: 13, color: C.text, marginBottom: 12 }}>
        M1 {pct(report.stage1.m1)} · M6 {s.readingClearer} {pct(report.stage1.m6_clearer)} · {s.readingNo} {pct(report.stage1.m6_no)}
      </div>

      {report.weeks.map((w) => (
        <div key={w.week_start} style={{ fontSize: 12.5, color: C.subtext, lineHeight: 1.6, borderTop: `1px solid ${C.border}`, paddingTop: 6, marginTop: 6 }}>
          <strong style={{ color: C.text }}>{s.readingWeek} {w.week_start}</strong> — {s.readingStarted}: {n(w.counts.s2_started)} · {s.readingReached}: {n(w.counts.s7_reached)} · {s.readingClearer}: {n(clearerCount(w.counts))} · {s.readingNo}: {n(w.counts.m6_no)}
        </div>
      ))}
    </section>
  );
}
