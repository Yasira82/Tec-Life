'use client';

// TEC Life — System of Record (Personal). C-106.
// The user's personal economic context: self-declared goals + preferences
// (strong consistency) and, later, an activity timeline (eventual).
import { useState } from 'react';
import { InviteCard } from '@/components/referral/InviteCard';
import { usePiAuth } from '@yasser172/tec-auth';
import { C, goldA } from '@/lib-client/palette';
import {
  useGoals, useActivity, useSubscription, useSkills, SKILL_LEVELS,
  type Goal, type GoalStatus, type Skill, type SkillLevel,
} from '@/lib-client/life/useLife';
import { pickFocusGoal, goalPercent } from '@/lib-client/life/focus';
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
      {stat(t.life.goals.completed, String(done), C.success)}
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
    </section>
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

  const submit = () => {
    const v = name.trim();
    if (v.length < 2) return;
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
        <button onClick={submit} disabled={busy || name.trim().length < 2} style={goldBtn}>
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
const fmtWhen = (iso: string) => { try { return new Date(iso).toLocaleString(); } catch { return iso; } };
const piAmount = (payload: Record<string, unknown> | null): string | null => {
  const a = payload?.amount;
  return (typeof a === 'number' || typeof a === 'string') ? `π ${a}` : null;
};

// C-106 §4: the caller's own activity, presented from Analytics (eventual).
// Life never stores or re-derives transaction truth.
function Activity() {
  const { t } = useTranslation();
  const { events, loading, error } = useActivity(25);

  return (
    <section style={{ marginTop: 4 }}>
      <div style={{ ...card }}>
        {loading ? (
          <p style={{ fontSize: 13, color: C.subtext, margin: 0 }}>Loading…</p>
        ) : error ? (
          <p style={{ fontSize: 13, color: C.subtext, margin: 0 }}>
            No activity to show yet. It appears here as you use the ecosystem.
          </p>
        ) : events.length === 0 ? (
          <p style={{ fontSize: 13, color: C.subtext, margin: 0 }}>
            No activity yet. As you pay, trade and create across TEC, it appears here.
          </p>
        ) : (
          <>
            {events.map((ev, i) => {
              const amt = piAmount(ev.payload);
              return (
                <div key={ev.id ?? i}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: i === 0 ? 'none' : `1px solid ${C.border}` }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: C.gold, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prettyType(ev.type)}</div>
                    <div style={{ fontSize: 11, color: C.subtext }}>{fmtWhen(ev.created_at)}</div>
                  </div>
                  {amt && <div style={{ fontSize: 14, fontWeight: 800, color: C.gold, whiteSpace: 'nowrap' }}>{amt}</div>}
                </div>
              );
            })}
            <p style={{ fontSize: 11, color: C.subtext, margin: '12px 0 0', lineHeight: 1.5 }}>
              A summary of your recent activity. Figures update periodically.
            </p>
          </>
        )}
      </div>
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
      <div style={{ fontSize: 26, fontWeight: 900, color: accent, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: C.subtext, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </div>
    </button>
  );
}

// The one goal you are closest to finishing, with the only action worth having
// on a home screen: add to it. Everything else about a goal (rename, complete,
// delete) belongs in the Goals tab — a home screen that repeats a full editor
// is the duplication this replaced, wearing a different shape.
function Focus({ goals, busy, onLog, onGo }: {
  goals: Goal[]; busy: boolean; onLog: (id: string, delta: number) => void; onGo: (t: LifeTab) => void;
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
  const p      = Math.round(goalPercent(goal));
  const log = () => {
    const d = parseFloat(amt);
    if (!Number.isFinite(d) || d <= 0) return;
    setAmt('');
    onLog(goal.id, d);
  };

  return (
    <div style={{ ...card, marginTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: C.gold }}>
          {h.focus}
        </span>
        {target > 0 && <span style={{ fontSize: 11, color: C.faint }}>{h.focusHint}</span>}
      </div>

      <div style={{ fontSize: 17, fontWeight: 800, color: C.text, lineHeight: 1.35, overflowWrap: 'anywhere' }}>
        {goal.title}
      </div>

      {target > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '12px 0 6px' }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: C.gold, fontVariantNumeric: 'tabular-nums' }}>{p}%</span>
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: C.subtext, fontVariantNumeric: 'tabular-nums' }}>
              π {fmtPi(done)} / {fmtPi(target)}
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: C.bg, overflow: 'hidden' }}>
            <div style={{ width: `${p}%`, height: '100%', borderRadius: 999,
                          background: `linear-gradient(90deg, ${C.gold}, ${C.goldDark})`, transition: 'width .3s' }} />
          </div>
          <div style={{ fontSize: 11.5, color: C.faint, marginTop: 6 }}>
            π {fmtPi(Math.max(0, target - done))} {h.remaining}
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            <input
              style={{ ...inputStyle, flex: '0 0 120px', padding: '9px 11px', fontSize: 13 }}
              value={amt}
              onChange={(e) => setAmt(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') log(); }}
              inputMode="decimal"
              placeholder={t.life.goals.logPlaceholder}
            />
            <button onClick={log} disabled={busy}
              style={{ background: 'transparent', color: C.gold, border: `1px solid ${goldA(0.333)}`,
                       borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 700,
                       cursor: 'pointer', opacity: busy ? 0.6 : 1 }}>
              {t.life.goals.log}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// The last three things that happened, not the last twenty-five. The full list
// is one tap away and says so.
function RecentActivity({ onGo }: { onGo: (t: LifeTab) => void }) {
  const { t } = useTranslation();
  const h = t.life.home;
  const { events, loading } = useActivity(3);

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
                <div style={{ fontSize: 11, color: C.faint }}>{fmtWhen(ev.created_at)}</div>
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

  const active  = goals.filter((g) => g.status === 'ACTIVE').length;
  const tracked = goals.reduce((sum, g) => sum + (g.target_amount ? (g.progress ?? 0) : 0), 0);

  return (
    <>
      <div style={{ ...card, display: 'flex', gap: 4, marginTop: 18, padding: '16px 12px' }}>
        <Stat value={String(active)}          label={t.life.goals.active}   accent={C.gold}    onClick={() => onGo('goals')} />
        <div style={{ width: 1, background: C.border }} />
        <Stat value={String(skills.length)}   label={t.life.home.skills}    accent={C.text}    onClick={() => onGo('skills')} />
        <div style={{ width: 1, background: C.border }} />
        <Stat value={`π ${fmtPi(tracked)}`}   label={t.life.goals.tracked}  accent={C.success} onClick={() => onGo('goals')} />
      </div>

      <Focus goals={goals} busy={busy} onLog={addProgress} onGo={onGo} />
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
          borderRadius: '0 0 var(--tec-topbar-radius) var(--tec-topbar-radius)',
          margin: '-28px -22px 18px',
          padding: 'calc(12px + env(safe-area-inset-top)) 22px 16px',
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
