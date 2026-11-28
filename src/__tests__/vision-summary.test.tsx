/**
 * «مستقبلي» on the redesign's My goals, compact (owner review 2026-11-28): the vision in two
 * lines at most, the areas as tags, and Edit opening a sheet with the existing editor — the same
 * component, so its functions and routes are unchanged.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, within } from '@testing-library/react';
import React, { useState } from 'react';
import { VisionSummary } from '../app/app/redesign/goals/VisionSummary';
import { futureCopy } from '@/lib/life/future-copy';
import type { Future } from '@/lib-client/life/future';

const f = futureCopy('en');
let calls: { url: string; method: string; body: string }[];
beforeEach(() => {
  calls = [];
  vi.stubGlobal('fetch', vi.fn(async (u: RequestInfo | URL, init?: RequestInit) => {
    const body = typeof init?.body === 'string' ? init.body : '';
    calls.push({ url: String(u), method: init?.method ?? 'GET', body });
    const sent = body ? JSON.parse(body) : {};
    return { ok: true, status: 200, json: async () => ({ success: true, data: { vision: sent.statement ?? 'A calm life', areas: [{ area: 'MONEY', note: null }] } }) } as Response;
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function Host({ initial }: { initial: Future }) {
  const [fu, setFu] = useState(initial);
  return <VisionSummary future={fu} onChange={setFu} />;
}

describe('VisionSummary', () => {
  it('the vision in two lines at most, the areas as tags', () => {
    render(<Host initial={{ vision: 'A calm life: money set aside, good health, and time for family.', areas: [{ area: 'MONEY', note: 'save first' }, { area: 'HEALTH', note: null }] }} />);
    const text = screen.getByTestId('vision-text');
    expect(text.textContent).toBe('A calm life: money set aside, good health, and time for family.');
    // jsdom drops -webkit-line-clamp; the two-line cap is measured on a real phone in e2e/redesign.spec.ts.
    expect(text.style.overflow).toBe('hidden');
    const tags = within(screen.getByRole('list', { name: f.areasLabel })).getAllByRole('listitem').map((li) => li.textContent);
    expect(tags).toEqual(['Money', 'Health']);
    // The editor is not on the screen until Edit.
    expect(screen.queryByText(f.visionLabel)).toBeNull();
  });

  it('no vision yet: says so, quietly', () => {
    render(<Host initial={{ vision: null, areas: [] }} />);
    expect(screen.getByTestId('vision-text').textContent).toBe(f.visionEmpty);
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('Edit opens the existing editor in a sheet; what it saves shows in the summary', async () => {
    render(<Host initial={{ vision: 'A calm life', areas: [] }} />);
    fireEvent.click(screen.getByRole('button', { name: `${f.edit} — ${f.title}` }));
    const sheet = screen.getByTestId('vision-sheet');
    expect(within(sheet).getByText(f.visionLabel)).toBeTruthy();
    // The editor's own Edit → field → Save, on its own route.
    fireEvent.click(within(sheet).getAllByRole('button', { name: f.edit })[0]!);
    fireEvent.change(within(sheet).getByPlaceholderText(f.visionPh), { target: { value: 'Healthy for my kids' } });
    fireEvent.click(within(sheet).getByRole('button', { name: f.save }));
    await waitFor(() => expect(calls.some((c) => c.url === '/api/bff/life/future/vision' && c.method === 'PUT')).toBe(true));
    await waitFor(() => expect(screen.getByTestId('vision-text').textContent).toBe('Healthy for my kids'));
  });

  it('Escape closes the sheet', () => {
    render(<Host initial={{ vision: 'A calm life', areas: [] }} />);
    fireEvent.click(screen.getByRole('button', { name: `${f.edit} — ${f.title}` }));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByTestId('vision-sheet')).toBeNull();
  });
});
