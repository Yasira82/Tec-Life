'use client';

import { useState } from 'react';
import { InviteCard } from '@/components/referral/InviteCard';
import { C, goldA, inkA, successA } from '@/lib-client/palette';
import { type Goal, useActivity, useGoals, useSkills, useTrajectory } from '@/lib-client/life/useLife';
import { goalPercent, pickFocusGoal } from '@/lib-client/life/focus';
import { formatWhen } from '@/lib-client/format';
import { LifePro } from './LifePro';
import { type LifeTab } from './BottomNav';
import { useTranslation } from '@/lib/i18n';
import { card, fmtPi, goldBtn, inputStyle } from './shared';
import { Goals } from './Goals';
import { Skills } from './Skills';
import { Activity, piAmount, prettyType } from './Activity';

// ── Home ─────────────────────────────────────────────────────────────────────
//
// Home used to be four cards reading Goals · Skills · Activity · Preferences —
// the same four destinations the tab bar already carries, in the same order,
// under the same grey rounded rectangle. Tapping a card and tapping its tab did
// the identical thing, so the app's first screen was a second copy of its own
// navigation: four rows that looked alike and told you nothing.
//
// A home screen earns its place by showing STATE, not routes. These numbers
// still lead where the cards led — they are buttons — but they say something on
// the way there, and they are different from each other on sight.


// A progress RING, not another bar.
//
// The home screen had three stacked cards of the same size, and the thing that
// matters most on it — how close you are to the goal you are working on — was
// a 8px bar indistinguishable from every other row. A ring gives that number
// somewhere to live at a scale the eye lands on first, which is the difference
// between a screen that has a hierarchy and one that merely has content.
//
// Painted in CHANNELS (`goldA`/`inkA`), so it follows the theme like everything
// else; `stroke` is set through `style` rather than the attribute so the CSS
// variable resolves at paint time.
export function ProgressRing({ pct, size = 116, width = 9, children }: {
  pct: number; size?: number; width?: number; children?: React.ReactNode;
}) {
  const r    = (size - width) / 2;
  const circ = 2 * Math.PI * r;
  const on   = (Math.min(100, Math.max(0, pct)) / 100) * circ;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={width}
                style={{ stroke: inkA(0.09) }} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={width}
                strokeLinecap="round"
                strokeDasharray={`${on} ${circ - on}`}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{ stroke: C.gold, transition: 'stroke-dasharray .7s cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 1,
      }}>
        {children}
      </div>
    </div>
  );
}


// One live number. Tappable, because a number you can act on is a better link
// than a label that only names a screen.
export function Stat({ value, label, accent, onClick }: {
  value: string; label: string; accent: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={{
      flex: 1, minWidth: 0, background: 'none', border: 'none', padding: '2px 4px',
      cursor: 'pointer', textAlign: 'center', font: 'inherit',
    }}>
      <div style={{ fontSize: 23, fontWeight: 900, color: accent, fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1.1, letterSpacing: '-0.02em' }}>
        {value}
      </div>
      <div style={{ fontSize: 10.5, color: C.faint, marginTop: 3, letterSpacing: 0.2,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </div>
    </button>
  );
}


// The one goal you are closest to finishing, with the only action worth having
// on a home screen: add to it. Everything else about a goal (rename, complete,
// delete) belongs in the Goals tab — a home screen that repeats a full editor
// is the duplication this replaced, wearing a different shape.
export function Focus({ goals, busy, eta, onLog, onGo }: {
  goals: Goal[]; busy: boolean; eta: Map<string, number>;
  onLog: (id: string, delta: number) => void; onGo: (t: LifeTab) => void;
}) {
  const { t } = useTranslation();
  const h = t.life.home;
  const [amt, setAmt] = useState('');

  const goal = pickFocusGoal(goals);

  if (!goal) {
    return (
      <div style={{ ...card, marginTop: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{h.noGoals}</div>
        <p style={{ fontSize: 13, color: C.subtext, margin: '6px 0 14px', lineHeight: 1.5 }}>{h.noGoalsHint}</p>
        <button onClick={() => onGo('goals')} style={goldBtn}>{h.addGoal}</button>
      </div>
    );
  }

  const target = goal.target_amount ?? 0;
  const done   = goal.progress ?? 0;
  const p       = Math.round(goalPercent(goal));
  const etaDays = eta.get(goal.id);
  const log = () => {
    const d = parseFloat(amt);
    if (!Number.isFinite(d) || d <= 0) return;
    setAmt('');
    onLog(goal.id, d);
  };

  return (
    <div style={{
      ...card, marginTop: 14, padding: '20px 20px 18px',
      // The hero, and it is allowed to look like one: a faint amber wash from
      // the ring's corner so the card carries the same light direction as the
      // band above it. One accent, used twice, reads as a system.
      backgroundImage: `radial-gradient(90% 120% at 0% 0%, ${goldA(0.07)}, transparent 62%)`,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.7, textTransform: 'uppercase', color: C.gold }}>
          {h.focus}
        </span>
        {target > 0 && <span style={{ fontSize: 11, color: C.faint }}>{h.focusHint}</span>}
      </div>

      {target > 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <ProgressRing pct={p}>
            <span style={{ fontSize: 26, fontWeight: 900, color: C.text, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}>
              {p}<span style={{ fontSize: 14, fontWeight: 800, color: C.subtext }}>%</span>
            </span>
            <span style={{ fontSize: 10, color: C.faint, fontVariantNumeric: 'tabular-nums' }}>
              π {fmtPi(done)} / {fmtPi(target)}
            </span>
          </ProgressRing>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, lineHeight: 1.3, overflowWrap: 'anywhere' }}>
              {goal.title}
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.gold, marginTop: 8, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
              π {fmtPi(Math.max(0, target - done))}
            </div>
            <div style={{ fontSize: 11.5, color: C.subtext, marginTop: 1 }}>{h.remaining}</div>
            {/* The trajectory, in one clause, only when there is one. The full
                pace panel lives in the Goals tab; here it is the answer to
                "and how long is that?" — never printed on a guess. */}
            {etaDays !== undefined && (
              <div style={{
                display: 'inline-block', marginTop: 10, fontSize: 11, fontWeight: 700,
                color: C.gold, background: goldA(0.1), border: `1px solid ${goldA(0.22)}`,
                borderRadius: 999, padding: '3px 9px',
              }}>
                {etaDays} {t.life.trajectory.days} · {t.life.trajectory.atThisPace}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 16, fontWeight: 800, color: C.text, lineHeight: 1.35, overflowWrap: 'anywhere' }}>
          {goal.title}
        </div>
      )}

      {target > 0 && done >= target ? (
        // Reached. Offering "+ π amount" here would be asking for progress on
        // something already at its target; the useful next move is closing it,
        // and that is the person's call to make (C-106).
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: C.success }}>✓ {t.life.goals.reached}</span>
          <span style={{ flex: 1 }} />
          <button onClick={() => onGo('goals')}
            style={{ background: successA(0.12), color: C.success, border: `1px solid ${successA(0.3)}`,
                     borderRadius: 999, padding: '7px 14px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
            {t.life.goals.markDone}
          </button>
        </div>
      ) : target > 0 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <input
            style={{ ...inputStyle, flex: 1, padding: '10px 12px', fontSize: 13 }}
            value={amt}
            onChange={(e) => setAmt(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') log(); }}
            inputMode="decimal"
            placeholder={t.life.goals.logPlaceholder}
          />
          <button onClick={log} disabled={busy}
            style={{ background: goldA(0.12), color: C.gold, border: `1px solid ${goldA(0.3)}`,
                     borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 800,
                     cursor: 'pointer', opacity: busy ? 0.6 : 1 }}>
            {t.life.goals.log}
          </button>
        </div>
      )}
    </div>
  );
}


// The last three things that happened, not the last twenty-five. The full list
// is one tap away and says so.
export function RecentActivity({ onGo }: { onGo: (t: LifeTab) => void }) {
  const { t, locale } = useTranslation();
  const h = t.life.home;
  const { events, loading } = useActivity(3);
  const dayLabels = { today: t.common.today, yesterday: t.common.yesterday };

  return (
    <div style={{ ...card, marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: events.length ? 4 : 8 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: C.gold }}>
          {h.recent}
        </span>
        <span style={{ flex: 1 }} />
        <button onClick={() => onGo('activity')}
          style={{ background: 'none', border: 'none', color: C.subtext, fontSize: 12, cursor: 'pointer', padding: 0, font: 'inherit' }}>
          {h.seeAll} ›
        </button>
      </div>

      {loading ? (
        <p style={{ fontSize: 13, color: C.subtext, margin: 0 }}>{t.common.loading}</p>
      ) : events.length === 0 ? (
        <p style={{ fontSize: 12.5, color: C.subtext, margin: 0, lineHeight: 1.5 }}>{h.noActivity}</p>
      ) : (
        events.map((ev, i) => {
          const amt = piAmount(ev.payload);
          return (
            <div key={ev.id ?? i}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0',
                       borderTop: i === 0 ? 'none' : `1px solid ${C.border}` }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: C.gold, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {prettyType(ev.type)}
                </div>
                <div style={{ fontSize: 11, color: C.faint }}>{formatWhen(ev.created_at, locale, dayLabels)}</div>
              </div>
              {amt && <div style={{ fontSize: 13, fontWeight: 800, color: C.gold, whiteSpace: 'nowrap' }}>{amt}</div>}
            </div>
          );
        })
      )}
    </div>
  );
}


export function HomeView({ isPro, daysRemaining, onGo }: {
  isPro: boolean; daysRemaining: number | null; onGo: (t: LifeTab) => void;
}) {
  const { t } = useTranslation();
  const { goals, busy, addProgress } = useGoals();
  const { skills } = useSkills();
  // Home shows the ETA of ONE goal, so it reads the same trajectory the Goals
  // tab renders in full rather than computing a second, quietly different one.
  const { trajectory } = useTrajectory();
  const eta = new Map((trajectory?.goals ?? []).map((g) => [g.id, g.eta_days]));

  const active  = goals.filter((g) => g.status === 'ACTIVE').length;
  const tracked = goals.reduce((sum, g) => sum + (g.target_amount ? (g.progress ?? 0) : 0), 0);

  return (
    <>
      {/* On the page ground, not in a card. Three cards of identical size and
          weight is what made the screen read as a stack of boxes; a bare
          numeric strip under the band gives the hero below it somewhere to be
          the hero. π tracked is no longer GREEN — green is a status colour
          here (C-83), and an amount is not a status. */}
      <div style={{ display: 'flex', gap: 4, margin: '16px 2px 2px' }}>
        <Stat value={String(active)}        label={t.life.goals.active}  accent={C.gold} onClick={() => onGo('goals')} />
        <div style={{ width: 1, background: C.border, margin: '4px 0' }} />
        <Stat value={String(skills.length)} label={t.life.home.skills}   accent={C.text} onClick={() => onGo('skills')} />
        <div style={{ width: 1, background: C.border, margin: '4px 0' }} />
        <Stat value={`π ${fmtPi(tracked)}`} label={t.life.goals.tracked} accent={C.text} onClick={() => onGo('goals')} />
      </div>

      <Focus goals={goals} busy={busy} eta={eta} onLog={addProgress} onGo={onGo} />
      <RecentActivity onGo={onGo} />
      <LifePro isPro={isPro} daysRemaining={daysRemaining} />
      <InviteCard />
    </>
  );
}
