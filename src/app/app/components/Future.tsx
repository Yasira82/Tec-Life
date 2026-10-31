'use client';

// ── «مستقبلي» — my future (owner, 2026-10-31) ───────────────────────────────
//
// The vision first, then the life areas the person chooses, then (on each goal) the area it
// serves — KB audits/LIFE_MEMORY_AND_HUMAN_BUILDING_2026-10-23.md §6 step 4. Everything here is
// the person's own words or a choice from a closed list; nothing is suggested, scored or judged.
// Read from Life with the session; nothing at all is shown when it cannot be read.
import { useState } from 'react';
import { C, goldA, identityA } from '@/lib-client/palette';
import { useTranslation } from '@/lib/i18n';
import { futureCopy, LIFE_AREAS, type LifeArea } from '@/lib/life/future-copy';
import { saveAreas, saveVision, type Future as FutureData } from '@/lib-client/life/future';
import { card } from './shared';

const smallBtn = {
  background: 'transparent', color: C.subtext, border: `1px solid ${C.border}`, borderRadius: 8,
  padding: '6px 10px', fontSize: 12.5, cursor: 'pointer',
};
const field = {
  width: '100%', background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8,
  padding: '8px 10px', fontSize: 14, lineHeight: 1.5, fontFamily: 'inherit',
} as const;

export function Future({ future, onChange }: { future: FutureData; onChange: (f: FutureData) => void }) {
  const { locale } = useTranslation();
  const f = futureCopy(locale);
  const [editing, setEditing] = useState<'vision' | 'areas' | null>(null);
  const [vision, setVision] = useState('');
  const [chosen, setChosen] = useState<Partial<Record<LifeArea, string>>>({});
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const openVision = () => { setVision(future.vision ?? ''); setFailed(false); setEditing('vision'); };
  const openAreas = () => {
    setChosen(Object.fromEntries(future.areas.map((a) => [a.area, a.note ?? ''])));
    setFailed(false); setEditing('areas');
  };
  const toggle = (a: LifeArea) => setChosen((c) => {
    const next = { ...c };
    if (a in next) delete next[a]; else next[a] = '';
    return next;
  });

  const save = async () => {
    setSaving(true); setFailed(false);
    const out = editing === 'vision'
      ? await saveVision(vision.trim())
      : await saveAreas(LIFE_AREAS.filter((a) => a in chosen).map((a) => ({ area: a, note: chosen[a]?.trim() || null })));
    setSaving(false);
    if (!out) { setFailed(true); return; }
    onChange(out); setEditing(null);
  };

  const actions = (
    <>
      {failed && <div role="alert" style={{ fontSize: 12.5, color: C.text, marginTop: 6 }}>{f.failed}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button type="button" style={smallBtn} disabled={saving} onClick={() => void save()}>{f.save}</button>
        <button type="button" style={smallBtn} disabled={saving} onClick={() => setEditing(null)}>{f.cancel}</button>
      </div>
    </>
  );

  return (
    // IDENTITY, like «أنا بتغيّر»: this is about who the person is becoming; gold stays for action.
    <section aria-label={f.title} data-testid="future" className="tec-rise" style={{
      ...card, marginTop: 4, borderRadius: 22,
      background: identityA(0.10), border: `1px solid ${identityA(0.32)}`,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.identityInk }}>{f.title}</div>
      <div style={{ fontSize: 12, color: C.subtext, marginTop: 2, lineHeight: 1.5 }}>{f.hint}</div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.identityInk, marginBottom: 4 }}>{f.visionLabel}</div>
        {editing === 'vision' ? (
          <>
            <textarea value={vision} maxLength={300} disabled={saving} placeholder={f.visionPh} aria-label={f.visionLabel}
              onChange={(e) => setVision(e.target.value.slice(0, 300))} autoComplete="off" spellCheck={false} translate="no"
              style={{ ...field, minHeight: 64, resize: 'vertical' }} />
            {actions}
          </>
        ) : (
          <>
            {future.vision
              ? <div translate="no" data-testid="future-vision" style={{ fontSize: 18, fontWeight: 700, color: C.text, lineHeight: 1.55 }}><bdi>{future.vision}</bdi></div>
              : <div style={{ fontSize: 13, color: C.subtext, lineHeight: 1.5 }}>{f.visionEmpty}</div>}
            {!editing && <button type="button" style={{ ...smallBtn, marginTop: 8 }} onClick={openVision}>{f.edit}</button>}
          </>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.identityInk, marginBottom: 4 }}>{f.areasLabel}</div>
        {editing === 'areas' ? (
          <>
            <div style={{ fontSize: 12, color: C.subtext, marginBottom: 8, lineHeight: 1.5 }}>{f.areasHint}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {LIFE_AREAS.map((a) => {
                const on = a in chosen;
                return (
                  <button key={a} type="button" aria-pressed={on} disabled={saving} onClick={() => toggle(a)} style={{
                    borderRadius: 999, padding: '6px 12px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    background: on ? goldA(0.16) : 'transparent', color: on ? C.gold : C.subtext,
                    border: `1px solid ${on ? goldA(0.45) : C.border}`,
                  }}>{f.area[a]}</button>
                );
              })}
            </div>
            {LIFE_AREAS.filter((a) => a in chosen).map((a) => (
              <label key={a} style={{ display: 'block', marginTop: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{f.area[a]}</span>
                <input value={chosen[a] ?? ''} maxLength={160} disabled={saving} placeholder={f.notePh}
                  onChange={(e) => setChosen((c) => ({ ...c, [a]: e.target.value.slice(0, 160) }))}
                  autoComplete="off" translate="no" style={{ ...field, marginTop: 4 }} />
              </label>
            ))}
            {actions}
          </>
        ) : (
          <>
            {future.areas.length > 0 && (
              <ul data-testid="future-areas" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {future.areas.map((a) => (
                  <li key={a.area} style={{ fontSize: 13.5, color: C.text, lineHeight: 1.55, marginTop: 4 }}>
                    <b>{f.area[a.area]}</b>{a.note && <> — <bdi translate="no">{a.note}</bdi></>}
                  </li>
                ))}
              </ul>
            )}
            {!editing && <button type="button" style={{ ...smallBtn, marginTop: 8 }} onClick={openAreas}>{f.edit}</button>}
          </>
        )}
      </div>
    </section>
  );
}
