'use client';

import { useState } from 'react';
import { C, goldA, inkA } from '@/lib-client/palette';
import { SKILL_LEVELS, type Skill, type SkillLevel, useSkills } from '@/lib-client/life/useLife';
import { useTranslation } from '@/lib/i18n';
import { card, goldBtn } from './shared';
import { Goals } from './Goals';

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
export const SKILL_LEVEL_KEYS = {
  LEARNING: 'learning', PRACTISING: 'practising',
  PROFICIENT: 'proficient', EXPERT: 'expert',
} as const;


export function SkillRow({ skill, busy, onLevel, onRemove }: {
  skill: Skill;
  busy: boolean;
  onLevel: (level: SkillLevel) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const s = t.life.skills;
  const inferred = skill.source === 'ACTIVITY_INFERRED';

  return (
    // One row, not a panel. A skill is a NAME and a RUNG — two short facts —
    // and each one used to get a full card with four wrapping pills, so three
    // skills filled the screen and the level chips were the biggest thing on
    // it. The rung is now a segmented control at label size.
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
      padding: '12px 14px', display: 'grid', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 700, color: C.text, overflowWrap: 'anywhere' }}>
          {skill.name}
        </span>
        {/* An inferred skill is a statement about what someone DID. It is
            marked, and it is not editable — letting the subject rewrite it
            would make the distinction between the two sources worthless. */}
        {inferred && (
          <span style={{
            fontSize: 9.5, fontWeight: 800, letterSpacing: 0.4, color: C.gold,
            border: `1px solid ${goldA(0.35)}`, borderRadius: 999, padding: '2px 7px',
          }}>{s.inferred}</span>
        )}
        {!inferred && (
          <button onClick={onRemove} disabled={busy} aria-label={s.remove}
            style={{ background: 'none', border: 'none', color: C.faint, cursor: 'pointer',
                     fontSize: 15, lineHeight: 1, flexShrink: 0, padding: 2 }}>
            ×
          </button>
        )}
      </div>

      {/* A segmented control: one track, four segments, the current rung
          filled. Four separate outlined pills read as four buttons of equal
          weight — which is the opposite of a ladder. */}
      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(${SKILL_LEVELS.length}, 1fr)`,
        background: C.bg, border: `1px solid ${C.border}`, borderRadius: 999, padding: 2,
      }}>
        {SKILL_LEVELS.map((lvl) => {
          const active = skill.level === lvl;
          return (
            <button key={lvl} disabled={busy || inferred} onClick={() => onLevel(lvl)}
              aria-pressed={active}
              style={{
                fontSize: 11, fontWeight: 700, padding: '6px 2px', borderRadius: 999,
                cursor: busy || inferred ? 'default' : 'pointer',
                color: active ? C.onGold : C.subtext,
                background: active ? C.gold : 'transparent',
                border: 'none', minWidth: 0,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                transition: 'background .18s, color .18s',
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


export function Skills() {
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
          // A real empty state, not a sentence left hanging under the input.
          // The screen was blank from the field down to the tab bar, which
          // reads as something that failed to load rather than something
          // waiting to be filled.
          <div style={{
            ...card, marginTop: 4, padding: '32px 22px', textAlign: 'center',
            borderStyle: 'dashed', borderColor: inkA(0.14), background: 'transparent',
          }}>
            <div style={{ fontSize: 13.5, color: C.subtext, lineHeight: 1.7 }}>{s.empty}</div>
          </div>
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
          yet — saying so is better than letting someone guess either way. It
          sits under a hairline as a footnote: it is a standing fact about the
          screen, not another row of content. */}
      <p style={{
        fontSize: 11.5, color: C.faint, margin: '18px 2px 0', paddingTop: 14,
        borderTop: `1px solid ${C.border}`, lineHeight: 1.6,
      }}>
        {s.privacyNote}
      </p>
    </section>
  );
}
