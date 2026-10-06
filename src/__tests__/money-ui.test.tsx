/**
 * L1 — the Budget and Cash flow sections on Home (components/Money.tsx).
 *
 * The screen's one rule: an amount the owning service did not give is said in
 * words — never drawn as 0, never as a bar, never as "under budget" — and the
 * cash flow shows no net while a side is unknown (C-47 §10 E1).
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Budget, Cashflow, appLabel } from '../app/app/components/Money';
import { DICTIONARIES } from '@/lib/i18n/dictionaries';
import { LOCALES } from '@/lib/i18n/locales';

const en = DICTIONARIES.en.life;

const respond = (routes: Record<string, [number, unknown]>) =>
  vi.fn(async (u: RequestInfo | URL, _init?: RequestInit) => {
    const key = Object.keys(routes).find((k) => String(u).startsWith(k)) ?? '';
    const [status, body] = routes[key] ?? [404, {}];
    return { ok: status < 400, status, json: async () => body } as Response;
  });

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const known = {
  period: '2026-10',
  lines: [
    { category: 'ecommerce', cap_pi: '40', spent_pi: '12.5', pct: 31.25, over: false },
    { category: 'assets',    cap_pi: '10', spent_pi: '12',   pct: 100,   over: true },
  ],
  unallocated: [{ source: 'tec', spent_pi: '3' }],
  spent_total: '27.5', spent_status: null,
};

describe('Budget', () => {
  it('shows each cap with the owning service\'s amount, the bar, and "over" only where the cap was passed', async () => {
    vi.stubGlobal('fetch', respond({ '/api/bff/life/budget': [200, { success: true, data: known }] }));
    render(<Budget />);
    await waitFor(() => expect(screen.getByTestId('budget-ecommerce')).toBeTruthy());
    expect(screen.getByTestId('budget-ecommerce').textContent).toContain('π 12.5');
    expect(screen.getByTestId('budget-ecommerce').textContent).toContain('/ π 40');
    expect(screen.getByTestId('budget-ecommerce').textContent).not.toContain(en.budget.over);
    expect(screen.getByTestId('budget-assets').textContent).toContain(en.budget.over);
    expect(screen.getByTestId('budget-unallocated').textContent).toContain('Tec π 3');
    expect(screen.queryByTestId('budget-spent-unknown')).toBeNull();
  });

  it('when spending could not be read, says so — no 0, no bar, no "over"', async () => {
    const unknown = { ...known, lines: known.lines.map((l) => ({ ...l, spent_pi: null, pct: null, over: null })), unallocated: [], spent_total: null, spent_status: 503 };
    vi.stubGlobal('fetch', respond({ '/api/bff/life/budget': [200, { success: true, data: unknown }] }));
    render(<Budget />);
    await waitFor(() => expect(screen.getByTestId('budget-spent-unknown')).toBeTruthy());
    expect(screen.getByTestId('budget-spent-unknown').textContent).toBe(en.budget.spentUnknown);
    const line = screen.getByTestId('budget-ecommerce');
    expect(line.textContent).toContain(en.budget.lineUnknown);
    expect(line.textContent).toContain('/ π 40');
    expect(line.textContent).not.toMatch(/π 0\b/);
    expect(line.textContent).not.toContain(en.budget.over);
    expect(line.querySelectorAll('div[style*="width"]').length).toBe(0); // no bar painted on a guess
  });

  it('"partial" has its own sentence — the month was too big to read at once', async () => {
    const partial = { ...known, lines: [], unallocated: [], spent_total: null, spent_status: 'partial' };
    vi.stubGlobal('fetch', respond({ '/api/bff/life/budget': [200, { success: true, data: partial }] }));
    render(<Budget />);
    await waitFor(() => expect(screen.getByTestId('budget-spent-unknown').textContent).toBe(en.budget.spentPartial));
  });

  it('setting a cap PUTs the slug and the exact amount; a bad amount sends nothing', async () => {
    const f = respond({ '/api/bff/life/budget': [200, { success: true, data: { ...known, lines: [], unallocated: [] } }] });
    vi.stubGlobal('fetch', f);
    render(<Budget />);
    await waitFor(() => expect(screen.getByPlaceholderText(en.budget.appPlaceholder)).toBeTruthy());
    fireEvent.change(screen.getByPlaceholderText(en.budget.appPlaceholder), { target: { value: 'Ecommerce' } });
    fireEvent.change(screen.getByPlaceholderText(en.budget.capPlaceholder), { target: { value: 'abc' } });
    fireEvent.click(screen.getByText(en.budget.set));
    const puts = () => f.mock.calls.filter((c) => c[1]?.method === 'PUT');
    expect(puts()).toHaveLength(0);

    fireEvent.change(screen.getByPlaceholderText(en.budget.capPlaceholder), { target: { value: '12.5' } });
    fireEvent.click(screen.getByText(en.budget.set));
    await waitFor(() => expect(puts()).toHaveLength(1));
    expect(JSON.parse(String(puts()[0]?.[1]?.body))).toEqual({ category: 'ecommerce', cap_pi: '12.5' });
  });

  it('a failed read of the budget itself says so', async () => {
    vi.stubGlobal('fetch', respond({ '/api/bff/life/budget': [503, { error: 'Service unavailable' }] }));
    render(<Budget />);
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(en.budget.unavailable));
  });
});

describe('Cashflow', () => {
  it('shows in, out and a net when both sides are known', async () => {
    vi.stubGlobal('fetch', respond({ '/api/bff/life/cashflow': [200, { success: true, data: {
      period: '2026-10', in: { total: '3', lines: [] }, in_status: null, out: { total: '12.5', lines: [] }, out_status: null, net: '-9.5' } }] }));
    render(<Cashflow />);
    await waitFor(() => expect(screen.getByTestId('cashflow-net').textContent).toContain('π -9.5'));
    expect(screen.getByTestId('cashflow-in').textContent).toContain('π 3');
    expect(screen.getByTestId('cashflow-out').textContent).toContain('π 12.5');
  });

  it('an unknown side is said in words and the net is withheld — never a 0', async () => {
    vi.stubGlobal('fetch', respond({ '/api/bff/life/cashflow': [200, { success: true, data: {
      period: '2026-10', in: null, in_status: 502, out: { total: '12.5', lines: [] }, out_status: null, net: null } }] }));
    render(<Cashflow />);
    await waitFor(() => expect(screen.getByTestId('cashflow-in').textContent).toContain(en.cashflow.unknown));
    expect(screen.getByTestId('cashflow-in').textContent).not.toMatch(/π 0\b/);
    expect(screen.getByTestId('cashflow-net').textContent).toContain(en.cashflow.noNet);
    expect(screen.getByTestId('cashflow-net').textContent).not.toContain('π');
  });
});

describe('names and languages', () => {
  it('names an app from the fleet registry, capitalises an unknown slug, and translates "other"', () => {
    expect(appLabel('commerce', 'Other')).toBe('Commerce');
    expect(appLabel('legend', 'Other')).toBe('Legend');
    expect(appLabel('other', 'أخرى')).toBe('أخرى');
  });

  it('every locale carries the budget, cash-flow and privacy strings', () => {
    for (const { code } of LOCALES) {
      const d = DICTIONARIES[code].life;
      for (const k of Object.keys(en.budget) as (keyof typeof en.budget)[]) expect(d.budget[k], `${code}.budget.${k}`).toBeTruthy();
      for (const k of Object.keys(en.cashflow) as (keyof typeof en.cashflow)[]) expect(d.cashflow[k], `${code}.cashflow.${k}`).toBeTruthy();
      expect(d.privacy.budget, `${code}.privacy.budget`).toBeTruthy();
      // The purge copy was rewritten in every language to name the caps; what
      // can be checked without knowing the language is that it changed.
      expect(d.privacy.deleteDesc, `${code}.privacy.deleteDesc`).not.toBe('Goals, skills, preferences and these permissions. Your payments and your TEC account are not touched.');
    }
  });

  it('the Privacy screen names the BUDGET category', () => {
    const src = readFileSync(join(process.cwd(), 'src', 'app/app/components/SettingsView.tsx'), 'utf8');
    expect(src).toMatch(/BUDGET:\s*p\.budget/);
  });

  it('Home renders the budget and the cash flow below the focus goal', () => {
    const src = readFileSync(join(process.cwd(), 'src', 'app/app/components/Home.tsx'), 'utf8');
    const focus = src.indexOf('<Focus '); const budget = src.indexOf('<Budget />'); const recent = src.indexOf('<RecentActivity ');
    expect(focus).toBeGreaterThan(-1);
    expect(budget).toBeGreaterThan(focus);
    expect(recent).toBeGreaterThan(budget);
  });
});
