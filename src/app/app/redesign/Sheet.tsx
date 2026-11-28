'use client';

// The redesign's bottom sheet: rises from the bottom, above the tab bar, over a scrim. Escape or a
// tap on the scrim closes it. Its bottom padding clears Android's own buttons the way the tab bar
// does (lib/safe-bottom.ts) — Pi Browser reports an inset of 0 there.
//
// Focus (owner review of the redesign chain, 28 Nov 2026): on open, focus moves into the sheet —
// unless something inside already took it (the goal sheet focuses its title); Tab and Shift+Tab
// stay inside while it is open; on close, focus returns to what had it before (the button that
// opened it), so a keyboard or screen-reader user is never left on a removed element.
import { useEffect, useRef, type ReactNode } from 'react';
import { C, bgA } from '@/lib-client/palette';
import { SAFE_BOTTOM } from '@/lib/safe-bottom';

const FOCUSABLE = 'a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])';

/**
 * Whether an element can really take focus: not disabled, not hidden from assistive tech, not inside
 * a closed <details> (its content is not rendered for focus), and actually rendered — `hidden`,
 * `display: none` or `visibility: hidden` on it or any ancestor up to the sheet all take it out.
 */
function canTakeFocus(el: HTMLElement): boolean {
  if (el.matches(':disabled') || el.closest('[aria-hidden="true"], [inert], [hidden]')) return false;
  const closed = el.closest('details:not([open])');
  if (closed && !(el.tagName === 'SUMMARY' && el.parentElement === closed)) return false;
  for (let n: HTMLElement | null = el; n; n = n.parentElement) {
    const cs = getComputedStyle(n);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    if (n.getAttribute('role') === 'dialog') break;
  }
  return true;
}

export function Sheet({ title, testId, onClose, children }: {
  title: string; testId: string; onClose: () => void; children: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // Once per opening: where focus was, and where it goes back.
  useEffect(() => {
    const before = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // Children's effects ran first: if one focused a field inside, leave it there.
    if (box.current && !box.current.contains(document.activeElement)) box.current.focus();
    return () => { if (before && before.isConnected) before.focus(); };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { closeRef.current(); return; }
      if (e.key !== 'Tab' || !box.current) return;
      const items = [...box.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(canTakeFocus);
      if (items.length === 0) { e.preventDefault(); box.current.focus(); return; }
      const first = items[0]!, last = items[items.length - 1]!;
      const at = document.activeElement;
      const outside = !box.current.contains(at);
      // From outside the sheet, Tab comes back to its first control and Shift+Tab to its last.
      if (e.shiftKey && (outside || at === first || at === box.current)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (outside || at === last)) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const id = `${testId}-h`;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400 }}>
      <div data-testid={`${testId}-scrim`} onClick={onClose} style={{ position: 'absolute', inset: 0, background: bgA(0.7) }} />
      <div ref={box} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={id} data-testid={testId} style={{
        outline: 'none',
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
