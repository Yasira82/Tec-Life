'use client';

// TEC Life — System of Record (Personal). C-106.
// The user's personal economic context: self-declared goals + preferences
// (strong consistency) and, later, an activity timeline (eventual).
import { useState } from 'react';
import { InviteCard } from '@/components/referral/InviteCard';
import { usePiAuth } from '@yasser172/tec-auth';
import { TEC_COLORS } from '@yasser172/tec-ui';
import { useGoals, useActivity, useSubscription, type Goal, type GoalStatus } from '@/lib-client/life/useLife';
import { LifePro } from './components/LifePro';
import { LifeInsights } from './components/LifeInsights';
import { BottomNav, type LifeTab } from './components/BottomNav';
import { Icon, type LifeIconName } from './components/Icon';
import { SettingsView } from './components/SettingsView';
import { useTranslation } from '@/lib/i18n';

const card = {
  background:   TEC_COLORS.surface,
  border:       `1px solid ${TEC_COLORS.border}`,
  borderRadius: 16,
  padding:      '20px 22px',
} as const;

const inputStyle = {
  flex: 1, minWidth: 0, background: TEC_COLORS.bg, color: TEC_COLORS.text,
  border: `1px solid ${TEC_COLORS.border}`, borderRadius: 10, padding: '10px 12px', fontSize: 14,
} as const;

const goldBtn = {
  background: `linear-gradient(135deg, ${TEC_COLORS.gold}, ${TEC_COLORS.goldDark})`,
  color: '#0a0800', border: 'none', borderRadius: 10, padding: '10px 16px',
  fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
} as const;

const STATUS_COLOR: Record<GoalStatus, string> = {
  ACTIVE:   TEC_COLORS.gold,
  DONE:     TEC_COLORS.success,
  ARCHIVED: TEC_COLORS.subtext,
};

// Pro entitlement (source of truth = the subscription on the session user, activated
// by commerce-service when a Pro payment completes). FREE users get a soft goal cap;
// Pro/Enterprise = unlimited — the concrete benefit behind "unlimited goals".
const FREE_ACTIVE_GOAL_CAP = 3;
const isProPlan = (plan?: string | null) => {
  const p = (plan ?? '').toUpperCase();
  return p === 'PRO' || p === 'ENTERPRISE';
};

function SectionTitle({ emoji, title, hint }: { emoji: string; title: string; hint?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
      <span style={{ fontSize: 20 }}>{emoji}</span>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: TEC_COLORS.text, margin: 0 }}>{title}</h2>
      {hint && <span style={{ fontSize: 12, color: TEC_COLORS.subtext }}>{hint}</span>}
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

  const stat = (label: string, value: string, accent: string = TEC_COLORS.text) => (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontSize: 24, fontWeight: 900, color: accent, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 11, color: TEC_COLORS.subtext, marginTop: 2 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ ...card, display: 'flex', gap: 8, marginBottom: 12 }}>
      {stat(t.life.goals.active, String(active), TEC_COLORS.gold)}
      <div style={{ width: 1, background: TEC_COLORS.border }} />
      {stat(t.life.goals.completed, String(done), TEC_COLORS.success)}
      <div style={{ width: 1, background: TEC_COLORS.border }} />
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
    <div style={{ padding: '12px 0', borderTop: first ? 'none' : `1px solid ${TEC_COLORS.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          title={goal.status === 'DONE' ? 'Mark active' : 'Mark done'}
          onClick={onToggle}
          style={{ width: 20, height: 20, borderRadius: 6, cursor: 'pointer', flexShrink: 0,
                   border: `2px solid ${STATUS_COLOR[goal.status]}`,
                   background: goal.status === 'DONE' ? TEC_COLORS.success : 'transparent', color: '#0a0800', fontSize: 12, lineHeight: '16px' }}>
          {goal.status === 'DONE' ? '✓' : ''}
        </button>
        <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: TEC_COLORS.text,
                       textDecoration: goal.status === 'DONE' ? 'line-through' : 'none',
                       opacity: goal.status === 'DONE' ? 0.6 : 1,
                       overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {goal.title}
        </span>
        {hasTarget && (
          <span style={{ fontSize: 12, fontWeight: 700, color: TEC_COLORS.gold, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
            π {fmtPi(goal.progress ?? 0)} / {fmtPi(goal.target_amount as number)}
          </span>
        )}
        <button onClick={onDelete} title="Delete"
          style={{ background: 'none', border: 'none', color: TEC_COLORS.subtext, cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>×</button>
      </div>

      {hasTarget && (
        <div style={{ marginTop: 8, marginLeft: 30 }}>
          <div style={{ height: 6, borderRadius: 999, background: TEC_COLORS.bg, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999,
                          background: `linear-gradient(90deg, ${TEC_COLORS.gold}, ${TEC_COLORS.goldDark})`, transition: 'width .3s' }} />
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
                style={{ background: 'transparent', color: TEC_COLORS.gold, border: `1px solid ${TEC_COLORS.gold}55`,
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
      <SectionTitle emoji="🎯" title={t.life.goals.title} hint={t.life.goals.hint} />

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

        {error && <p style={{ color: TEC_COLORS.error, fontSize: 13, marginTop: 10 }}>{error}</p>}
        {gate  && <p style={{ color: TEC_COLORS.gold,  fontSize: 12, marginTop: 10 }}>🔒 {gate}</p>}
        {!isPro && !gate && activeCount >= FREE_ACTIVE_GOAL_CAP - 1 && activeCount < FREE_ACTIVE_GOAL_CAP && (
          <p style={{ color: TEC_COLORS.subtext, fontSize: 11, marginTop: 10 }}>
            Free plan: {activeCount}/{FREE_ACTIVE_GOAL_CAP} active goals. Life Pro = unlimited.
          </p>
        )}

        <div style={{ marginTop: 6 }}>
          {loading ? (
            <p style={{ color: TEC_COLORS.subtext, fontSize: 13 }}>Loading…</p>
          ) : goals.length === 0 ? (
            <p style={{ color: TEC_COLORS.subtext, fontSize: 13 }}>{t.life.goals.empty}</p>
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
      <SectionTitle emoji="📈" title={t.life.activity.title} hint={t.life.activity.hint} />
      <div style={{ ...card }}>
        {loading ? (
          <p style={{ fontSize: 13, color: TEC_COLORS.subtext, margin: 0 }}>Loading…</p>
        ) : error ? (
          <p style={{ fontSize: 13, color: TEC_COLORS.subtext, margin: 0 }}>
            No activity to show yet. It appears here as you use the ecosystem.
          </p>
        ) : events.length === 0 ? (
          <p style={{ fontSize: 13, color: TEC_COLORS.subtext, margin: 0 }}>
            No activity yet. As you pay, trade and create across TEC, it appears here.
          </p>
        ) : (
          <>
            {events.map((ev, i) => {
              const amt = piAmount(ev.payload);
              return (
                <div key={ev.id ?? i}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: i === 0 ? 'none' : `1px solid ${TEC_COLORS.border}` }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: TEC_COLORS.gold, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: TEC_COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prettyType(ev.type)}</div>
                    <div style={{ fontSize: 11, color: TEC_COLORS.subtext }}>{fmtWhen(ev.created_at)}</div>
                  </div>
                  {amt && <div style={{ fontSize: 14, fontWeight: 800, color: TEC_COLORS.gold, whiteSpace: 'nowrap' }}>{amt}</div>}
                </div>
              );
            })}
            <p style={{ fontSize: 11, color: TEC_COLORS.subtext, margin: '12px 0 0', lineHeight: 1.5 }}>
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
  const items: { id: LifeTab; icon: LifeIconName; title: string; hint: string }[] = [
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
            background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.18)',
          }}>
            <Icon name={it.icon} size={20} color={TEC_COLORS.gold} strokeWidth={2} />
          </span>
          <span style={{ flex: 1 }}>
            <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: TEC_COLORS.text }}>{it.title}</span>
            <span style={{ display: 'block', fontSize: 12, color: TEC_COLORS.subtext, marginTop: 2 }}>{it.hint}</span>
          </span>
          <Icon name="chevron-right" size={18} color={TEC_COLORS.subtext} strokeWidth={2} />
        </button>
      ))}
    </div>
  );
}

export default function LifeHome() {
  const { user, isLoading } = usePiAuth();
  const { plan, daysRemaining } = useSubscription(); // source of truth = commerce subscription (auth /me does not carry it)
  const name  = user?.piUsername ? `@${user.piUsername}` : 'there';
  const isPro = isProPlan(plan ?? (user as { subscriptionPlan?: string } | null)?.subscriptionPlan);
  const [tab, setTab] = useState<LifeTab>('home');
  const { t } = useTranslation();

  return (
    <main style={{ minHeight: '100vh', background: TEC_COLORS.bg, color: TEC_COLORS.text, fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: 96 }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 22px 0' }}>
        {/* Compact persistent app header (chrome). Each section renders its own title. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 12, letterSpacing: 1, color: TEC_COLORS.subtext, textTransform: 'uppercase' }}>{t.life.brand}</div>
          {isPro && (
            <span style={{
              fontSize: 10, fontWeight: 900, letterSpacing: 0.5, color: '#0a0800',
              background: `linear-gradient(135deg, ${TEC_COLORS.gold}, ${TEC_COLORS.goldDark})`,
              borderRadius: 999, padding: '2px 9px',
            }}>★ {t.life.pro}</span>
          )}
        </div>

        {tab === 'home' && (
          <>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: TEC_COLORS.gold, margin: '6px 0 0' }}>
              {isLoading ? t.life.welcome : t.life.welcomeName.replace('{name}', name)}
            </h1>
            <p style={{ fontSize: 14, color: TEC_COLORS.subtext, margin: '6px 0 0', lineHeight: 1.6 }}>
              {t.life.subtitle}
            </p>
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
