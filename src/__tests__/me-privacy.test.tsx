/**
 * The redesign's privacy section (Phase 1; owner review of #132, 28 Nov 2026). Three groups that say
 * what the code does. Turning JOURNEY or CONVERSATIONS off deletes what it kept, so:
 *   • it counts first, and cannot be confirmed until the count is known;
 *   • a count that cannot be read says so, offers a retry, and nothing to delete;
 *   • the count is never more precise than the reads allow («at least» at the service's cap),
 *     and JOURNEY names «I'm becoming…» when there is one, because it is deleted too;
 *   • nothing is sent until the person confirms; the confirmation stays while the server works,
 *     closes only on success, and a refusal stays on screen with the switch at the server's truth.
 * Settings that cannot be loaded say so, with a retry; any other switch that fails to save says so.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, within, act } from '@testing-library/react';
import React from 'react';
import { MePrivacy } from '../app/app/redesign/me/MePrivacy';
import { meCopy } from '@/lib/life/me-copy';
import { en } from '@/lib/i18n/dictionaries/en';
import { journeyDeletion, conversationsDeletion } from '@/lib/life/deletion-count';

const m = meCopy('en');
const p = en.life.privacy;
const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => ({ success: true, data }) } as Response);
const fail = (status = 500) => ({ ok: false, status, json: async () => ({ error: 'down' }) } as Response);

let consent: { category: string; granted: boolean }[];
let calls: { url: string; method: string; body: string }[];
let routes: Record<string, () => Response | Promise<Response>>;

const entries = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `e${i}` }));
beforeEach(() => {
  calls = [];
  consent = [
    { category: 'GOALS', granted: true }, { category: 'SKILLS', granted: false }, { category: 'BUDGET', granted: false },
    { category: 'INTENT', granted: false }, { category: 'CHECKIN', granted: true },
    { category: 'JOURNEY', granted: true }, { category: 'CONVERSATIONS', granted: true },
  ];
  routes = {
    'GET /api/bff/life/consent': () => ok({ consent }),
    'PUT /api/bff/life/consent': () => ok({ consent }),
    'GET /api/bff/life/journey': () => ok({ keeping: true, entries: entries(3) }),
    'GET /api/bff/life/self': () => ok({ keeping: true, statement: null }),
    'GET /api/bff/life/conversations': () => ok({ keeping: true, configured: true, conversations: entries(2) }),
    'GET /api/bff/life/intent': () => ok({ intent: null }),
    'DELETE /api/bff/life/data': () => ok({ deleted: {} }),
  };
  vi.stubGlobal('fetch', vi.fn(async (u: RequestInfo | URL, init?: RequestInit) => {
    const url = String(u); const method = init?.method ?? 'GET'; const body = typeof init?.body === 'string' ? init.body : '';
    calls.push({ url, method, body });
    if (method === 'PUT' && url === '/api/bff/life/consent') {
      const r = await routes['PUT /api/bff/life/consent']!();
      if (r.ok) {
        const asked = JSON.parse(body).consent as Record<string, boolean>;
        consent = consent.map((c) => (c.category in asked ? { ...c, granted: asked[c.category]! } : c));
        return ok({ consent });
      }
      return r;
    }
    return (routes[`${method} ${url}`] ?? (() => ok({})))();
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const puts = () => calls.filter((c) => c.url === '/api/bff/life/consent' && c.method === 'PUT').map((c) => JSON.parse(c.body).consent);
const box = (cat: string) => screen.getByTestId(`confirm-off-${cat}`);
const phase = (cat: string) => box(cat).getAttribute('data-phase');
const turnOff = async (name: string) => fireEvent.click(await screen.findByRole('switch', { name }));

describe('deletion-count', () => {
  it('unknown when any read failed', () => {
    expect(journeyDeletion(null, { keeping: true, statement: null })).toBeNull();
    expect(journeyDeletion({ keeping: true, entries: [] }, null)).toBeNull();
    expect(conversationsDeletion(null)).toBeNull();
  });
  it('exact below the cap; «at least» at it; «I’m becoming» when there is one', () => {
    expect(journeyDeletion({ keeping: true, entries: entries(3) as never }, { keeping: true, statement: '  ' })).toEqual({ n: 3, atLeast: false, self: false });
    expect(journeyDeletion({ keeping: true, entries: entries(500) as never }, { keeping: true, statement: 'kind' })).toEqual({ n: 500, atLeast: true, self: true });
    expect(conversationsDeletion({ keeping: true, configured: true, conversations: entries(200) as never })).toEqual({ n: 200, atLeast: true, self: false });
  });
});

describe('MePrivacy — the three groups', () => {
  it('what Life keeps, what TEC AI may read (with the provider note), the reminder', async () => {
    render(<MePrivacy />);
    await screen.findByRole('switch', { name: m.keepJourney });
    const text = screen.getByTestId('me-privacy').textContent!;
    const keep = text.indexOf(m.gKeep), hub = text.indexOf(m.gHub), rem = text.indexOf(m.gReminder);
    expect(keep).toBeGreaterThan(-1); expect(hub).toBeGreaterThan(keep); expect(rem).toBeGreaterThan(hub);
    expect(text.indexOf(m.keepConvs)).toBeLessThan(hub);
    expect(text.indexOf(p.goals)).toBeGreaterThan(hub);
    expect(text.indexOf(p.checkin)).toBeGreaterThan(rem);
    expect(screen.getByRole('note').textContent).toBe(p.shareProvider);
  });

  it('JOURNEY off, CONVERSATIONS on: kept but not read by the coach', async () => {
    consent = consent.map((c) => (c.category === 'JOURNEY' ? { ...c, granted: false } : c));
    render(<MePrivacy />);
    expect(await screen.findByTestId('stored-not-read')).toBeTruthy();
  });
});

describe('MePrivacy — turning a keep switch off', () => {
  it('cannot be confirmed while counting, and sends nothing', async () => {
    let release!: () => void;
    routes['GET /api/bff/life/journey'] = () => new Promise<Response>((r) => { release = () => r(ok({ keeping: true, entries: entries(3) })); });
    render(<MePrivacy />);
    await turnOff(m.keepJourney);
    expect(phase('JOURNEY')).toBe('counting');
    expect((within(box('JOURNEY')).getByRole('button', { name: m.offDo }) as HTMLButtonElement).disabled).toBe(true);
    await act(async () => { release(); });
    await waitFor(() => expect(phase('JOURNEY')).toBe('ready'));
    expect(puts()).toEqual([]);
  });

  it('the exact count, then the request only after Confirm; closes on success', async () => {
    render(<MePrivacy />);
    await turnOff(m.keepJourney);
    await waitFor(() => expect(box('JOURNEY').textContent).toContain('This deletes 3 summaries and cannot be undone.'));
    expect(puts()).toEqual([]);
    fireEvent.click(within(box('JOURNEY')).getByRole('button', { name: m.offDo }));
    await waitFor(() => expect(screen.queryByTestId('confirm-off-JOURNEY')).toBeNull());
    expect(puts()).toEqual([{ JOURNEY: false }]);
    expect(screen.getByRole('switch', { name: m.keepJourney }).getAttribute('aria-checked')).toBe('false');
  });

  it('names «I’m becoming…» when it exists, and says «at least» at the read cap', async () => {
    routes['GET /api/bff/life/journey'] = () => ok({ keeping: true, entries: entries(500) });
    routes['GET /api/bff/life/self'] = () => ok({ keeping: true, statement: 'someone who plans first' });
    render(<MePrivacy />);
    await turnOff(m.keepJourney);
    await waitFor(() => expect(box('JOURNEY').textContent).toContain('This deletes at least 500 summaries and your «I’m becoming» sentence'));
  });

  it('summaries that cannot be counted: says so, offers a retry, nothing to delete', async () => {
    routes['GET /api/bff/life/journey'] = () => fail();
    render(<MePrivacy />);
    await turnOff(m.keepJourney);
    await waitFor(() => expect(phase('JOURNEY')).toBe('countFailed'));
    expect(box('JOURNEY').textContent).toContain(m.countFailed);
    expect(within(box('JOURNEY')).queryByRole('button', { name: m.offDo })).toBeNull();
    expect(box('JOURNEY').textContent).not.toMatch(/\d+ summaries/);
    routes['GET /api/bff/life/journey'] = () => ok({ keeping: true, entries: entries(4) });
    fireEvent.click(within(box('JOURNEY')).getByRole('button', { name: m.retry }));
    await waitFor(() => expect(box('JOURNEY').textContent).toContain('This deletes 4 summaries'));
    expect(puts()).toEqual([]);
  });

  it('«I’m becoming» that cannot be read is a count that cannot be read', async () => {
    routes['GET /api/bff/life/self'] = () => fail();
    render(<MePrivacy />);
    await turnOff(m.keepJourney);
    await waitFor(() => expect(phase('JOURNEY')).toBe('countFailed'));
  });

  it('conversations that cannot be counted: says so, nothing to delete', async () => {
    routes['GET /api/bff/life/conversations'] = () => fail();
    render(<MePrivacy />);
    await turnOff(m.keepConvs);
    await waitFor(() => expect(phase('CONVERSATIONS')).toBe('countFailed'));
    expect(within(box('CONVERSATIONS')).queryByRole('button', { name: m.offDo })).toBeNull();
    expect(puts()).toEqual([]);
  });

  it('a refused request: the confirmation stays and says so; the switch shows the server’s truth', async () => {
    routes['PUT /api/bff/life/consent'] = () => fail();
    render(<MePrivacy />);
    await turnOff(m.keepConvs);
    await waitFor(() => expect(phase('CONVERSATIONS')).toBe('ready'));
    fireEvent.click(within(box('CONVERSATIONS')).getByRole('button', { name: m.offDo }));
    await waitFor(() => expect(phase('CONVERSATIONS')).toBe('failed'));
    expect(box('CONVERSATIONS').textContent).toContain(m.offFailed);
    expect(screen.getByRole('switch', { name: m.keepConvs }).getAttribute('aria-checked')).toBe('true');
    // It can be tried again from the same place.
    routes['PUT /api/bff/life/consent'] = () => ok({ consent });
    fireEvent.click(within(box('CONVERSATIONS')).getByRole('button', { name: m.offDo }));
    await waitFor(() => expect(screen.queryByTestId('confirm-off-CONVERSATIONS')).toBeNull());
    expect(screen.getByRole('switch', { name: m.keepConvs }).getAttribute('aria-checked')).toBe('false');
  });

  it('«Keep it on» sends nothing', async () => {
    render(<MePrivacy />);
    await turnOff(m.keepConvs);
    await waitFor(() => expect(phase('CONVERSATIONS')).toBe('ready'));
    fireEvent.click(within(box('CONVERSATIONS')).getByRole('button', { name: m.offKeep }));
    expect(screen.queryByTestId('confirm-off-CONVERSATIONS')).toBeNull();
    expect(puts()).toEqual([]);
  });
});

describe('MePrivacy — loading and saving', () => {
  it('settings that cannot be loaded say so, with a retry — never an empty screen', async () => {
    routes['GET /api/bff/life/consent'] = () => fail();
    render(<MePrivacy />);
    const failed = await screen.findByTestId('privacy-load-failed');
    expect(failed.textContent).toContain(m.loadFailed);
    expect(screen.queryByRole('switch')).toBeNull();
    routes['GET /api/bff/life/consent'] = () => ok({ consent });
    fireEvent.click(within(failed).getByRole('button', { name: m.retry }));
    expect(await screen.findByRole('switch', { name: m.keepJourney })).toBeTruthy();
  });

  it('another switch that fails to save says so, and shows the server’s truth', async () => {
    routes['PUT /api/bff/life/consent'] = () => fail();
    render(<MePrivacy />);
    fireEvent.click(await screen.findByRole('switch', { name: p.skills }));
    expect(await screen.findByTestId('privacy-save-failed')).toBeTruthy();
    await waitFor(() => expect(screen.getByRole('switch', { name: p.skills }).getAttribute('aria-checked')).toBe('false'));
  });

  it('turning a keep switch ON, or a TEC AI switch, needs no confirmation', async () => {
    consent = consent.map((c) => (c.category === 'JOURNEY' ? { ...c, granted: false } : c));
    render(<MePrivacy />);
    await turnOff(m.keepJourney);
    await waitFor(() => expect(puts()).toEqual([{ JOURNEY: true }]));
    fireEvent.click(screen.getByRole('switch', { name: p.skills }));
    await waitFor(() => expect(puts()).toEqual([{ JOURNEY: true }, { SKILLS: true }]));
  });

  it('delete my Life data: two taps, the existing route', async () => {
    render(<MePrivacy />);
    await screen.findByRole('switch', { name: m.keepJourney });
    fireEvent.click(screen.getByRole('button', { name: p.delete }));
    expect(calls.some((c) => c.url === '/api/bff/life/data')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: p.confirm }));
    await waitFor(() => expect(calls.find((c) => c.url === '/api/bff/life/data')?.method).toBe('DELETE'));
  });
});
