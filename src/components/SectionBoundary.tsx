'use client';

// One part of Life failing must not take the whole app down (owner, 27 Nov 2026). The app-wide ErrorBoundary
// replaces EVERYTHING with «Something went wrong» — a budget that could not be drawn hid the coach, the goals and
// the bottom bar. Each screen and each Home section sits in one of these instead: that part says it could not load
// and offers to try again, in the person's language, and the rest keeps working. The error is logged (C-96), its
// text is never shown — a stack message means nothing to the person and may say too much.
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { C } from '@/lib-client/palette';
import { useTranslation } from '@/lib/i18n';
import { uiCopy } from '@/lib/life/ui-copy';

function Fallback({ onRetry }: { onRetry: () => void }) {
  const { locale } = useTranslation();
  const u = uiCopy(locale);
  return (
    <div role="alert" style={{ marginTop: 12, padding: '14px 16px', borderRadius: 14, border: `1px solid ${C.border}`, background: C.surface,
      display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ flex: 1, fontSize: 14, color: C.subtext }}>{u.sectionFailed}</span>
      <button type="button" onClick={onRetry}
        style={{ background: 'transparent', color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: '0 14px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
        {u.tryAgain}
      </button>
    </div>
  );
}

export class SectionBoundary extends Component<{ name: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[SectionBoundary:${this.props.name}]`, error.message, info.componentStack?.split('\n')[1]?.trim() ?? '');
  }

  render(): ReactNode {
    return this.state.failed ? <Fallback onRetry={() => this.setState({ failed: false })} /> : this.props.children;
  }
}
