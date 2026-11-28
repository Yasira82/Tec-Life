'use client';

// The redesign's My goals (Phase 1, approved mockup «أهدافي», owner 2026-11-28).
//
//   vision and areas  — the existing «مستقبلي» editor, unchanged
//   the priority      — the goal closest to done (Today's choice), large: its progress, logging π,
//                       its steps ticked in place
//   the others        — one line each, filterable by area; a tap opens the sheet
//   finished goals    — folded under their count
//   then Pace and the Pro insights, as today
//
// Adding and editing happen in GoalSheet. The free plan's cap, the coach's proposed goal (prefill)
// and the existing routes all behave exactly as on the current Goals screen.
import { useEffect, useState, type CSSProperties } from 'react';
import { C } from '@/lib-client/palette';
import { useTranslation } from '@/lib/i18n';
import { useGoals, type Goal } from '@/lib-client/life/useLife';
import { readFuture, type Future as FutureData } from '@/lib-client/life/future';
import { futureCopy, type LifeArea } from '@/lib/life/future-copy';
import { goalsCopy } from '@/lib/life/goals-copy';
import { todayCopy, fill } from '@/lib/life/today-copy';
import { createBody, draftOf, emptyDraft, patchBody, shareOf, splitGoals, type GoalDraft } from '@/lib/life/goals-edit';
import { parseSteps, toggleStep } from '@/lib/life/steps';
import { type GoalPrefill } from '@/lib/life/prefill';
import { sessionCopy } from '@/lib/life/session-copy';
import { uiCopy } from '@/lib/life/ui-copy';
import { countSession } from '@/lib-client/life/sessionCounter';
import { FREE_ACTIVE_GOAL_CAP, fmtPi } from '../../components/shared';
import { Future } from '../../components/Future';
import { Pace } from '../../components/Pace';
import { LifeInsights } from '../../components/LifeInsights';
import { GoalSheet } from './GoalSheet';

const card: CSSProperties = {
  background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: 16,
  display: 'flex', flexDirection: 'column', gap: 10,
};
const quiet: CSSProperties = {
  minHeight: 44, borderRadius: 12, border: `1px solid ${C.border}`, background: 'transparent',
  color: C.text, fontSize: 14, cursor: 'pointer', padding: '0 14px',
};

type Sheet = { mode: 'new'; draft: GoalDraft; note: string | null } | { mode: 'edit'; goal: Goal };

export function GoalsView({ isPro, prefill, onPrefillUsed }: { isPro: boolean; prefill?: GoalPrefill | null; onPrefillUsed?: () => void }) {
  const { t, locale } = useTranslation();
  const g = goalsCopy(locale);
  const td = todayCopy(locale);
  const fc = futureCopy(locale);
  const { goals, loading, error, busy, reload, addGoal, addProgress, setStatus, setDescription, updateGoal, removeGoal } = useGoals();
  const [future, setFuture] = useState<FutureData | null>(null);
  useEffect(() => { void readFuture().then(setFuture); }, []);
  const chosenAreas = future?.areas.map((a) => a.area) ?? [];
  const [area, setArea] = useState<LifeArea | 'ALL'>('ALL');
  const [showDone, setShowDone] = useState(false);
  const [gate, setGate] = useState<string | null>(null);
  const [log, setLog] = useState('');

  const activeCount = goals.filter((x) => x.status === 'ACTIVE').length;
  const atFreeCap = !isPro && activeCount >= FREE_ACTIVE_GOAL_CAP;

  // A goal the coach proposed opens the sheet filled in; nothing is saved until Save.
  const [sheet, setSheet] = useState<Sheet | null>(() => prefill
    ? { mode: 'new', draft: emptyDraft(prefill), note: prefill.from === 'journey' ? sessionCopy(locale).jGoalNote : t.life.goals.prefill }
    : null);

  const openNew = () => {
    if (atFreeCap) { setGate(t.life.goals.freeCap.replace('{n}', String(FREE_ACTIVE_GOAL_CAP))); return; }
    setGate(null);
    setSheet({ mode: 'new', draft: emptyDraft(), note: null });
  };
  const close = () => { if (sheet?.mode === 'new' && prefill) onPrefillUsed?.(); setSheet(null); };

  const save = async (d: GoalDraft) => {
    if (!sheet) return null;
    if (sheet.mode === 'new') {
      if (atFreeCap) return 'cap' as const;
      const b = createBody(d);
      if (!b.ok) return b.problem;
      const ok = await addGoal(b.title, b.target, b.description, b.area);
      if (!ok) return 'failed' as const;
      if (prefill) { if (prefill.from === 'journey') countSession('g_from_step'); onPrefillUsed?.(); }
    } else {
      const b = patchBody(sheet.goal, d);
      if (!b.ok) return b.problem;
      if (Object.keys(b.patch).length && !(await updateGoal(sheet.goal.id, b.patch))) return 'failed' as const;
    }
    setSheet(null);
    return null;
  };
  const after = (p: Promise<boolean>) => p.then((ok) => { if (ok) setSheet(null); return ok; });

  const { priority, others, done, areas } = splitGoals(goals, area);
  const logPi = async () => {
    const n = Number(log.replace(',', '.'));
    if (!priority || !Number.isFinite(n) || n <= 0) return;
    if (await addProgress(priority.id, n)) setLog('');
  };

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {future && <div data-reused="future"><Future future={future} onChange={setFuture} /></div>}

      {loading && goals.length === 0 ? (
        <div aria-busy="true" style={{ ...card, height: 180, opacity: 0.6 }} />
      ) : error && goals.length === 0 ? (
        <div role="alert" style={card}>
          <p style={{ margin: 0, fontSize: 14, color: C.text }}>{td.failed}</p>
          <button type="button" onClick={reload} style={{ ...quiet, alignSelf: 'flex-start' }}>{td.retry}</button>
        </div>
      ) : priority ? (
        <div data-testid="goal-priority" style={{ ...card, borderColor: C.gold }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.subtext }}>{g.priority}</span>
            {priority.area && <span style={{ fontSize: 12, fontWeight: 700, color: C.identityInk }}>{fc.area[priority.area]}</span>}
          </div>
          <div translate="no" style={{ fontSize: 19, fontWeight: 800, color: C.text, lineHeight: 1.4 }}><bdi>{priority.title}</bdi></div>
          <Bar share={shareOf(priority)} />
          {priority.target_amount && priority.target_amount > 0 ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13.5, color: C.subtext, flex: 1, minWidth: 120 }}>
                {fill(td.ofTarget, { p: fmtPi(priority.progress), t: fmtPi(priority.target_amount) })}
              </span>
              <input aria-label={t.life.goals.logPlaceholder} placeholder={t.life.goals.logPlaceholder} inputMode="decimal" value={log}
                onChange={(e) => setLog(e.target.value)} style={{ width: 110, minHeight: 44, fontSize: 16, background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 12, padding: '0 10px' }} />
              <button type="button" disabled={busy || !log.trim()} onClick={() => void logPi()} style={{ ...quiet, borderColor: C.gold, color: C.gold }}>{t.life.goals.log}</button>
            </div>
          ) : null}
          {parseSteps(priority.description).length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {parseSteps(priority.description).map((s, i) => (
                <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 44, cursor: 'pointer' }}>
                  <input type="checkbox" checked={s.done} disabled={busy}
                    onChange={() => void setDescription(priority.id, toggleStep(priority.description, i))}
                    style={{ width: 22, height: 22, accentColor: C.gold, flex: 'none' }} />
                  <span translate="no" style={{ fontSize: 15, color: s.done ? C.subtext : C.text, textDecoration: s.done ? 'line-through' : 'none' }}><bdi>{s.text}</bdi></span>
                </label>
              ))}
            </div>
          )}
          <button type="button" onClick={() => setSheet({ mode: 'edit', goal: priority })} style={{ ...quiet, alignSelf: 'flex-start' }}>{g.edit}</button>
        </div>
      ) : (
        <div style={card}>
          <p style={{ margin: 0, fontSize: 14, color: C.subtext }}>{td.noGoals}</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text }}>{g.others}</h2>
          <button type="button" onClick={openNew} data-testid="goal-new"
            style={{ ...quiet, background: C.gold, color: C.onGold, border: 'none', fontWeight: 800 }}>+ {t.life.goals.add}</button>
        </div>
        {gate && <p role="status" style={{ margin: 0, fontSize: 13, color: C.gold }}>🔒 {gate}</p>}
        {!isPro && !gate && activeCount === FREE_ACTIVE_GOAL_CAP - 1 && (
          <p style={{ margin: 0, fontSize: 12, color: C.faint }}>{uiCopy(locale).freeNear(activeCount, FREE_ACTIVE_GOAL_CAP)}</p>
        )}
        {areas.length > 0 && (
          <div role="group" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(['ALL', ...areas] as const).map((a) => (
              <button key={a} type="button" aria-pressed={area === a} onClick={() => setArea(a)} style={{
                ...quiet, borderRadius: 999, fontSize: 13.5,
                borderColor: area === a ? C.gold : C.border, color: area === a ? C.text : C.subtext,
              }}>{a === 'ALL' ? g.all : fc.area[a]}</button>
            ))}
          </div>
        )}
        {others.length > 0 ? (
          <div style={{ ...card, padding: '2px 14px', gap: 0 }}>
            {others.map((x, i) => <Row key={x.id} goal={x} first={i === 0} onOpen={() => setSheet({ mode: 'edit', goal: x })} />)}
          </div>
        ) : area !== 'ALL' ? <p style={{ margin: 0, fontSize: 13.5, color: C.subtext }}>{g.noneInArea}</p> : null}
      </div>

      {done.length > 0 && (
        <div>
          <button type="button" onClick={() => setShowDone((v) => !v)} aria-expanded={showDone}
            style={{ ...quiet, border: 'none', padding: 0, color: C.subtext, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontWeight: 700 }}>{t.life.goals.completed}</span><span>{done.length}</span><span aria-hidden="true">{showDone ? '⌃' : '⌄'}</span>
          </button>
          {showDone && (
            <div style={{ ...card, padding: '2px 14px', gap: 0 }}>
              {done.map((x, i) => <Row key={x.id} goal={x} first={i === 0} onOpen={() => setSheet({ mode: 'edit', goal: x })} />)}
            </div>
          )}
        </div>
      )}

      {/* An action on the screen itself (a step ticked, π logged) that the server refused. */}
      {error && goals.length > 0 && !sheet && <p role="alert" style={{ margin: 0, fontSize: 13.5, color: C.text }}>{g.saveFailed}</p>}

      {!loading && goals.length > 0 && <div data-reused="pace"><Pace /></div>}
      {!loading && goals.length > 0 && <div data-reused="insights"><LifeInsights /></div>}

      {sheet && (
        <GoalSheet
          goal={sheet.mode === 'edit' ? sheet.goal : null}
          initial={sheet.mode === 'edit' ? draftOf(sheet.goal) : sheet.draft}
          note={sheet.mode === 'new' ? sheet.note : null}
          areas={chosenAreas} busy={busy}
          capText={t.life.goals.freeCap.replace('{n}', String(FREE_ACTIVE_GOAL_CAP))}
          onSave={save} onClose={close}
          onDone={sheet.mode === 'edit' ? () => after(setStatus(sheet.goal.id, 'DONE')) : undefined}
          onReopen={sheet.mode === 'edit' ? () => after(setStatus(sheet.goal.id, 'ACTIVE')) : undefined}
          onDelete={sheet.mode === 'edit' ? () => after(removeGoal(sheet.goal.id)) : undefined}
        />
      )}
    </section>
  );
}

function Bar({ share }: { share: number | null }) {
  if (share == null) return null;
  const pct = Math.round(share * 100);
  return (
    <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} style={{ height: 8, borderRadius: 999, background: C.surface2, overflow: 'hidden' }}>
      <span style={{ display: 'block', height: '100%', width: `${pct}%`, background: C.gold, borderRadius: 999 }} />
    </div>
  );
}

/** One goal, one line: its name, its area, how far along — a tap opens it. */
function Row({ goal, first, onOpen }: { goal: Goal; first: boolean; onOpen: () => void }) {
  const { locale } = useTranslation();
  const fc = futureCopy(locale);
  const share = shareOf(goal);
  return (
    <button type="button" onClick={onOpen} data-testid={`goal-row-${goal.id}`} style={{
      display: 'flex', alignItems: 'center', gap: 10, minHeight: 56, width: '100%', padding: '6px 0',
      background: 'none', border: 'none', borderTop: first ? 'none' : `1px solid ${C.border}`,
      cursor: 'pointer', textAlign: 'start', color: C.text,
    }}>
      <span translate="no" style={{ flex: 1, minWidth: 0, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        color: goal.status === 'DONE' ? C.subtext : C.text }}><bdi>{goal.title}</bdi></span>
      {goal.area && <span style={{ fontSize: 12, color: C.identityInk, whiteSpace: 'nowrap' }}>{fc.area[goal.area]}</span>}
      {share != null && goal.status !== 'DONE' && (
        <span aria-hidden="true" style={{ width: 48, height: 6, borderRadius: 999, background: C.surface2, overflow: 'hidden', flex: 'none' }}>
          <span style={{ display: 'block', height: '100%', width: `${Math.round(share * 100)}%`, background: C.gold }} />
        </span>
      )}
    </button>
  );
}
