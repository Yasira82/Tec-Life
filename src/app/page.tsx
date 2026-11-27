'use client';

import { useEffect, useState }     from 'react';
import { useRouter }               from 'next/navigation';
import { usePiAuth, ssoRedirect }  from '@yasser172/tec-auth';
import { SocialLinks } from '@/components/social/SocialLinks';
import { Icon }                    from '@yasser172/tec-ui';
import { C }                       from '@/lib-client/palette';
import { looksLikePiBrowser }      from '@/lib/pi/pi-browser';
import { piBrowserLink }           from '@/lib/pi/open-in-pi-browser';

const HUB_URL     = process.env.NEXT_PUBLIC_HUB_URL   ?? 'https://hub.tecosystem.app';
// The SSO return address must be the host the visitor is ACTUALLY on.
// One build serves the Mainnet app and its paired Testnet app on two
// hosts; a build-time constant returns a Testnet visitor to the Mainnet
// origin, where the session then lives and the Testnet host stays
// "Unauthorized" with nothing logged. The Hub validates the target
// against its own ALLOWED_TARGETS, so nothing is weakened.
const APP_URL     = process.env.NEXT_PUBLIC_APP_URL   ?? 'https://life.tecosystem.app';
const APP_NAME    = process.env.NEXT_PUBLIC_APP_NAME  ?? 'TEC Life';
// What it is, in the Hub registry's words (tec-app domains/_registry.ts) — "What matters to
// you" did not say there is a coach here.
const APP_TAGLINE = 'Your personal life coach';

export default function HomePage() {
  const { isAuthenticated, isLoading } = usePiAuth();
  const router = useRouter();
  // Outside Pi Browser (PiNet in Chrome, a shared link) Pi sign-in cannot happen here: hand the visitor to Pi
  // Browser instead of a login that stops. Decided after mount — the server cannot see the browser.
  const [outside, setOutside] = useState<{ href: string | null } | null>(null);
  useEffect(() => {
    if (!looksLikePiBrowser()) setOutside({ href: piBrowserLink(`${APP_URL}/app`, navigator.userAgent) });
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/app');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogin = () => {
    ssoRedirect(HUB_URL, `${typeof window === 'undefined' ? APP_URL : window.location.origin}/app`);
  };

  return (
    <div style={{
      minHeight:      '100vh',
      background:     C.bg,
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
          <Icon name="sprout" size={48} color={C.gold} strokeWidth={1.5} />
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, color: C.gold, marginBottom: 8 }}>
          {APP_NAME}
        </div>
        <div style={{ fontSize: 14, color: C.text, marginBottom: 4 }}>
          {APP_TAGLINE}
        </div>
        <div style={{ fontSize: 12, color: C.subtext, marginBottom: 32, letterSpacing: 1 }}>
          TEC ECOSYSTEM · SYSTEM OF RECORD
        </div>
        {outside ? (
          <div style={{ maxWidth: 300, margin: '0 auto' }}>
            {outside.href && (
              <a
                href={outside.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display:        'inline-block',
                  padding:        '14px 32px',
                  background:     `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
                  borderRadius:   16,
                  color:          C.onGold,
                  fontSize:       15,
                  fontWeight:     700,
                  textDecoration: 'none',
                }}>
                Open in Pi Browser
              </a>
            )}
            <div style={{ fontSize: 13, color: C.subtext, marginTop: 14, lineHeight: 1.5 }}>
              {outside.href
                ? 'Sign in with Pi in Pi Browser — your goals and coach are waiting there.'
                : 'To sign in with Pi, open life.tecosystem.app in Pi Browser.'}
            </div>
          </div>
        ) : (
        <button
          onClick={handleLogin}
          disabled={isLoading}
          style={{
            padding:      '14px 32px',
            background:   `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
            border:       'none',
            borderRadius: 16,
            color:        C.onGold,
            fontSize:     15,
            fontWeight:   700,
            cursor:       isLoading ? 'not-allowed' : 'pointer',
            opacity:      isLoading ? 0.6 : 1,
          }}>
          {isLoading ? '...' : 'Login with Pi'}
        </button>
        )}

        {/* Below the button, not beside it. This screen has exactly one job and
            the social row must not compete with it — but "is anyone actually
            behind this?" is a question a person asks BEFORE they sign in, not
            after, and a login screen with no answer to it is a dead end.
            Renders nothing at all until a link is configured. */}
        <div style={{ marginTop: 28 }}>
          <SocialLinks compact />
        </div>
      </div>
    </div>
  );
}
