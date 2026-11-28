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

  test('My goals: the closest goal large, the others one line, the sheet — every control at least 44×44', async ({ context, page }) => {
    await signIn(context, page, LISTED, await sign(LISTED));
    await page.route('**/api/bff/life/goals', (r) => r.fulfill(ok({ goals: [
      { id: 'a', title: 'Save 10π for a phone', description: '- [x] open a note\n- [ ] 1π every Friday', status: 'ACTIVE', target_date: null, target_amount: 10, progress: 8, area: 'MONEY', created_at: '', updated_at: '' },
      { id: 'b', title: 'Walk after dinner', description: null, status: 'ACTIVE', target_date: null, target_amount: null, progress: 0, area: 'HEALTH', created_at: '', updated_at: '' },
    ] })));
    await page.route('**/api/bff/life/future', (r) => r.fulfill(ok({ vision: 'A calm life', areas: [{ area: 'MONEY', note: null }, { area: 'HEALTH', note: null }] })));
    await page.goto('/app');
    await page.getByRole('navigation').last().getByRole('button', { name: 'My goals', exact: true }).click();
    await expect(page.getByTestId('goal-priority')).toContainText('Save 10π for a phone');
    await expect(page.getByTestId('goal-row-b')).toBeVisible();
    // The new screen's own controls. The parts it reuses unchanged (the vision editor, Pace,
    // the Pro insights) are marked `data-reused` and measured by #127's touch-target suite.
    const undersized = () => page.evaluate(() => {
      const out: string[] = [];
      for (const el of document.querySelectorAll<HTMLElement>('main button, main a[href], main input, main select, main textarea, [data-testid="goal-sheet"] :is(button, a[href], input, select, textarea)')) {
        if (el.closest('[data-reused]') || el.closest('nav')) continue;
        const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
        if (el.matches('input[type="checkbox"]')) { const l = el.closest('label')?.getBoundingClientRect(); if (l && l.height >= 43.5) continue; }
        if (Math.min(r.width, r.height) < 43.5) out.push(`${el.tagName} «${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 20)}» ${Math.round(r.width)}×${Math.round(r.height)}`);
        if (el.matches('input:not([type="checkbox"]), select, textarea') && parseFloat(getComputedStyle(el).fontSize) < 16) out.push(`${el.tagName} font ${getComputedStyle(el).fontSize}`);
      }
      return out;
    });
    expect(await undersized()).toEqual([]);
    await page.getByTestId('goal-row-b').click();
    await expect(page.getByTestId('goal-sheet')).toBeVisible();
    expect(await undersized()).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });

  test('My goals: the vision is two lines at most, and nothing hides under the tab bar (Pi Browser on Android)', async ({ context, page }) => {
    await signIn(context, page, LISTED, await sign(LISTED));
    const many = Array.from({ length: 9 }, (_, i) => ({ id: `g${i}`, title: `Goal number ${i + 1}`, description: null, status: i > 6 ? 'DONE' : 'ACTIVE', target_date: null, target_amount: i === 0 ? 10 : null, progress: i === 0 ? 3 : 0, area: i % 2 ? 'HEALTH' : 'MONEY', created_at: '', updated_at: `2026-11-${10 + i}` }));
    await page.route('**/api/bff/life/goals', (r) => r.fulfill(ok({ goals: many })));
    await page.route('**/api/bff/life/future', (r) => r.fulfill(ok({
      vision: 'A calm life with money set aside every month, good health that lets me play with my children, time for my family every evening, and work I am proud of.',
      areas: [{ area: 'MONEY', note: null }, { area: 'HEALTH', note: null }],
    })));
    await page.goto('/app');
    // Pi Browser on Android reports no inset; lib/safe-bottom.ts then reserves Android's 48px.
    await page.addStyleTag({ content: ':root{--tec-safe-bottom-fallback:48px}' });
    await page.getByRole('navigation').last().getByRole('button', { name: 'My goals', exact: true }).click();
    const vision = page.getByTestId('vision-text');
    await expect(vision).toBeVisible();
    const lines = await vision.evaluate((el) => Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)));
    expect(lines).toBeLessThanOrEqual(2);
    // The closest goal now starts in the first screen, not below a tall card.
    const top = await page.getByTestId('goal-priority').evaluate((el) => el.getBoundingClientRect().top);
    expect(top).toBeLessThan(400);
    // At the end of the scroll, the last thing on the page sits above the tab bar.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(300);
    const { lastBottom, navTop, navGap } = await page.evaluate(() => {
      const nav = document.querySelector('nav')!.getBoundingClientRect();
      // The page's content — not the tab bar's own buttons (the bar sits inside <main>).
      const items = [...document.querySelectorAll<HTMLElement>('main button, main a[href], main [data-reused]')]
        .filter((el) => !el.closest('nav'))
        .map((el) => el.getBoundingClientRect()).filter((r) => r.height > 0);
      return { lastBottom: Math.max(...items.map((r) => r.bottom)), navTop: nav.top, navGap: window.innerHeight - nav.bottom };
    });
    expect(lastBottom).toBeLessThanOrEqual(navTop);
    expect(navGap).toBeGreaterThanOrEqual(48 + 12 - 1); // the bar stays above Android's own buttons
    // The add button, scrolled to just above the bar, is not covered by it.
    await page.getByTestId('goal-new').evaluate((el) => el.scrollIntoView({ block: 'center' }));
    const covered = await page.getByTestId('goal-new').evaluate((el) => {
      const r = el.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !(hit && (hit === el || el.contains(hit)));
    });
    expect(covered).toBe(false);
  });

  test('Me: identity, skills, journey, privacy in three groups — every new control at least 44×44', async ({ context, page }) => {
    await signIn(context, page, LISTED, await sign(LISTED));
    await page.route('**/api/bff/life/skills', (r) => r.fulfill(ok({ skills: [{ id: 's1', name: 'Graphic design', level: 'PRACTISING', source: 'SELF_DECLARED', created_at: '', updated_at: '' }] })));
    await page.route('**/api/bff/life/consent', (r) => r.fulfill(ok({ consent: [
      { category: 'GOALS', granted: true }, { category: 'BUDGET', granted: false }, { category: 'CHECKIN', granted: true },
      { category: 'JOURNEY', granted: true }, { category: 'CONVERSATIONS', granted: true },
    ] })));
    await page.goto('/app');
    await page.getByRole('navigation').last().getByRole('button', { name: 'Me', exact: true }).click();
    await expect(page.getByTestId('me-skills')).toContainText('Graphic design');
    await expect(page.getByTestId('me-privacy')).toContainText('What Life keeps');
    await expect(page.getByTestId('me-privacy')).toContainText('What TEC AI in the Hub may read');
    // Turning the journey off asks first.
    await page.getByRole('switch', { name: 'Keep my journey summaries' }).click();
    await expect(page.getByTestId('confirm-off-JOURNEY')).toBeVisible();
    const small = await page.evaluate(() => {
      const out: string[] = [];
      for (const el of document.querySelectorAll<HTMLElement>('main :is(button, a[href], input, select, textarea, summary)')) {
        if (el.closest('[data-reused]') || el.closest('nav')) continue;
        const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
        if (Math.min(r.width, r.height) < 43.5) out.push(`${el.tagName} «${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 24)}» ${Math.round(r.width)}×${Math.round(r.height)}`);
        if (el.matches('input, select, textarea') && parseFloat(getComputedStyle(el).fontSize) < 16) out.push(`${el.tagName} font ${getComputedStyle(el).fontSize}`);
      }
      return out;
    });
    expect(small).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });

  test('My goals in Arabic, Pi Browser width: π in Arabic digits, «1,000» refused beside the field, the sheet keeps focus', async ({ context, page }) => {
    await signIn(context, page, LISTED, await sign(LISTED), 'ar');
    await page.route('**/api/bff/life/goals', (r) => r.fulfill(ok({ goals: [
      { id: 'a', title: 'ادّخار ١٠π لهاتف', description: null, status: 'ACTIVE', target_date: null, target_amount: 10, progress: 2, area: 'MONEY', created_at: '', updated_at: '' },
    ] })));
    const sent: string[] = [];
    await page.route('**/api/bff/life/goals/a/progress', (r) => { sent.push(r.request().postData() ?? ''); return r.fulfill(ok({ goal: {} })); });
    await page.goto('/app');
    await page.getByRole('navigation').last().getByRole('button', { name: 'أهدافي', exact: true }).click();
    const card = page.getByTestId('goal-priority');
    const field = card.getByRole('textbox');
    await field.fill('1,000');
    const log = card.getByRole('button', { name: 'تسجيل', exact: true });
    await log.click();
    await expect(card.getByRole('alert')).toHaveText('اكتبه بدون فاصلة: نقطة للكسور، مثل 1000 أو 2.5.');
    expect(sent).toEqual([]);
    await field.fill('٢٫٥');
    await log.click();
    await expect.poll(() => sent).toEqual(['{"delta":2.5}']);
    // The sheet: focus goes in, Tab stays in, closing returns it to the opener.
    const edit = card.getByRole('button', { name: 'تعديل' });
    await edit.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
    for (let i = 0; i < 12; i++) await page.keyboard.press('Tab');
    expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    expect(await edit.evaluate((b) => b === document.activeElement)).toBe(true);
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
