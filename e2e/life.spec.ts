/**
 * Life's own screens, end to end in a real browser — with the BFF answered by
 * the test, not by a gateway.
 *
 * `/app` renders its own signed-in state from the session cookies (the
 * middleware has no page guard, C-123 §7) and `/api/auth/me` only reads them —
 * so a session is two cookies. Every `/api/bff/*` call is fulfilled here with
 * the shapes `lib-client/life/useLife.ts` reads (`{ data: { goals } }` …), and
 * nothing in the app changes for a test.
 */
import { test, expect, type Page } from '@playwright/test';

const USER = { id: 'e2e-user', piUsername: 'e2e_pioneer', username: 'e2e_pioneer' };

type Goal  = { id: string; title: string; status: 'ACTIVE' | 'DONE' | 'ARCHIVED'; progress: number; target_amount: number | null; created_at: string; updated_at: string };
type Skill = { id: string; name: string; level: 'LEARNING' | 'PRACTISING' | 'PROFICIENT' | 'EXPERT'; source: 'SELF_DECLARED'; created_at: string; updated_at: string };

const ok = (data: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) });

async function signedIn(page: Page) {
  await page.context().addCookies([
    { name: 'tec_access_token', value: 'e2e-token', domain: 'localhost', path: '/' },
    { name: 'tec_user', value: encodeURIComponent(JSON.stringify(USER)), domain: 'localhost', path: '/' },
    { name: 'tec_csrf', value: 'e2e-csrf', domain: 'localhost', path: '/' },
  ]);
}

/** An in-memory Life for one test: goals + skills, the rest empty. */
async function fakeLife(page: Page) {
  const goals: Goal[] = []; const skills: Skill[] = []; const caps: { category: string; cap_pi: string }[] = [];
  const now = () => new Date().toISOString();
  await page.route('**/api/bff/**', async (route) => {
    const req = route.request(); const url = new URL(req.url()); const p = url.pathname; const m = req.method();
    const body = () => (req.postDataJSON() ?? {}) as Record<string, unknown>;
    if (p === '/api/bff/life/goals' && m === 'GET')  return route.fulfill(ok({ goals }));
    if (p === '/api/bff/life/goals' && m === 'POST') {
      const g: Goal = { id: `g${goals.length + 1}`, title: String(body().title), status: 'ACTIVE', progress: 0,
        target_amount: typeof body().target_amount === 'number' ? (body().target_amount as number) : null, created_at: now(), updated_at: now() };
      goals.push(g); return route.fulfill(ok({ goal: g }));
    }
    const gm = p.match(/^\/api\/bff\/life\/goals\/([^/]+)(\/progress)?$/);
    if (gm) {
      const g = goals.find((x) => x.id === gm[1]); if (!g) return route.fulfill({ status: 404, body: '{}' });
      if (m === 'DELETE') { goals.splice(goals.indexOf(g), 1); return route.fulfill(ok({})); }
      if (gm[2]) { g.progress = Math.min(g.target_amount ?? Infinity, g.progress + Number(body().delta ?? 0)); }
      else if (typeof body().status === 'string') g.status = body().status as Goal['status'];
      g.updated_at = now(); return route.fulfill(ok({ goal: g }));
    }
    if (p === '/api/bff/life/skills' && m === 'GET')  return route.fulfill(ok({ skills }));
    if (p === '/api/bff/life/skills' && m === 'POST') {
      const s: Skill = { id: `s${skills.length + 1}`, name: String(body().name), level: (body().level as Skill['level']) ?? 'LEARNING', source: 'SELF_DECLARED', created_at: now(), updated_at: now() };
      skills.push(s); return route.fulfill(ok({ skill: s }));
    }
    const sm = p.match(/^\/api\/bff\/life\/skills\/([^/]+)$/);
    if (sm) {
      const s = skills.find((x) => x.id === sm[1]); if (!s) return route.fulfill({ status: 404, body: '{}' });
      if (m === 'DELETE') { skills.splice(skills.indexOf(s), 1); return route.fulfill(ok({})); }
      if (typeof body().level === 'string') s.level = body().level as Skill['level'];
      return route.fulfill(ok({ skill: s }));
    }
    if (p === '/api/bff/subscription')          return route.fulfill(ok({ subscription: { plan: 'FREE', isActive: false, isExpired: false, daysRemaining: null } }));
    if (p === '/api/bff/life/goals/insights')   return route.fulfill(ok({ insights: null }));
    if (p === '/api/bff/life/trajectory')       return route.fulfill(ok({ projectable: false, reason: 'not_enough_data', goals: [] }));
    if (p === '/api/bff/life/activity')         return route.fulfill(ok([]));
    if (p === '/api/bff/life/preferences')      return route.fulfill(ok({ preferences: {} }));
    if (p === '/api/bff/life/consent')          return route.fulfill(ok({ consent: {} }));
    if (p === '/api/bff/life/intent')           return route.fulfill(ok({ signals: [] }));
    // L1 — the caps are the test's; the amounts beside them are what the owning services "say".
    if (p === '/api/bff/life/budget' && m === 'GET') return route.fulfill(ok({
      period: '2026-10',
      lines: caps.map((c) => ({ category: c.category, cap_pi: c.cap_pi, spent_pi: '2.5', pct: 10, over: false })),
      unallocated: [], spent_total: '2.5', spent_status: null,
    }));
    if (p === '/api/bff/life/budget' && m === 'PUT') { const b = body(); caps.push({ category: String(b.category), cap_pi: String(b.cap_pi) }); return route.fulfill(ok({ period: '2026-10', caps })); }
    if (p === '/api/bff/life/cashflow')          return route.fulfill(ok({ period: '2026-10', in: null, in_status: 503, out: { total: '2.5', lines: [] }, out_status: null, net: null }));
    return route.fulfill(ok({}));
  });
  await page.route('**/api/referral**', (route) => route.fulfill(ok({ code: 'E2E', url: 'http://localhost:3000/?ref=E2E', count: 0 })));
}

test.describe('Life, signed in', () => {
  test.beforeEach(async ({ page }) => { await signedIn(page); await fakeLife(page); });

  test('home shows the empty focus and the tabs', async ({ page }) => {
    await page.goto('/app');
    await expect(page.getByText('No goals yet').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Goals', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Skills', exact: true })).toBeVisible();
  });

  test('a goal is added, logged against, and reaches its target', async ({ page }) => {
    await page.goto('/app');
    await page.getByRole('button', { name: 'Goals', exact: true }).click();
    await page.getByPlaceholder('Add a goal').fill('Save 10 π');
    await page.getByPlaceholder('π target (opt)').fill('10');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText('Save 10 π')).toBeVisible();
    await page.getByPlaceholder('+ π amount').first().fill('10');
    await page.getByRole('button', { name: 'Log', exact: true }).first().click();
    // At its target the goal is REACHED, not closed — the goal is the person's to
    // close (C-106). The screen says so and offers the tap; then it moves to Completed.
    await expect(page.getByText('Target reached').first()).toBeVisible();
    await expect(page.getByTestId('ask-ai-g1')).toHaveAttribute('href', /\/ai\?q=.*Save%2010/);
    await page.getByText('Mark done', { exact: true }).click(); // the text button — the status circle carries the same title
    const completed = page.getByRole('button', { name: /Completed/ });
    await expect(completed).toBeVisible();
    await completed.click();
    await expect(page.getByText('Save 10 π')).toBeVisible();
  });

  test('a budget cap is set on Home and the unknown side of the cash flow is said, not zeroed', async ({ page }) => {
    await page.goto('/app');
    await page.getByPlaceholder('App').fill('ecommerce');
    await page.getByPlaceholder('π cap').fill('40');
    await page.getByRole('button', { name: 'Set', exact: true }).click();
    await expect(page.getByTestId('budget-ecommerce')).toContainText('π 2.5');
    await expect(page.getByTestId('budget-ecommerce')).toContainText('/ π 40');
    await expect(page.getByTestId('cashflow-in')).toContainText("couldn't read");
    await expect(page.getByTestId('cashflow-net')).not.toContainText('π');
  });

  test('a goal proposed by TEC AI opens filled in, and exists only after Add', async ({ page }) => {
    await page.goto('/app?goal=Save%2010%20%CF%80&target=10&ref=ABC');
    await expect(page.getByPlaceholder('Add a goal')).toHaveValue('Save 10 π');
    await expect(page.getByPlaceholder('π target (opt)')).toHaveValue('10');
    await expect(page.getByTestId('goal-prefill-note')).toBeVisible();
    await expect(page).toHaveURL(/\/app\?ref=ABC$/);             // the two keys are consumed
    await expect(page.getByText('No goals yet — add your first above.')).toBeVisible(); // nothing saved yet
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText('Save 10 π')).toBeVisible();
    await expect(page.getByTestId('goal-prefill-note')).toHaveCount(0);
  });

  test('a skill is added on the ladder', async ({ page }) => {
    await page.goto('/app');
    await page.getByRole('button', { name: 'Skills', exact: true }).click();
    await page.getByPlaceholder('Add a skill').fill('TypeScript');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText('TypeScript')).toBeVisible();
    await expect(page.getByText('Learning').first()).toBeVisible();
  });
});

test.describe('Life, signed out', () => {
  test('/app opens on the sign-in button — not on an app that says "Not signed in"', async ({ page }) => {
    await page.goto('/app');
    await expect(page.getByRole('button', { name: 'Sign in with Pi' })).toBeVisible();
    await expect(page.getByText('No goals yet')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Goals', exact: true })).toHaveCount(0);
  });
});
