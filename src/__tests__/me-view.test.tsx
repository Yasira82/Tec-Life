/**
 * The redesign's Me screen (Phase 1, owner 2026-11-28): who I am, my skills (managed in a sheet),
 * my journey (the existing drawer), privacy, subscription, settings, then help — reusing the
 * existing parts and routes.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, within } from '@testing-library/react';
import React from 'react';
import { MeView } from '../app/app/redesign/me/MeView';
import { meCopy } from '@/lib/life/me-copy';
import { en } from '@/lib/i18n/dictionaries/en';

vi.mock('@yasser172/tec-auth', () => ({ usePiAuth: () => ({ user: null, isAuthenticated: true, logout: vi.fn() }) }));

const m = meCopy('en');
const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => ({ success: true, data }) } as Response);
let calls: { url: string; method: string; body: string }[];

beforeEach(() => {
  calls = [];
  vi.stubGlobal('fetch', vi.fn(async (u: RequestInfo | URL, init?: RequestInit) => {
    const url = String(u).split('?')[0]!; const method = init?.method ?? 'GET';
    calls.push({ url, method, body: typeof init?.body === 'string' ? init.body : '' });
    if (url === '/api/auth/me') return { ok: true, status: 200, json: async () => ({ authenticated: true, user: { piUsername: 'sara' } }) } as Response;
    if (url === '/api/bff/life/skills') return ok({ skills: [
      { id: 's1', name: 'Graphic design', level: 'PRACTISING', source: 'SELF_DECLARED', created_at: '', updated_at: '' },
      { id: 's2', name: 'Writing', level: 'PROFICIENT', source: 'SELF_DECLARED', created_at: '', updated_at: '' },
    ] });
    if (url === '/api/bff/life/journey') return ok({ keeping: true, entries: [{ id: 'a' }, { id: 'b' }] });
    if (url === '/api/bff/life/conversations') return ok({ keeping: true, configured: true, conversations: [{ id: 'x' }] });
    if (url === '/api/bff/life/consent') return ok({ consent: [{ category: 'JOURNEY', granted: true }] });
    if (url === '/api/bff/life/preferences') return ok({ preferences: {} });
    if (url === '/api/bff/life/self') return ok({ keeping: true, statement: null });
    if (url === '/api/bff/life/intent') return ok({ intent: null });
    if (url.startsWith('/api/bff/life/admin/')) return { ok: false, status: 403, json: async () => ({}) } as Response;
    return ok({});
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('Me', () => {
  it('in order: identity, skills, journey, privacy, settings', async () => {
    render(<MeView isPro={false} daysRemaining={null} onOpenJourney={vi.fn()} />);
    await screen.findByText('Graphic design');
    const ids = [...document.querySelectorAll('[data-testid^="me-"]')].map((e) => e.getAttribute('data-testid'));
    expect(ids).toEqual(['me-identity', 'me-skills', 'me-journey', 'me-privacy', 'me-settings', 'me-more']);
    await waitFor(() => expect(screen.getByTestId('me-identity').textContent).toContain('@sara'));
  });

  it('skills: one line each with the ladder; Manage opens the existing editor in a sheet', async () => {
    render(<MeView isPro={false} daysRemaining={null} onOpenJourney={vi.fn()} />);
    const skills = screen.getByTestId('me-skills');
    expect(await within(skills).findByText('Graphic design')).toBeTruthy();
    expect(within(skills).getByText(en.life.skills.levels.practising)).toBeTruthy();
    fireEvent.click(within(skills).getByRole('button', { name: m.manage }));
    expect(screen.getByTestId('skills-sheet')).toBeTruthy();
  });

  it('my journey: what is kept, and the button opens the existing drawer', async () => {
    const open = vi.fn();
    render(<MeView isPro={false} daysRemaining={null} onOpenJourney={open} />);
    await waitFor(() => expect(screen.getByTestId('me-journey').textContent).toContain('2 summaries · 1 conversations'));
    fireEvent.click(screen.getByRole('button', { name: m.openJourney }));
    expect(open).toHaveBeenCalledOnce();
  });

  it('settings: the language is saved through the existing preferences route', async () => {
    render(<MeView isPro={false} daysRemaining={null} onOpenJourney={vi.fn()} />);
    const settings = screen.getByTestId('me-settings');
    fireEvent.change(within(settings).getByRole('combobox', { name: en.life.prefs.language }), { target: { value: 'ar' } });
    await waitFor(() => expect(calls.some((c) => c.url === '/api/bff/life/preferences' && c.method !== 'GET' && c.body.includes('"language":"ar"'))).toBe(true));
  });
});
