'use client';

// Add or edit a goal, in a sheet that rises from the bottom (the approved mockup «أهدافي»).
//
// It closes only when the server kept the change; a refusal keeps it open, with what was typed,
// and says so. Delete asks twice. Everything goes through the existing routes (useGoals).
import { useEffect, useRef, useState } from 'react';
import { C, goldA } from '@/lib-client/palette';
import { useTranslation } from '@/lib/i18n';
import type { Goal } from '@/lib-client/life/useLife';
import { futureCopy, type LifeArea } from '@/lib/life/future-copy';
import { goalsCopy } from '@/lib/life/goals-copy';
import { isTargetProblem, takesTarget, type GoalDraft, type DraftProblem } from '@/lib/life/goals-edit';
import { Sheet } from '../Sheet';

const HUB_URL = process.env.NEXT_PUBLIC_HUB_URL ?? 'https://hub.tecosystem.app';

const field = {
  width: '100%', minHeight: 48, fontSize: 16, background: C.bg, color: C.text,
  border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 12px', fontFamily: 'inherit',
} as const;
const btn = {
  minHeight: 48, borderRadius: 14, border: `1px solid ${C.border}`, background: 'transparent',
  color: C.text, fontSize: 15, cursor: 'pointer', padding: '0 16px',
} as const;

export function GoalSheet({ goal, initial, areas, note, busy, capText, onSave, onDone, onReopen, onDelete, onClose }: {
  /** The goal being edited, or null for a new one. */
  goal: Goal | null;
  initial: GoalDraft;
  /** The areas the person chose («مستقبلي») — a goal may serve one of them. */
  areas: LifeArea[];
  /** Shown above the form, e.g. «suggested by TEC AI — nothing is saved until you tap Save». */
  note?: string | null;
  busy: boolean;
  /** What the free plan's cap says, when a new goal would pass it. */
  capText?: string;
  onSave: (d: GoalDraft) => Promise<DraftProblem | 'failed' | 'cap' | null>;
  onDone?: () => Promise<boolean>;
  onReopen?: () => Promise<boolean>;
  onDelete?: () => Promise<boolean>;
  onClose: () => void;
}) {
  const { t, locale } = useTranslation();
  const g = goalsCopy(locale);
  const fc = futureCopy(locale);
  const [d, setD] = useState<GoalDraft>(initial);
  const [problem, setProblem] = useState<string | null>(null);
  // A target that cannot be read is said next to the target field, not in the general alert.
  const [targetProblem, setTargetProblem] = useState<string | null>(null);
  const [armed, setArmed] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { titleRef.current?.focus(); }, []);

  // The goal's own area stays selectable even if it is no longer among the chosen ones.
  const options = d.area && !areas.includes(d.area) ? [...areas, d.area] : areas;
  const say = (p: DraftProblem | 'failed' | 'cap') => {
    if (isTargetProblem(p)) {
      setTargetProblem(p === 'ambiguous_target' ? g.amountAmbiguous : p === 'large_target' ? g.amountTooLarge : g.badTarget);
      return;
    }
    setProblem(p === 'no_title' ? g.noTitle : p === 'cap' ? `🔒 ${capText ?? ''}` : g.saveFailed);
  };
  const save = async () => { setProblem(null); setTargetProblem(null); const p = await onSave(d); if (p) say(p); };
  const act = async (fn?: () => Promise<boolean>) => { if (!fn) return; setProblem(null); if (!(await fn())) say('failed'); };

  return (
    <Sheet title={goal ? g.sheetEdit : g.sheetNew} testId="goal-sheet" onClose={onClose}>
        {note && <p style={{ margin: 0, fontSize: 13, color: C.gold, lineHeight: 1.5 }}>{note}</p>}

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, color: C.subtext }}>{g.fTitle}</span>
          <input ref={titleRef} id="goal-title" value={d.title} maxLength={200} onChange={(e) => setD({ ...d, title: e.target.value })} style={field} />
        </label>
        {options.length > 0 && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, color: C.subtext }}>{fc.goalArea}</span>
            <select id="goal-area" value={d.area} onChange={(e) => setD({ ...d, area: e.target.value as LifeArea | '' })} style={field}>
              <option value="">{fc.noArea}</option>
              {options.map((a) => <option key={a} value={a}>{fc.area[a]}</option>)}
            </select>
          </label>
        )}
        {takesTarget(d.area) && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, color: C.subtext }}>{g.fTarget}</span>
            <input id="goal-target" inputMode="decimal" value={d.target}
              aria-invalid={targetProblem ? true : undefined} aria-describedby={targetProblem ? 'goal-target-problem' : undefined}
              onChange={(e) => { setD({ ...d, target: e.target.value }); setTargetProblem(null); }}
              style={{ ...field, borderColor: targetProblem ? C.error : C.border }} />
            {targetProblem && <span id="goal-target-problem" role="alert" style={{ fontSize: 13, color: C.text }}>{targetProblem}</span>}
          </label>
        )}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, color: C.subtext }}>{g.fSteps}</span>
          <textarea id="goal-steps" value={d.steps} rows={4} onChange={(e) => setD({ ...d, steps: e.target.value })} style={{ ...field, minHeight: 104, resize: 'vertical' }} />
        </label>

        {problem && <p role="alert" style={{ margin: 0, fontSize: 13.5, color: C.text, background: goldA(0.1), borderRadius: 10, padding: '8px 10px' }}>{problem}</p>}

        <button type="button" disabled={busy} onClick={() => void save()} style={{ ...btn, background: C.gold, color: C.onGold, border: 'none', fontWeight: 800 }}>{g.save}</button>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={onClose} style={{ ...btn, flex: 1 }}>{g.cancel}</button>
          {goal && goal.status === 'ACTIVE' && onDone && <button type="button" disabled={busy} onClick={() => void act(onDone)} style={{ ...btn, flex: 1 }}>{t.life.goals.markDone}</button>}
          {goal && goal.status === 'DONE' && onReopen && <button type="button" disabled={busy} onClick={() => void act(onReopen)} style={{ ...btn, flex: 1 }}>{g.reopen}</button>}
        </div>
        {goal && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <a href={`${HUB_URL}/ai?q=${encodeURIComponent(t.life.goals.askAiQuestion.replace('{title}', goal.title))}`} target="_blank" rel="noopener noreferrer"
              style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', color: C.gold, fontSize: 14, textDecoration: 'none' }}>
              {t.life.goals.askAi}
            </a>
            {onDelete && (
              <button type="button" disabled={busy} onClick={() => { if (!armed) { setArmed(true); return; } void act(onDelete); }}
                style={{ ...btn, minHeight: 44, color: C.error, borderColor: armed ? C.error : C.border }}>
                {armed ? g.confirmDelete : t.life.goals.deleteGoal}
              </button>
            )}
          </div>
        )}
    </Sheet>
  );
}
