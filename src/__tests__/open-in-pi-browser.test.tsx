/**
 * PiNet (life4748.pinet.com) shows Life in an ordinary browser, but signing in with Pi only works in Pi
 * Browser: «Login with Pi» in Chrome went to the Hub's login and stopped there (owner, 27 Nov 2026). Outside
 * Pi Browser the button now opens Life IN Pi Browser — on Android by an intent link to Pi Browser's package
 * (`pi.browser`), falling back to its Play Store page when it is not installed; elsewhere (iPhone, a computer)
 * no such link exists, so the screen says where to open it. Inside Pi Browser nothing changes.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { piBrowserLink } from '@/lib/pi/open-in-pi-browser';

const UA = {
  piBrowser:     'Mozilla/5.0 (Linux; Android 14; SM-A546E Build/UP1A; wv) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36 PiBrowser/2.4.1',
  chromeAndroid: 'Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
  safariIphone:  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  chromeDesktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
};

describe('piBrowserLink', () => {
  it('Android: an intent for Pi Browser\'s package that opens the app\'s /app, with the Play Store as fallback', () => {
    const href = piBrowserLink('https://life.tecosystem.app/app', UA.chromeAndroid)!;
    expect(href).toBe('intent://life.tecosystem.app/app#Intent;scheme=https;package=pi.browser;'
      + 'S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dpi.browser;end');
  });
  it('iPhone or a computer: no link — there is no way to hand a page to Pi Browser there', () => {
    expect(piBrowserLink('https://life.tecosystem.app/app', UA.safariIphone)).toBeNull();
    expect(piBrowserLink('https://life.tecosystem.app/app', UA.chromeDesktop)).toBeNull();
  });
  it('only https targets', () => {
    expect(piBrowserLink('javascript:alert(1)', UA.chromeAndroid)).toBeNull();
    expect(piBrowserLink('http://life.tecosystem.app/app', UA.chromeAndroid)).toBeNull();
  });
});

const sso = vi.hoisted(() => ({ ssoRedirect: vi.fn() }));
vi.mock('@yasser172/tec-auth', () => ({ usePiAuth: () => ({ isAuthenticated: false, isLoading: false }), ssoRedirect: sso.ssoRedirect }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock('@/components/social/SocialLinks', () => ({ SocialLinks: () => null }));

describe('the landing page', () => {
  beforeEach(() => { sso.ssoRedirect.mockReset(); });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });
  const show = async (ua: string) => {
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(ua);
    const { default: HomePage } = await import('@/app/page');
    await act(async () => { render(<HomePage />); });
  };

  it('in Pi Browser: «Login with Pi», as before', async () => {
    await show(UA.piBrowser);
    act(() => screen.getByRole('button', { name: 'Login with Pi' }).click());
    expect(sso.ssoRedirect).toHaveBeenCalledTimes(1);
  });

  it('Chrome on Android (PiNet): «Open in Pi Browser», a link that hands Life to Pi Browser', async () => {
    await show(UA.chromeAndroid);
    const link = screen.getByRole('link', { name: 'Open in Pi Browser' });
    expect(link.getAttribute('href')).toMatch(/^intent:\/\/life\.tecosystem\.app\/app#Intent;scheme=https;package=pi\.browser;/);
    expect(screen.queryByRole('button', { name: 'Login with Pi' })).toBeNull();
    expect(screen.getByText(/Sign in with Pi in Pi Browser/)).toBeTruthy();
  });

  it('an iPhone or a computer: says where to open it, no dead button', async () => {
    await show(UA.safariIphone);
    expect(screen.queryByRole('button', { name: 'Login with Pi' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Open in Pi Browser' })).toBeNull();
    expect(screen.getByText(/open life\.tecosystem\.app in Pi Browser/)).toBeTruthy();
  });
});
