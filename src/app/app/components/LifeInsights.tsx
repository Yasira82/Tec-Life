'use client';

// TEC Life (C-106) — Goal Insights (Life Pro). A real, standalone Pro service on top of
// unlimited goals: a DEEPER read of your own goals than the free overview strip
// (active · done · π tracked) — completion rate, funding progress toward your π targets,
// goals reached. Your own self-declared data (no population needed). The aggregate is
// gated server-side behind live Pro (P5); a non-Pro sees an honest teaser. Own-scope (P6).
import { useEffect, useState } from 'react';
import { Icon, TEC_COLORS } from '@yasser172/tec-ui';

interface Insights {
  total: number;
  byStatus: Record<string, number>;
  completionRate: number;
  trackers: number;
  reached: number;
  funding: { targetSum: number; progressSum: number; pct: number };
}

const fmtPi = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));
const card = { background: TEC_COLORS.surface, border: `1px solid ${TEC_COLORS.gold}33`, borderRadius: 16, padding: '18px 20px' } as const;

export function LifeInsights() {
  const [pro, setPro] = useState<boolean | null>(null);
  const [data, setData] = useState<Insights | null>(null);

  useEffect(() => {
    fetch('/api/bff/life/goals/insights', { credentials: 'include', cache: 'no-store' })
      .then((r) => (r.status === 401 ? null : r.json()))
      .then((j: { pro?: boolean; insights?: Insights } | null) => {
        if (!j) { setPro(false); return; }
        setPro(Boolean(j.pro));
        setData(j.insights ?? null);
      })
      .catch(() => setPro(false));
  }, []);

  if (pro === null) return null;

  return (
    <section style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: TEC_COLORS.text, margin: 0, display: 'flex', alignItems: 'center', gap: 7 }}><Icon name="chart" size={17} color={TEC_COLORS.gold} strokeWidth={1.9} />Goal insights</h3>
        <span style={{ fontSize: 11, color: TEC_COLORS.gold, border: `1px solid ${TEC_COLORS.gold}55`, borderRadius: 999, padding: '1px 8px' }}>PRO</span>
      </div>

      {!pro || !data ? (
        <div style={card}>
          <div style={{ color: TEC_COLORS.text, fontWeight: 800, fontSize: 14 }}>🔒 Go deeper on your goals</div>
          <p style={{ color: TEC_COLORS.subtext, fontSize: 13, lineHeight: 1.6, marginTop: 8 }}>
            Life Pro adds a completion rate, funding progress toward your π targets, and how many goals
            you&apos;ve reached — beyond the summary above. It&apos;s your own data. Upgrade below.
          </p>
        </div>
      ) : data.total === 0 ? (
        <div style={card}>
          <p style={{ color: TEC_COLORS.subtext, fontSize: 13, lineHeight: 1.6 }}>Add a goal above and your insights fill in automatically.</p>
        </div>
      ) : (
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              ['Completion', `${data.completionRate}%`],
              ['Reached', `${data.reached}/${data.trackers}`],
              ['Archived', String(data.byStatus.ARCHIVED ?? 0)],
            ].map(([label, value]) => (
              <div key={label} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: TEC_COLORS.gold, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
                <div style={{ fontSize: 10.5, color: TEC_COLORS.subtext, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {data.funding.targetSum > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: TEC_COLORS.subtext, marginBottom: 5 }}>
                <span>Funding toward targets</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>π {fmtPi(data.funding.progressSum)} / {fmtPi(data.funding.targetSum)} · {data.funding.pct}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: TEC_COLORS.bg, overflow: 'hidden' }}>
                <div style={{ width: `${data.funding.pct}%`, height: '100%', background: `linear-gradient(90deg, ${TEC_COLORS.gold}, ${TEC_COLORS.goldDark})` }} />
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
