/**
 * Life never falls down whole (owner, 27 Nov 2026). A budget answered `{}` threw in Money.tsx and the app-wide
 * boundary replaced everything with «Something went wrong». Now the readers check each shape (lib-client/life/shapes.ts)
 * and every screen and Home section has its own boundary (SectionBoundary). The worst case is pinned here: EVERY
 * endpoint at once answers `{}`, `null`, or a server error — and every screen still opens, with the bottom bar.
 */
import { test, expect, type Page, type Route } from '@playwright/test';

const USER = { id: 'e2e-user', piUsername: 'e2e_pioneer', username: 'e2e_pioneer' };

async function everyAnswer(page: Page, answer: (route: Route) => Promise<void>) {
  await page.context().addCookies([
    { name: 'tec_access_token', value: 'e2e-token', domain: 'localhost', path: '/' },
    { name: 'tec_user', value: encodeURIComponent(JSON.stringify(USER)), domain: 'localhost', path: '/' },
    { name: 'tec_csrf', value: 'e2e-csrf', domain: 'localhost', path: '/' },
  ]);
  await page.route('**/api/auth/me**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ authenticated: true, user: USER }) }));
  await page.route('**/api/bff/**', answer);
  await page.route('**/api/referral**', answer);
}

const ANSWERS: [string, (r: Route) => Promise<void>][] = [
  ['an empty object', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true,"data":{}}' })],
  ['null data', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true,"data":null}' })],
  ['a server error', (r) => r.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"down"}' })],
  ['not JSON', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<html>gateway</html>' })],
];

test.describe('every endpoint answering badly at once', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  for (const [name, answer] of ANSWERS) {
    test(`${name}: no screen falls down whole`, async ({ page }) => {
      await everyAnswer(page, answer);
      await page.goto('/app');
      for (const tab of ['Home', 'My future', 'Skills', 'Activity', 'Settings']) {
        // /app opens on Home; its tab is the current one (and animated), so it is not clicked.
        if (tab !== 'Home') await page.getByRole('button', { name: tab, exact: true }).last().click();
        await page.waitForTimeout(600);
        await expect(page.getByText('Something went wrong')).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Settings', exact: true }).last()).toBeVisible();
      }
    });
  }
});
