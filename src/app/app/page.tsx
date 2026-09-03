'use client';

// TEC Life — System of Record (Personal). C-106.
// The user's personal economic context: self-declared goals + preferences
// (strong consistency) and, later, an activity timeline (eventual).
import { useState } from 'react';
import { InviteCard } from '@/components/referral/InviteCard';
import { usePiAuth } from '@yasser172/tec-auth';
import { C, goldA, inkA } from '@/lib-client/palette';
import {
  useGoals, useActivity, useSubscription, useSkills, useTrajectory, SKILL_LEVELS,
  type Goal, type GoalStatus, type Skill, type SkillLevel,
} from '@/lib-client/life/useLife';
import { pickFocusGoal, goalPercent } from '@/lib-client/life/focus';
import { formatTime, formatDay, formatWhen, groupByDay } from '@/lib-client/format';
import { useMe } from '@/lib-client/hooks/useMe';
import { LifePro } from './components/LifePro';
import { LifeInsights } from './components/LifeInsights';
import { BottomNav, type LifeTab } from './components/BottomNav';
import { SettingsView } from './components/SettingsView';
import { useTranslation } from '@/lib/i18n';

const card = {
  background:   C.surface,
  border:       `1px solid ${C.border}`,
  borderRadius: 16,
  padding:      '20px 22px',
} as const;

const inputStyle = {
  flex: 1, minWidth: 0, background: C.bg, color: C.text,
  border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px', fontSize: 14,
} as const;

const goldBtn = {
  background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
  color: C.onGold, border: 'none', borderRadius: 10, padding: '10px 16px',
  fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
} as const;

const STATUS_COLOR: Record<GoalStatus, string> = {
  ACTIVE:   C.gold,
  DONE:     C.success,
  ARCHIVED: C.subtext,
};

// Pro entitlement (source of truth = the subscription on the session user, activated
// by commerce-service when a Pro payment completes). FREE users get a soft goal cap;
// Pro/Enterprise = unlimited — the concrete benefit behind "unlimited goals".
const FREE_ACTIVE_GOAL_CAP = 3;
const isProPlan = (plan?: string | null) => {
  const p = (plan ?? '').toUpperCase();
  return p === 'PRO' || p === 'ENTERPRISE';
};

// Trim a π amount for display: 100, 42.5, 0.25 — never "100.00".
const fmtPi = (n: number) => {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? String(r) : String(r);
};

// Three-at-a-glance stats derived from the caller's own goals (summary before detail).
function Overview({ goals }: { goals: Goal[] }) {
  const { t } = useTranslation();
  const active = goals.filter((g) => g.status === 'ACTIVE').length;
  const done   = goals.filter((g) => g.status === 'DONE').length;
  const tracked = goals.reduce((sum, g) => sum + (g.target_amount ? (g.progress ?? 0) : 0), 0);

  const stat = (label: string, value: string, accent: string = C.text) => (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontSize: 24, fontWeight: 900, color: accent, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 11, color: C.subtext, marginTop: 2 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ ...card, display: 'flex', gap: 8, marginBottom: 12 }}>
      {stat(t.life.goals.active, String(active), C.gold)}
      <div style={{ width: 1, background: C.border }} />
      {stat(t.life.goals.completed, String(done), C.text)}
      <div style={{ width: 1, background: C.border }} />
      {stat(t.life.goals.tracked, `π ${fmtPi(tracked)}`)}
    </div>
  );
}

// One goal row. If it has a π target, shows a progress bar + a compact "log progress"
// control (the momentum loop). Ownership + clamping/auto-complete are server-side.
function GoalItem({
  goal, first, busy, onToggle, onDelete, onLog,
}: {
  goal: Goal; first: boolean; busy: boolean;
  onToggle: () => void; onDelete: () => void; onLog: (delta: number) => void;
}) {
  const [amt, setAmt] = useState('');
  const hasTarget = typeof goal.target_amount === 'number' && goal.target_amount > 0;
  const pct = hasTarget ? Math.min(100, Math.round(((goal.progress ?? 0) / (goal.target_amount as number)) * 100)) : 0;

  const log = () => {
    const d = parseFloat(amt);
    if (!Number.isFinite(d) || d <= 0) return;
    setAmt('');
    onLog(d);
  };

  return (
    <div style={{ padding: '12px 0', borderTop: first ? 'none' : `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          title={goal.status === 'DONE' ? 'Mark active' : 'Mark done'}
          onClick={onToggle}
          style={{ width: 20, height: 20, borderRadius: 6, cursor: 'pointer', flexShrink: 0,
                   border: `2px solid ${STATUS_COLOR[goal.status]}`,
                   background: goal.status === 'DONE' ? C.success : 'transparent', color: C.onGold, fontSize: 12, lineHeight: '16px' }}>
          {goal.status === 'DONE' ? '✓' : ''}
        </button>
        <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: C.text,
                       textDecoration: goal.status === 'DONE' ? 'line-through' : 'none',
                       opacity: goal.status === 'DONE' ? 0.6 : 1,
                       overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {goal.title}
        </span>
        {hasTarget && (
          <span style={{ fontSize: 12, fontWeight: 700, color: C.gold, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
            π {fmtPi(goal.progress ?? 0)} / {fmtPi(goal.target_amount as number)}
          </span>
        )}
        <button onClick={onDelete} title="Delete"
          style={{ background: 'none', border: 'none', color: C.subtext, cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>×</button>
      </div>

      {hasTarget && (
        <div style={{ marginTop: 8, marginLeft: 30 }}>
          <div style={{ height: 6, borderRadius: 999, background: C.bg, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999,
                          background: `linear-gradient(90deg, ${C.gold}, ${C.goldDark})`, transition: 'width .3s' }} />
          </div>
          {goal.status !== 'DONE' && (
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <input
                style={{ ...inputStyle, flex: '0 0 110px', padding: '7px 10px', fontSize: 13 }}
                value={amt}
                onChange={(e) => setAmt(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') log(); }}
                inputMode="decimal"
                placeholder="+ π amount"
              />
              <button
                onClick={log}
                disabled={busy}
                style={{ background: 'transparent', color: C.gold, border: `1px solid ${goldA(0.333)}`,
                         borderRadius: 10, padding: '7px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}>
                Log
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Goals({ isPro }: { isPro: boolean }) {
  const { t } = useTranslation();
  const { goals, loading, error, busy, addGoal, addProgress, setStatus, removeGoal } = useGoals();
  const [title,  setTitle]  = useState('');
  const [target, setTarget] = useState('');
  const [gate,   setGate]   = useState<string | null>(null);

  const activeCount = goals.filter((g) => g.status === 'ACTIVE').length;
  const atFreeCap   = !isPro && activeCount >= FREE_ACTIVE_GOAL_CAP;

  // No section heading in any tab below: the band already carries the tab's
  // title AND its hint, in these exact words. Printing both twice — once in
  // gold, once in white, ten pixels apart — is what made every screen look
  // like the one before it.

  const submit = async () => {
    const t = title.trim();
    if (!t) return;
    if (atFreeCap) {
      setGate(`Free plan is limited to ${FREE_ACTIVE_GOAL_CAP} active goals. Upgrade to Life Pro for unlimited.`);
      return;
    }
    setGate(null);
    const amt = parseFloat(target);
    setTitle('');
    setTarget('');
    await addGoal(t, Number.isFinite(amt) && amt > 0 ? amt : undefined);
  };

  return (
    <section style={{ marginTop: 4 }}>
      {!loading && goals.length > 0 && <Overview goals={goals} />}

      {/* Life Pro — Goal Insights (deeper own-data analytics; gated behind live Pro) */}
      {!loading && goals.length > 0 && <LifeInsights />}

      <div style={{ ...card }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            style={inputStyle}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            placeholder={t.life.goals.addPlaceholder}
            maxLength={200}
          />
          <input
            style={{ ...inputStyle, flex: '0 0 120px' }}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            inputMode="decimal"
            placeholder={t.life.goals.targetPlaceholder}
          />
          <button style={{ ...goldBtn, opacity: busy ? 0.6 : 1 }} onClick={submit} disabled={busy}>{t.life.goals.add}</button>
        </div>

        {error && <p style={{ color: C.error, fontSize: 13, marginTop: 10 }}>{error}</p>}
        {gate  && <p style={{ color: C.gold,  fontSize: 12, marginTop: 10 }}>🔒 {gate}</p>}
        {!isPro && !gate && activeCount >= FREE_ACTIVE_GOAL_CAP - 1 && activeCount < FREE_ACTIVE_GOAL_CAP && (
          <p style={{ color: C.subtext, fontSize: 11, marginTop: 10 }}>
            Free plan: {activeCount}/{FREE_ACTIVE_GOAL_CAP} active goals. Life Pro = unlimited.
          </p>
        )}

        <div style={{ marginTop: 6 }}>
          {loading ? (
            <p style={{ color: C.subtext, fontSize: 13 }}>Loading…</p>
          ) : goals.length === 0 ? (
            <p style={{ color: C.subtext, fontSize: 13 }}>{t.life.goals.empty}</p>
          ) : (
            goals.map((g, i) => (
              <GoalItem
                key={g.id}
                goal={g}
                first={i === 0}
                busy={busy}
                onToggle={() => setStatus(g.id, g.status === 'DONE' ? 'ACTIVE' : 'DONE')}
                onDelete={() => removeGoal(g.id)}
                onLog={(delta) => addProgress(g.id, delta)}
              />
            ))
          )}
        </div>
      </div>

      {/* Where the person is HEADED, under what they have. It reads the same
          logged steps the list above writes, so it belongs beside them rather
          than on a sixth tab. */}
      {!loading && goals.length > 0 && <Pace />}
    </section>
  );
}

// ── Pace (C-106 §4 — personal trajectory) ────────────────────────────────────
//
// How fast the person is actually moving, and what that reaches. Every figure
// is arithmetic on their own logged steps — no recommendation (that is TEC AI's
// function, C-104) and no claim about π itself.
//
// It refuses more often than it answers, and the refusal is the feature: with
// one entry, or several on a single day, there is no pace, and the panel says
// so instead of dividing by a day and naming a Thursday.
function Pace() {
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

const EVENT_LABEL: Record<string, string> = {
  'payment.completed': 'Payment completed',
  'order.created':     'Order placed',
  'user.created':      'Joined TEC',
  'kyc.verified':      'Identity verified',
};
// ── Skills (C-106 §4) ────────────────────────────────────────────────────────
//
// What a person can DO, as opposed to what they say they want. Goals and
// preferences were already here; this is the first of the three capabilities
// the charter names that had no screen at all.
//
// The level is a LADDER — Learning → Practising → Proficient → Expert — not a
// score out of ten. A number invites a precision nobody has about their own
// ability, and invites comparison with other people, which a private inventory
// is not for. Nobody else can see this list: C-106 §6 gives other users no
// access to Life data.
const SKILL_LEVEL_KEYS = {
  LEARNING: 'learning', PRACTISING: 'practising',
  PROFICIENT: 'proficient', EXPERT: 'expert',
} as const;

function SkillRow({ skill, busy, onLevel, onRemove }: {
  skill: Skill;
  busy: boolean;
  onLevel: (level: SkillLevel) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const s = t.life.skills;
  const inferred = skill.source === 'ACTIVITY_INFERRED';

  return (
    <div style={{ ...card, display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 700, color: C.text, overflowWrap: 'anywhere' }}>
          {skill.name}
        </span>
        {/* An inferred skill is a statement about what someone DID. It is
            marked, and it is not editable — letting the subject rewrite it
            would make the distinction between the two sources worthless. */}
        {inferred && (
          <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: 0.4, color: C.gold,
            border: `1px solid ${goldA(0.35)}`, borderRadius: 999, padding: '2px 8px',
          }}>{s.inferred}</span>
        )}
        {!inferred && (
          <button onClick={onRemove} disabled={busy} aria-label={s.remove}
            style={{ background: 'none', border: 'none', color: C.faint, cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>
            ×
          </button>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {SKILL_LEVELS.map((lvl) => {
          const active = skill.level === lvl;
          return (
            <button key={lvl} disabled={busy || inferred} onClick={() => onLevel(lvl)}
              aria-pressed={active}
              style={{
                fontSize: 11.5, fontWeight: 700, padding: '5px 11px', borderRadius: 999,
                cursor: busy || inferred ? 'default' : 'pointer',
                color: active ? C.onGold : C.subtext,
                background: active ? C.gold : 'transparent',
                border: `1px solid ${active ? 'transparent' : C.border}`,
                opacity: inferred && !active ? 0.5 : 1,
              }}>
              {s.levels[SKILL_LEVEL_KEYS[lvl]]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Skills() {
  const { t } = useTranslation();
  const s = t.life.skills;
  const { skills, loading, error, busy, addSkill, setLevel, removeSkill } = useSkills();
  const [name, setName] = useState('');

  // One character is a real skill: R, C, Go, AI. The old rule demanded two and
  // enforced it by DISABLING the button — so typing "R" and tapping Add did
  // nothing at all, with no message and no cursor change to explain it. A
  // control that refuses in silence is worse than one that refuses out loud;
  // this one now only refuses an EMPTY field, which the placeholder covers.
  const submit = () => {
    const v = name.trim();
    if (!v) return;
    void addSkill(v);
    setName('');
  };

  return (
    <section style={{ marginTop: 4 }}>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder={s.addPlaceholder}
          maxLength={80}
          style={{
            flex: 1, minWidth: 0, background: C.surface, color: C.text,
            border: `1px solid ${C.border}`, borderRadius: 12,
            padding: '11px 13px', fontSize: 14, outline: 'none',
          }}
        />
        <button onClick={submit} disabled={busy || name.trim().length === 0}
          style={{ ...goldBtn, opacity: busy || !name.trim() ? 0.55 : 1 }}>
          {s.add}
        </button>
      </div>

      {error && (
        <p style={{ fontSize: 12.5, color: C.error, margin: '10px 0 0' }}>{error}</p>
      )}

      <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
        {loading && <p style={{ fontSize: 13, color: C.subtext, margin: 0 }}>{t.common.loading}</p>}
        {!loading && skills.length === 0 && (
          <p style={{ fontSize: 13, color: C.subtext, margin: 0, lineHeight: 1.6 }}>{s.empty}</p>
        )}
        {skills.map((sk: Skill) => (
          <SkillRow
            key={sk.id}
            skill={sk}
            busy={busy}
            onLevel={(lvl) => void setLevel(sk.id, lvl)}
            onRemove={() => void removeSkill(sk.id)}
          />
        ))}
      </div>

      {/* The honest note. Nobody else can read this, and nothing infers from it
          yet — saying so is better than letting someone guess either way. */}
      <p style={{ fontSize: 11.5, color: C.faint, margin: '14px 0 0', lineHeight: 1.6 }}>
        {s.privacyNote}
      </p>
    </section>
  );
}

const prettyType = (t: string) => EVENT_LABEL[t] ?? t.replace(/\./g, ' · ');
const piAmount = (payload: Record<string, unknown> | null): string | null => {
  const a = payload?.amount;
  return (typeof a === 'number' || typeof a === 'string') ? `π ${a}` : null;
};

// C-106 §4: the caller's own activity, presented from Analytics (eventual).
// Life never stores or re-derives transaction truth.
function Activity() {
  const { t, locale } = useTranslation();
  const { events, loading, error } = useActivity(25);
  const dayLabels = { today: t.common.today, yesterday: t.common.yesterday };

  // Grouped by day. Nine rows reading "Payment completed · 8/28/2026,
  // 11:02:27 PM" is a wall — the same nine under two date headers is a
  // history, and the reader sees the shape of a week without parsing a single
  // timestamp.
  const days = groupByDay(events, (e) => e.created_at);

  return (
    <section style={{ marginTop: 4 }}>
      {loading ? (
        <div style={{ ...card }}>
          <p style={{ fontSize: 13, color: C.subtext, margin: 0 }}>{t.common.loading}</p>
        </div>
      ) : error || events.length === 0 ? (
        <div style={{ ...card }}>
          <p style={{ fontSize: 13, color: C.subtext, margin: 0, lineHeight: 1.6 }}>{t.life.activity.empty}</p>
        </div>
      ) : (
        <>
          {days.map((day) => (
            <div key={day.key} style={{ marginBottom: 14 }}>
              <div style={{
                fontSize: 11, fontWeight: 800, letterSpacing: 0.7, textTransform: 'uppercase',
                color: C.faint, margin: '0 4px 8px',
              }}>
                {formatDay(day.iso, locale, dayLabels)}
              </div>
              <div style={{ ...card, padding: '6px 18px' }}>
                {day.rows.map((ev, i) => {
                  const amt = piAmount(ev.payload);
                  return (
                    <div key={ev.id ?? i}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                               borderTop: i === 0 ? 'none' : `1px solid ${C.border}` }}>
                      {/* A time column, not a caption under the title: aligned
                          and tabular, so the eye reads DOWN the column instead
                          of hunting for it on each row. */}
                      <span style={{ fontSize: 11.5, color: C.faint, fontVariantNumeric: 'tabular-nums',
                                     minWidth: 52, flexShrink: 0 }}>
                        {formatTime(ev.created_at, locale)}
                      </span>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: C.text,
                                     overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {prettyType(ev.type)}
                      </span>
                      {amt && (
                        <span style={{ fontSize: 14, fontWeight: 800, color: C.gold,
                                       whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                          {amt}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}
    </section>
  );
}

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
function ProgressRing({ pct, size = 116, width = 9, children }: {
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
function Stat({ value, label, accent, onClick }: {
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
function Focus({ goals, busy, eta, onLog, onGo }: {
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

      {target > 0 && (
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
function RecentActivity({ onGo }: { onGo: (t: LifeTab) => void }) {
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

function HomeView({ isPro, daysRemaining, onGo }: {
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

export default function LifeHome() {
  const { user, isLoading } = usePiAuth();
  const me = useMe(); // server-resolved Pi username (Pi Browser hides tec_user from client JS — C-123 §3)
  const { plan, daysRemaining } = useSubscription(); // source of truth = commerce subscription (auth /me does not carry it)
  const piName = me.username ?? user?.piUsername ?? null;
  const name  = piName ? `@${piName}` : '';
  const isPro = isProPlan(plan ?? (user as { subscriptionPlan?: string } | null)?.subscriptionPlan);
  const [tab, setTab] = useState<LifeTab>('home');
  const { t } = useTranslation();

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: 96 }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 22px 0' }}>
        {/* ── The band ───────────────────────────────────────────────────────
            The Hub frames every inner page with a solid band that has rounded
            BOTTOM corners. Life's header was a bare line of text on the same
            flat ground as everything under it, so switching tabs felt like
            nothing had happened. Same shape, same token, same radius as the
            Hub — one frame across the fleet rather than a per-app flourish.

            `tec-on-band` re-scopes the palette for this subtree: the band is
            dark in BOTH themes, so on a light page the ink inside it has to
            stay light. Anything dropped in here is correct without knowing it.

            It bleeds to the edges — the band frames the SCREEN, not the column —
            so it cancels the page gutter and restores it as its own padding.
            The Hub's is `12px 20px 16px`; matching it matters because a curve on
            a taller band reads as a BIGGER curve at the same radius. */}
        <header className="tec-on-band" style={{
          background: 'var(--tec-topbar)',
          // A flat brown rectangle is the part that read as unfinished. One
          // soft amber source in the top corner and a hairline along the
          // bottom edge give the band a light direction — the cheapest thing
          // that separates a designed surface from a filled one. Both are
          // painted in CHANNELS, so they follow the theme.
          backgroundImage:
            `radial-gradient(120% 140% at 8% -30%, ${goldA(0.16)}, transparent 60%)`,
          boxShadow: `inset 0 -1px 0 ${goldA(0.14)}`,
          borderRadius: '0 0 var(--tec-topbar-radius) var(--tec-topbar-radius)',
          margin: '-28px -22px 18px',
          padding: 'calc(12px + env(safe-area-inset-top)) 22px 18px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 10, letterSpacing: 1.2, color: C.subtext, textTransform: 'uppercase', fontWeight: 700 }}>{t.life.brand}</div>
            {isPro && (
              <span style={{
                fontSize: 10, fontWeight: 900, letterSpacing: 0.5, color: C.onGold,
                background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
                borderRadius: 999, padding: '2px 9px',
              }}>★ {t.life.pro}</span>
            )}
          </div>
          {/* 22px — chrome, not a hero. It was 26, which put the page title
              above the section headings under it and made the band taller than
              the Hub's for no gain. */}
          <h1 style={{ fontSize: 22, fontWeight: 900, color: C.gold, margin: '2px 0 0', letterSpacing: '-0.02em' }}>
            <bdi>{tab === 'home'
              ? (isLoading || !name ? t.life.welcome : t.life.welcomeName.replace('{name}', name))
              : tab === 'goals' ? t.life.goals.title
              : tab === 'skills' ? t.life.skills.title
              : tab === 'activity' ? t.life.activity.title
              : t.life.settings.profile}</bdi>
          </h1>
          <p style={{ fontSize: 12.5, color: C.subtext, margin: '3px 0 0', lineHeight: 1.45 }}>
            {tab === 'home' ? t.life.subtitle
              : tab === 'goals' ? t.life.goals.hint
              : tab === 'skills' ? t.life.skills.hint
              : tab === 'activity' ? t.life.activity.hint
              : t.life.prefs.hint}
          </p>
        </header>

        {tab === 'home' && <HomeView isPro={isPro} daysRemaining={daysRemaining} onGo={setTab} />}
        {tab === 'goals'    && <Goals isPro={isPro} />}
        {tab === 'skills'   && <Skills />}
        {tab === 'activity' && <Activity />}
        {tab === 'settings' && <SettingsView isPro={isPro} />}
      </div>

      <BottomNav active={tab} onSelect={setTab} />
    </main>
  );
}
