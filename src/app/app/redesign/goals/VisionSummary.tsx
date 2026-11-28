'use client';

// «مستقبلي» on My goals, compact (owner review, 2026-11-28: «الكارت البنفسجي كبير جداً مقارنة
// بوظيفته»). The vision in two lines at most, the chosen areas as tags, and one Edit that opens a
// sheet holding the existing editor — the same Future component, unchanged, so every function it
// has (the vision, the areas, a line for each area, its own save and failure) stays exactly as it
// is, on the same routes. Purple is identity's colour: who the person wants to become.
import { useState } from 'react';
import { C, identityA } from '@/lib-client/palette';
import { useTranslation } from '@/lib/i18n';
import { futureCopy } from '@/lib/life/future-copy';
import type { Future as FutureData } from '@/lib-client/life/future';
import { Future } from '../../components/Future';
import { Sheet } from '../Sheet';

export function VisionSummary({ future, onChange }: { future: FutureData; onChange: (f: FutureData) => void }) {
  const { locale } = useTranslation();
  const f = futureCopy(locale);
  const [open, setOpen] = useState(false);
  const vision = future.vision?.trim() || null;

  return (
    <section data-testid="vision-summary" style={{
      display: 'flex', gap: 12, alignItems: 'flex-start',
      background: identityA(0.08), border: `1px solid ${identityA(0.25)}`, borderRadius: 16, padding: '12px 14px',
    }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p data-testid="vision-text" translate="no" style={{
          margin: 0, fontSize: 14.5, lineHeight: 1.5, color: vision ? C.text : C.subtext, fontWeight: vision ? 600 : 400,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}><bdi>{vision ?? f.visionEmpty}</bdi></p>
        {future.areas.length > 0 && (
          <ul aria-label={f.areasLabel} style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {future.areas.map((a) => (
              <li key={a.area} style={{ fontSize: 12, color: C.identityInk, background: identityA(0.12), borderRadius: 999, padding: '2px 10px' }}>
                {f.area[a.area]}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button type="button" onClick={() => setOpen(true)} aria-label={`${f.edit} — ${f.title}`} style={{
        minHeight: 44, minWidth: 44, flex: 'none', borderRadius: 12, border: `1px solid ${identityA(0.35)}`,
        background: 'transparent', color: C.identityInk, fontSize: 14, cursor: 'pointer', padding: '0 12px',
      }}>{f.edit}</button>

      {open && (
        <Sheet title={f.title} testId="vision-sheet" onClose={() => setOpen(false)}>
          <div data-reused="future"><Future future={future} onChange={onChange} /></div>
        </Sheet>
      )}
    </section>
  );
}
