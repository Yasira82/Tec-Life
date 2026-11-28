/**
 * The Me screen never shows what is no longer true (owner review of the redesign chain, 28 Nov 2026):
 *   1. after the journey is turned off and the server confirmed it, «I'm becoming…» and the counts are
 *      read again from the source — on a refusal, nothing is re-read and nothing changes;
 *   2. counts that cannot be read say so, with a retry — never 0; at a read cap they say «at least»;
 *   3. the skills list is read again when the editor's sheet closes; a list that cannot be read says so.
 * CONVERSATIONS keeps its own behaviour: turning it off re-reads the counts only.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, within, act } from '@testing-library/react';
import React from 'react';
import { MeView } from '../app/app/redesign/me/MeView';
import { meCopy } from '@/lib/life/me-copy';
import { en } from '@/lib/i18n/dictionaries/en';

vi.mock('@yasser172/tec-auth', () => ({ usePiAuth: () => ({ user: null, isAuthenticated: true, logout: vi.fn() }) }));

const m = meCopy('en');
const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => ({ success: true, data }) } as Response);
const fail = () => ({ ok: false, status: 502, json: async () => ({ error: 'down' }) } as Response);
const entries = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `e${i}`, problem: 'p', understanding: 'u', step: null, step_outcome: null, created_at: '2026-11-20T10:00:00.000Z' }));

// The server, as state: what it keeps changes when a switch is turned off.
let db: { journey: number; convs: number; statement: string | null; skills: string[]; consent: Record<string, boolean> };
let down: Set<string>;
let refusePut: boolean;
let calls: { url: string; method: string; body: string }[];
// A response to hold back: the test releases it when it wants the old read to arrive.
let hold: { url: string; release?: () => void; held: boolean; read?: Promise<void> } | null;

/**
 * Releases the held (old) answer and waits until the app has FINISHED with it — no fixed delay:
 *   1. `hold.read` settles only when the app's own code has read that answer's body (res.json()),
 *      so the old answer provably reached the guard;
 *   2. the guard and everything after it run as microtasks with no timer in between; one macrotask
 *      boundary (setTimeout 0) comes only after the microtask queue is empty — an ordering the event
 *      loop guarantees, not a timing guess.
 */
async function releaseOldAndSettle() {
  await act(async () => {
    hold!.release!();
    await hold!.read;
    await new Promise<void>((r) => setTimeout(r, 0));
  });
}

beforeEach(() => {
  db = { journey: 3, convs: 2, statement: 'someone who plans first', skills: ['Writing'], consent: { JOURNEY: true, CONVERSATIONS: true, GOALS: false } };
  down = new Set(); refusePut = false; calls = []; hold = null;
  vi.stubGlobal('fetch', vi.fn(async (u: RequestInfo | URL, init?: RequestInit) => {
    const url = String(u).split('?')[0]!; const method = init?.method ?? 'GET'; const body = typeof init?.body === 'string' ? init.body : '';
    calls.push({ url, method, body });
    if (down.has(url) && method === 'GET') return fail();
    if (hold && !hold.held && hold.url === url && method === 'GET') {
      // Answer with the server as it is NOW, but only when released — a read started before a change.
      hold.held = true;
      const answer = url === '/api/bff/life/conversations'
        ? ok({ keeping: true, configured: true, conversations: entries(db.convs).map((e) => ({ ...e, readable: true })) })
        : url === '/api/bff/life/skills'
          ? ok({ skills: db.skills.map((name, i) => ({ id: `s${i}`, name, level: 'LEARNING', source: 'SELF_DECLARED', created_at: '', updated_at: '' })) })
          : ok({});
      // Its body read is signalled: the test waits for the app to have read it (releaseOldAndSettle).
      let bodyRead!: () => void;
      hold.read = new Promise<void>((r) => { bodyRead = r; });
      const signalled = { ...answer, json: async () => { const b = await answer.json(); bodyRead(); return b; } } as Response;
      return new Promise<Response>((r) => { hold!.release = () => r(signalled); });
    }
    if (url === '/api/auth/me') return { ok: true, status: 200, json: async () => ({ authenticated: true, user: { piUsername: 'sara' } }) } as Response;
    if (url === '/api/bff/life/journey') return ok({ keeping: db.consent.JOURNEY, entries: db.consent.JOURNEY ? entries(db.journey) : [] });
    if (url === '/api/bff/life/self') return ok({ keeping: db.consent.JOURNEY, statement: db.consent.JOURNEY ? db.statement : null });
    if (url === '/api/bff/life/conversations') return ok({ keeping: db.consent.CONVERSATIONS, configured: true, conversations: db.consent.CONVERSATIONS ? entries(db.convs).map((e) => ({ ...e, readable: true })) : [] });
    if (url === '/api/bff/life/consent' && method === 'PUT') {
      if (refusePut) return fail();
      const asked = JSON.parse(body).consent as Record<string, boolean>;
      for (const [k, v] of Object.entries(asked)) {
        db.consent[k] = v;
        if (!v && k === 'JOURNEY') { db.journey = 0; db.statement = null; }
        if (!v && k === 'CONVERSATIONS') db.convs = 0;
      }
      return ok({ consent: Object.entries(db.consent).map(([category, granted]) => ({ category, granted })) });
    }
    if (url === '/api/bff/life/consent') return ok({ consent: Object.entries(db.consent).map(([category, granted]) => ({ category, granted })) });
    if (url === '/api/bff/life/skills' && method === 'POST') { db.skills.push(JSON.parse(body).name); return ok({ skill: {} }); }
    if (url === '/api/bff/life/skills') return ok({ skills: db.skills.map((name, i) => ({ id: `s${i}`, name, level: 'LEARNING', source: 'SELF_DECLARED', created_at: '', updated_at: '' })) });
    if (url === '/api/bff/life/preferences') return ok({ preferences: {} });
    if (url === '/api/bff/life/intent') return ok({ intent: null });
    if (url.startsWith('/api/bff/life/admin/')) return { ok: false, status: 403, json: async () => ({}) } as Response;
    return ok({});
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const view = () => render(<MeView isPro={false} daysRemaining={null} onOpenJourney={vi.fn()} />);
const counts = () => screen.getByTestId('journey-counts').textContent;
const reads = (url: string) => calls.filter((c) => c.url === url && c.method === 'GET').length;
const turnOff = async (name: string) => {
  fireEvent.click(await screen.findByRole('switch', { name }));
  const box = await screen.findByTestId(`confirm-off-${name === m.keepJourney ? 'JOURNEY' : 'CONVERSATIONS'}`);
  await waitFor(() => expect(box.getAttribute('data-phase')).toBe('ready'));
  fireEvent.click(within(box).getByRole('button', { name: m.offDo }));
  return box;
};

describe('1 — after a keep switch is turned off', () => {
  it('JOURNEY off, confirmed: «I’m becoming…» and the counts are read again — the old ones are gone', async () => {
    view();
    await waitFor(() => expect(counts()).toBe('3 summaries · 2 conversations'));
    expect(await screen.findByText(/someone who plans first/)).toBeTruthy();
    const selfReads = reads('/api/bff/life/self');
    await turnOff(m.keepJourney);
    await waitFor(() => expect(counts()).toBe('0 summaries · 2 conversations'));
    await waitFor(() => expect(screen.queryByText(/someone who plans first/)).toBeNull());
    expect(reads('/api/bff/life/self')).toBeGreaterThan(selfReads);
  });

  it('JOURNEY off, refused: nothing is re-read and nothing on the screen changes', async () => {
    refusePut = true;
    view();
    await waitFor(() => expect(counts()).toBe('3 summaries · 2 conversations'));
    await screen.findByText(/someone who plans first/);
    const before = { j: reads('/api/bff/life/journey'), s: reads('/api/bff/life/self') };
    const box = await turnOff(m.keepJourney);
    await waitFor(() => expect(box.getAttribute('data-phase')).toBe('failed'));
    expect(counts()).toBe('3 summaries · 2 conversations');
    expect(screen.getByText(/someone who plans first/)).toBeTruthy();
    // Only the confirmation's own count read the journey; the screen did not re-read it.
    expect(reads('/api/bff/life/self')).toBe(before.s + 1);
  });

  it('CONVERSATIONS off, confirmed: the counts are read again; «I’m becoming…» is left as it is', async () => {
    view();
    await waitFor(() => expect(counts()).toBe('3 summaries · 2 conversations'));
    await screen.findByText(/someone who plans first/);
    const selfReads = reads('/api/bff/life/self');
    await turnOff(m.keepConvs);
    await waitFor(() => expect(counts()).toBe('3 summaries · 0 conversations'));
    expect(screen.getByText(/someone who plans first/)).toBeTruthy();
    expect(reads('/api/bff/life/self')).toBe(selfReads);
  });
});

describe('1b — a read started before the deletion that answers after it (owner review of 2e0f43f)', () => {
  it('the old counts never come back over the new ones', async () => {
    hold = { url: '/api/bff/life/conversations', held: false };
    view();
    // The first count read is in flight: its journey answer (3 summaries) is in, its conversations held.
    await waitFor(() => expect(hold!.held).toBe(true));
    expect(screen.getByTestId('journey-counts').getAttribute('aria-busy')).toBe('true');
    // The journey is turned off and the server confirms; the new read answers first.
    await turnOff(m.keepJourney);
    await waitFor(() => expect(counts()).toBe('0 summaries · 2 conversations'));
    // Now the old read arrives — with the deleted 3 summaries in it.
    await releaseOldAndSettle();
    expect(counts()).toBe('0 summaries · 2 conversations');
  });
});

describe('2 — counts that cannot be read', () => {
  it('summaries that cannot be read: said, with a retry — never «0»', async () => {
    down.add('/api/bff/life/journey');
    view();
    const failed = await screen.findByTestId('journey-counts-failed');
    expect(failed.textContent).toContain(m.countsFailed);
    expect(screen.queryByTestId('journey-counts')).toBeNull();
    expect(screen.getByTestId('me-journey').textContent).not.toMatch(/\b0 summaries/);
    down.clear();
    fireEvent.click(within(failed).getByRole('button', { name: m.retry }));
    await waitFor(() => expect(counts()).toBe('3 summaries · 2 conversations'));
  });

  it('conversations that cannot be read: the same', async () => {
    down.add('/api/bff/life/conversations');
    view();
    expect(await screen.findByTestId('journey-counts-failed')).toBeTruthy();
    expect(screen.getByTestId('me-journey').textContent).not.toMatch(/\b0 conversations/);
  });

  it('a list at its read cap says «at least» — 500 summaries, 200 conversations', async () => {
    db.journey = 500; db.convs = 200;
    view();
    await waitFor(() => expect(counts()).toBe('at least 500 summaries · at least 200 conversations'));
  });

  it('below the cap the number is exact', async () => {
    db.journey = 499; db.convs = 199;
    view();
    await waitFor(() => expect(counts()).toBe('499 summaries · 199 conversations'));
  });
});

describe('3 — the skills list', () => {
  it('a skill added in the sheet is on the list once the sheet closes', async () => {
    view();
    const list = screen.getByTestId('me-skills');
    expect(await within(list).findByText('Writing')).toBeTruthy();
    fireEvent.click(within(list).getByRole('button', { name: m.manage }));
    const sheet = screen.getByTestId('skills-sheet');
    fireEvent.change(within(sheet).getByPlaceholderText(en.life.skills.addPlaceholder), { target: { value: 'Graphic design' } });
    fireEvent.click(within(sheet).getByRole('button', { name: en.life.skills.add }));
    await waitFor(() => expect(calls.some((c) => c.url === '/api/bff/life/skills' && c.method === 'POST')).toBe(true));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(await within(screen.getByTestId('me-skills')).findByText('Graphic design')).toBeTruthy();
  });

  it('a read started before the edit that answers after it never puts the older list back (owner review of e41a4b1)', async () => {
    hold = { url: '/api/bff/life/skills', held: false };
    view();
    // The list's first read is in flight, holding the list as it was: «Writing» only.
    await waitFor(() => expect(hold!.held).toBe(true));
    const list = screen.getByTestId('me-skills');
    fireEvent.click(within(list).getByRole('button', { name: m.manage }));
    const sheet = screen.getByTestId('skills-sheet');
    fireEvent.change(within(sheet).getByPlaceholderText(en.life.skills.addPlaceholder), { target: { value: 'Graphic design' } });
    fireEvent.click(within(sheet).getByRole('button', { name: en.life.skills.add }));
    await waitFor(() => expect(calls.some((c) => c.url === '/api/bff/life/skills' && c.method === 'POST')).toBe(true));
    fireEvent.keyDown(window, { key: 'Escape' });
    // The read after the edit answers first…
    expect(await within(screen.getByTestId('me-skills')).findByText('Graphic design')).toBeTruthy();
    // …then the old one arrives, without «Graphic design» in it.
    await releaseOldAndSettle();
    expect(within(screen.getByTestId('me-skills')).getByText('Graphic design')).toBeTruthy();
  });

  it('a list that cannot be read says so, with a retry — not «no skills»', async () => {
    down.add('/api/bff/life/skills');
    view();
    const failed = await screen.findByTestId('skills-failed');
    expect(failed.textContent).toContain(m.skillsFailed);
    expect(screen.queryByText(m.noSkills)).toBeNull();
    down.clear();
    fireEvent.click(within(failed).getByRole('button', { name: m.retry }));
    expect(await within(screen.getByTestId('me-skills')).findByText('Writing')).toBeTruthy();
  });
});
