/**
 * "Before and after" v1 (owner, 2026-10-18). Pinned:
 *   • wholly optional — nothing is sent until the person types a value; Skip sends nothing;
 *   • no default, no suggested number: the value box starts empty;
 *   • "I don't know" / "I didn't count" are sent without a number;
 *   • the change is shown only with both values, with the two recorded dates and the
 *     "not proof" line — never a computed duration.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import React from 'react';
import { JourneyView } from '../app/app/components/JourneyView';
import { sessionCopy } from '@/lib/life/session-copy';

const s = sessionCopy('en');
let calls: { url: string; method: string; body: string }[] = [];
let entry: Record<string, unknown>;
const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => ({ success: true, data }) } as Response);
const BASE = { id: 'j1', problem: 'I smoke a lot', understanding: 'u', step: 'Set a quit date', step_outcome: null, created_at: '2026-10-01T09:00:00.000Z' };

beforeEach(() => {
  calls = []; entry = { ...BASE };
  vi.stubGlobal('fetch', vi.fn(async (u: RequestInfo | URL, init?: RequestInit) => {
    const url = String(u); const method = init?.method ?? 'GET'; const body = typeof init?.body === 'string' ? init.body : '';
    calls.push({ url, method, body });
    if (url === '/api/bff/life/journey' && method === 'GET') return ok({ keeping: true, entries: [entry] });
    if (url.endsWith('/measure') && method === 'PUT') {
      const m = JSON.parse(body);
      return ok({ entry: { ...entry, measure_kind: m.kind, measure_label: m.label, measure_period: m.period, baseline_value: m.value, baseline_at: '2026-10-01T09:00:00.000Z' } });
    }
    if (url.endsWith('/followup')) {
      const f = JSON.parse(body);
      return ok({ entry: { ...entry, followup_status: f.status, followup_value: f.value ?? null, followup_at: '2026-10-15T09:00:00.000Z' } });
    }
    return ok({ keeping: false, conversations: [], configured: false });
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const openEntry = async () => fireEvent.click(await screen.findByRole('button', { name: /I smoke a lot/ }));
const writes = () => calls.filter((c) => c.method !== 'GET');

describe('before and after — optional, typed by the person', () => {
  it('nothing is sent until they type a value; the box starts empty; Skip sends nothing', async () => {
    render(<JourneyView />);
    await openEntry();
    fireEvent.click(screen.getByRole('button', { name: s.mAdd }));
    expect((screen.getByLabelText(s.mValueNow) as HTMLInputElement).value).toBe('');
    fireEvent.change(screen.getByLabelText(s.mLabel), { target: { value: 'cigarettes' } });
    expect((screen.getByRole('button', { name: s.mSave }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: s.mSkip }));
    expect(writes()).toEqual([]);
    expect(screen.getByRole('button', { name: s.mAdd })).toBeTruthy();
  });

  it('saves what they typed — label, number, period — and shows it', async () => {
    render(<JourneyView />);
    await openEntry();
    fireEvent.click(screen.getByRole('button', { name: s.mAdd }));
    fireEvent.change(screen.getByLabelText(s.mLabel), { target: { value: 'cigarettes' } });
    fireEvent.change(screen.getByLabelText(s.mValueNow), { target: { value: '٢٠' } });
    fireEvent.click(screen.getByRole('button', { name: s.mSave }));
    await screen.findByRole('button', { name: s.mFollowCta });
    const put = writes()[0]!;
    expect(put.url).toBe('/api/bff/life/journey/j1/measure');
    expect(JSON.parse(put.body)).toEqual({ kind: 'NUMBER', label: 'cigarettes', period: 'DAY', value: 20 });
    expect(screen.getByText(/20 a day/)).toBeTruthy();
  });

  it('"I don\'t know" is sent without a number, and no change is claimed', async () => {
    entry = { ...BASE, measure_kind: 'NUMBER', measure_label: 'cigarettes', measure_period: 'DAY', baseline_value: 20, baseline_at: '2026-10-01T09:00:00.000Z' };
    render(<JourneyView />);
    await openEntry();
    fireEvent.click(screen.getByRole('button', { name: s.mFollowCta }));
    fireEvent.click(screen.getByRole('button', { name: s.mUnknown }));
    await waitFor(() => expect(screen.getByText(new RegExp(s.mUnknown))).toBeTruthy());
    expect(JSON.parse(writes()[0]!.body)).toEqual({ status: 'UNKNOWN' });
    expect(screen.queryByText(s.mClaim)).toBeNull();
  });

  it('with both values: the change, the two recorded dates, and "not proof" — no duration', async () => {
    entry = { ...BASE, measure_kind: 'NUMBER', measure_label: 'cigarettes', measure_period: 'DAY', baseline_value: 20, baseline_at: '2026-10-01T09:00:00.000Z' };
    render(<JourneyView />);
    await openEntry();
    fireEvent.click(screen.getByRole('button', { name: s.mFollowCta }));
    fireEvent.change(screen.getByLabelText(s.mValueNow), { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: s.mSave }));
    expect(await screen.findByText(s.mClaim)).toBeTruthy();
    expect(JSON.parse(writes()[0]!.body)).toEqual({ status: 'MEASURED', value: 12 });
    const text = document.body.textContent ?? '';
    expect(text).toMatch(/From 20 to 12, between .*Oct.* and .*Oct/);
    expect(text).not.toMatch(/week|days? later|two/i);
  });

  it('a rating is 1–5 buttons, shown as "n of 5"', async () => {
    render(<JourneyView />);
    await openEntry();
    fireEvent.click(screen.getByRole('button', { name: s.mAdd }));
    fireEvent.change(screen.getByLabelText(s.mLabel), { target: { value: 'calm' } });
    fireEvent.click(screen.getByRole('button', { name: s.mKindRating }));
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    fireEvent.click(screen.getByRole('button', { name: s.mSave }));
    await screen.findByText(/3 of 5/);
    expect(JSON.parse(writes()[0]!.body)).toMatchObject({ kind: 'RATING_1_5', value: 3 });
  });

  it('nothing is offered while keeping the journey is off', async () => {
    vi.mocked(fetch).mockImplementation(async (u) => String(u) === '/api/bff/life/journey'
      ? ok({ keeping: false, entries: [entry] }) : ok({ keeping: false, conversations: [], configured: false }));
    render(<JourneyView />);
    await openEntry();
    expect(screen.queryByRole('button', { name: s.mAdd })).toBeNull();
  });
});

describe('the BFF routes', () => {
  it('refuse a NONE kind, a rating out of 1–5, and a number with "I don\'t know"', async () => {
    const { NextRequest } = await import('next/server');
    const measure = await import('../app/api/bff/life/journey/[id]/measure/route');
    const followup = await import('../app/api/bff/life/journey/[id]/followup/route');
    const req = (body: unknown) => new NextRequest('http://life.test/x', { method: 'PUT', body: JSON.stringify(body) });
    const params = Promise.resolve({ id: 'j1' });
    expect((await measure.PUT(req({ kind: 'NONE', label: 'x', period: 'DAY', value: 1 }), { params })).status).toBe(400);
    expect((await measure.PUT(req({ kind: 'RATING_1_5', label: 'x', period: 'DAY', value: 7 }), { params })).status).toBe(400);
    expect((await followup.PUT(req({ status: 'UNKNOWN', value: 4 }), { params })).status).toBe(400);
  });
});
