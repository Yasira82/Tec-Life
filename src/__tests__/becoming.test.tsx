import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import React from 'react';
import { Becoming } from '../app/app/components/Becoming';
import { sessionCopy } from '@/lib/life/session-copy';

// «أنا بتغيّر» (owner, 2026-10-23). Pinned: built only from what the person kept; shows evidence
// (managed · works for you · now do · reasons · own words · feelings) and their own sentence;
// nothing at all without keeping; no score, no streak, nothing taken away by a slip.
const s = sessionCopy('en');
let calls: { url: string; method: string; body?: string }[] = [];
let journey: unknown; let self: unknown;
const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => ({ success: true, data }) } as Response);
const E = (o: Record<string, unknown>) => ({ id: String(Math.random()), problem: 'p', understanding: 'u', step: null, step_outcome: null, created_at: '2026-10-10T09:00:00.000Z', ...o });

beforeEach(() => {
  calls = [];
  journey = { keeping: true, entries: [
    E({ step: 'Phone in the kitchen', step_outcome: 'DONE', helped: 'Fasting', words: 'I will not go back', feeling_start: 'FRUSTRATED', feeling_end: 'HOPEFUL' }),
    E({ step: 'Walk after lunch', step_outcome: 'NOT_YET', practice: 'I pray at the mosque', reason: 'My kids',
        measure_label: 'cigarettes a day', baseline_value: 20, followup_value: 8, followup_status: 'MEASURED' }),
    E({ helped: 'Fasting' }),
  ] };
  self = { keeping: true, statement: null };
  vi.stubGlobal('fetch', vi.fn(async (u: RequestInfo | URL, init?: RequestInit) => {
    const url = String(u); calls.push({ url, method: init?.method ?? 'GET', body: typeof init?.body === 'string' ? init.body : undefined });
    if (url === '/api/bff/life/self' && init?.method === 'PUT') return ok({ keeping: true, statement: JSON.parse(String(init.body)).statement || null });
    return url === '/api/bff/life/self' ? ok(self) : ok(journey);
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('I\'m changing', () => {
  it('shows what they managed, what works, what they do, why, their words and how they felt — once each', async () => {
    render(<Becoming />);
    await screen.findByText(s.bTitle);
    expect(screen.getByText('Phone in the kitchen')).toBeTruthy();
    expect(screen.queryByText(/Walk after lunch/)).toBeNull();            // not done → not a "managed"
    expect(screen.getByText('cigarettes a day: 20 → 8')).toBeTruthy();    // before → after, as recorded
    expect(screen.getAllByText('Fasting')).toHaveLength(1);                // deduplicated
    expect(screen.getByText('I pray at the mosque')).toBeTruthy();
    expect(screen.getByText('My kids')).toBeTruthy();
    expect(screen.getByText('«I will not go back»')).toBeTruthy();
    expect(screen.getByText(`${s.feel.FRUSTRATED} → ${s.feel.HOPEFUL}`)).toBeTruthy();
    expect(screen.getByText(s.bStatementEmpty)).toBeTruthy();
  });

  it('the person writes who they are becoming, and can clear it', async () => {
    render(<Becoming />);
    fireEvent.click(await screen.findByRole('button', { name: s.bEdit }));
    fireEvent.change(screen.getByRole('textbox', { name: s.bStatementLabel }), { target: { value: 'Someone who keeps his word' } });
    fireEvent.click(screen.getByRole('button', { name: s.jMemSave }));
    await screen.findByText('Someone who keeps his word');
    expect(JSON.parse(calls.find((c) => c.method === 'PUT')!.body!)).toEqual({ statement: 'Someone who keeps his word' });
    fireEvent.click(screen.getByRole('button', { name: s.bEdit }));
    fireEvent.change(screen.getByRole('textbox', { name: s.bStatementLabel }), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: s.jMemSave }));
    await screen.findByText(s.bStatementEmpty);
  });

  it('nothing at all without keeping, or when the journey cannot be read', async () => {
    journey = { keeping: false, entries: [] };
    const { container } = render(<Becoming />);
    await waitFor(() => expect(calls.length).toBe(2));
    expect(container.textContent).toBe('');
  });

  it('keeping on but nothing kept yet → says how the page fills', async () => {
    journey = { keeping: true, entries: [] };
    render(<Becoming />);
    expect(await screen.findByText(s.bEmpty)).toBeTruthy();
  });

  it('no score, no streak — a slip takes nothing away', () => {
    const fs = require('node:fs') as typeof import('node:fs');
    const src = fs.readFileSync('src/app/app/components/Becoming.tsx', 'utf8');
    expect(src.replace(/\/\/.*$/gm, '')).not.toMatch(/streak|score|percent|rank/i);   // code, not the comment that forbids it
  });
});
