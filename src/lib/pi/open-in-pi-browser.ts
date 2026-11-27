// A link that opens a page in Pi Browser, from an ordinary browser.
//
// PiNet (<sub>.pinet.com) shows the app in Chrome, but signing in with Pi works only in Pi Browser. On
// Android a page can be handed to an app by an intent link naming its package — Pi Browser's is `pi.browser`
// — with the Play Store page as the fallback when it is not installed. iPhones and computers have no such
// link, so there is none: the screen says where to open the app instead.
const PACKAGE = 'pi.browser';
const STORE   = `https://play.google.com/store/apps/details?id=${PACKAGE}`;

export function piBrowserLink(target: string, ua: string): string | null {
  if (!/Android/i.test(ua)) return null;
  let url: URL;
  try { url = new URL(target); } catch { return null; }
  if (url.protocol !== 'https:') return null;
  return `intent://${url.host}${url.pathname}${url.search}#Intent;scheme=https;package=${PACKAGE};`
    + `S.browser_fallback_url=${encodeURIComponent(STORE)};end`;
}
