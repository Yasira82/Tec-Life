/**
 * The redesign switch, end to end (Phase 1 Foundation, owner 2026-11-28).
 *
 * The server for this run is started with the switch on for ONE name:
 *   JWT_SECRET=<test secret>  LIFE_REDESIGN_ENABLED=true  LIFE_REDESIGN_USERS=e2e_redesign
 * (.github/workflows/e2e.yml sets them; the suite skips when they are absent). Tokens are signed
 * here with the same test secret, so the server's real verification decides — nothing is mocked
 * on the decision path. The data routes are answered with empty data; this pins the SHELL.
 *
 * Rollback (switch off → everyone on the current design at the next request) is a config read,
 * proved in src/__tests__/design-flag.test.ts; a running server's env cannot be flipped from here.
 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { SignJWT } from 'jose';

const SECRET = process.env.JWT_SECRET;
const LISTED = 'e2e_redesign';
const configured = !!SECRET && process.env.LIFE_REDESIGN_ENABLED === 'true'
  && (process.env.LIFE_REDESIGN_USERS ?? '').split(',').includes(LISTED);
const PI_BROWSER_UA = 'Mozilla/5.0 (Linux; Android 13; SM-A515F Build/TP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0 Mobile Safari/537.36 PiBrowser/2.4.0';

const sign = (name: string, secret = SECRET!) => new SignJWT({ sub: `id-${name}`, pi_username: name })
  .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('1h').sign(new TextEncoder().encode(secret));

async function signIn(context: BrowserContext, page: Page, name: string, token: string, locale?: string) {
  const user = { id: `id-${name}`, piUsername: name, username: name };
  await context.addCookies([
    { name: 'tec_access_token', value: token, domain: 'localhost', path: '/' },
    { name: 'tec_user', value: encodeURIComponent(JSON.stringify(user)), domain: 'localhost', path: '/' },
    { name: 'tec_csrf', value: 'e2e-csrf', domain: 'localhost', path: '/' },
  ]);
  if (locale) await context.addInitScript((l) => { try { localStorage.setItem('tec_locale', l); } catch { /* */ } }, locale);
  await page.route('**/api/auth/me**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ authenticated: true, user }) }));
  // Each route answers the shape it really has (empty, but well-formed) — this suite pins the shell,
  // not how the parts cope with a malformed answer (that is e2e/no-crash.spec.ts, PR #128).
  await page.route('**/api/bff/**', (route) => {
    const p = new URL(route.request().url()).pathname;
    // The admin readings answer a non-admin with 403, as the service does.
    if (p.startsWith('/api/bff/life/admin/')) return route.fulfill({ status: 403, contentType: 'application/json', body: '{"error":"Forbidden"}' });
    return route.fulfill(ok(SHAPES[p] ?? {}));
  });
  await page.route('**/api/referral**', (r) => r.fulfill(ok({ code: 'E2E', url: 'http://localhost:3000/?ref=E2E', count: 0 })));
}

const ok = (data: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) });
const SHAPES: Record<string, unknown> = {
  '/api/bff/life/goals': { goals: [] },
  '/api/bff/life/skills': { skills: [] },
  '/api/bff/life/journey': { keeping: true, entries: [] },
  '/api/bff/life/conversations': { keeping: true, configured: true, conversations: [] },
  '/api/bff/subscription': { subscription: { plan: 'FREE', isActive: false, isExpired: false, daysRemaining: null } },
  '/api/bff/life/trajectory': { projectable: false, reason: 'not_enough_data', goals: [] },
  '/api/bff/life/activity': [],
  '/api/bff/life/budget': { period: '2026-11', lines: [], unallocated: [], spent_total: '0', spent_status: null },
  '/api/bff/life/consent': { consent: [] },
  '/api/bff/life/future': { vision: null, areas: [] },
  '/api/bff/life/self': { statement: null },
  '/api/bff/life/preferences': { preferences: {} },
  '/api/bff/life/intent': { signals: [] },
  '/api/bff/life/cashflow': { period: '2026-11', in: null, in_status: 503, out: { total: '0', lines: [] }, out_status: null, net: null },
};

test.describe('the redesign switch', () => {
  test.skip(!configured, 'server not started with the redesign switch for e2e_redesign');
  test.use({ viewport: { width: 390, height: 844 } });

  test('a listed name gets the new shell: four tabs that work', async ({ context, page }) => {
    await signIn(context, page, LISTED, await sign(LISTED));
    await page.goto('/app');
    await expect(page.locator('main[data-design="new"]')).toBeVisible();
    const nav = page.getByRole('navigation').last();
    for (const label of ['My goals', 'My mirror', 'Me']) {
      await nav.getByRole('button', { name: label, exact: true }).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(label);
      await expect(nav.getByRole('button', { name: label, exact: true })).toHaveAttribute('aria-current', 'page');
    }
    // Today's heading is the greeting; its first action is the coach.
    await nav.getByRole('button', { name: 'Today', exact: true }).click();
    await expect(nav.getByRole('button', { name: 'Today', exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('button', { name: /Talk to your coach/ })).toBeVisible();
  });

  test('anyone else gets the current design, unchanged', async ({ context, page }) => {
    await signIn(context, page, 'e2e_pioneer', await sign('e2e_pioneer'));
    await page.goto('/app');
    await expect(page.getByRole('button', { name: 'Settings', exact: true }).last()).toBeVisible();
    await expect(page.locator('main[data-design="new"]')).toHaveCount(0);
  });

  test('a token signed with another key is the current design, even for a listed name', async ({ context, page }) => {
    await signIn(context, page, LISTED, await sign(LISTED, 'not-the-server-secret-at-all-xx'));
    await page.goto('/app');
    await expect(page.locator('main[data-design="new"]')).toHaveCount(0);
  });

  test('no URL parameter can turn it on', async ({ context, page }) => {
    await signIn(context, page, 'e2e_pioneer', await sign('e2e_pioneer'));
    await page.goto('/app?design=new&redesign=1&v2=1');
    await expect(page.locator('main[data-design="new"]')).toHaveCount(0);
  });

  test('Today: greeting, coach, step, closest goal — every control at least 44×44', async ({ context, page }) => {
    await signIn(context, page, LISTED, await sign(LISTED));
    await page.route('**/api/bff/life/journey', (r) => r.fulfill(ok({ keeping: true, entries: [
      { id: 'e1', problem: 'My Pi is gone on arrival', understanding: 'u', step: 'Set 1π aside the day it arrives', step_outcome: null, created_at: new Date().toISOString(), days: [] },
    ] })));
    await page.route('**/api/bff/life/goals', (r) => r.fulfill(ok({ goals: [
      { id: 'g1', title: 'Save 10π for a phone', description: null, status: 'ACTIVE', target_date: null, target_amount: 10, progress: 4, created_at: '', updated_at: '' },
    ] })));
    await page.goto('/app');
    await expect(page.getByTestId('coach-hint')).toHaveText(/It remembers the conversations you kept/);
    await expect(page.getByText('Set 1π aside the day it arrives')).toBeVisible();
    await expect(page.getByText('Save 10π for a phone')).toBeVisible();
    const small = await page.locator('main button').evaluateAll((bs) => bs
      .map((b) => { const r = b.getBoundingClientRect(); return { n: (b.getAttribute('aria-label') || b.textContent || '').trim().slice(0, 24), w: r.width, h: r.height }; })
      .filter((x) => x.w && x.h && Math.min(x.w, x.h) < 43.5).map((x) => `${x.n} ${Math.round(x.w)}×${Math.round(x.h)}`));
    expect(small).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });

  test('Arabic: right to left, Arabic tabs', async ({ context, page }) => {
    await signIn(context, page, LISTED, await sign(LISTED), 'ar');
    await page.goto('/app');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    const nav = page.getByRole('navigation').last();
    for (const label of ['اليوم', 'أهدافي', 'مرآتي', 'أنا']) await expect(nav.getByRole('button', { name: label, exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /تحدّث مع مدربك/ })).toBeVisible();
    await nav.getByRole('button', { name: 'مرآتي', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('مرآتي');
  });

  test('English: left to right', async ({ context, page }) => {
    await signIn(context, page, LISTED, await sign(LISTED), 'en');
    await page.goto('/app');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  });
});

test.describe('the redesign switch in Pi Browser', () => {
  test.skip(!configured, 'server not started with the redesign switch for e2e_redesign');
  test.use({ viewport: { width: 390, height: 844 }, userAgent: PI_BROWSER_UA, isMobile: true, hasTouch: true });

  test('the shell opens, every tab is at least 44×44, and nothing scrolls sideways', async ({ context, page }) => {
    await signIn(context, page, LISTED, await sign(LISTED));
    await page.goto('/app');
    await expect(page.locator('main[data-design="new"]')).toBeVisible();
    const sizes = await page.getByRole('navigation').last().getByRole('button').evaluateAll((bs) =>
      bs.map((b) => { const r = b.getBoundingClientRect(); return Math.min(r.width, r.height); }));
    expect(sizes).toHaveLength(4);
    for (const s of sizes) expect(s).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });
});
