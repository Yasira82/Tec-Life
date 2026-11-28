/**
 * The redesign's «My mirror» screen (Phase 1, owner 2026-11-28): each part loads and fails on its
 * own, the numbers are Life's own, nothing is read into the records without enough evidence, and no
 * AI, Analytics or write request is made.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, within, act } from '@testing-library/react';
import React from 'react';
import { MirrorView } from '../app/app/redesign/mirror/MirrorView';
import { mirrorCopy } from '@/lib/life/mirror-copy';
import { localDayKey, shiftDay } from '@/lib/life/step-week';

const m = mirrorCopy('en');
const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => ({ success: true, data }) } as Response);
const fail = () => ({ ok: false, status: 502, json: async () => ({ error: 'down' }) } as Response);

const TODAY = localDayKey();
const ago = (n: number) => shiftDay(TODAY, -n);
const at = (n: number) => new Date(`${ago(n)}T12:00:00`).toISOString();
const entry = (id: string, n: number, extra: object = {}) => ({ id, problem: `topic ${id}`, understanding: 'u', step: null, step_outcome: null, created_at: at(n), ...extra });
const traj = (active: number, done: number) => ({ trajectory: { window_days: 7, entries: active, active_days: active, pi_logged: 0, pi_per_week: 0, first_entry_at: null, completed_in_window: done, projectable: false, goals: [] } });

let calls: { url: string; method: string }[];
let routes: Record<string, (url: string) => Response | Promise<Response>>;
const RICH = [
  entry('a', 1, { step: 'Save 2π on payday', helped: 'A small step on payday', days: [{ day: ago(1), answer: 'DONE' }, { day: ago(2), answer: 'PARTLY' }] }),
  entry('b', 8), entry('c', 15), entry('d', 20, { practice: 'I check my spending on Sundays' }),
];

beforeEach(() => {
  calls = [];
  routes = {
    '/api/bff/life/journey': () => ok({ keeping: true, entries: RICH }),
    '/api/bff/life/trajectory': (u) => ok(traj(u.includes('=90') ? 9 : 3, u.includes('=90') ? 2 : 1)),
  };
  vi.stubGlobal('fetch', vi.fn(async (u: RequestInfo | URL, init?: RequestInit) => {
    const url = String(u); calls.push({ url, method: init?.method ?? 'GET' });
    const r = routes[url.split('?')[0]!];
    return r ? r(url) : fail();
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const view = () => render(<MirrorView onTalk={vi.fn()} />);
const period = (label: string) => fireEvent.click(screen.getByRole('button', { name: label }));

describe('My mirror — what happened', () => {
  it('a week: Life’s own counts, the step days and the seven-day bars', async () => {
    view();
    await waitFor(() => expect(screen.getByTestId('stat-progress-days').textContent).toContain('3'));
    expect(screen.getByTestId('stat-goals-done').textContent).toContain('1');
    expect(screen.getByTestId('stat-summaries').textContent).toContain('1');
    expect(screen.getByTestId('stat-step-days').textContent).toContain('1');
    expect(screen.getByTestId('mirror-week').querySelectorAll('[data-answer="DONE"]')).toHaveLength(1);
    expect(calls.some((c) => c.url === '/api/bff/life/trajectory?window_days=7')).toBe(true);
  });

  it('3 months: the trajectory for 90 days; step days are not stretched past the 14 Life keeps', async () => {
    view();
    await screen.findByTestId('stat-summaries');
    period(m.period.m3);
    await waitFor(() => expect(screen.getByTestId('stat-progress-days').textContent).toContain('9'));
    expect(screen.getByTestId('stat-summaries').textContent).toContain('4');
    expect(screen.getByTestId('stat-step-days').textContent).toContain('—');
    expect(screen.getByTestId('stat-step-days').textContent).toContain(m.only14);
    expect(screen.queryByTestId('mirror-week')).toBeNull();
  });

  it('an answer for a period no longer on screen is ignored', async () => {
    let release!: () => void;
    routes['/api/bff/life/trajectory'] = (u) => (u.includes('=7')
      ? new Promise<Response>((r) => { release = () => r(ok(traj(77, 7))); })
      : ok(traj(30, 3)));
    view();
    period(m.period.month);
    await waitFor(() => expect(screen.getByTestId('stat-progress-days').textContent).toContain('30'));
    await act(async () => { release(); });
    expect(screen.getByTestId('stat-progress-days').textContent).toContain('30');
  });
});

describe('My mirror — each part on its own', () => {
  it('progress that cannot be read: its own card says so; the rest still shows; retry works', async () => {
    routes['/api/bff/life/trajectory'] = () => fail();
    view();
    const card = within(screen.getByTestId('mirror-progress'));
    expect(await card.findByRole('alert')).toBeTruthy();
    expect(await screen.findByTestId('stat-summaries')).toBeTruthy();
    expect(screen.getByTestId('mirror-step')).toBeTruthy();
    routes['/api/bff/life/trajectory'] = () => ok(traj(4, 0));
    fireEvent.click(card.getByRole('button', { name: m.retry }));
    await waitFor(() => expect(screen.getByTestId('stat-progress-days').textContent).toContain('4'));
  });

  it('a journey that cannot be read: its parts say so with a retry; progress still shows', async () => {
    routes['/api/bff/life/journey'] = () => fail();
    view();
    await waitFor(() => expect(screen.getByTestId('stat-progress-days')).toBeTruthy());
    for (const id of ['mirror-journey', 'mirror-learned', 'mirror-next']) {
      expect(within(screen.getByTestId(id)).getByRole('alert').textContent).toContain(m.failed);
    }
    expect(screen.queryByTestId('stat-summaries')).toBeNull();
    routes['/api/bff/life/journey'] = () => ok({ keeping: true, entries: RICH });
    fireEvent.click(within(screen.getByTestId('mirror-next')).getByRole('button', { name: m.retry }));
    expect(await screen.findByTestId('stat-summaries')).toBeTruthy();
  });

  it('journey not kept: says so — no zeros that would read as «you did nothing»', async () => {
    routes['/api/bff/life/journey'] = () => ok({ keeping: false, entries: [] });
    view();
    await waitFor(() => expect(screen.getByTestId('mirror-journey').textContent).toContain(m.journeyOff));
    expect(screen.queryByTestId('stat-summaries')).toBeNull();
    expect(screen.getByTestId('mirror-learned').textContent).toContain(m.journeyOff);
    expect(screen.getByTestId('mirror-next').textContent).toContain(m.stepOff);
  });
});

describe('My mirror — what did I learn (the evidence rule)', () => {
  it('not enough: no reading, the conditions and where the person stands on each', async () => {
    view();
    const box = await screen.findByTestId('mirror-not-enough');
    expect(box.textContent).toContain(m.notEnough);
    // A week: 3 records (one summary, two step answers) on 2 days, 1 day apart.
    expect(box.textContent).toContain('5 or more steps or summaries (you have 3)');
    expect(box.textContent).toContain('on 3 or more different days (you have 2)');
    expect(box.textContent).toContain('over 14 or more days (you have 1)');
    expect(screen.queryByTestId('mirror-own')).toBeNull();
  });

  it('enough: only the person’s own confirmed words, said as theirs, with the records behind them', async () => {
    view();
    await screen.findByTestId('stat-summaries');
    period(m.period.m3);
    const own = await screen.findByTestId('mirror-own');
    expect(own.textContent).toContain('A small step on payday');
    expect(own.textContent).toContain('I check my spending on Sundays');
    expect(own.textContent).toContain(m.ownNote);
    const records = within(own).getByTestId('mirror-records');
    expect(records.textContent).toContain('See the records (6)');
    expect(records.textContent).toContain('Step partly done');
  });

  it('enough, but no words of theirs: says so — nothing is made up to fill it', async () => {
    routes['/api/bff/life/journey'] = () => ok({ keeping: true, entries: RICH.map((e) => ({ ...e, helped: null, practice: null })) });
    view();
    await screen.findByTestId('stat-summaries');
    period(m.period.m3);
    expect((await screen.findByTestId('mirror-own')).textContent).toContain(m.noLessons);
  });
});

describe('My mirror — what next, and what it never does', () => {
  it('the step being followed; with none, the way to the coach', async () => {
    const onTalk = vi.fn();
    routes['/api/bff/life/journey'] = () => ok({ keeping: true, entries: [entry('z', 1)] });
    render(<MirrorView onTalk={onTalk} />);
    const next = await screen.findByText(m.noStep);
    fireEvent.click(within(next.parentElement!).getByRole('button', { name: m.talk }));
    expect(onTalk).toHaveBeenCalledOnce();
  });

  it('reads only Life’s journey and trajectory — no AI, no Analytics, no writes', async () => {
    view();
    await screen.findByTestId('stat-summaries');
    period(m.period.month); period(m.period.m3);
    await screen.findByTestId('mirror-own');
    const paths = new Set(calls.map((c) => c.url.split('?')[0]));
    expect([...paths].sort()).toEqual(['/api/bff/life/journey', '/api/bff/life/trajectory']);
    expect(calls.every((c) => c.method === 'GET')).toBe(true);
  });
});
