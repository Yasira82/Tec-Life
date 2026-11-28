/**
 * /app's layout (Phase 1 Foundation): the current page for everyone the switch does not
 * name, the redesign only for those it does — and the current page whenever the switch
 * cannot answer. The current page itself (app/app/page.tsx) is not touched by this change.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { isValidElement, type ReactElement } from 'react';

const cookieGet = vi.fn();
vi.mock('next/headers', () => ({ cookies: async () => ({ get: cookieGet }) }));
const resolveDesign = vi.fn();
vi.mock('@/lib/server/design-flag', () => ({ resolveDesign: (...a: unknown[]) => resolveDesign(...a) }));
vi.mock('@/app/app/redesign/NewApp', () => ({ NewApp: () => null }));

beforeEach(() => { cookieGet.mockReset(); resolveDesign.mockReset(); });

async function render(design: 'new' | 'legacy', reason = 'x') {
  cookieGet.mockReturnValue({ value: 'the-token' });
  resolveDesign.mockResolvedValue({ design, reason });
  const { default: AppLayout } = await import('@/app/app/layout');
  const child = <div data-testid="legacy-page" />;
  return { out: (await AppLayout({ children: child })) as ReactElement, child };
}

describe('/app layout', () => {
  it('current design → the page, exactly as it is', async () => {
    const { out, child } = await render('legacy', 'not_on_list');
    expect(isValidElement(out)).toBe(true);
    expect((out.props as { children: unknown }).children).toBe(child);
  });

  it('redesign → the new shell, not the page', async () => {
    const { out } = await render('new', 'on_list');
    const { NewApp } = await import('@/app/app/redesign/NewApp');
    expect(out.type).toBe(NewApp);
  });

  it('passes ONLY the session token to the decision', async () => {
    await render('legacy');
    expect(cookieGet).toHaveBeenCalledWith('tec_access_token');
    expect(resolveDesign).toHaveBeenCalledWith('the-token');
  });

  it('is decided per request, never served from a static build', () => {
    const src = readFileSync('src/app/app/layout.tsx', 'utf8');
    expect(src).toMatch(/export const dynamic = 'force-dynamic'/);
    // No query string, no cookie of our own, no client storage can pick the design.
    expect(src).not.toMatch(/searchParams|localStorage|sessionStorage|tec_design/);
  });
});
