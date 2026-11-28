/**
 * The redesign's privacy section (Phase 1, owner 2026-11-28): three groups that say what the code
 * does. JOURNEY and CONVERSATIONS are independent; turning either off deletes what it kept, so it
 * asks first and says how much — nothing is sent until the person confirms. Same route as today.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, within } from '@testing-library/react';
import React from 'react';
import { MePrivacy } from '../app/app/redesign/me/MePrivacy';
import { meCopy } from '@/lib/life/me-copy';
import { en } from '@/lib/i18n/dictionaries/en';

const m = meCopy('en');
const p = en.life.privacy;
const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => ({ success: true, data }) } as Response);
let consent: { category: string; granted: boolean }[];
let calls: { url: string; method: string; body: string }[];

beforeEach(() => {
  calls = [];
  consent = [
    { category: 'GOALS', granted: true }, { category: 'SKILLS', granted: false }, { category: 'BUDGET', granted: false },
    { category: 'INTENT', granted: false }, { category: 'CHECKIN', granted: true },
    { category: 'JOURNEY', granted: true }, { category: 'CONVERSATIONS', granted: true },
  ];
  vi.stubGlobal('fetch', vi.fn(async (u: RequestInfo | URL, init?: RequestInit) => {
    const url = String(u); const method = init?.method ?? 'GET'; const body = typeof init?.body === 'string' ? init.body : '';
    calls.push({ url, method, body });
    if (url === '/api/bff/life/consent' && method === 'PUT') {
      const asked = JSON.parse(body).consent as Record<string, boolean>;
      consent = consent.map((c) => (c.category in asked ? { ...c, granted: asked[c.category]! } : c));
      return ok({ consent });
    }
    if (url === '/api/bff/life/consent') return ok({ consent });
    if (url === '/api/bff/life/journey') return ok({ keeping: true, entries: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] });
    if (url === '/api/bff/life/conversations') return ok({ keeping: true, configured: true, conversations: [{ id: 'x' }, { id: 'y' }] });
    if (url === '/api/bff/life/intent') return ok({ intent: null });
    if (url === '/api/bff/life/data') return ok({ deleted: {} });
    return ok({});
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const puts = () => calls.filter((c) => c.url === '/api/bff/life/consent' && c.method === 'PUT').map((c) => JSON.parse(c.body).consent);
const sw = (name: string) => screen.getByRole('switch', { name });

describe('MePrivacy', () => {
  it('three groups: what Life keeps, what TEC AI may read (with the provider note), the reminder', async () => {
    render(<MePrivacy />);
    await screen.findByRole('switch', { name: m.keepJourney });
    const text = screen.getByTestId('me-privacy').textContent!;
    const keep = text.indexOf(m.gKeep), hub = text.indexOf(m.gHub), rem = text.indexOf(m.gReminder);
    expect(keep).toBeGreaterThan(-1); expect(hub).toBeGreaterThan(keep); expect(rem).toBeGreaterThan(hub);
    expect(text.indexOf(m.keepConvs)).toBeLessThan(hub);       // CONVERSATIONS is a keep switch
    expect(text.indexOf(p.goals)).toBeGreaterThan(hub);        // GOALS is TEC AI's
    expect(text.indexOf(p.checkin)).toBeGreaterThan(rem);      // CHECKIN is the reminder
    expect(screen.getByRole('note').textContent).toBe(p.shareProvider);
  });

  it('turning JOURNEY off asks first, says how much — and sends nothing until confirmed', async () => {
    render(<MePrivacy />);
    fireEvent.click(await screen.findByRole('switch', { name: m.keepJourney }));
    const box = await screen.findByTestId('confirm-off-JOURNEY');
    await waitFor(() => expect(box.textContent).toContain('This deletes 3 summaries'));
    expect(puts()).toEqual([]);
    fireEvent.click(within(box).getByRole('button', { name: m.offDo }));
    await waitFor(() => expect(puts()).toEqual([{ JOURNEY: false }]));
  });

  it('“Keep it on” sends nothing', async () => {
    render(<MePrivacy />);
    fireEvent.click(await screen.findByRole('switch', { name: m.keepConvs }));
    const box = await screen.findByTestId('confirm-off-CONVERSATIONS');
    await waitFor(() => expect(box.textContent).toContain('2 conversations'));
    fireEvent.click(within(box).getByRole('button', { name: m.offKeep }));
    expect(screen.queryByTestId('confirm-off-CONVERSATIONS')).toBeNull();
    expect(puts()).toEqual([]);
  });

  it('JOURNEY off, CONVERSATIONS on: says they are kept but not read by the coach', async () => {
    consent = consent.map((c) => (c.category === 'JOURNEY' ? { ...c, granted: false } : c));
    render(<MePrivacy />);
    expect(await screen.findByTestId('stored-not-read')).toBeTruthy();
  });

  it('turning a keep switch ON, or any TEC AI switch, needs no confirmation', async () => {
    consent = consent.map((c) => (c.category === 'JOURNEY' ? { ...c, granted: false } : c));
    render(<MePrivacy />);
    fireEvent.click(await screen.findByRole('switch', { name: m.keepJourney }));
    await waitFor(() => expect(puts()).toEqual([{ JOURNEY: true }]));
    fireEvent.click(sw(p.skills));
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
