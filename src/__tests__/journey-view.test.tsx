import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import React from 'react';
import { JourneyView } from '../app/app/components/JourneyView';
import { sessionCopy } from '@/lib/life/session-copy';

// "My journey" — the person sees their own stages, can delete any of them, and
// can take them with them. Unreadable is not empty.
const s = sessionCopy('en');
let calls: { url: string; method: string }[] = [];
let read: Response;
const entries = [
  { id: 'j2', problem: 'Newer problem', understanding: 'u2', step: 'Walk after lunch', step_outcome: 'DONE', created_at: '2026-10-16T09:00:00.000Z' },
  { id: 'j1', problem: 'Older problem', understanding: 'u1', step: null, step_outcome: null, created_at: '2026-10-10T09:00:00.000Z' },
];
const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => ({ success: true, data }) } as Response);
beforeEach(() => {
  calls = []; read = ok({ keeping: true, entries });
  vi.stubGlobal('fetch', vi.fn(async (u: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(u), method: init?.method ?? 'GET' });
    return init?.method === 'DELETE' ? ok({ deleted: true }) : read;
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('My journey', () => {
  it('shows the kept summaries newest first, with the step and its outcome', async () => {
    render(<JourneyView />);
    await screen.findByText('Newer problem');
    const items = screen.getAllByRole('listitem').map((li) => li.textContent ?? '');
    expect(items[0]).toContain('Newer problem');
    expect(items[0]).toContain('Walk after lunch');
    expect(items[0]).toContain(s.outDone);
    expect(items[1]).toContain('Older problem');
  });

  it('deletes one entry on the second tap only', async () => {
    render(<JourneyView />);
    await screen.findByText('Older problem');
    fireEvent.click(screen.getAllByRole('button', { name: s.jDelete })[1]!);
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
    await waitFor(() => expect(calls.length).toBe(1));
    expect(container.textContent).toBe('');
  });
});
