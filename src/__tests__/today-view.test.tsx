/**
 * The redesign's Today screen (Phase 1, owner 2026-11-28): each part loads and fails on its own,
 * the coach button says only what is true, and the step's answer shows only after the server
 * kept it. The reads are the existing BFF routes; nothing new is called.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, within } from '@testing-library/react';
import React from 'react';
import { TodayView } from '../app/app/redesign/today/TodayView';
import { todayCopy } from '@/lib/life/today-copy';
import { stepCopy } from '@/lib/life/step-copy';
import { localDayKey } from '@/lib/life/step-week';

const t = todayCopy('en');
const c = stepCopy('en');
const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => ({ success: true, data }) } as Response);
const fail = (status = 500) => ({ ok: false, status, json: async () => ({ error: 'down' }) } as Response);

const STEP_ENTRY = { id: 'e1', problem: 'My Pi is gone on arrival', understanding: 'u', step: 'Set 1π aside the day it arrives', step_outcome: null, created_at: new Date().toISOString(), days: [] };
let routes: Record<string, () => Response>;
let calls: { url: string; method: string; body: string }[];

beforeEach(() => {
  calls = [];
  routes = {
    '/api/auth/me': () => ({ ok: true, status: 200, json: async () => ({ authenticated: true, user: { piUsername: 'sara' } }) } as Response),
    '/api/bff/life/journey': () => ok({ keeping: true, entries: [STEP_ENTRY] }),
    '/api/bff/life/conversations': () => ok({ keeping: false, configured: true, conversations: [] }),
    '/api/bff/life/goals': () => ok({ goals: [
      { id: 'g1', title: 'Save 10π for a phone', description: null, status: 'ACTIVE', target_date: null, target_amount: 10, progress: 4, created_at: '', updated_at: '' },
    ] }),
  };
  vi.stubGlobal('fetch', vi.fn(async (u: RequestInfo | URL, init?: RequestInit) => {
    const url = String(u).split('?')[0]!; const method = init?.method ?? 'GET';
    calls.push({ url, method, body: typeof init?.body === 'string' ? init.body : '' });
    if (method === 'PUT' && url === '/api/bff/life/journey/e1/today') return (routes.put ?? (() => ok({})))();
    return (routes[url] ?? (() => ok({})))();
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const view = (over: Partial<React.ComponentProps<typeof TodayView>> = {}) =>
  render(<TodayView onTalk={vi.fn()} onContinue={vi.fn()} onGoals={vi.fn()} onMenu={vi.fn()} {...over} />);

describe('Today', () => {
  it('shows the coach, today’s step and the closest goal', async () => {
    view();
    expect(await screen.findByText('Set 1π aside the day it arrives')).toBeTruthy();
    expect(await screen.findByText('Save 10π for a phone')).toBeTruthy();
    expect(screen.getByText('4π of 10π · 6π left')).toBeTruthy();
    await waitFor(() => expect(screen.getByTestId('coach-hint').textContent).toBe('It remembers the conversations you kept. The last one: “My Pi is gone on arrival”'));
  });

  it('the coach button starts a conversation', async () => {
    const onTalk = vi.fn();
    view({ onTalk });
    fireEvent.click(screen.getByRole('button', { name: new RegExp(t.talk) }));
    expect(onTalk).toHaveBeenCalledOnce();
  });

  it('journey not kept: the coach promises no memory, and the step says why it is absent', async () => {
    routes['/api/bff/life/journey'] = () => ok({ keeping: false, entries: [] });
    view();
    await waitFor(() => expect(screen.getByTestId('coach-hint').textContent).toBe(t.hint.off));
    expect(await screen.findByText(t.stepOff)).toBeTruthy();
  });

  it('a journey that cannot be read: only the step fails — the coach and the goal still work', async () => {
    routes['/api/bff/life/journey'] = () => fail();
    view();
    const step = screen.getByTestId('today-step');
    expect(await within(step).findByRole('alert')).toBeTruthy();
    expect(screen.getByTestId('coach-hint').textContent).toBe(t.hint.unknown); // never a memory claim
    expect(await screen.findByText('Save 10π for a phone')).toBeTruthy();
    // Try again reads the journey again, and the step appears.
    routes['/api/bff/life/journey'] = () => ok({ keeping: true, entries: [STEP_ENTRY] });
    fireEvent.click(within(step).getByRole('button', { name: t.retry }));
    expect(await screen.findByText('Set 1π aside the day it arrives')).toBeTruthy();
  });

  it('goals that cannot be read fail in their own card; the step is untouched', async () => {
    routes['/api/bff/life/goals'] = () => fail();
    view();
    expect(await within(screen.getByTestId('today-goal')).findByRole('alert')).toBeTruthy();
    expect(await screen.findByText('Set 1π aside the day it arrives')).toBeTruthy();
  });

  it('no goals: says so, and offers to add one', async () => {
    routes['/api/bff/life/goals'] = () => ok({ goals: [] });
    const onGoals = vi.fn();
    view({ onGoals });
    fireEvent.click(await screen.findByRole('button', { name: t.addGoal }));
    expect(onGoals).toHaveBeenCalledOnce();
  });

  it('the step’s answer shows only after the server kept it', async () => {
    view();
    const yes = await screen.findByRole('button', { name: 'Yes' });
    fireEvent.click(yes);
    await waitFor(() => expect(yes.getAttribute('aria-pressed')).toBe('true'));
    const put = calls.find((x) => x.method === 'PUT');
    expect(put?.url).toBe('/api/bff/life/journey/e1/today');
    expect(JSON.parse(put!.body)).toEqual({ day: localDayKey(), answer: 'DONE' });
    expect(screen.getByRole('status').textContent).toBe(c.saved);
  });

  it('a refused answer leaves the step as it was, and says so', async () => {
    routes.put = () => fail();
    view();
    const yes = await screen.findByRole('button', { name: 'Yes' });
    fireEvent.click(yes);
    expect(await within(screen.getByTestId('today-step')).findByText(c.failed)).toBeTruthy();
    expect(yes.getAttribute('aria-pressed')).toBe('false');
  });

  it('reads only the existing routes', async () => {
    view();
    await screen.findByText('Save 10π for a phone');
    const read = new Set(calls.filter((x) => x.method === 'GET').map((x) => x.url));
    expect([...read].sort()).toEqual(['/api/auth/me', '/api/bff/life/conversations', '/api/bff/life/goals', '/api/bff/life/journey']);
  });
});
