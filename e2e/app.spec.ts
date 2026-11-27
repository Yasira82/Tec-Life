import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/TEC/);
});

// Pi sign-in works only in Pi Browser (Tec-Life #125, PiNet): there the landing offers «Login with Pi»;
// in any other browser it says where to open Life instead of a button that cannot sign in.
test.describe('in Pi Browser', () => {
  test.use({ userAgent: 'Mozilla/5.0 (Linux; Android 14; wv) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36 PiBrowser/2.4.1' });
  test('login button visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Login with Pi')).toBeVisible();
  });
});

test('in another browser: where to open Life, not a login that cannot work', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/open life\.tecosystem\.app in Pi Browser/)).toBeVisible();
  await expect(page.getByText('Login with Pi')).toHaveCount(0);
});
