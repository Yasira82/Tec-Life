/**
 * The door of the app: a sign-in button before any screen (owner, 2026-10-06 —
 * "there should be a login button at the very start, before I enter any app").
 *
 * Not a redirect guard (C-123 §7/§9/§11 — tried, rolled back). The button runs
 * the app's own Pi sign-in; when Pi cannot answer here, the Hub signs them in.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let me   = { username: null as string | null, authenticated: false, loading: false, reason: 'no_token' as string | null };
let auth = { isAuthenticated: false, isLoading: false, user: null };
const ssoRedirect = vi.fn();
const selfSignIn  = vi.fn();
vi.mock('@/lib-client/hooks/useMe', () => ({ useMe: () => me }));
vi.mock('@yasser172/tec-auth', () => ({ usePiAuth: () => auth, ssoRedirect: (...a: unknown[]) => ssoRedirect(...a) }));
vi.mock('@/lib/pi/self-sign-in', () => ({ selfSignIn: (...a: unknown[]) => selfSignIn(...a) }));
vi.mock('@/lib/i18n', async () => {
  const { DICTIONARIES } = await import('@/lib/i18n/dictionaries');
  return { useTranslation: () => ({ t: DICTIONARIES.en, locale: 'en' }) };
});

import { SignInGate } from '../app/app/components/SignInGate';
import { LOCALES } from '@/lib/i18n/locales';
import { DICTIONARIES } from '@/lib/i18n/dictionaries';

afterEach(cleanup); // no `globals: true` here, so Testing Library does not clean up on its own
beforeEach(() => {
  me   = { username: null, authenticated: false, loading: false, reason: 'no_token' };
  auth = { isAuthenticated: false, isLoading: false, user: null };
  ssoRedirect.mockReset(); selfSignIn.mockReset();
});

describe('SignInGate', () => {
  it('a signed-in member sees the app, never the gate', () => {
    me = { ...me, authenticated: true, username: 'alice' };
    render(<SignInGate><p>the app</p></SignInGate>);
    expect(screen.getByText('the app')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Sign in with Pi' })).toBeNull();
  });

  it('while the session is unknown it shows neither — no gate flashed at a member', () => {
    me = { ...me, loading: true };
    render(<SignInGate><p>the app</p></SignInGate>);
    expect(screen.queryByText('the app')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Sign in with Pi' })).toBeNull();
  });

  it('no session → the button, and nothing of the app', () => {
    render(<SignInGate><p>the app</p></SignInGate>);
    expect(screen.getByRole('button', { name: 'Sign in with Pi' })).toBeTruthy();
    expect(screen.queryByText('the app')).toBeNull();
  });

  it('the button runs the app\'s OWN sign-in, forced past the attempt window', async () => {
    selfSignIn.mockResolvedValue('navigating');
    render(<SignInGate><p /></SignInGate>);
    fireEvent.click(screen.getByRole('button', { name: 'Sign in with Pi' }));
    await waitFor(() => expect(selfSignIn).toHaveBeenCalled());
    expect(selfSignIn.mock.calls[0]?.[1]).toEqual({ force: true });
    expect(ssoRedirect).not.toHaveBeenCalled();
  });

  it.each(['foreign-session', 'no-pi', 'refused'])('when Pi cannot answer here (%s) the Hub signs them in and sends them back', async (outcome) => {
    selfSignIn.mockResolvedValue(outcome);
    render(<SignInGate><p /></SignInGate>);
    fireEvent.click(screen.getByRole('button', { name: 'Sign in with Pi' }));
    await waitFor(() => expect(ssoRedirect).toHaveBeenCalled());
    expect(String(ssoRedirect.mock.calls[0]?.[1])).toContain(window.location.pathname);
  });

  it('the secondary link goes through the Hub directly', () => {
    render(<SignInGate><p /></SignInGate>);
    fireEvent.click(screen.getByRole('button', { name: 'Sign in through the Hub instead' }));
    expect(ssoRedirect).toHaveBeenCalled();
    expect(selfSignIn).not.toHaveBeenCalled();
  });

  it('every language has the whole gate', () => {
    for (const l of LOCALES) {
      const g = DICTIONARIES[l.code].life.gate;
      for (const k of ['title', 'body', 'button', 'busy', 'viaHub'] as const) expect(g[k], `${l.code}.${k}`).toBeTruthy();
    }
  });

  it('the shell puts every screen AND the nav behind the gate', () => {
    const page = readFileSync(join(process.cwd(), 'src/app/app/page.tsx'), 'utf8');
    const gate = page.slice(page.indexOf('<SignInGate>'), page.indexOf('</SignInGate>'));
    for (const c of ['<HomeView', '<Goals', '<Skills', '<Activity', '<SettingsView', '<BottomNav']) expect(gate).toContain(c);
  });
});

describe('selfSignIn({ force })', () => {
  it('a tap is not "already tried" — the window guards loops, not people', async () => {
    // Mock Pi BEFORE the module is loaded: `piSession` is imported at the top of self-sign-in.
    vi.doUnmock('@/lib/pi/self-sign-in');
    vi.doMock('@/lib/pi/pi-session', () => ({ piSession: { ensureAuth: async () => true, accessToken: 'pi-at' } }));
    vi.resetModules();
    sessionStorage.setItem('__tec_self_signin', String(Date.now()));       // tried a moment ago
    vi.stubGlobal('fetch', vi.fn(async (u: string) =>
      String(u).includes('/api/auth/me') ? ({ ok: false, status: 401 } as Response)
      : ({ ok: true, json: async () => ({ ssoToken: 'one-time' }) } as Response)));
    const replace = vi.fn();
    Object.defineProperty(window, 'location', { value: { ...window.location, replace, pathname: '/app', search: '' }, writable: true });
    const { selfSignIn: forced } = await import('@/lib/pi/self-sign-in');
    expect(await forced(Date.now())).toBe('already-tried');
    expect(await forced(Date.now(), { force: true })).toBe('navigating');
    expect(String(replace.mock.calls[0]?.[0])).toContain('/api/auth/sso-callback?token=one-time');
    vi.unstubAllGlobals();
    vi.doUnmock('@/lib/pi/pi-session');
  });
});
