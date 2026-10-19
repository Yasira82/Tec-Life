/**
 * Keeping full conversations — opt-in (owner, 2026-10-18). Pinned:
 *   • off by default: the words go to the talk route only, nothing is saved;
 *   • the person turns it on by a tap that says what it does;
 *   • when on, each answered turn is saved under ONE id, to Life's own route;
 *   • a kept conversation can be continued from My journey, and deleted there.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import React from 'react';
import { ProblemSession } from '../app/app/components/ProblemSession';
import { JourneyView } from '../app/app/components/JourneyView';
import { sessionCopy } from '@/lib/life/session-copy';

const s = sessionCopy('en');
const MARKER = 'ZQX-private-marker-7781';
let calls: { url: string; method: string; body: string }[] = [];
let convs: unknown;
const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => ({ success: true, data }) } as Response);
const KEPT = { id: '3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e', message_count: 3, created_at: '2026-10-17T10:00:00.000Z', updated_at: '2026-10-17T10:05:00.000Z', preview: 'I worry about the future', readable: true };

beforeEach(() => {
  calls = []; convs = { keeping: false, configured: true, conversations: [] };
  vi.stubGlobal('fetch', vi.fn(async (u: RequestInfo | URL, init?: RequestInit) => {
    const url = String(u); const method = init?.method ?? 'GET';
    calls.push({ url, method, body: typeof init?.body === 'string' ? init.body : '' });
    if (url === '/api/bff/life/conversations') return ok(convs);
    if (url.startsWith('/api/bff/life/conversations/') && method === 'GET') return ok({ messages: [{ role: 'assistant', content: 'opener' }, { role: 'user', content: 'I worry about the future' }, { role: 'assistant', content: 'Tell me more.' }] });
    if (url === '/api/bff/life/talk') return ok({ reply: 'I hear you.' });
    if (url === '/api/bff/life/journey') return ok({ keeping: false, entries: [] });
    return ok({});
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

/** My journey → the conversations tab → the row of the kept conversation. */
const openKept = async () => {
  fireEvent.click(await screen.findByRole('tab', { name: new RegExp(s.cTitle) }));
  fireEvent.click(await screen.findByRole('button', { name: /I worry about the future/ }));
};
const saves = () => calls.filter((c) => c.method === 'PUT' && c.url.startsWith('/api/bff/life/conversations/'));
const say = async (text: string, n: number) => {
  fireEvent.change(screen.getByRole('textbox'), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: s.send }));
  await waitFor(() => expect(screen.getAllByText('I hear you.').length).toBe(n));
};

describe('off by default', () => {
  it('nothing is saved; the screen offers the switch and says what it does', async () => {
    render(<ProblemSession onClose={vi.fn()} />);
    await screen.findByRole('button', { name: s.fullTurnOn });
    expect(screen.getByText(s.fullTurnOnNote)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: s.agree }));
    await say(`hello ${MARKER}`, 1);
    expect(saves()).toEqual([]);
    expect(calls.filter((c) => c.body.includes(MARKER)).map((c) => c.url)).toEqual(['/api/bff/life/talk']);
  });

  it('no key on the server → the switch is not offered at all', async () => {
    convs = { keeping: false, configured: false, conversations: [] };
    render(<ProblemSession onClose={vi.fn()} />);
    await waitFor(() => expect(calls.some((c) => c.url === '/api/bff/life/conversations')).toBe(true));
    expect(screen.queryByRole('button', { name: s.fullTurnOn })).toBeNull();
  });
});

describe('on', () => {
  it('the tap turns it on; then every answered turn is saved under one id', async () => {
    render(<ProblemSession onClose={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: s.fullTurnOn }));
    await screen.findByText(s.fullOn);
    expect(JSON.parse(calls.find((c) => c.url === '/api/bff/life/consent')!.body)).toEqual({ consent: { CONVERSATIONS: true } });
    fireEvent.click(screen.getByRole('button', { name: s.agree }));
    await say('first', 1);
    await say('second', 2);
    await waitFor(() => expect(saves()).toHaveLength(2));
    expect(new Set(saves().map((c) => c.url)).size).toBe(1);
    expect(JSON.parse(saves()[1]!.body).messages).toHaveLength(5);
    expect(Object.keys(JSON.parse(saves()[1]!.body))).toEqual(['messages']);
  });

  it('a conversation continued from My journey goes on under its own id', async () => {
    convs = { keeping: true, configured: true, conversations: [KEPT] };
    const onContinue = vi.fn();
    render(<JourneyView onContinue={onContinue} />);
    await openKept();
    fireEvent.click(screen.getByRole('button', { name: s.cContinue }));
    await waitFor(() => expect(onContinue).toHaveBeenCalled());
    const r = onContinue.mock.calls[0]![0];
    expect(r.id).toBe(KEPT.id);
    cleanup();
    render(<ProblemSession onClose={vi.fn()} resume={r} />);
    expect(screen.getByText('Tell me more.')).toBeTruthy();
    await say('more', 1);
    await waitFor(() => expect(saves()).toHaveLength(1));
    expect(saves()[0]!.url).toBe(`/api/bff/life/conversations/${KEPT.id}`);
  });

  it('deleting a kept conversation takes two taps', async () => {
    convs = { keeping: true, configured: true, conversations: [KEPT] };
    render(<JourneyView onContinue={vi.fn()} />);
    await openKept();
    fireEvent.click(screen.getByRole('button', { name: s.jDelete }));
    expect(calls.filter((c) => c.method === 'DELETE')).toEqual([]);
    fireEvent.click(screen.getByRole('button', { name: s.jConfirm }));
    await waitFor(() => expect(screen.queryByText('I worry about the future')).toBeNull());
    expect(calls.find((c) => c.method === 'DELETE')!.url).toBe(`/api/bff/life/conversations/${KEPT.id}`);
  });
});

describe('a deleted conversation stays deleted (owner, 2026-10-18: "I delete it and it is not deleted")', () => {
  const OPEN = { ...KEPT, id: '7a1c2e3f-5b6d-4e7f-9a0b-1c2d3e4f5a6b' };

  it('deleting the conversation that is open closes it, and its next reply does not write it back', async () => {
    convs = { keeping: true, configured: true, conversations: [OPEN] };
    const onClose = vi.fn();
    const resume = { id: OPEN.id, messages: [{ role: 'assistant' as const, content: 'opener' }, { role: 'user' as const, content: 'I worry about the future' }, { role: 'assistant' as const, content: 'Tell me more.' }] };
    render(<><ProblemSession onClose={onClose} resume={resume} /><JourneyView onContinue={vi.fn()} /></>);
    await openKept();
    fireEvent.click(screen.getByRole('button', { name: s.jDelete }));
    fireEvent.click(screen.getByRole('button', { name: s.jConfirm }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(saves()).toEqual([]);
  });

  it('a delete that fails says so, and the conversation stays listed', async () => {
    const FAIL = { ...KEPT, id: '9b8a7c6d-1e2f-4a3b-8c4d-5e6f7a8b9c0d' };
    convs = { keeping: true, configured: true, conversations: [FAIL] };
    const base = vi.mocked(fetch).getMockImplementation()!;
    vi.mocked(fetch).mockImplementation(async (u, init) =>
      init?.method === 'DELETE' ? ({ ok: false, status: 502, json: async () => ({}) } as Response) : base(u, init));
    render(<JourneyView onContinue={vi.fn()} />);
    await openKept();
    fireEvent.click(screen.getByRole('button', { name: s.jDelete }));
    fireEvent.click(screen.getByRole('button', { name: s.jConfirm }));
    expect(await screen.findByText(s.cDeleteFailed)).toBeTruthy();
    expect(screen.getAllByText('I worry about the future').length).toBeGreaterThan(0);
  });
});

describe('a conversation that cannot be opened says so', () => {
  it('Continue on an unreadable conversation shows a message, not nothing', async () => {
    convs = { keeping: true, configured: true, conversations: [KEPT] };
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockImplementation(async (u: RequestInfo | URL) =>
      String(u) === '/api/bff/life/conversations' ? ok(convs)
      : String(u).startsWith('/api/bff/life/conversations/') ? ({ ok: false, status: 503, json: async () => ({}) } as Response)
      : ok({ keeping: false, entries: [] }));
    const onContinue = vi.fn();
    render(<JourneyView onContinue={onContinue} />);
    await openKept();
    fireEvent.click(screen.getByRole('button', { name: s.cContinue }));
    await screen.findByText(s.cOpenFailed);
    expect(onContinue).not.toHaveBeenCalled();
  });
});

describe('a conversation does not end unless the person ends it (owner, 2026-10-18)', () => {
  it('Home offers to continue the last kept conversation, and opens it', async () => {
    convs = { keeping: true, configured: true, conversations: [KEPT] };
    const onContinue = vi.fn();
    const { ProblemSessionEntry } = await import('../app/app/components/ProblemSession');
    render(<ProblemSessionEntry onStart={vi.fn()} onContinue={onContinue} />);
    fireEvent.click(await screen.findByRole('button', { name: s.continueLast }));
    await waitFor(() => expect(onContinue).toHaveBeenCalled());
    expect(onContinue.mock.calls[0]![0].id).toBe(KEPT.id);
    expect(screen.getByRole('button', { name: s.startNew })).toBeTruthy();
  });

  it('nothing kept → only the usual Start', async () => {
    const { ProblemSessionEntry } = await import('../app/app/components/ProblemSession');
    render(<ProblemSessionEntry onStart={vi.fn()} onContinue={vi.fn()} />);
    await waitFor(() => expect(calls.some((c) => c.url === '/api/bff/life/conversations')).toBe(true));
    expect(screen.queryByRole('button', { name: s.continueLast })).toBeNull();
    expect(screen.getByRole('button', { name: s.entryCta })).toBeTruthy();
  });

  it('a continued conversation does not ask about the last step', async () => {
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockImplementation(async (u: RequestInfo | URL) =>
      String(u) === '/api/bff/life/journey'
        ? ok({ keeping: true, entries: [{ id: 'j1', problem: 'p', understanding: 'u', step: 'Phone in the kitchen', step_outcome: null, created_at: '2026-10-10T09:00:00.000Z' }] })
        : ok(convs));
    render(<ProblemSession onClose={vi.fn()} resume={{ id: KEPT.id, messages: [{ role: 'assistant', content: 'opener' }, { role: 'user', content: 'hi' }, { role: 'assistant', content: 'Tell me more.' }] }} />);
    expect(screen.getByText('Tell me more.')).toBeTruthy();
    await new Promise((r) => setTimeout(r, 50)); // let the journey read land
    expect(screen.queryByText(s.lastStepQ.replace('{step}', 'Phone in the kitchen'))).toBeNull();
  });

  it('switching tabs does not close the conversation — only hides it', async () => {
    const { readFileSync } = await import('node:fs');
    const page = readFileSync('src/app/app/page.tsx', 'utf8');
    expect(page).toMatch(/<BottomNav active=\{tab\} onSelect=\{goTo\} \/>/);
    // goTo only forgets a proposed goal — it never touches the conversation
    const goTo = page.match(/const goTo = [^\n]*/)![0];
    expect(goTo).not.toMatch(/InSession|Resume|sessionKey/);
    expect(page).toMatch(/hidden=\{tab !== 'home'\}/);
  });
});

describe('the side menu (owner, 2026-10-18: "an entry, then a menu on the side with everything")', () => {
  it('holds New conversation, the kept conversations and the summaries; Continue and New both close it', async () => {
    convs = { keeping: true, configured: true, conversations: [KEPT] };
    const { JourneyDrawer } = await import('../app/app/components/JourneyDrawer');
    const onNew = vi.fn(); const onContinue = vi.fn(); const onClose = vi.fn();
    render(<JourneyDrawer open onClose={onClose} onNew={onNew} onContinue={onContinue} />);
    expect(screen.getByRole('dialog', { name: s.jTitle })).toBeTruthy();
    expect(await screen.findByRole('tab', { name: new RegExp(s.jSummaries) })).toBeTruthy();
    await openKept();
    fireEvent.click(screen.getByRole('button', { name: s.cContinue }));
    await waitFor(() => expect(onContinue).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: new RegExp(s.newConversation) }));
    expect(onNew).toHaveBeenCalled();
  });

  it('closed → nothing rendered; Escape closes it', async () => {
    const { JourneyDrawer } = await import('../app/app/components/JourneyDrawer');
    const onClose = vi.fn();
    const { rerender } = render(<JourneyDrawer open={false} onClose={onClose} onNew={vi.fn()} onContinue={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
    rerender(<JourneyDrawer open onClose={onClose} onNew={vi.fn()} onContinue={vi.fn()} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('the conversation and the entry both carry the ☰ button', async () => {
    const onMenu = vi.fn();
    render(<ProblemSession onClose={vi.fn()} onMenu={onMenu} />);
    fireEvent.click(screen.getByRole('button', { name: s.menu }));
    expect(onMenu).toHaveBeenCalled();
  });
});
