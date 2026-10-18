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
    fireEvent.click(await screen.findByRole('button', { name: s.cContinue }));
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
    await screen.findByText('I worry about the future');
    const del = screen.getAllByRole('button', { name: s.jDelete });
    fireEvent.click(del[del.length - 1]!);
    expect(calls.filter((c) => c.method === 'DELETE')).toEqual([]);
    fireEvent.click(screen.getByRole('button', { name: s.jConfirm }));
    await waitFor(() => expect(screen.queryByText('I worry about the future')).toBeNull());
    expect(calls.find((c) => c.method === 'DELETE')!.url).toBe(`/api/bff/life/conversations/${KEPT.id}`);
  });
});
