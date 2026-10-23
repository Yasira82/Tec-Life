import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import React from 'react';
import { JourneyView } from '../app/app/components/JourneyView';
import { sessionCopy } from '@/lib/life/session-copy';

// "My journey" — the person sees their own stages, can delete any of them, and
// can take them with them. Unreadable is not empty.
const s = sessionCopy('en');
let calls: { url: string; method: string; body?: string }[] = [];
let read: Response;
const entries = [
  { id: 'j2', problem: 'Newer problem', understanding: 'u2', step: 'Walk after lunch', step_outcome: 'DONE', created_at: '2026-10-16T09:00:00.000Z', tried: 'Water and gum', reason: 'My kids' },
  { id: 'j1', problem: 'Older problem', understanding: 'u1', step: null, step_outcome: null, created_at: '2026-10-10T09:00:00.000Z' },
];
const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => ({ success: true, data }) } as Response);
beforeEach(() => {
  calls = []; read = ok({ keeping: true, entries });
  vi.stubGlobal('fetch', vi.fn(async (u: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(u), method: init?.method ?? 'GET', body: typeof init?.body === 'string' ? init.body : undefined });
    if (init?.method === 'PUT') return ok({ entry: { ...entries[0], ...JSON.parse(String(init.body)) } });
    return init?.method === 'DELETE' ? ok({ deleted: true }) : read;
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('My journey', () => {
  it('one line per summary, newest first; tapping one opens its details', async () => {
    render(<JourneyView />);
    await screen.findByText('Newer problem');
    const items = screen.getAllByRole('listitem').map((li) => li.textContent ?? '');
    expect(items[0]).toContain('Newer problem');
    expect(items[0]).toContain(s.outDone);
    expect(items[1]).toContain('Older problem');
    expect(screen.queryByText('Walk after lunch')).toBeNull();      // details closed
    fireEvent.click(screen.getByRole('button', { name: /Newer problem/ }));
    expect(screen.getByText('Walk after lunch')).toBeTruthy();       // and now open
  });

  it('deletes one entry on the second tap only', async () => {
    render(<JourneyView />);
    fireEvent.click(await screen.findByRole('button', { name: /Older problem/ }));
    fireEvent.click(screen.getByRole('button', { name: s.jDelete }));
    expect(calls.filter((c) => c.method === 'DELETE')).toEqual([]);
    fireEvent.click(screen.getByRole('button', { name: s.jConfirm }));
    await waitFor(() => expect(screen.queryByText('Older problem')).toBeNull());
    expect(calls.find((c) => c.method === 'DELETE')!.url).toBe('/api/bff/life/journey/j1');
  });

  it('says when nothing is kept, and when keeping is off', async () => {
    read = ok({ keeping: false, entries: [] });
    render(<JourneyView />);
    await screen.findByText(s.jEmpty);
    expect(screen.getByText(s.jOff)).toBeTruthy();
  });

  it('a journey it could not read shows nothing — not "nothing kept"', async () => {
    read = { ok: false, status: 503, json: async () => ({}) } as Response;
    const { container } = render(<JourneyView />);
    await waitFor(() => expect(calls.length).toBe(2)); // the journey and the conversations, both unreadable
    expect(container.textContent).toBe('');
  });

  it('shows what Life remembers, and the person changes it — an emptied field is cleared (owner, 2026-10-23)', async () => {
    render(<JourneyView />);
    fireEvent.click(await screen.findByRole('button', { name: /Newer problem/ }));
    expect(screen.getByText('Water and gum')).toBeTruthy();
    expect(screen.getByText('My kids')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: s.jMemEdit }));
    fireEvent.change(screen.getByDisplayValue('Water and gum'), { target: { value: 'Water, gum, walking' } });
    fireEvent.change(screen.getByDisplayValue('My kids'), { target: { value: ' ' } });
    fireEvent.click(screen.getByRole('button', { name: s.jMemSave }));
    await screen.findByText('Water, gum, walking');
    const put = calls.find((c) => c.method === 'PUT')!;
    expect(put.url).toBe('/api/bff/life/journey/j2/memory');
    expect(JSON.parse(put.body!)).toEqual({ tried: 'Water, gum, walking', helped: null, triggers: null, reason: null, practice: null, words: null, feeling_start: null, feeling_end: null });
    expect(screen.queryByText('My kids')).toBeNull();
  });
});
