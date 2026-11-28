/**
 * The redesign's My goals screen (Phase 1, owner 2026-11-28): the goal closest to done shown
 * large, the rest one line each, add and edit in a sheet that closes only when the server kept
 * the change, delete asked twice, the free plan's cap and the coach's proposed goal as before.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, within } from '@testing-library/react';
import React from 'react';
import { GoalsView } from '../app/app/redesign/goals/GoalsView';
import { goalsCopy } from '@/lib/life/goals-copy';
import { en } from '@/lib/i18n/dictionaries/en';

const g = goalsCopy('en');
const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => ({ success: true, data }) } as Response);
const fail = () => ({ ok: false, status: 500, json: async () => ({ error: 'down' }) } as Response);

const G = (over: Record<string, unknown>) => ({
  id: 'g', title: 't', description: null, status: 'ACTIVE', target_date: null, target_amount: null, progress: 0, area: null,
  created_at: '2026-11-01T00:00:00.000Z', updated_at: '2026-11-01T00:00:00.000Z', ...over,
});
let goals: unknown[];
let calls: { url: string; method: string; body: string }[];
let patchAnswer: () => Response;

beforeEach(() => {
  calls = []; patchAnswer = () => ok({});
  goals = [
    G({ id: 'a', title: 'Save 10π for a phone', target_amount: 10, progress: 8, area: 'MONEY', description: '- [x] open a note\n- [ ] 1π every Friday' }),
    G({ id: 'b', title: 'Walk after dinner', area: 'HEALTH', updated_at: '2026-11-20T00:00:00.000Z' }),
  ];
  vi.stubGlobal('fetch', vi.fn(async (u: RequestInfo | URL, init?: RequestInit) => {
    const url = String(u).split('?')[0]!; const method = init?.method ?? 'GET';
    calls.push({ url, method, body: typeof init?.body === 'string' ? init.body : '' });
    if (url === '/api/bff/life/goals' && method === 'GET') return ok({ goals });
    if (url === '/api/bff/life/goals' && method === 'POST') return ok({ goal: {} });
    if (url.startsWith('/api/bff/life/goals/') && method === 'PATCH') return patchAnswer();
    if (url.startsWith('/api/bff/life/goals/') && method === 'DELETE') return ok({});
    if (url === '/api/bff/life/future') return ok({ vision: null, areas: [{ area: 'MONEY', note: null }, { area: 'HEALTH', note: null }] });
    if (url === '/api/bff/life/trajectory') return ok({ projectable: false, reason: 'not_enough_data', goals: [] });
    if (url === '/api/bff/life/goals/insights') return ok({ pro: false });
    return ok({});
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const view = (p: Partial<React.ComponentProps<typeof GoalsView>> = {}) => render(<GoalsView isPro={false} {...p} />);
const sheet = () => screen.getByTestId('goal-sheet');

describe('My goals', () => {
  it('the closest goal is large, with its steps; the others are one line each', async () => {
    view();
    const top = await screen.findByTestId('goal-priority');
    expect(within(top).getByText('Save 10π for a phone')).toBeTruthy();
    expect(within(top).getByText('1π every Friday')).toBeTruthy();
    expect(screen.getByTestId('goal-row-b').textContent).toContain('Walk after dinner');
    expect(screen.queryByTestId('goal-row-a')).toBeNull();
  });

  it('ticking a step rewrites the description through the existing PATCH', async () => {
    view();
    const top = await screen.findByTestId('goal-priority');
    fireEvent.click(within(top).getByRole('checkbox', { name: '1π every Friday' }));
    await waitFor(() => expect(calls.some((c) => c.method === 'PATCH')).toBe(true));
    const patch = calls.find((c) => c.method === 'PATCH')!;
    expect(patch.url).toBe('/api/bff/life/goals/a');
    expect(JSON.parse(patch.body)).toEqual({ description: '- [x] open a note\n- [x] 1π every Friday' });
  });

  it('edit: only the changed field is sent, and the sheet closes when the server kept it', async () => {
    view();
    fireEvent.click(await screen.findByTestId('goal-row-b'));
    const title = within(sheet()).getByLabelText(g.fTitle) as HTMLInputElement;
    expect(title.value).toBe('Walk after dinner');
    fireEvent.change(title, { target: { value: 'Walk 20 minutes after dinner' } });
    fireEvent.click(within(sheet()).getByRole('button', { name: g.save }));
    await waitFor(() => expect(screen.queryByTestId('goal-sheet')).toBeNull());
    const patch = calls.find((c) => c.method === 'PATCH')!;
    expect(JSON.parse(patch.body)).toEqual({ title: 'Walk 20 minutes after dinner' });
  });

  it('a refused save keeps the sheet open, with what was typed', async () => {
    patchAnswer = fail;
    view();
    fireEvent.click(await screen.findByTestId('goal-row-b'));
    const title = within(sheet()).getByLabelText(g.fTitle) as HTMLInputElement;
    fireEvent.change(title, { target: { value: 'Walk more' } });
    fireEvent.click(within(sheet()).getByRole('button', { name: g.save }));
    expect(await within(sheet()).findByText(g.saveFailed)).toBeTruthy();
    expect((within(sheet()).getByLabelText(g.fTitle) as HTMLInputElement).value).toBe('Walk more');
  });

  it('delete asks twice', async () => {
    view();
    fireEvent.click(await screen.findByTestId('goal-row-b'));
    fireEvent.click(within(sheet()).getByRole('button', { name: en.life.goals.deleteGoal }));
    expect(calls.some((c) => c.method === 'DELETE')).toBe(false);
    fireEvent.click(within(sheet()).getByRole('button', { name: g.confirmDelete }));
    await waitFor(() => expect(calls.find((c) => c.method === 'DELETE')?.url).toBe('/api/bff/life/goals/b'));
  });

  it('new goal: a name is required, then POST with the steps as the checklist', async () => {
    view();
    fireEvent.click(await screen.findByTestId('goal-new'));
    fireEvent.click(within(sheet()).getByRole('button', { name: g.save }));
    expect((await within(sheet()).findByRole('alert')).textContent).toBe(g.noTitle);
    fireEvent.change(within(sheet()).getByLabelText(g.fTitle), { target: { value: 'Read a book' } });
    fireEvent.change(within(sheet()).getByLabelText(g.fSteps), { target: { value: 'chapter one\nchapter two' } });
    fireEvent.click(within(sheet()).getByRole('button', { name: g.save }));
    await waitFor(() => expect(screen.queryByTestId('goal-sheet')).toBeNull());
    const post = calls.find((c) => c.method === 'POST')!;
    expect(JSON.parse(post.body)).toEqual({ title: 'Read a book', description: '- [ ] chapter one\n- [ ] chapter two' });
  });

  it('the free plan’s cap: three active goals — the sheet does not open, and says why', async () => {
    goals = [...goals, G({ id: 'c', title: 'Third' })];
    view();
    fireEvent.click(await screen.findByTestId('goal-new'));
    expect(screen.queryByTestId('goal-sheet')).toBeNull();
    expect(screen.getByRole('status').textContent).toContain(en.life.goals.freeCap.replace('{n}', '3'));
    expect(calls.some((c) => c.method === 'POST')).toBe(false);
  });

  it('the coach’s proposed goal opens the sheet filled in; nothing is saved until Save', async () => {
    const used = vi.fn();
    view({ prefill: { title: 'Save 2π a week', steps: ['open a note'] } as never, onPrefillUsed: used });
    const s = await screen.findByTestId('goal-sheet');
    expect((within(s).getByLabelText(g.fTitle) as HTMLInputElement).value).toBe('Save 2π a week');
    expect(calls.some((c) => c.method === 'POST')).toBe(false);
    fireEvent.click(within(s).getByRole('button', { name: g.save }));
    await waitFor(() => expect(used).toHaveBeenCalled());
    expect(JSON.parse(calls.find((c) => c.method === 'POST')!.body)).toMatchObject({ title: 'Save 2π a week' });
  });

  it('the area filter narrows the list', async () => {
    goals = [...goals, G({ id: 'c', title: 'Budget notes', area: 'MONEY' })];
    view({ isPro: true });
    await screen.findByTestId('goal-row-b');
    fireEvent.click(screen.getByRole('button', { name: 'Health' }));
    expect(screen.getByTestId('goal-row-b')).toBeTruthy();
    expect(screen.queryByTestId('goal-row-c')).toBeNull();
  });

  it('Escape closes the sheet', async () => {
    view();
    fireEvent.click(await screen.findByTestId('goal-row-b'));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByTestId('goal-sheet')).toBeNull();
  });
});

describe('My goals — amounts (owner review of the chain, 28 Nov)', () => {
  const progress = () => calls.filter((c) => c.url.endsWith('/progress') && c.method === 'POST');
  const logField = () => within(screen.getByTestId('goal-priority')).getByRole('textbox', { name: en.life.goals.logPlaceholder });
  const logBtn = () => within(screen.getByTestId('goal-priority')).getByRole('button', { name: en.life.goals.log });

  it('logging π in Arabic-Indic digits sends the number', async () => {
    view();
    await screen.findByTestId('goal-priority');
    fireEvent.change(logField(), { target: { value: '٢٫٥' } });
    fireEvent.click(logBtn());
    await waitFor(() => expect(progress().map((c) => JSON.parse(c.body))).toEqual([{ delta: 2.5 }]));
  });

  it('«1,000» is refused next to the field — nothing is sent, nothing is guessed', async () => {
    view();
    await screen.findByTestId('goal-priority');
    fireEvent.change(logField(), { target: { value: '1,000' } });
    fireEvent.click(logBtn());
    const said = await screen.findByText(g.amountAmbiguous);
    expect(logField().getAttribute('aria-invalid')).toBe('true');
    expect(logField().getAttribute('aria-describedby')).toBe(said.id);
    expect(progress()).toEqual([]);
    // Typing again clears it.
    fireEvent.change(logField(), { target: { value: '1000' } });
    expect(screen.queryByText(g.amountAmbiguous)).toBeNull();
  });

  it('«0» or letters say so — never a silent no-op', async () => {
    view();
    await screen.findByTestId('goal-priority');
    fireEvent.change(logField(), { target: { value: 'abc' } });
    fireEvent.click(logBtn());
    expect(await screen.findByText(g.amountInvalid)).toBeTruthy();
    expect(progress()).toEqual([]);
  });

  it('more digits than a number can carry exactly: refused, not rounded', async () => {
    view();
    await screen.findByTestId('goal-priority');
    fireEvent.change(logField(), { target: { value: '999999999.12345678' } });
    fireEvent.click(logBtn());
    expect(await screen.findByText(g.amountTooPrecise)).toBeTruthy();
    expect(progress()).toEqual([]);
  });

  it('a log larger than the target’s own limit is sent — the service caps progress at the target', async () => {
    goals = [G({ id: 'big', title: 'A billion', target_amount: 1_000_000_000, progress: 0, area: 'MONEY' })];
    view();
    await screen.findByTestId('goal-priority');
    fireEvent.change(logField(), { target: { value: '1500000000' } });
    fireEvent.click(logBtn());
    await waitFor(() => expect(progress().map((c) => JSON.parse(c.body))).toEqual([{ delta: 1_500_000_000 }]));
    expect(screen.queryByText(g.amountTooLarge)).toBeNull();
  });

  it('a log above the target’s limit with too many digits is refused beside the field, not rounded and sent', async () => {
    goals = [G({ id: 'big', title: 'A billion', target_amount: 1_000_000_000, progress: 0, area: 'MONEY' })];
    view();
    await screen.findByTestId('goal-priority');
    fireEvent.change(logField(), { target: { value: '1500000000.1234567' } });
    fireEvent.click(logBtn());
    expect(await screen.findByText(g.amountTooPrecise)).toBeTruthy();
    expect(progress()).toEqual([]);
    fireEvent.change(logField(), { target: { value: '1500000000.12345' } });
    fireEvent.click(logBtn());
    await waitFor(() => expect(progress().map((c) => JSON.parse(c.body))).toEqual([{ delta: 1500000000.12345 }]));
  });

  it('…while the same number as a target is refused beside the field', async () => {
    view();
    await screen.findByTestId('goal-priority');
    fireEvent.click(screen.getByTestId('goal-new'));
    fireEvent.change(within(sheet()).getByLabelText(g.fTitle), { target: { value: 'Too big' } });
    fireEvent.change(within(sheet()).getByLabelText(g.fTarget), { target: { value: '1500000000' } });
    fireEvent.click(within(sheet()).getByRole('button', { name: g.save }));
    expect(await within(sheet()).findByText(g.amountTooLarge)).toBeTruthy();
    expect(calls.some((c) => c.url === '/api/bff/life/goals' && c.method === 'POST')).toBe(false);
  });

  it('the sheet’s target: refused next to the target field; nothing is saved; the sheet stays', async () => {
    view();
    await screen.findByTestId('goal-priority');
    fireEvent.click(screen.getByTestId('goal-new'));
    fireEvent.change(within(sheet()).getByLabelText(g.fTitle), { target: { value: 'Phone' } });
    const target = within(sheet()).getByLabelText(g.fTarget);
    fireEvent.change(target, { target: { value: '1,000' } });
    fireEvent.click(within(sheet()).getByRole('button', { name: g.save }));
    const said = await within(sheet()).findByText(g.amountAmbiguous);
    expect(target.getAttribute('aria-describedby')).toBe(said.id);
    expect(calls.some((c) => c.url === '/api/bff/life/goals' && c.method === 'POST')).toBe(false);
    fireEvent.change(target, { target: { value: '١٠٠٠' } });
    fireEvent.click(within(sheet()).getByRole('button', { name: g.save }));
    await waitFor(() => expect(calls.find((c) => c.url === '/api/bff/life/goals' && c.method === 'POST')?.body).toContain('"target_amount":1000'));
  });
});

