'use client';

import { useEffect, useState } from 'react';
import { C, errorA } from '@/lib-client/palette';
import { useTranslation } from '@/lib/i18n';
import { uiCopy } from '@/lib/life/ui-copy';
import { readProState } from '@/lib/subscription/read-pro-state';

/**
 * Cancel THIS app's Pro — and only this app's (owner decision, 2026-10-02: each
 * app's Pro card is its own, with its own cancel; the Hub plan is separate).
 *
 * Self-contained: it reads the app's own status and renders nothing unless there
 * is something here to cancel — not on the Testnet host, and not for a Pro bought
 * before the split (`legacy`), which belongs to the platform plan and ends on its
 * own date.
 */
const csrf = (): string => {
  if (typeof document === 'undefined') return '';
  return decodeURIComponent(document.cookie.match(/(?:^|;\s*)tec_csrf=([^;]*)/)?.[1] ?? '');
};

export function CancelProButton({ onCancelled }: { onCancelled?: () => void } = {}) {
  const u = uiCopy(useTranslation().locale);
  const [show,   setShow]   = useState(false);
  const [busy,   setBusy]   = useState(false);
  const [error,  setError]  = useState('');

  useEffect(() => {
    fetch('/api/bff/subscription', { credentials: 'include', cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null)).catch(() => null)
      .then((j: unknown) => {
        // One reading, fail-closed — the template's (TEC-AUDIT-0044).
        const st = readProState(j);
        setShow(st.pro && !st.legacy && !st.testnet);
      })
      .catch(() => {});
  }, []);

  if (!show) return null;

  const cancel = async () => {
    if (busy) return;
    if (!window.confirm(u.cancelConfirm)) return;
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/bff/subscription/cancel', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf() },
        body: '{}',
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({})) as { message?: unknown; error?: unknown };
        throw new Error(String(b.message ?? b.error ?? u.cancelFailed));
      }
      setShow(false);
      if (onCancelled) onCancelled(); else window.location.reload();
    } catch (e) {
      setError((e as Error).message || u.cancelFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ marginTop: 14 }}>
      <button
        onClick={cancel}
        disabled={busy}
        style={{
          padding: '8px 14px', borderRadius: 10, cursor: busy ? 'default' : 'pointer',
          background: 'transparent', border: `1px solid ${errorA(0.55)}`, color: C.error,
          fontSize: 12, fontWeight: 700,
        }}
      >
        {busy ? u.cancelling : u.cancel}
      </button>
      {error && <div role="alert" style={{ fontSize: 11, color: C.error, marginTop: 6 }}>{error}</div>}
    </div>
  );
}
