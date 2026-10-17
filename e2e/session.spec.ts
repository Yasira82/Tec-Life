/**
 * G5, browser side — stage 1 "talk it through without saving"
 * (KB First Session Spec §7 G5, §8 stage 1).
 *
 * A marker is typed into every field of the session. Every request the page
 * makes — fetch, XHR, sendBeacon, image/script loads, WebSocket frames — is
 * captured with its URL, headers and body, and none may carry the marker. After
 * Finish, no storage may hold it. One request carrying the text means the path
 * is not local, and stage 1 stops.
 */
import { test, expect, type Page } from '@playwright/test';

const USER   = { id: 'e2e-user', piUsername: 'e2e_pioneer', username: 'e2e_pioneer' };
const MARKER = 'ZQX-private-marker-7781';
const ok = (data: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) });

async function signedIn(page: Page) {
  await page.context().addCookies([
    { name: 'tec_access_token', value: 'e2e-token', domain: 'localhost', path: '/' },
    { name: 'tec_user', value: encodeURIComponent(JSON.stringify(USER)), domain: 'localhost', path: '/' },
    { name: 'tec_csrf', value: 'e2e-csrf', domain: 'localhost', path: '/' },
  ]);
}

/** The BFF answered here, so the page renders as signed in with an empty Life. */
async function fakeBff(page: Page, counted: string[]) {
  await page.route('**/api/bff/**', async (route) => {
    const req = route.request(); const p = new URL(req.url()).pathname;
    if (p === '/api/bff/life/session/count') { counted.push(String((req.postDataJSON() ?? {}).metric)); return route.fulfill(ok({})); }
    if (p === '/api/bff/life/goals')        return route.fulfill(ok({ goals: [] }));
    if (p === '/api/bff/life/skills')       return route.fulfill(ok({ skills: [] }));
    if (p === '/api/bff/life/trajectory')   return route.fulfill(ok({ projectable: false, reason: 'not_enough_data', goals: [] }));
    if (p === '/api/bff/life/activity')     return route.fulfill(ok([]));
    if (p === '/api/bff/subscription')      return route.fulfill(ok({ subscription: { plan: 'FREE', isActive: false, isExpired: false, daysRemaining: null } }));
    if (p === '/api/bff/life/budget')       return route.fulfill(ok({ period: '2026-10', lines: [], unallocated: [], spent_total: '0', spent_status: null }));
    if (p === '/api/bff/life/cashflow')     return route.fulfill(ok({ period: '2026-10', in: null, in_status: 503, out: null, out_status: 503, net: null }));
    return route.fulfill(ok({}));
  });
  await page.route('**/api/referral**', (route) => route.fulfill(ok({ code: 'E2E', url: 'http://localhost:3000/?ref=E2E', count: 0 })));
}

test('stage 1: the person\'s words never leave the page', async ({ page }) => {
  const seen: string[] = [];
  const counted: string[] = [];
  page.on('request', (r) => {
    seen.push([r.url(), JSON.stringify(r.headers()), r.postData() ?? ''].join('\n'));
  });
  page.on('websocket', (ws) => {
    ws.on('framesent', (f) => seen.push(`ws:${ws.url()}\n${String(f.payload)}`));
  });

  await signedIn(page);
  await fakeBff(page, counted);
  await page.goto('/app');

  await page.getByRole('button', { name: 'Start' }).first().click();     // the entry on Home
  await expect(page.getByText('Nothing you write here will be saved.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Start' }).click();             // S1 → S2

  const answer = async (text: string) => {
    await page.locator('textarea').fill(text);
    await page.getByRole('button', { name: 'Next' }).click();
  };
  await answer(`problem ${MARKER}`);
  await answer(`when one ${MARKER}`);
  await answer(`did one ${MARKER}`);
  await page.getByRole('button', { name: 'Yes, a different time' }).click();
  await answer(`when two ${MARKER}`);
  await answer(`did two ${MARKER}`);
  await page.getByRole('button', { name: 'Next' }).click();              // plan → summary

  await expect(page.getByText(`problem ${MARKER}`)).toBeVisible();
  await page.getByRole('button', { name: 'Somewhat' }).click();
  await page.getByRole('button', { name: 'Finish' }).click();

  // Let any late beacon or keepalive request go out before reading the log.
  await page.waitForTimeout(500);

  const leaks = seen.filter((r) => r.includes(MARKER));
  expect(leaks, `requests carrying the person's text:\n${leaks.join('\n---\n')}`).toEqual([]);
  expect(counted).toEqual(['s2_started', 's7_reached', 'm6_somewhat']);

  const stored = await page.evaluate(() => {
    const dump = (s: Storage) => Array.from({ length: s.length }, (_, i) => `${s.key(i)}=${s.getItem(s.key(i)!)}`).join('|');
    return `${dump(localStorage)}\n${dump(sessionStorage)}\n${document.cookie}\n${location.href}`;
  });
  expect(stored).not.toContain(MARKER);

  const idb = await page.evaluate(async () =>
    (await (indexedDB as IDBFactory & { databases?: () => Promise<{ name?: string }[]> }).databases?.() ?? []).map((d) => d.name));
  expect(idb).toEqual([]);

  // Finish dropped the words: they are no longer on the page.
  await expect(page.getByText(`problem ${MARKER}`)).toHaveCount(0);
});
