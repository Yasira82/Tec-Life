'use client';

// TEC Referral — "Invite & Earn" CTA (C-133 growth). The invite-out half of the
// referral loop: a signed-in user gets their own code + a shareable link back to
// THIS app (so attribution + reward land platform-side, commerce-service). The
// referral SYSTEM is owned by the platform (Hub → commerce-service); this card is
// only a per-app surface over the shared `/api/referral` proxy. Real data only
// (C-135 §4): the code is fetched live; with no session it shows an honest prompt.
import { useEffect, useState } from 'react';
import {Icon} from '@yasser172/tec-ui';
import { C, goldA } from '@/lib-client/palette';

export function InviteCard() {
  const [code, setCode]   = useState<string | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'anon'>('loading');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch('/api/referral', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive) return;
        const c = d?.data?.referral?.code;
        if (c) { setCode(String(c)); setState('ready'); }
        else setState('anon');
      })
      .catch(() => { if (alive) setState('anon'); });
    return () => { alive = false; };
  }, []);

  const link = code && typeof window !== 'undefined'
    ? `${window.location.origin}/?ref=${code}`
    : '';

  const copy = async () => {
    if (!link) return;
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    catch { /* clipboard blocked — the link is shown for manual copy */ }
  };

  const card: React.CSSProperties = {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 12, padding: 14, marginTop: 12,
  };

  if (state === 'loading') return null;

  return (
    <section style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon name="gift" size={16} color={C.gold} strokeWidth={1.9} />
        <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Invite &amp; earn</span>
      </div>

      {state === 'anon' ? (
        <p style={{ fontSize: 13, color: C.subtext, margin: '8px 0 0', lineHeight: 1.6 }}>
          Sign in with Pi to get your invite link — share it and earn a reward when a friend joins.
        </p>
      ) : (
        <>
          {/* The raw URL is gone. It was a truncated `https://life.tecosystem
              .app/?ref=Q…` that nobody could read, copy by hand, or verify —
              taking a full row to display a string whose ONLY use is the button
              beside it. The button says what it copies; that is the whole
              contract. */}
          <p style={{ fontSize: 12.5, color: C.subtext, margin: '6px 0 12px', lineHeight: 1.5 }}>
            You both earn when a friend joins TEC through your link.
          </p>
          <button
            onClick={copy}
            disabled={!link}
            style={{
              width: '100%', fontSize: 13.5, fontWeight: 800,
              color: copied ? C.onGold : C.gold,
              background: copied ? `linear-gradient(135deg, ${C.gold}, ${C.goldDark})` : goldA(0.1),
              border: `1px solid ${goldA(copied ? 0 : 0.28)}`,
              borderRadius: 10, padding: '10px 16px', cursor: 'pointer',
              transition: 'background .2s, color .2s',
            }}
          >
            {copied ? '✓ Copied' : 'Copy invite link'}
          </button>
        </>
      )}
    </section>
  );
}
