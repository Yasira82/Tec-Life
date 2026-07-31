'use client';

// TEC Life — System of Record (Personal). C-106.
// The user's personal economic context: self-declared goals + preferences
// (strong consistency) and, later, an activity timeline (eventual).
import { useState } from 'react';
import { InviteCard } from '@/components/referral/InviteCard';
import { usePiAuth } from '@yasser172/tec-auth';
import { TEC_COLORS } from '@yasser172/tec-ui';
import { useGoals, usePreferences, useActivity, type GoalStatus } from '@/lib-client/life/useLife';
import { LifePro } from './components/LifePro';

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

function SectionTitle({ emoji, title, hint }: { emoji: string; title: string; hint?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
      <span style={{ fontSize: 20 }}>{emoji}</span>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: TEC_COLORS.text, margin: 0 }}>{title}</h2>
      {hint && <span style={{ fontSize: 12, color: TEC_COLORS.subtext }}>{hint}</span>}
    </div>
  );
}

function Goals() {
  const { goals, loading, error, busy, addGoal, setStatus, removeGoal } = useGoals();
  const [title, setTitle] = useState('');

  const submit = async () => {
    const t = title.trim();
    if (!t) return;
    setTitle('');
    await addGoal(t);
  };

  return (
    <section style={{ marginTop: 24 }}>
      <SectionTitle emoji="🎯" title="Goals" hint="what you’re working toward" />

      <div style={{ ...card }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={inputStyle}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            placeholder="Add a goal — e.g. Save 100π this month"
            maxLength={200}
          />
          <button style={{ ...goldBtn, opacity: busy ? 0.6 : 1 }} onClick={submit} disabled={busy}>Add</button>
        </div>

        {error && <p style={{ color: TEC_COLORS.error, fontSize: 13, marginTop: 10 }}>{error}</p>}

        <div style={{ marginTop: 14 }}>
          {loading ? (
            <p style={{ color: TEC_COLORS.subtext, fontSize: 13 }}>Loading…</p>
          ) : goals.length === 0 ? (
            <p style={{ color: TEC_COLORS.subtext, fontSize: 13 }}>No goals yet. Add your first above.</p>
          ) : (
            goals.map((g, i) => (
              <div key={g.id}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: i === 0 ? 'none' : `1px solid ${TEC_COLORS.border}` }}>
                <button
                  title={g.status === 'DONE' ? 'Mark active' : 'Mark done'}
                  onClick={() => setStatus(g.id, g.status === 'DONE' ? 'ACTIVE' : 'DONE')}
                  style={{ width: 20, height: 20, borderRadius: 6, cursor: 'pointer', flexShrink: 0,
                           border: `2px solid ${STATUS_COLOR[g.status]}`,
                           background: g.status === 'DONE' ? TEC_COLORS.success : 'transparent', color: '#0a0800', fontSize: 12, lineHeight: '16px' }}>
                  {g.status === 'DONE' ? '✓' : ''}
                </button>
                <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: TEC_COLORS.text,
                               textDecoration: g.status === 'DONE' ? 'line-through' : 'none',
                               opacity: g.status === 'DONE' ? 0.6 : 1,
                               overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {g.title}
                </span>
                <button onClick={() => removeGoal(g.id)} title="Delete"
                  style={{ background: 'none', border: 'none', color: TEC_COLORS.subtext, cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>×</button>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

const FOCUS_OPTIONS = ['Saving', 'Earning', 'Learning', 'Building', 'Trading'];
const LANG_OPTIONS  = [['en', 'English'], ['ar', 'العربية']] as const;

function Preferences() {
  const { prefs, loading, saving, error, save } = usePreferences();

  const selectStyle = {
    background: TEC_COLORS.bg, color: TEC_COLORS.text, border: `1px solid ${TEC_COLORS.border}`,
    borderRadius: 10, padding: '9px 12px', fontSize: 14, minWidth: 160,
  } as const;

  return (
    <section style={{ marginTop: 24 }}>
      <SectionTitle emoji="⚙️" title="Preferences" hint="how TEC tailors your experience" />
      <div style={{ ...card, display: 'grid', gap: 14 }}>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontSize: 14, color: TEC_COLORS.text }}>Primary focus</span>
          <select style={selectStyle} value={prefs.focus ?? ''} disabled={loading || saving}
            onChange={(e) => save({ focus: e.target.value })}>
            <option value="">Not set</option>
            {FOCUS_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontSize: 14, color: TEC_COLORS.text }}>Language</span>
          <select style={selectStyle} value={prefs.language ?? 'en'} disabled={loading || saving}
            onChange={(e) => save({ language: e.target.value })}>
            {LANG_OPTIONS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
          </select>
        </label>

        {error && <p style={{ color: TEC_COLORS.error, fontSize: 13, margin: 0 }}>{error}</p>}
        {saving && <p style={{ color: TEC_COLORS.subtext, fontSize: 12, margin: 0 }}>Saving…</p>}
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
  const { events, loading, error } = useActivity(25);

  return (
    <section style={{ marginTop: 24 }}>
      <SectionTitle emoji="📈" title="Activity" hint="your recent economic activity" />
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
              Presented from Analytics (eventual consistency). Life never re-derives
              transaction truth — the owning services are the source.
            </p>
          </>
        )}
      </div>
    </section>
  );
}

export default function LifeHome() {
  const { user, isLoading } = usePiAuth();
  const name = user?.piUsername ? `@${user.piUsername}` : 'there';

  return (
    <main style={{ minHeight: '100vh', background: TEC_COLORS.bg, color: TEC_COLORS.text, padding: '32px 22px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <header>
          <div style={{ fontSize: 12, letterSpacing: 1, color: TEC_COLORS.subtext, textTransform: 'uppercase' }}>TEC Life · System of Record</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: TEC_COLORS.gold, margin: '6px 0 0' }}>
            {isLoading ? 'Welcome' : `Welcome, ${name}`}
          </h1>
          <p style={{ fontSize: 14, color: TEC_COLORS.subtext, margin: '6px 0 0', lineHeight: 1.6 }}>
            Your personal context in the TEC ecosystem. Your data is yours (C-106) —
            self-declared, private, and never used without your consent.
          </p>
        </header>

        <LifePro />
        <Goals />
        <Preferences />
        <Activity />
        <InviteCard />
      </div>
    </main>
  );
}
