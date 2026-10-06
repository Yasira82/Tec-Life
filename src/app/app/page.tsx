'use client';

// TEC Life — System of Record (Personal). C-106.
// The screens live in ./components; this is the shell: tabs, the top band, the session state.
import { useState } from 'react';
import { usePiAuth } from '@yasser172/tec-auth';
import { C, goldA } from '@/lib-client/palette';
import { useSubscription } from '@/lib-client/life/useLife';
import { useMe } from '@/lib-client/hooks/useMe';
import { BottomNav, type LifeTab } from './components/BottomNav';
import { SettingsView } from './components/SettingsView';
import { useTranslation } from '@/lib/i18n';
import { isProPlan } from './components/shared';
import { Goals } from './components/Goals';
import { Skills } from './components/Skills';
import { Activity } from './components/Activity';
import { HomeView } from './components/Home';
import { SignInGate } from './components/SignInGate';

export default function LifeHome() {
  const { user, isLoading } = usePiAuth();
  const me = useMe(); // server-resolved Pi username (Pi Browser hides tec_user from client JS — C-123 §3)
  const { plan, daysRemaining } = useSubscription(); // source of truth = commerce subscription (auth /me does not carry it)
  const piName = me.username ?? user?.piUsername ?? null;
  const name  = piName ? `@${piName}` : '';
  const isPro = isProPlan(plan ?? (user as { subscriptionPlan?: string } | null)?.subscriptionPlan);
  const [tab, setTab] = useState<LifeTab>('home');
  const { t } = useTranslation();

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: 96 }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 22px 0' }}>
        {/* ── The band ───────────────────────────────────────────────────────
            The Hub frames every inner page with a solid band that has rounded
            BOTTOM corners. Life's header was a bare line of text on the same
            flat ground as everything under it, so switching tabs felt like
            nothing had happened. Same shape, same token, same radius as the
            Hub — one frame across the fleet rather than a per-app flourish.

            `tec-on-band` re-scopes the palette for this subtree: the band is
            dark in BOTH themes, so on a light page the ink inside it has to
            stay light. Anything dropped in here is correct without knowing it.

            It bleeds to the edges — the band frames the SCREEN, not the column —
            so it cancels the page gutter and restores it as its own padding.
            The Hub's is `12px 20px 16px`; matching it matters because a curve on
            a taller band reads as a BIGGER curve at the same radius. */}
        <header className="tec-on-band" style={{
          background: 'var(--tec-topbar)',
          // A flat brown rectangle is the part that read as unfinished. One
          // soft amber source in the top corner and a hairline along the
          // bottom edge give the band a light direction — the cheapest thing
          // that separates a designed surface from a filled one. Both are
          // painted in CHANNELS, so they follow the theme.
          backgroundImage:
            `radial-gradient(120% 140% at 8% -30%, ${goldA(0.16)}, transparent 60%)`,
          boxShadow: `inset 0 -1px 0 ${goldA(0.14)}`,
          borderRadius: '0 0 var(--tec-topbar-radius) var(--tec-topbar-radius)',
          margin: '-28px -22px 18px',
          padding: 'calc(12px + env(safe-area-inset-top)) 22px 18px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 10, letterSpacing: 1.2, color: C.subtext, textTransform: 'uppercase', fontWeight: 700 }}>{t.life.brand}</div>
            {isPro && (
              <span style={{
                fontSize: 10, fontWeight: 900, letterSpacing: 0.5, color: C.onGold,
                background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
                borderRadius: 999, padding: '2px 9px',
              }}>★ {t.life.pro}</span>
            )}
          </div>
          {/* 22px — chrome, not a hero. It was 26, which put the page title
              above the section headings under it and made the band taller than
              the Hub's for no gain. */}
          <h1 style={{ fontSize: 22, fontWeight: 900, color: C.gold, margin: '2px 0 0', letterSpacing: '-0.02em' }}>
            <bdi>{tab === 'home'
              ? (isLoading || !name ? t.life.welcome : t.life.welcomeName.replace('{name}', name))
              : tab === 'goals' ? t.life.goals.title
              : tab === 'skills' ? t.life.skills.title
              : tab === 'activity' ? t.life.activity.title
              : t.life.settings.profile}</bdi>
          </h1>
          <p style={{ fontSize: 12.5, color: C.subtext, margin: '3px 0 0', lineHeight: 1.45 }}>
            {tab === 'home' ? t.life.subtitle
              : tab === 'goals' ? t.life.goals.hint
              : tab === 'skills' ? t.life.skills.hint
              : tab === 'activity' ? t.life.activity.hint
              : t.life.prefs.hint}
          </p>
        </header>

        <SignInGate>
          {tab === 'home' && <HomeView isPro={isPro} daysRemaining={daysRemaining} onGo={setTab} />}
          {tab === 'goals'    && <Goals isPro={isPro} />}
          {tab === 'skills'   && <Skills />}
          {tab === 'activity' && <Activity />}
          {tab === 'settings' && <SettingsView isPro={isPro} />}
          <BottomNav active={tab} onSelect={setTab} />
        </SignInGate>
      </div>
    </main>
  );
}
