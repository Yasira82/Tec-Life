'use client';

// How the person felt — CHOSEN by them from a closed list (owner, 2026-10-23: «واحسيسو»).
// Life never writes a feeling for anyone: it may preselect one the person NAMED in the
// conversation, and the person changes or removes it with one tap. Tapping the chosen one
// again clears it.
import { C } from '@/lib-client/palette';
import type { SessionCopy } from '@/lib/life/session-copy';
import { FEELINGS, type Feeling } from '@/lib-client/life/journey';

export function FeelingPicker({ label, value, onChange, s, disabled }: {
  label: string; value: Feeling | null; onChange: (f: Feeling | null) => void; s: SessionCopy; disabled?: boolean;
}) {
  return (
    <fieldset style={{ border: 'none', padding: 0, margin: '10px 0 0' }}>
      <legend style={{ fontSize: 12, fontWeight: 700, color: C.subtext, marginBottom: 6, padding: 0 }}>{label}</legend>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {FEELINGS.map((f) => {
          const on = value === f;
          return (
            <button key={f} type="button" aria-pressed={on} disabled={disabled} onClick={() => onChange(on ? null : f)}
              style={{
                borderRadius: 999, padding: '5px 10px', fontSize: 12.5, cursor: 'pointer',
                background: on ? C.surface2 : 'transparent', color: on ? C.text : C.subtext,
                border: `1px solid ${on ? C.gold : C.border}`, fontWeight: on ? 700 : 500,
              }}>{s.feel[f]}</button>
          );
        })}
      </div>
    </fieldset>
  );
}
