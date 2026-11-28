/**
 * A1 — the redesign's budget in «Me» (owner, 2026-11-28; KB plan §4 A1). The existing route and data only:
 * an unread spend is said, never 0; over a cap is said in words; the cap is sent as the exact decimal
 * typed; a refused change is said and the list is read again; digits follow the screen's language.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import React from 'react';
import { LocaleProvider } from '@/lib/i18n';
import { MeBudget } from '../app/app/redesign/me/MeBudget';
import { DICTIONARIES } from '@/lib/i18n/dictionaries';
import { budgetCopy } from '@/lib/life/budget-copy';
import { goalsCopy } from '@/lib/life/goals-copy';
import { amountString, CAP_MAX } from '@/lib/life/amount';

const b = DICTIONARIES.en.life.budget;
const k = budgetCopy('en');
const g = goalsCopy('en');

const known = {
  period: '2026-11',
  lines: [
    { category: 'ecommerce', cap_pi: '40', spent_pi: '30', pct: 75, over: false },
    { category: 'assets', cap_pi: '10', spent_pi: '12', pct: 100, over: true },
  ],
  unallocated: [{ source: 'tec', spent_pi: '8' }],
  spent_total: '50', spent_status: null,
};

type Call = { url: string; method: string; body: unknown };
let calls: Call[];
const stub = (handler: (url: string, method: string) => [number, unknown]) => {
  calls = [];
  vi.stubGlobal('fetch', vi.fn(async (u: RequestInfo | URL, init?: RequestInit) => {
    const url = String(u); const method = init?.method ?? 'GET';
    calls.push({ url, method, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    const [status, body] = handler(url, method);
    return { ok: status < 400, status, json: async () => body } as Response;
  }));
};
const ok = (data: unknown): [number, unknown] => [200, { success: true, data }];

afterEach(() => { cleanup(); vi.unstubAllGlobals(); localStorage.clear(); });

describe('MeBudget — what is read', () => {
  it('each cap with its spend, what is left, and «over» said in words', async () => {
    stub(() => ok(known));
    render(<MeBudget />);
    await screen.findByTestId('budget-ecommerce');
    expect(screen.getByTestId('budget-ecommerce').textContent).toContain('30 / 40π');
    expect(screen.getByTestId('budget-ecommerce-state').textContent).toBe('10π left');
    expect(screen.getByTestId('budget-assets-state').textContent).toBe('Over the cap by 2π');
    expect(screen.getByTestId('budget-unallocated').textContent).toContain('8π');
    expect(screen.getByRole('heading').textContent).toBe('My budget — November');
  });

  it('a spend that could not be read is said — never 0, never a bar, never «left»', async () => {
    stub(() => ok({ ...known, lines: [{ category: 'commerce', cap_pi: '20', spent_pi: null, pct: null, over: null }], spent_status: 502, unallocated: [] }));
    render(<MeBudget />);
    await screen.findByTestId('budget-commerce');
    expect(screen.getByTestId('budget-spent-unknown').textContent).toBe(b.spentUnknown);
    expect(screen.getByTestId('budget-commerce-state').textContent).toBe(b.lineUnknown);
    expect(screen.getByTestId('budget-commerce').textContent).not.toMatch(/\b0\b|left/);
  });

  it('a month with more payments than one read holds is «partial»', async () => {
    stub(() => ok({ ...known, lines: [{ category: 'commerce', cap_pi: '20', spent_pi: null, pct: null, over: null }], spent_status: 'partial', unallocated: [] }));
    render(<MeBudget />);
    expect((await screen.findByTestId('budget-spent-unknown')).textContent).toBe(b.spentPartial);
  });

  it('a budget that could not be read is said, with a retry — never «no caps»', async () => {
    let fail = true;
    stub(() => (fail ? [502, { error: 'down' }] : ok(known)));
    render(<MeBudget />);
    const failed = await screen.findByTestId('budget-failed');
    expect(screen.queryByText(b.empty)).toBeNull();
    fail = false;
    fireEvent.click(within(failed).getByRole('button', { name: k.retry }));
    await screen.findByTestId('budget-ecommerce');
  });

  it('a response of the wrong shape is unread — said with a retry, and nothing crashes', async () => {
    stub(() => ok({}));
    render(<MeBudget />);
    expect((await screen.findByTestId('budget-failed')).textContent).toContain(b.unavailable);
  });

    it('no caps yet → the empty line', async () => {
    stub(() => ok({ ...known, lines: [], unallocated: [] }));
    render(<MeBudget />);
    expect(await screen.findByText(b.empty)).toBeTruthy();
  });
});

describe('MeBudget — what is written', () => {
  const open = async () => {
    fireEvent.click(await screen.findByTestId('budget-add-open'));
    return screen.getByTestId('budget-add');
  };
  const fillIn = (form: HTMLElement, app: string, amount: string) => {
    fireEvent.change(within(form).getByRole('combobox'), { target: { value: app } });
    fireEvent.change(within(form).getByRole('textbox'), { target: { value: amount } });
    fireEvent.click(within(form).getByRole('button', { name: k.save }));
  };

  it('the cap goes to the existing route as the exact decimal typed — Arabic digits and «٫» included', async () => {
    stub((_u, m) => ok(m === 'GET' ? known : {}));
    render(<MeBudget />);
    fillIn(await open(), 'commerce', '٠٠٢٫٥٠');
    await waitFor(() => expect(calls.some((c) => c.method === 'PUT')).toBe(true));
    const put = calls.find((c) => c.method === 'PUT')!;
    expect(put.url).toBe('/api/bff/life/budget');
    expect(put.body).toEqual({ category: 'commerce', cap_pi: '2.5' });
    await waitFor(() => expect(screen.queryByTestId('budget-add')).toBeNull());
  });

  it('a tiny cap is sent as a decimal, never as "1e-8"', () => {
    expect(String(0.00000001)).toBe('1e-8');                 // why the cap is not sent as a number
    expect(amountString('0.00000001', CAP_MAX)).toBe('0.00000001');
    expect(amountString('1000000000', CAP_MAX)).toBe('1000000000');
    expect(amountString('1000000001', CAP_MAX)).toBeNull();
    expect(amountString('1,000', CAP_MAX)).toBeNull();
  });

  it.each([
    ['1,000', g.amountAmbiguous], ['0', g.amountInvalid], ['abc', g.amountInvalid],
    ['2000000000', g.amountTooLarge], ['1.123456789', g.amountTooPrecise],
  ])('%s → refused beside the field, nothing sent', async (typed, message) => {
    stub(() => ok(known));
    render(<MeBudget />);
    const form = await open();
    fillIn(form, 'commerce', typed);
    const alert = within(form).getByRole('alert');
    expect(alert.textContent).toBe(message);
    expect(within(form).getByRole('textbox').getAttribute('aria-describedby')).toBe('budget-amount-problem');
    expect(calls.some((c) => c.method === 'PUT')).toBe(false);
  });

  it('a refused change is said, the form stays open, and the list is read again', async () => {
    stub((_u, m) => (m === 'PUT' ? [400, { error: 'VALIDATION_ERROR' }] : ok(known)));
    render(<MeBudget />);
    fillIn(await open(), 'commerce', '5');
    expect((await screen.findByTestId('budget-save-failed')).textContent).toBe(k.saveFailed);
    expect(screen.getByTestId('budget-add')).toBeTruthy();
    await waitFor(() => expect(calls.filter((c) => c.method === 'GET').length).toBeGreaterThanOrEqual(2));
  });

  it('remove: DELETE on the existing route, named for the app', async () => {
    stub((_u, m) => ok(m === 'GET' ? known : { removed: true }));
    render(<MeBudget />);
    fireEvent.click(await screen.findByRole('button', { name: 'Remove the cap for Assets' }));
    await waitFor(() => expect(calls.some((c) => c.method === 'DELETE')).toBe(true));
    expect(calls.find((c) => c.method === 'DELETE')!.url).toBe('/api/bff/life/budget/assets');
  });

  it('an app that already has a cap is not offered again', async () => {
    stub(() => ok(known));
    render(<MeBudget />);
    const form = await open();
    const values = Array.from(within(form).getByRole('combobox').querySelectorAll('option')).map((o) => o.getAttribute('value'));
    expect(values).not.toContain('ecommerce');
    expect(values).not.toContain('assets');
    expect(values).toContain('tec');     // spent without a cap
    expect(values).toContain('other');
  });
});

describe('MeBudget — Arabic', () => {
  it('Arabic digits and words, RTL copy', async () => {
    localStorage.setItem('tec_locale', 'ar');
    stub(() => ok(known));
    render(<LocaleProvider><MeBudget /></LocaleProvider>);
    await waitFor(() => expect(screen.getByTestId('budget-assets-state').textContent).toBe('تجاوزت الحد بـ ٢π'));
    expect(screen.getByTestId('budget-ecommerce').textContent).toContain('٣٠ / ٤٠π');
    expect(screen.getByTestId('budget-ecommerce-state').textContent).toBe('باقي ١٠π');
    expect(screen.getByTestId('me-budget').textContent).not.toMatch(/[0-9]/);
  });
});
