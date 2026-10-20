'use client';

// ── Capabilities v1 (owner, 2026-10-20) ──────────────────────────────────────────────────
//
// After the person agrees to a step, Life may propose ONE thing to keep: a goal with its
// steps, or a skill. This card is the only way it becomes real — Add writes it through Life's
// own routes (lib-client/life/proposals.ts); Not now drops it. Nothing is written by Life
// itself, nothing is written without the tap, and the card says so.
import { useState } from 'react';
import { C } from '@/lib-client/palette';
import type { SessionCopy } from '@/lib/life/session-copy';
import { acceptProposal, type Proposal } from '@/lib-client/life/proposals';
import { goldBtn } from './shared';

const ghostBtn = {
  background: 'transparent', color: C.subtext, border: `1px solid ${C.border}`, borderRadius: 10,
  padding: '8px 12px', fontSize: 13.5, cursor: 'pointer',
};

export function ProposalCard({ proposal, s, onDone }: { proposal: Proposal; s: SessionCopy; onDone: () => void }) {
  const [state, setState] = useState<'idle' | 'adding' | 'added' | 'failed'>('idle');
  const goal = proposal.kind === 'goal';

  const add = async () => {
    setState('adding');
    setState((await acceptProposal(proposal)) ? 'added' : 'failed');
  };

  if (state === 'added') {
    return (
      <div role="status" style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 12px', marginTop: 10, fontSize: 13.5, color: C.text }}>
        {goal ? s.pAddedGoal : s.pAddedSkill}
      </div>
    );
  }

  return (
    <div role="group" aria-label={goal ? s.pGoalQ : s.pSkillQ}
      style={{ border: `1px solid ${C.gold}`, borderRadius: 12, padding: '10px 12px', marginTop: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.gold, marginBottom: 6 }}>{goal ? s.pGoalQ : s.pSkillQ}</div>
      <div translate="no" style={{ fontSize: 14, color: C.text, lineHeight: 1.55 }}>
        <bdi style={{ fontWeight: 700 }}>{goal ? proposal.title : proposal.name}</bdi>
        {goal && (
          <ul style={{ margin: '6px 0 0', paddingInlineStart: 18, color: C.subtext, fontSize: 13.5 }}>
            {proposal.steps.map((step, i) => <li key={i}><bdi>{step}</bdi></li>)}
          </ul>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        <button type="button" style={goldBtn} disabled={state === 'adding'} onClick={() => void add()}>
          {goal ? s.pAddGoal : s.pAddSkill}
        </button>
        <button type="button" style={ghostBtn} disabled={state === 'adding'} onClick={onDone}>{s.pNo}</button>
      </div>
      {state === 'failed' && <div role="alert" style={{ fontSize: 12.5, color: C.text, marginTop: 6 }}>{s.pFailed}</div>}
      <div style={{ fontSize: 11.5, color: C.subtext, marginTop: 8, lineHeight: 1.5 }}>{s.pNote}</div>
    </div>
  );
}
