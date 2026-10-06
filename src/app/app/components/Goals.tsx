'use client';

import { useState } from 'react';

// The Hub's assistant (C-104 V1) prefills its composer from `?q=` — Life asks on the
// goal's behalf and never grows an AI surface of its own (C-104 §5.6: a third surface
// drifts). The question travels in the URL; the answer uses whatever Life context the
// person has CONSENTED to share (C-106 §5), read by the Hub through Life's gated door.
const HUB_URL = process.env.NEXT_PUBLIC_HUB_URL ?? 'https://hub.tecosystem.app';
const askAiHref = (question: string) => `${HUB_URL}/ai?q=${encodeURIComponent(question)}`;
import { C, goldA, successA } from '@/lib-client/palette';
import { type Goal, useGoals } from '@/lib-client/life/useLife';
import { LifeInsights } from './LifeInsights';
import { useTranslation } from '@/lib/i18n';
import { FREE_ACTIVE_GOAL_CAP, STATUS_COLOR, card, fmtPi, goldBtn, inputStyle } from './shared';
import { Overview } from './Overview';
import { Pace } from './Pace';
import { type GoalPrefill } from '@/lib/life/prefill';

// One goal row. If it has a π target, shows a progress bar + a compact "log progress"
// control (the momentum loop). Ownership + clamping/auto-complete are server-side.
export function GoalItem({
  goal, first, busy, onToggle, onDelete, onLog,
}: {
  goal: Goal; first: boolean; busy: boolean;
  onToggle: () => void; onDelete: () => void; onLog: (delta: number) => void;
}) {
  const { t } = useTranslation();
  const [amt, setAmt] = useState('');
  const hasTarget = typeof goal.target_amount === 'number' && goal.target_amount > 0;
  const pct = hasTarget ? Math.min(100, Math.round(((goal.progress ?? 0) / (goal.target_amount as number)) * 100)) : 0;
  // The server no longer closes a goal on its own (C-106: goals are the user's
  // to control). A goal sitting AT its target is REACHED — the screen says so
  // and offers the tap; the status changes when they take it.
  const reached = hasTarget && goal.status === 'ACTIVE' && (goal.progress ?? 0) >= (goal.target_amount as number);

  const log = () => {
    const d = parseFloat(amt);
    if (!Number.isFinite(d) || d <= 0) return;
    setAmt('');
    onLog(d);
  };
  const askAi = askAiHref(t.life.goals.askAiQuestion.replace('{title}', goal.title));

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
        {goal.status === 'ACTIVE' && (
          <a href={askAi} target="_blank" rel="noopener noreferrer" data-testid={`ask-ai-${goal.id}`}
            style={{ fontSize: 12, fontWeight: 700, color: C.gold, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            {t.life.goals.askAi} →
          </a>
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
          {reached ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.success }}>✓ {t.life.goals.reached}</span>
              <button onClick={onToggle}
                style={{ background: successA(0.12), color: C.success, border: `1px solid ${successA(0.3)}`,
                         borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                {t.life.goals.markDone}
              </button>
            </div>
          ) : goal.status !== 'DONE' && (
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


export function Goals({ isPro, prefill }: { isPro: boolean; prefill?: GoalPrefill | null }) {
  const { t } = useTranslation();
  const { goals, loading, error, busy, addGoal, addProgress, setStatus, removeGoal } = useGoals();
  // A3 (C-104 §10.1): a goal TEC AI proposed arrives as text in the form, and
  // nothing is saved until the person taps Add — the same submit as a typed goal.
  const [title,  setTitle]  = useState(prefill?.title ?? '');
  const [target, setTarget] = useState(prefill?.target ?? '');
  const [suggested, setSuggested] = useState(Boolean(prefill));
  const [gate,   setGate]   = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);

  const open = goals.filter((g) => g.status !== 'DONE');
  const done = goals.filter((g) => g.status === 'DONE');

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
    setSuggested(false);
    await addGoal(t, Number.isFinite(amt) && amt > 0 ? amt : undefined);
  };

  return (
    <section style={{ marginTop: 4 }}>
      {/* A bare strip on the page ground, like Home. The Goals tab opened with
          the SAME grey card the Home tab opens with, holding the same three
          numbers — so the two screens were indistinguishable at a glance. */}
      {!loading && goals.length > 0 && <Overview goals={goals} />}

      {/* The composer is not in a card either: it is an input, and wrapping it
          in a panel made it look like content rather than a control. */}
      {suggested && (
        <p data-testid="goal-prefill-note" style={{ color: C.gold, fontSize: 12, margin: '14px 2px 0', lineHeight: 1.5 }}>
          {t.life.goals.prefill}
        </p>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: suggested ? 8 : 14 }}>
        <input
          style={{ ...inputStyle, background: C.surface, borderRadius: 12, padding: '11px 13px' }}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder={t.life.goals.addPlaceholder}
          maxLength={200}
        />
        <input
          style={{ ...inputStyle, background: C.surface, borderRadius: 12, padding: '11px 13px', flex: '0 0 120px' }}
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          inputMode="decimal"
          placeholder={t.life.goals.targetPlaceholder}
        />
        <button style={{ ...goldBtn, borderRadius: 12, padding: '11px 18px', opacity: busy || !title.trim() ? 0.55 : 1 }}
          onClick={submit} disabled={busy || !title.trim()}>{t.life.goals.add}</button>
      </div>

      {error && <p style={{ color: C.error, fontSize: 13, margin: '10px 2px 0' }}>{error}</p>}
      {gate  && <p style={{ color: C.gold,  fontSize: 12, margin: '10px 2px 0' }}>🔒 {gate}</p>}
      {!isPro && !gate && activeCount >= FREE_ACTIVE_GOAL_CAP - 1 && activeCount < FREE_ACTIVE_GOAL_CAP && (
        <p style={{ color: C.faint, fontSize: 11, margin: '10px 2px 0' }}>
          Free plan: {activeCount}/{FREE_ACTIVE_GOAL_CAP} active goals. Life Pro = unlimited.
        </p>
      )}

      {loading ? (
        <p style={{ color: C.subtext, fontSize: 13, margin: '16px 2px' }}>{t.common.loading}</p>
      ) : goals.length === 0 ? (
        <p style={{ color: C.subtext, fontSize: 13, margin: '16px 2px', lineHeight: 1.6 }}>{t.life.goals.empty}</p>
      ) : (
        <>
          {/* OPEN goals only. The list used to run active and completed
              together, so three finished goals pushed the one being worked on
              off the screen — a to-do list showing mostly done. */}
          {open.length > 0 && (
            <div style={{ ...card, marginTop: 14, padding: '6px 20px' }}>
              {open.map((g, i) => (
                <GoalItem
                  key={g.id} goal={g} first={i === 0} busy={busy}
                  onToggle={() => setStatus(g.id, 'DONE')}
                  onDelete={() => removeGoal(g.id)}
                  onLog={(delta) => addProgress(g.id, delta)}
                />
              ))}
            </div>
          )}

          {/* Finished ones are kept — deleting them would lose the record — but
              folded away behind their own count. They are history, and history
              belongs under the thing it is history OF. */}
          {done.length > 0 && (
            <div style={{ marginTop: 14 }}>
              {/* The chevron is the only thing saying whether this section is
                  open, and a screen reader never sees a glyph. `aria-expanded`
                  is the same information in the form assistive tech reads. */}
              <button onClick={() => setShowDone((v) => !v)} aria-expanded={showDone}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                         background: 'none', border: 'none', padding: '4px 2px', cursor: 'pointer',
                         font: 'inherit', color: C.faint, textAlign: 'start' }}>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.7, textTransform: 'uppercase' }}>
                  {t.life.goals.completed}
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: C.subtext }}>{done.length}</span>
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 13 }}>{showDone ? '⌃' : '⌄'}</span>
              </button>
              {showDone && (
                <div style={{ ...card, marginTop: 8, padding: '6px 20px' }}>
                  {done.map((g, i) => (
                    <GoalItem
                      key={g.id} goal={g} first={i === 0} busy={busy}
                      onToggle={() => setStatus(g.id, 'ACTIVE')}
                      onDelete={() => removeGoal(g.id)}
                      onLog={(delta) => addProgress(g.id, delta)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!loading && goals.length > 0 && <Pace />}

      {/* Life Pro — Goal Insights. BELOW the goals, not above them: a locked
          promo sitting between the summary and the list put the paid teaser
          ahead of the user's own content on their own screen. */}
      {!loading && goals.length > 0 && <LifeInsights />}
    </section>
  );
}
