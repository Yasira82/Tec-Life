/**
 * G5, browser side — Life's conversation, nothing saved
 * (KB First Session Spec §7 G5, §8).
 *
 * A marker is typed into the conversation. Every request the page makes — fetch,
 * XHR, sendBeacon, image/script loads, WebSocket frames — is captured with its URL,
 * headers and body. The marker may appear in ONE place: the body of the POST to
 * Life's own talk route. Anywhere else — or in any storage after Finish — and the
 * conversation is not as private as the screen says.
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
    if (p === '/api/bff/life/talk')          return route.fulfill(ok({ reply: 'I hear you. When did it last happen?' }));
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

test('the conversation\'s words go to Life\'s talk route and nowhere else', async ({ page }) => {
  const seen: { where: string; text: string }[] = [];
  const counted: string[] = [];
  page.on('request', (r) => {
    seen.push({ where: `${r.method()} ${new URL(r.url()).pathname}`, text: [r.url(), JSON.stringify(r.headers()), r.postData() ?? ''].join('\n') });
  });
  page.on('websocket', (ws) => {
    ws.on('framesent', (f) => seen.push({ where: `ws ${ws.url()}`, text: String(f.payload) }));
  });

  await signedIn(page);
  await fakeBff(page, counted);
  await page.goto('/app');

  await page.getByRole('button', { name: 'Start' }).first().click();   // the entry on Home
  await expect(page.getByText('sent to an AI model (Groq)', { exact: false })).toBeVisible();
  // Nothing goes anywhere before the person agrees.
  expect(seen.filter((r) => r.where.includes('/life/talk'))).toEqual([]);
  await page.getByRole('button', { name: 'I agree — start' }).click();

  await page.getByRole('textbox').fill(`problem ${MARKER}`);
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByText('I hear you. When did it last happen?')).toBeVisible();
  await page.getByRole('button', { name: 'End the conversation' }).click();
  await page.getByRole('button', { name: 'Somewhat' }).click();
  await page.getByRole('button', { name: 'Finish' }).click();

  // Let any late beacon or keepalive request go out before reading the log.
  await page.waitForTimeout(500);

  const carrying = seen.filter((r) => r.text.includes(MARKER));
  expect(carrying.map((r) => r.where), `requests carrying the person's text:\n${carrying.map((r) => r.where).join('\n')}`)
    .toEqual(['POST /api/bff/life/talk']);
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
