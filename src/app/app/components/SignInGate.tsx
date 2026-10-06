'use client';

// The door of the app — a sign-in BUTTON before any screen, not a screen that
// says "Not signed in" with nothing to press (owner, 2026-10-06).
//
// Not a page guard: a server redirect for a session-less visit was tried and
// rolled back (middleware.ts — C-123 §7/§9/§11), because a standalone visit from
// the Quest or the campaign has Pi bound to THIS app and a trip to the Hub never
// came back. So the gate renders here, and the button runs the app's OWN sign-in
// (§10): Pi → /api/auth/pi-login → the 200 landing that sets the cookies. When
// Pi cannot answer on this page (a Hub-owned session, no SDK, a refusal), the
// Hub signs them in instead and sends them back to this exact page.
//
// While the session is still unknown it renders neither — a gate flashed at a
// signed-in member on every load is the bug the old "Not signed in" verdict was.

import { useState } from 'react';
import { usePiAuth, ssoRedirect } from '@yasser172/tec-auth';
import { useMe } from '@/lib-client/hooks/useMe';
import { selfSignIn } from '@/lib/pi/self-sign-in';
import { useTranslation } from '@/lib/i18n';
import { C, goldA } from '@/lib-client/palette';
import { card, goldBtn } from './shared';

const HUB_URL = process.env.NEXT_PUBLIC_HUB_URL ?? 'https://hub.tecosystem.app';

export function SignInGate({ children }: { children: React.ReactNode }) {
  const me = useMe();
  const { isAuthenticated, isLoading } = usePiAuth();
  const { t } = useTranslation();
  const g = t.life.gate;
  const [state, setState] = useState<'idle' | 'busy' | 'hub'>('idle');

  if (me.authenticated || isAuthenticated) return <>{children}</>;
  if (me.loading || isLoading) return <div aria-busy="true" style={{ minHeight: 240 }} />;

  const viaHub = () => {
    setState('hub');
    ssoRedirect(HUB_URL, window.location.href);
  };
  const signIn = async () => {
    setState('busy');
    const r = await selfSignIn(Date.now(), { force: true });
    if (r === 'navigating') return;                 // the landing takes it from here
    if (r === 'has-session') { window.location.reload(); return; }
    viaHub();                                       // foreign-session · no-pi · refused
  };

  return (
    <section aria-label={g.title} style={{ ...card, textAlign: 'center', padding: '28px 22px', marginTop: 8 }}>
      <div style={{
        width: 56, height: 56, borderRadius: 999, margin: '0 auto 14px',
        background: goldA(0.14), display: 'grid', placeItems: 'center', color: C.gold, fontSize: 24, fontWeight: 900,
      }}>π</div>
      <h2 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 6px', color: C.text }}>{g.title}</h2>
      <p style={{ fontSize: 14, color: C.subtext, margin: '0 0 18px', lineHeight: 1.5 }}>{g.body}</p>
      <button onClick={() => { void signIn(); }} disabled={state !== 'idle'}
        style={{ ...goldBtn, width: '100%', padding: '13px 18px', fontSize: 15, borderRadius: 12, opacity: state !== 'idle' ? 0.6 : 1 }}>
        {state === 'idle' ? g.button : g.busy}
      </button>
      <button onClick={viaHub} disabled={state !== 'idle'}
        style={{ background: 'none', border: 'none', color: C.subtext, fontSize: 13, marginTop: 12, cursor: 'pointer', textDecoration: 'underline' }}>
        {g.viaHub}
      </button>
    </section>
  );
}
