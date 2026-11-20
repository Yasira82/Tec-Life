import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isProPlan } from '@/app/app/components/shared';

/**
 * Life's Pro is Life's own (owner, 2026-10-02): commerce's answer for this app,
 * read fail-closed. The home page used to fall back to the HUB plan in the
 * tec_user cookie while the read was loading or had failed — another app's
 * entitlement, and a client-side claim (P6). TEC-AUDIT-0044, 14 Nov 2026.
 */
describe("Life's Pro comes from commerce's answer for Life only", () => {
  const page = readFileSync(join(process.cwd(), 'src/app/app/page.tsx'), 'utf8');

  it('the home page takes no plan from the session cookie', () => {
    expect(page).not.toMatch(/subscriptionPlan/);
    expect(page).toMatch(/isProPlan\(plan\)/);
  });

  it('no plan known is no Pro', () => {
    expect(isProPlan(null)).toBe(false);
    expect(isProPlan(undefined)).toBe(false);
  });
});
