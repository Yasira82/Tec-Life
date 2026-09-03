'use client';

import { useEffect }               from 'react';
import { useRouter }               from 'next/navigation';
import { usePiAuth, ssoRedirect }  from '@yasser172/tec-auth';
import { Icon }                    from '@yasser172/tec-ui';
import { C }                       from '@/lib-client/palette';

const HUB_URL     = process.env.NEXT_PUBLIC_HUB_URL   ?? 'https://hub.tecosystem.app';
const APP_URL     = process.env.NEXT_PUBLIC_APP_URL   ?? 'https://life.tecosystem.app';
const APP_NAME    = process.env.NEXT_PUBLIC_APP_NAME  ?? 'TEC Life';
const APP_TAGLINE = 'What matters to you';

export default function HomePage() {
  const { isAuthenticated, isLoading } = usePiAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/app');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogin = () => {
    ssoRedirect(HUB_URL, `${APP_URL}/app`);
  };

  return (
    <div style={{
      minHeight:      '100vh',
      background:     C.bg,
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
          <Icon name="sprout" size={48} color={C.gold} strokeWidth={1.5} />
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, color: C.gold, marginBottom: 8 }}>
          {APP_NAME}
        </div>
        <div style={{ fontSize: 14, color: C.text, marginBottom: 4 }}>
          {APP_TAGLINE}
        </div>
        <div style={{ fontSize: 12, color: C.subtext, marginBottom: 32, letterSpacing: 1 }}>
          TEC ECOSYSTEM · SYSTEM OF RECORD
        </div>
        <button
          onClick={handleLogin}
          disabled={isLoading}
          style={{
            padding:      '14px 32px',
            background:   `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
            border:       'none',
            borderRadius: 16,
            color:        C.onGold,
            fontSize:     15,
            fontWeight:   700,
            cursor:       isLoading ? 'not-allowed' : 'pointer',
            opacity:      isLoading ? 0.6 : 1,
          }}>
          {isLoading ? '...' : 'Login with Pi'}
        </button>
      </div>
    </div>
  );
}
