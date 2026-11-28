'use client';

// The redesign's bottom sheet: rises from the bottom, above the tab bar, over a scrim. Escape or a
// tap on the scrim closes it. Its bottom padding clears Android's own buttons the way the tab bar
// does (lib/safe-bottom.ts) — Pi Browser reports an inset of 0 there.
import { useEffect, type ReactNode } from 'react';
import { C, bgA } from '@/lib-client/palette';
import { SAFE_BOTTOM } from '@/lib/safe-bottom';

export function Sheet({ title, testId, onClose, children }: {
  title: string; testId: string; onClose: () => void; children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const id = `${testId}-h`;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400 }}>
      <div data-testid={`${testId}-scrim`} onClick={onClose} style={{ position: 'absolute', inset: 0, background: bgA(0.7) }} />
      <div role="dialog" aria-modal="true" aria-labelledby={id} data-testid={testId} style={{
        position: 'absolute', insetInline: 0, bottom: 0, maxHeight: '88vh', overflowY: 'auto',
        background: C.surface, borderRadius: '22px 22px 0 0', borderTop: `1px solid ${C.border}`,
        padding: `10px 18px calc(18px + ${SAFE_BOTTOM})`, display: 'flex', flexDirection: 'column', gap: 14,
        maxWidth: 560, margin: '0 auto',
      }}>
        <div aria-hidden="true" style={{ width: 40, height: 4, borderRadius: 4, background: C.border, margin: '4px auto 2px' }} />
        <h2 id={id} style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}
