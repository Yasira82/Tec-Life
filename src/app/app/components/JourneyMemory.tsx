'use client';

// ── What Life remembers, on one kept summary (owner, 2026-10-23) ─────────────
//
// «يرجع للذاكرة بتاعتو ويتعلم منها» — and the person sees it and owns it. Four optional
// fields: what they tried, what helped, when it gets hard, why it matters. Life coaches
// from them (never offers again what was tried). They are shown as written and changed
// only by the person; an emptied field is cleared, not kept.
import { useState } from 'react';
import { C } from '@/lib-client/palette';
import type { SessionCopy } from '@/lib/life/session-copy';
import { setMemory, MEMORY_FIELDS, type JourneyEntry, type MemoryField } from '@/lib-client/life/journey';

const smallBtn = {
  background: 'transparent', color: C.subtext, border: `1px solid ${C.border}`, borderRadius: 8,
  padding: '6px 10px', fontSize: 12.5, cursor: 'pointer',
};
const area = {
  width: '100%', minHeight: 48, resize: 'vertical' as const,
  background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8,
  padding: '8px 10px', fontSize: 13, lineHeight: 1.5, fontFamily: 'inherit',
};

export function JourneyMemory({ entry, keeping, s, onUpdate }: {
  entry: JourneyEntry; keeping: boolean; s: SessionCopy; onUpdate: (e: JourneyEntry) => void;
}) {
  const label: Record<MemoryField, string> = { tried: s.fTried, helped: s.fHelped, triggers: s.fTriggers, reason: s.fReason };
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [failed, setFailed]   = useState(false);
  const [draft, setDraft]     = useState<Record<MemoryField, string>>({ tried: '', helped: '', triggers: '', reason: '' });

  const shown = MEMORY_FIELDS.filter((k) => entry[k]);
  const edit = () => {
    setDraft(Object.fromEntries(MEMORY_FIELDS.map((k) => [k, entry[k] ?? ''])) as Record<MemoryField, string>);
    setFailed(false); setEditing(true);
  };
  const save = async () => {
    setSaving(true); setFailed(false);
    const out = await setMemory(entry.id, Object.fromEntries(MEMORY_FIELDS.map((k) => [k, draft[k].trim() || null])) as Record<MemoryField, string | null>);
    setSaving(false);
    if (!out) { setFailed(true); return; }
    onUpdate(out); setEditing(false);
  };

  if (editing) {
    return (
      <div style={{ marginTop: 8 }}>
        {MEMORY_FIELDS.map((k) => (
          <label key={k} style={{ display: 'block', marginTop: 8 }}>
            <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.subtext, marginBottom: 4 }}>{label[k]}</span>
            <textarea value={draft[k]} maxLength={300} disabled={saving}
              onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value.slice(0, 300) }))}
              autoComplete="off" spellCheck={false} translate="no" style={area} />
          </label>
        ))}
        {failed && <div role="alert" style={{ fontSize: 12.5, color: C.text, marginTop: 6 }}>{s.jMemFailed}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button type="button" style={smallBtn} disabled={saving} onClick={() => void save()}>{s.jMemSave}</button>
          <button type="button" style={smallBtn} disabled={saving} onClick={() => setEditing(false)}>{s.jMemCancel}</button>
        </div>
      </div>
    );
  }
  return (
    <div style={{ marginTop: 6 }}>
      {shown.map((k) => (
        <div key={k} translate="no" style={{ fontSize: 12.5, color: C.subtext, marginTop: 4 }}>
          {label[k]}: <bdi style={{ color: C.text }}>{entry[k]}</bdi>
        </div>
      ))}
      {keeping && <button type="button" style={{ ...smallBtn, marginTop: 8 }} onClick={edit}>{s.jMemEdit}</button>}
    </div>
  );
}
