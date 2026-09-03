'use client';

// TEC Life — System of Record (Personal). C-106.
// The user's personal economic context: self-declared goals + preferences
// (strong consistency) and, later, an activity timeline (eventual).
import { useState } from 'react';
import { InviteCard } from '@/components/referral/InviteCard';
import { usePiAuth } from '@yasser172/tec-auth';
import {Icon, type IconName} from '@yasser172/tec-ui';
import { C, goldA } from '@/lib-client/palette';
import { useGoals, useActivity, useSubscription, type Goal, type GoalStatus } from '@/lib-client/life/useLife';
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

// Takes a glyph NAME, not a character. The emoji it used to take rendered as a
// glossy 3D object on one phone and flat grey line art on the next — see
// @yasser172/tec-ui 2.3.0.
function SectionTitle({ icon, title, hint }: { icon: IconName; title: string; hint?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <Icon name={icon} size={20} color={C.gold} strokeWidth={1.9} />
      <h2 style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: 0 }}>{title}</h2>
      {hint && <span style={{ fontSize: 12, color: C.subtext }}>{hint}</span>}
    </div>
  );
}

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
    <section style={{ marginTop: 24 }}>
      <SectionTitle icon="target" title={t.life.goals.title} hint={t.life.goals.hint} />

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
    <section style={{ marginTop: 24 }}>
      <SectionTitle icon="trending" title={t.life.activity.title} hint={t.life.activity.hint} />
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

// Home tab — quick-launch cards into each section, so the shell feels navigable.
function HomeQuickNav({ onGo }: { onGo: (t: LifeTab) => void }) {
  const { t } = useTranslation();
  const items: { id: LifeTab; icon: IconName; title: string; hint: string }[] = [
    { id: 'goals',    icon: 'trophy',   title: t.life.cards.goals.title,    hint: t.life.cards.goals.hint },
    { id: 'activity', icon: 'chart',    title: t.life.cards.activity.title, hint: t.life.cards.activity.hint },
    { id: 'settings', icon: 'settings', title: t.life.cards.prefs.title,    hint: t.life.cards.prefs.hint },
  ];
  return (
    <div style={{ display: 'grid', gap: 10, marginTop: 20 }}>
      {items.map((it) => (
        <button key={it.id} onClick={() => onGo(it.id)}
          style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', cursor: 'pointer', width: '100%' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: goldA(0.1), border: `1px solid ${goldA(0.18)}`,
          }}>
            <Icon name={it.icon} size={20} color={C.gold} strokeWidth={2} />
          </span>
          <span style={{ flex: 1 }}>
            <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: C.text }}>{it.title}</span>
            <span style={{ display: 'block', fontSize: 12, color: C.subtext, marginTop: 2 }}>{it.hint}</span>
          </span>
          <Icon name="chevron-right" size={18} color={C.subtext} strokeWidth={2} />
        </button>
      ))}
    </div>
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
              : tab === 'activity' ? t.life.activity.title
              : t.life.settings.profile}</bdi>
          </h1>
          <p style={{ fontSize: 12.5, color: C.subtext, margin: '3px 0 0', lineHeight: 1.45 }}>
            {tab === 'home' ? t.life.subtitle
              : tab === 'goals' ? t.life.goals.hint
              : tab === 'activity' ? t.life.activity.hint
              : t.life.prefs.hint}
          </p>
        </header>

        {tab === 'home' && (
          <>
            <LifePro isPro={isPro} daysRemaining={daysRemaining} />
            <HomeQuickNav onGo={setTab} />
            <InviteCard />
          </>
        )}
        {tab === 'goals'    && <Goals isPro={isPro} />}
        {tab === 'activity' && <Activity />}
        {tab === 'settings' && <SettingsView isPro={isPro} />}
      </div>

      <BottomNav active={tab} onSelect={setTab} />
    </main>
  );
}
