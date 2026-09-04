'use client';

import { useState } from 'react';
import { C, errorA, goldA, inkA, successA } from '@/lib-client/palette';
import { useTranslation } from '@/lib/i18n';

const MAX = 2000;
const MIN = 3;

/**
 * "Tell us what you think" — and it goes somewhere.
 *
 * The message posts to `/api/bff/feedback`, which forwards to the feedback
 * module in `tec-identity-service`. It does not open Telegram: a link out is
 * cheaper to build and loses the two things that make a report useful — the app
 * it came from, and the person still being inside the app when they send it.
 */
export function FeedbackCard({ page }: { page?: string }) {
  const { t } = useTranslation();
  const f = t.life.feedback;

  const [message, setMessage] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  const trimmed = message.trim();
  const tooLong = trimmed.length > MAX;
  const ready   = trimmed.length >= MIN && !tooLong;

  const submit = async () => {
    // The button is never disabled — a control that refuses in silence is the
    // one form of validation a person cannot read, and this app already shipped
    // that bug once on Skills. It says WHY instead.
    if (!ready) {
      setError(tooLong ? f.tooLong.replace('{n}', String(trimmed.length)) : f.tooShort);
      return;
    }
    setState('sending');
    setError(null);
    try {
      const res = await fetch('/api/bff/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, page }),
      });
      if (!res.ok) {
        // Prefer the server's own sentence. It knows which rule was broken —
        // the hourly limit, in particular, is not something the client can see.
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || data?.error || f.failed);
      }
      setState('sent');
      setMessage('');
    } catch (err) {
      setState('idle');
      setError((err as Error).message || f.failed);
    }
  };

  if (state === 'sent') {
    return (
      <div style={{
        background: successA(0.08), border: `1px solid ${successA(0.3)}`,
        borderRadius: 14, padding: '14px 16px',
      }}>
        <div style={{ color: C.success, fontWeight: 700, fontSize: 14 }}>{f.thanks}</div>
        {/* Says what happens next. "Thanks!" alone reads as a receipt printer. */}
        <div style={{ color: C.subtext, fontSize: 12.5, marginTop: 4, lineHeight: 1.5 }}>{f.thanksHint}</div>
        <button
          onClick={() => setState('idle')}
          style={{
            marginTop: 10, background: 'none', border: 'none', padding: 0,
            color: C.gold, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', font: 'inherit',
          }}
        >
          {f.sendAnother}
        </button>
      </div>
    );
  }

  return (
    <div>
      <textarea
        value={message}
        onChange={(e) => { setMessage(e.target.value); if (error) setError(null); }}
        placeholder={f.placeholder}
        rows={4}
        // The cap is generous, and typing past it is not blocked at the keystroke —
        // a textarea that stops accepting characters mid-sentence feels broken.
        // The count turns amber first, and the error explains on submit.
        style={{
          width: '100%', boxSizing: 'border-box', resize: 'vertical',
          background: inkA(0.04), border: `1px solid ${error ? errorA(0.5) : C.border}`,
          borderRadius: 12, padding: '12px 14px',
          color: C.text, fontSize: 14, lineHeight: 1.55, font: 'inherit',
          outline: 'none',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
        <span style={{ fontSize: 11.5, color: tooLong ? C.error : C.faint, fontWeight: tooLong ? 700 : 500 }}>
          {trimmed.length} / {MAX}
        </span>
        <span style={{ flex: 1 }} />
        <button
          onClick={() => { void submit(); }}
          disabled={state === 'sending'}
          style={{
            background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
            color: C.onGold, border: 'none', borderRadius: 10,
            padding: '9px 18px', fontSize: 13.5, fontWeight: 800,
            cursor: state === 'sending' ? 'default' : 'pointer',
            opacity: state === 'sending' ? 0.6 : 1, font: 'inherit',
          }}
        >
          {state === 'sending' ? f.sending : f.send}
        </button>
      </div>

      {error && (
        <div role="alert" style={{ marginTop: 8, color: C.error, fontSize: 12.5, lineHeight: 1.5 }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: 10, fontSize: 11.5, color: C.faint, lineHeight: 1.5 }}>
        {/* Says what is attached, before they type. A report that silently
            carried the page they were on would be a small surprise, and this
            app's whole privacy posture is that there are none. */}
        {f.privacyNote}
      </div>
    </div>
  );
}
