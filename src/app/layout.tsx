import { RefCapture } from '@/components/referral/RefCapture';
import { RefApply } from '@/components/referral/RefApply';
import type { Metadata } from 'next';
import '@/styles/tec-design-tokens.css';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LocaleProvider } from '@/lib/i18n';
import { THEME_BOOT_SCRIPT } from '@/lib-client/theme';

export const metadata: Metadata = {
  title:       'TEC Life',
  description: 'TEC Life — your personal economic context in the Pi Network ecosystem',
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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
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
        `}</style>
        <script
          src="https://sdk.minepi.com/pi-sdk.js"
          async
        />
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
                try {
                  if (sessionStorage.getItem('__tec_hub_entry') === '1' ||
                      document.referrer.toLowerCase().indexOf('hub.tecosystem.app') !== -1) {
                    window.__TEC_PI_FOREIGN_SESSION = true; setReady(); return;
                  }
                } catch(e) {}
                if (typeof window.Pi === 'undefined') { setTimeout(initPi, 150); return; }
                try {
                  window.Pi.init({ version: '2.0', sandbox: ${process.env.NEXT_PUBLIC_PI_SANDBOX === 'true'}, appId: '${process.env.NEXT_PUBLIC_PI_APP_ID ?? ''}' });
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
      <body><ErrorBoundary><LocaleProvider><RefCapture /><RefApply />{children}</LocaleProvider></ErrorBoundary></body>
    </html>
  );
}
