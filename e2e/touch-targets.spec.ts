/**
 * Every control a finger has to hit is at least 44×44, on every screen, at phone size — and the page can be
 * zoomed (owner, 27 Nov 2026: «التصميم صعب للمستخدم»; an engineering review measured it).
 *
 * Measured on 27 Nov before the fix: «Mark done» 20×20, «Delete» 11×24, «Remove» 14×19, a step's checkbox
 * 13×13, «Ask TEC AI» 18 high — under even WCAG 2.2 AA's 24px (2.5.8) — and some forty more under 44, the size
 * Apple and Android ask for. The page also forbade zoom (maximum-scale=1, WCAG 1.4.4), and its fields were
 * 12–14px, which makes an iPhone zoom in by itself on every tap once zoom is allowed — so fields are 16px.
 */
import { test, expect, type Page } from '@playwright/test';

const USER = { id: 'e2e-user', piUsername: 'e2e_pioneer', username: 'e2e_pioneer' };
const ok = (data: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) });
const ago = (d: number) => new Date(Date.now() - d * 864e5).toISOString();

async function lifeWithData(page: Page) {
  await page.context().addCookies([
    { name: 'tec_access_token', value: 'e2e-token', domain: 'localhost', path: '/' },
    { name: 'tec_user', value: encodeURIComponent(JSON.stringify(USER)), domain: 'localhost', path: '/' },
    { name: 'tec_csrf', value: 'e2e-csrf', domain: 'localhost', path: '/' },
  ]);
  const goals = [
    { id: 'g1', title: 'Save 10π for a new phone', description: '- [x] open a savings note\n- [ ] set 1π aside every Friday', status: 'ACTIVE', progress: 4, target_amount: 10, area: 'MONEY', created_at: ago(10), updated_at: ago(1) },
    { id: 'g2', title: 'Walk after dinner', description: null, status: 'ACTIVE', progress: 0, target_amount: null, area: null, created_at: ago(8), updated_at: ago(2) },
    { id: 'g3', title: 'Read one book', description: null, status: 'DONE', progress: 0, target_amount: null, area: null, created_at: ago(30), updated_at: ago(5) },
  ];
  const skills = [{ id: 's1', name: 'Graphic design', level: 'PRACTISING', source: 'SELF_DECLARED', created_at: ago(3), updated_at: ago(3) }];
  const entry = { id: 'j1', problem: 'I spend my Pi as soon as it arrives', understanding: 'It happens on the day it arrives', step: 'Set 1π aside on that day', step_outcome: null, created_at: ago(2), days: [] };
  await page.route('**/api/auth/me**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ authenticated: true, user: USER }) }));
  await page.route('**/api/bff/**', (route) => {
    const p = new URL(route.request().url()).pathname;
    if (p === '/api/bff/life/goals') return route.fulfill(ok({ goals }));
    if (p === '/api/bff/life/skills') return route.fulfill(ok({ skills }));
    if (p === '/api/bff/life/journey') return route.fulfill(ok({ keeping: true, entries: [entry] }));
    if (p === '/api/bff/life/conversations') return route.fulfill(ok({ keeping: true, configured: true, conversations: [] }));
    if (p === '/api/bff/subscription') return route.fulfill(ok({ subscription: { plan: 'FREE', isActive: false, isExpired: false, daysRemaining: null } }));
    if (p === '/api/bff/life/trajectory') return route.fulfill(ok({ projectable: false, reason: 'not_enough_data', goals: [] }));
    if (p === '/api/bff/life/activity') return route.fulfill(ok([]));
    if (p === '/api/bff/life/budget') return route.fulfill(ok({ period: '2026-11', lines: [], unallocated: [], spent_total: '0', spent_status: null }));
    if (p === '/api/bff/life/consent') return route.fulfill(ok({ consent: [] }));
    if (p === '/api/bff/life/future') return route.fulfill(ok({ vision: null, areas: [] }));
    if (p === '/api/bff/life/self') return route.fulfill(ok({ statement: null }));
    if (p === '/api/bff/life/preferences') return route.fulfill(ok({ preferences: {} }));
    if (p === '/api/bff/life/intent') return route.fulfill(ok({ signals: [] }));
    if (p === '/api/bff/life/cashflow') return route.fulfill(ok({ period: '2026-11', in: null, in_status: 503, out: { total: '0', lines: [] }, out_status: null, net: null }));
    return route.fulfill(ok({}));
  });
  await page.route('**/api/referral**', (r) => r.fulfill(ok({ code: 'E2E', url: 'http://localhost:3000/?ref=E2E', count: 0 })));
}

/** Every visible control under 44 in either direction, and every field under 16px. */
const undersized = (page: Page) => page.evaluate(() => {
  const out: string[] = [];
  for (const el of document.querySelectorAll<HTMLElement>('button, a[href], input, textarea, select, [role="button"], [role="switch"], [role="tab"], label:has(> input[type="checkbox"])')) {
    if (el.closest('nextjs-portal')) continue; // the dev overlay is not Life
    const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    if (!r.width || !r.height || cs.visibility === 'hidden') continue;
    if (el.matches('input[type="checkbox"]') && el.closest('label')) continue; // its label is the target
    const name = (el.getAttribute('aria-label') || el.innerText || el.getAttribute('placeholder') || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 30);
    if (Math.min(r.width, r.height) < 43.5) out.push(`${el.tagName.toLowerCase()} «${name}» ${Math.round(r.width)}×${Math.round(r.height)}`);
    const field = el.matches('input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea, select');
    if (field && parseFloat(cs.fontSize) < 16) out.push(`${el.tagName.toLowerCase()} «${name}» font ${cs.fontSize}`);
  }
  return out;
});

test.describe('touch targets at phone size', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test.beforeEach(async ({ page }) => { await lifeWithData(page); });

  test('the page can be zoomed', async ({ page }) => {
    await page.goto('/app');
    // Next writes a viewport tag of its own beside ours: none of them may stop zoom.
    const viewports = await page.locator('meta[name="viewport"]').evaluateAll((ms) => ms.map((m) => m.getAttribute('content') ?? ''));
    expect(viewports.length).toBeGreaterThan(0);
    for (const v of viewports) expect(v).not.toMatch(/maximum-scale|user-scalable\s*=\s*(no|0)/i);
  });

  for (const tab of ['Home', 'My future', 'Skills', 'Activity', 'Settings']) {
    test(`${tab}: every control at least 44×44, every field 16px`, async ({ page }) => {
      await page.goto('/app');
      // /app opens on Home; its tab is the current one (and animated), so it is not clicked.
      if (tab !== 'Home') await page.getByRole('button', { name: tab, exact: true }).last().click();
      await page.waitForTimeout(800);
      expect(await undersized(page)).toEqual([]);
    });
  }
});
