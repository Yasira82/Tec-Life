'use client';

import { C } from '@/lib-client/palette';
import { useTrajectory } from '@/lib-client/life/useLife';
import { useTranslation } from '@/lib/i18n';
import { card, fmtPi } from './shared';

// ── Pace (C-106 §4 — personal trajectory) ────────────────────────────────────
//
// How fast the person is actually moving, and what that reaches. Every figure
// is arithmetic on their own logged steps — no recommendation (that is TEC AI's
// function, C-104) and no claim about π itself.
//
// It refuses more often than it answers, and the refusal is the feature: with
// one entry, or several on a single day, there is no pace, and the panel says
// so instead of dividing by a day and naming a Thursday.
export function Pace() {
  const { t } = useTranslation();
  const tr = t.life.trajectory;
  const { trajectory, loading } = useTrajectory();

  if (loading || !trajectory) return null;
  const { projectable, pi_per_week, active_days, window_days, completed_in_window, goals } = trajectory;

  return (
    <div style={{ ...card, marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: C.gold }}>
          {tr.title}
        </span>
        <span style={{ fontSize: 11, color: C.faint }}>{tr.window.replace('{n}', String(window_days))}</span>
      </div>

      {!projectable ? (
        <p style={{ fontSize: 12.5, color: C.subtext, margin: 0, lineHeight: 1.6 }}>{tr.notEnough}</p>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: C.gold, fontVariantNumeric: 'tabular-nums' }}>
              π {fmtPi(pi_per_week)}
            </span>
            <span style={{ fontSize: 12, color: C.subtext }}>{tr.perWeek}</span>
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 11.5, color: C.faint }}>
              {active_days} {tr.activeDays}
              {completed_in_window > 0 && ` · ${tr.completed.replace('{n}', String(completed_in_window))}`}
            </span>
          </div>

          {goals.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {goals.map((g, i) => (
                <div key={g.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0',
                           borderTop: i === 0 ? `1px solid ${C.border}` : `1px solid ${C.border}` }}>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, color: C.text,
                                 overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {g.title}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: C.gold, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                    {g.eta_days} {tr.days}
                  </span>
                </div>
              ))}
            </div>
          )}

          <p style={{ fontSize: 11, color: C.faint, margin: '12px 0 0', lineHeight: 1.5 }}>{tr.note}</p>
        </>
      )}
    </div>
  );
}
