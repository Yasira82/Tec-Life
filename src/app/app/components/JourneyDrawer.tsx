'use client';

// ── The side menu — everything of the person's journey in one place ─────────────
//
// Owner, 2026-10-18: "an entry, then a menu on the side with everything inside".
// Like a chat app: the conversation fills the screen, and ☰ opens a panel from the
// reading side with "New conversation", the kept conversations and the summaries.
// The panel reads the person's own data from Life only when it is opened.
import { useEffect, useRef } from 'react';
import { C, bgA } from '@/lib-client/palette';
import { useTranslation } from '@/lib/i18n';
import { sessionCopy } from '@/lib/life/session-copy';
import { JourneyView } from './JourneyView';
import type { Resume } from './ProblemSession';
import { goldBtn } from './shared';

export function MenuButton({ onClick }: { onClick: () => void }) {
  const { locale } = useTranslation();
  const s = sessionCopy(locale);
  return (
    <button type="button" onClick={onClick} aria-label={s.menu} title={s.menu}
      style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 10, color: C.text,
        width: 40, height: 40, fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>
      ☰
    </button>
  );
}

export function JourneyDrawer({ open, onClose, onNew, onContinue }: {
  open: boolean; onClose: () => void; onNew: () => void; onContinue: (r: Resume) => void;
}) {
  const { locale } = useTranslation();
  const s = sessionCopy(locale);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    panel.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300 }}>
      <div onClick={onClose} aria-hidden style={{ position: 'absolute', inset: 0, background: bgA(0.7) }} />
      <div ref={panel} role="dialog" aria-modal="true" aria-label={s.jTitle} tabIndex={-1}
        style={{ position: 'absolute', top: 0, bottom: 0, insetInlineStart: 0, width: 'min(86vw, 380px)',
          background: C.bg, borderInlineEnd: `1px solid ${C.border}`, padding: '16px 16px 24px',
          overflowY: 'auto', outline: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>{s.jTitle}</div>
          <button type="button" onClick={onClose} aria-label={s.closeMenu}
            style={{ background: 'transparent', border: 'none', color: C.subtext, fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <button type="button" style={{ ...goldBtn, width: '100%', marginBottom: 16 }} onClick={() => { onNew(); onClose(); }}>
          ＋ {s.newConversation}
        </button>
        <JourneyView embedded onContinue={(r) => { onContinue(r); onClose(); }} />
      </div>
    </div>
  );
}
