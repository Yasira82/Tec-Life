import { PiWarmup } from '@/components/pi/PiWarmup';
import { RefCapture } from '@/components/referral/RefCapture';
import { RefApply } from '@/components/referral/RefApply';
import { HUB_HOSTS } from '@/lib/pi-network';
import type { Metadata } from 'next';
import '@/styles/tec-design-tokens.css';
// Arabic UI face, served from this app (the CSP allows fonts from 'self' only). Each file
// carries an Arabic unicode-range, so a page with no Arabic text downloads none of them.
import '@fontsource/ibm-plex-sans-arabic/arabic-400.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-600.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-700.css';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LocaleProvider } from '@/lib/i18n';
import { THEME_BOOT_SCRIPT } from '@/lib-client/theme';
import { ArrivalReport } from '@/components/pioneer/ArrivalReport';
import { QuestReturn } from '@/components/pioneer/QuestReturn';
import { SAFE_BOTTOM_BOOT_SCRIPT } from '@/lib/safe-bottom';

const DESCRIPTION = 'TEC Life — your personal life coach: build yourself, one step at a time';

export const metadata: Metadata = {
  // Absolute links for the preview image (src/app/opengraph-image.png · twitter-image.png): a shared Life
  // link, or a visit through PiNet, shows the picture from the production domain — never a preview build.
  metadataBase: new URL('https://life.tecosystem.app'),
  title:       'TEC Life',
  description: DESCRIPTION,
  openGraph: { title: 'TEC Life', description: DESCRIPTION, siteName: 'TEC Life', type: 'website', url: '/' },
  twitter:   { card: 'summary_large_image', title: 'TEC Life', description: DESCRIPTION },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // `suppressHydrationWarning` because the boot script STAMPS `data-theme`
    // and `style.color-scheme` on this element before React hydrates. That is
    // the point of the script — the alternative is a flash of the wrong theme
    // on every load — so the mismatch it causes is expected and only here.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Room under the bottom bar for Android's buttons when Pi Browser reports none (lib/safe-bottom). */}
        <script dangerouslySetInnerHTML={{ __html: SAFE_BOTTOM_BOOT_SCRIPT }} />
        {/* No maximum-scale: a person who needs larger text can zoom (WCAG 1.4.4; owner, 27 Nov 2026). */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* One theme-color per scheme, so the browser chrome above the page
            matches the page. A single dark value leaves a black bar sitting on
            top of a light app.

            These stay HEX LITERALS by necessity: a `theme-color` meta is read
            by the browser's own chrome, outside the document's style
            resolution, so `var(--tec-bg)` there is simply ignored. */}
        <meta name="theme-color" media="(prefers-color-scheme: dark)"  content="#101014" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#f4f3f1" />
        {/* Applies the stored theme BEFORE first paint. Inline and synchronous
            on purpose: anything deferred renders the page dark and then snaps
            to light on every load — a flash worse than not offering the choice. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <style>{`
          *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
          /* The page ground is a TOKEN, not a hex. It was #050816 — the blue-black
             C-83 §4 declared and the Hub does not use — hardcoded here, which
             would have kept a light page sitting on a dark sheet no matter what
             every component did. */
          html, body { height: 100%; width: 100%; background: var(--tec-bg); }
          body { overscroll-behavior: none; -webkit-tap-highlight-color: transparent; }
          /* Touch targets (owner, 27 Nov 2026 — e2e/touch-targets.spec.ts): every control a finger must hit is
             at least 44×44. min-* wins over a width/height written inline, so no screen can shrink one again.
             A control drawn smaller (a checkbox, a switch) draws inside a 44×44 button of its own. */
          button, select, [role="button"], [role="tab"], [role="switch"] { min-height: 44px; min-width: 44px; }
          /* Fields at 16px: an iPhone zooms in by itself on a field under 16px, now that zoom is allowed.
             !important because the screens set their sizes inline. */
          input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea, select { font-size: 16px !important; min-height: 44px; }
        `}</style>
        {/* The Pi SDK is NOT loaded here. It is injected below, and ONLY when
            this is not a Hub-owned session — see the note in that script. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              var tries = 0;
              function setReady(){ window.__TEC_PI_READY = true; window.dispatchEvent(new Event('tec-pi-ready')); }
              function initPi(){
                if (tries++ > 40) { window.__TEC_PI_ERROR = true; window.dispatchEvent(new Event('tec-pi-error')); return; }
                // ADR-007/C-12 §3: Hub-entered = Hub owns this Pi Browser session.
                // Never Pi.init() here (it poisons the session and breaks the Hub
                // PaymentModal / Mode-2). The SSO landing persists the flag;
                // referrer covers direct hub->app hops.
                //
                // BOTH Hub hosts. The list is interpolated from
                // lib/pi-network.ts (HUB_HOSTS) because this script runs before
                // any module and cannot import — but it must not become a
                // second, drifting copy of the answer. It named only the
                // Mainnet Hub, so a hop from the Testnet Hub ran Pi.init() into
                // a session the Hub owns and every later Pi call went silent.
                var __hubHosts = ${JSON.stringify(HUB_HOSTS)};
                var __fromHub = false;
                try {
                  __fromHub = !!document.referrer &&
                    __hubHosts.indexOf(new URL(document.referrer).hostname.toLowerCase()) !== -1;
                } catch (e) {}
                try {
                  if (sessionStorage.getItem('__tec_hub_entry') === '1' || __fromHub) {
                    window.__TEC_PI_FOREIGN_SESSION = true; setReady(); return;
                  }
                } catch(e) {}
                // The SDK is requested ONLY here — after the hub-entry branch above
                // has returned. In a Hub-owned session it is never even fetched:
                // pulling pi-sdk.js opens Pi's bridge on this origin whether or
                // not init() is called, and ADR-007 says an app in that session
                // must not touch Pi. Loading its SDK is touching it.
                if (typeof window.Pi === 'undefined') {
                  if (!window.__TEC_PI_SDK_REQUESTED) {
                    window.__TEC_PI_SDK_REQUESTED = true;
                    var __s = document.createElement('script');
                    __s.src = 'https://sdk.minepi.com/pi-sdk.js';
                    __s.async = true;
                    __s.onerror = function () {
                      window.__TEC_PI_ERROR = true;
                      window.dispatchEvent(new Event('tec-pi-error'));
                    };
                    document.head.appendChild(__s);
                  }
                  setTimeout(initPi, 150); return;
                }
                try {
                    var __isTestnetHost = /\\.vercel\\.app$/i.test(location.hostname)
                      || /-test\\.tecosystem\\.app$/i.test(location.hostname);
                    // SANDBOX IS NOT TESTNET. The HOST decides which Pi APP the
                    // visitor is in (and so which network the server approves
                    // against); "sandbox" points the SDK at Pi's SANDBOX
                    // environment, a third thing. A paired Testnet app is a
                    // normal app on its own domain — NOT the sandbox. Setting
                    // sandbox:true there left the Pi bridge silent ("Messaging
                    // promise with id 1 timed out after 120000ms"). Default
                    // false; ?pi_sandbox=1 is the way back in, honoured only on
                    // the Testnet host so no query param can put a Mainnet
                    // payment into sandbox mode.
                    var __q = null;
                    try { __q = new URLSearchParams(location.search).get('pi_sandbox'); } catch (e) {}
                    var __sandbox = __isTestnetHost
                      ? (__q === '1')
                      : ${process.env.NEXT_PUBLIC_PI_SANDBOX === 'true'};
                    window.__TEC_PI_SANDBOX = __sandbox;
                  window.Pi.init({ version: '2.0', sandbox: __sandbox, appId: '${process.env.NEXT_PUBLIC_PI_APP_ID ?? ''}' });
                  setReady();
                } catch(e) {
                  var msg = String(e).toLowerCase();
                  if (msg.indexOf('already') !== -1 || msg.indexOf('initialized') !== -1) {
                    window.__TEC_PI_FOREIGN_SESSION = true; setReady();
                  } else { setTimeout(initPi, 150); }
                }
              }
              initPi();
            })();`,
          }}
        />
      </head>
      <body><PiWarmup />
        <ArrivalReport /><QuestReturn /><ErrorBoundary><LocaleProvider><RefCapture /><RefApply />{children}</LocaleProvider></ErrorBoundary></body>
    </html>
  );
}
