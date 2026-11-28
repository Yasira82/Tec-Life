'use client';

// The redesign's shell (Phase 1 Foundation) — shown ONLY to people the server switch names
// (../layout.tsx, lib/server/design-flag.ts). Everyone else gets ../page.tsx, unchanged.
//
// Four tabs — Today, My goals, My mirror, Me — in the order the approved mockups settled on,
// with the navigation, the sign-in door and the session wiring. Each tab is its rebuilt
// screen (Phase 1: #130 Today, #131 My goals, #132 Me, #133 My mirror); inside them, parts of
// today's app are reused unchanged where they already did the job (marked data-reused).
// The server switch and the current design are as the Foundation (#129) left them.
//
// The data reads are the same BFF routes the current design uses: no new endpoint, no
// change to what any route sends or returns.
import { useState } from 'react';
import { usePiAuth } from '@yasser172/tec-auth';
import { Icon, type IconName } from '@yasser172/tec-ui';
import { C, bgA, goldA } from '@/lib-client/palette';
import { SAFE_BOTTOM } from '@/lib/safe-bottom';
import { useSubscription } from '@/lib-client/life/useLife';
import { useTranslation } from '@/lib/i18n';
import { isProPlan } from '../components/shared';
import { SignInGate } from '../components/SignInGate';
import { TodayView } from './today/TodayView';
import { GoalsView } from './goals/GoalsView';
import { MeView } from './me/MeView';
import { MirrorView } from './mirror/MirrorView';
import { ProblemSession, type Resume } from '../components/ProblemSession';
import { JourneyDrawer } from '../components/JourneyDrawer';
import { GoalPrefillReader } from '../components/GoalPrefillReader';
import { type GoalPrefill, stepAsGoal } from '@/lib/life/prefill';
import { countSession } from '@/lib-client/life/sessionCounter';

export type NewTab = 'today' | 'goals' | 'mirror' | 'me';
export const NEW_TABS: readonly NewTab[] = ['today', 'goals', 'mirror', 'me'];
const ICONS: Record<NewTab, IconName> = { today: 'sparkles', goals: 'target', mirror: 'trending', me: 'user' };

export function NewApp() {
  const { t } = useTranslation();
  const { user } = usePiAuth();
  const { plan, daysRemaining } = useSubscription();
  const isPro = isProPlan(plan ?? (user as { subscriptionPlan?: string } | null)?.subscriptionPlan);
  const [tab, setTab] = useState<NewTab>('today');
  const [inSession, setInSession] = useState(false);
  const [resume, setResume] = useState<Resume | undefined>(undefined);
  const [sessionKey, setSessionKey] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [prefill, setPrefill] = useState<GoalPrefill | null>(null);
  const [prefillN, setPrefillN] = useState(0);

  const goTo = (next: NewTab) => { if (next !== 'goals') setPrefill(null); setTab(next); };
  const openSession = (r?: Resume) => {
    if (r) countSession('c_resumed');
    setResume(r); setSessionKey((k) => k + 1); setInSession(true); setTab('today');
  };

  return (
    <main data-design="new" style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'var(--tec-font-ui)', paddingBottom: `calc(112px + ${SAFE_BOTTOM})` }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: 'calc(18px + env(safe-area-inset-top)) 18px 0', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          {tab === 'today' && !inSession
            ? <span />
            : <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: C.text }}>{t.life.v2.tabs[tab]}</h1>}
        </header>

        <SignInGate>
          <GoalPrefillReader onPrefill={(p) => { setPrefill(p); setTab('goals'); }} />
          {inSession && (
            <div hidden={tab !== 'today'}>
              <ProblemSession key={sessionKey} resume={resume} onMenu={() => setMenuOpen(true)}
                onClose={() => { setInSession(false); setResume(undefined); }} />
            </div>
          )}
          {tab === 'today' && !inSession && (
            <TodayView onTalk={() => openSession()} onContinue={openSession}
              onGoals={() => goTo('goals')} onMenu={() => setMenuOpen(true)} />
          )}
          {tab === 'goals' && (
            <GoalsView isPro={isPro} prefill={prefill} onPrefillUsed={() => setPrefill(null)} key={prefill ? `pf:${prefillN}:${prefill.title}` : 'goals'} />
          )}
          {tab === 'mirror' && <MirrorView onTalk={() => openSession()} />}
          {tab === 'me' && <MeView isPro={isPro} daysRemaining={daysRemaining ?? null} onOpenJourney={() => setMenuOpen(true)} />}
          <JourneyDrawer open={menuOpen} onClose={() => setMenuOpen(false)} onNew={() => openSession()} onContinue={openSession}
            onMakeGoal={(step) => { const p = stepAsGoal(step); if (!p) return; setPrefill(p); setPrefillN((n) => n + 1); setTab('goals'); }} />
          <NewNav active={tab} onSelect={goTo} />
        </SignInGate>
      </div>
    </main>
  );
}

/** Four tabs, each at least 44×44 (WCAG 2.5.8 and the platforms' own minimum). */
export function NewNav({ active, onSelect }: { active: NewTab; onSelect: (t: NewTab) => void }) {
  const { t } = useTranslation();
  return (
    <nav aria-label={t.life.brand} style={{
      position: 'fixed', zIndex: 200,
      left: 12, right: 12, bottom: `calc(12px + ${SAFE_BOTTOM})`,
      maxWidth: 560, margin: '0 auto',
      background: bgA(0.9), backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: `1px solid ${C.border}`, borderRadius: 22,
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: 4,
    }}>
      {NEW_TABS.map((key) => {
        const on = active === key;
        return (
          <button key={key} type="button" onClick={() => onSelect(key)} aria-current={on ? 'page' : undefined}
            style={{
              minHeight: 56, minWidth: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
              background: on ? goldA(0.12) : 'none', border: 'none', borderRadius: 18, cursor: 'pointer',
            }}>
            <Icon name={ICONS[key]} size={20} color={on ? C.gold : C.faint} strokeWidth={on ? 2.2 : 1.9} />
            <span style={{ fontSize: 11.5, fontWeight: on ? 700 : 500, color: on ? C.gold : C.faint, whiteSpace: 'nowrap' }}>
              {t.life.v2.tabs[key]}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
