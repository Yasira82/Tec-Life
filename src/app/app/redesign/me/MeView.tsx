'use client';

// The redesign's Me (Phase 1, approved mockup «أنا», owner 2026-11-28). In this order:
//
//   who I am       the name, the plan, and «I'm becoming…» (the existing Becoming card) — purple is
//                  identity's colour and lives here
//   my skills      one line each; Manage opens the existing Skills editor in a sheet
//   my journey     how many summaries and conversations are kept; opens the existing drawer
//   privacy        MePrivacy — the three groups
//   subscription   the existing Life Pro card
//   settings       theme, language, focus — the same controls and stores as today's Settings
//   more           feedback, links, about, invite (existing components), then log out
//
// Admin-only readings render as before (each renders nothing for anyone else). Nothing here calls a
// route the current design does not call.
import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { usePiAuth } from '@yasser172/tec-auth';
import { C, goldA, identityA } from '@/lib-client/palette';
import { THEME_ORDER, readTheme, saveTheme, type ThemeChoice } from '@/lib-client/theme';
import { useTranslation } from '@/lib/i18n';
import { LOCALES } from '@/lib/i18n/locales';
import { useMe } from '@/lib-client/hooks/useMe';
import { usePreferences, useSkills } from '@/lib-client/life/useLife';
import { readJourney } from '@/lib-client/life/journey';
import { listConversations } from '@/lib-client/life/conversations';
import { meCopy } from '@/lib/life/me-copy';
import { CONVERSATIONS_READ_CAP, JOURNEY_READ_CAP } from '@/lib/life/deletion-count';
import { fill } from '@/lib/life/today-copy';
import { uiCopy } from '@/lib/life/ui-copy';
import { Becoming } from '../../components/Becoming';
import { Skills, SKILL_LEVEL_KEYS } from '../../components/Skills';
import { LifePro } from '../../components/LifePro';
import { SessionReading } from '../../components/SessionReading';
import { OutcomesReading } from '../../components/OutcomesReading';
import { InviteCard } from '@/components/referral/InviteCard';
import { FeedbackCard } from '@/components/feedback/FeedbackCard';
import { SocialLinks } from '@/components/social/SocialLinks';
import { Sheet } from '../Sheet';
import { MePrivacy } from './MePrivacy';

type Counts = { state: 'loading' } | { state: 'failed' } | { state: 'ok'; s: number; sAtLeast: boolean; c: number; cAtLeast: boolean };

const FOCUS_OPTIONS = ['Saving', 'Earning', 'Learning', 'Building', 'Trading'];
const card: CSSProperties = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 };
const h2: CSSProperties = { margin: 0, fontSize: 16, fontWeight: 800, color: C.text };
const quiet: CSSProperties = { minHeight: 44, borderRadius: 12, border: `1px solid ${C.border}`, background: 'transparent', color: C.text, fontSize: 14, cursor: 'pointer', padding: '0 14px' };
const field: CSSProperties = { minHeight: 44, fontSize: 16, background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 12, padding: '0 10px', maxWidth: 200 };

export function MeView({ isPro, daysRemaining, onOpenJourney }: { isPro: boolean; daysRemaining: number | null; onOpenJourney: () => void }) {
  const { t, locale, setLocale } = useTranslation();
  const m = meCopy(locale);
  const s = t.life.settings;
  const me = useMe();
  const { user, isAuthenticated, logout } = usePiAuth();
  const username = me.username ?? user?.piUsername ?? null;
  const signedIn = me.authenticated || isAuthenticated || isPro || !!username;
  const { skills, loading: skillsLoading, error: skillsError, reload: reloadSkills } = useSkills();
  const { prefs, loading: prefsLoading, saving, save } = usePreferences();
  const [theme, setTheme] = useState<ThemeChoice>('system');
  useEffect(() => { setTheme(readTheme()); }, []);
  const [skillsOpen, setSkillsOpen] = useState(false);
  // What is kept, read from the source — and read AGAIN whenever it may have changed (a keep switch
  // turned off below). A read that fails is said, with a retry; it is never shown as 0. At a read cap
  // the count is «at least» (owner review of the redesign chain, 28 Nov 2026).
  const [counts, setCounts] = useState<Counts>({ state: 'loading' });
  const loadCounts = useCallback(() => {
    setCounts({ state: 'loading' });
    void Promise.all([readJourney(), listConversations()]).then(([j, l]) => {
      if (!j || !l) { setCounts({ state: 'failed' }); return; }
      const s = j.keeping ? j.entries.length : 0;
      const c = l.keeping ? l.conversations.length : 0;
      setCounts({ state: 'ok', s, sAtLeast: s >= JOURNEY_READ_CAP, c, cAtLeast: c >= CONVERSATIONS_READ_CAP });
    });
  }, []);
  useEffect(() => { loadCounts(); }, [loadCounts]);
  // «I'm becoming…» is deleted with the journey: remounting the card makes it read the source again.
  const [becomingKey, setBecomingKey] = useState(0);
  const afterDeletion = (cat: 'JOURNEY' | 'CONVERSATIONS') => {
    if (cat === 'JOURNEY') setBecomingKey((k) => k + 1);
    loadCounts();
  };
  // The skills editor in the sheet keeps its own list; this one is read again when the sheet closes.
  const closeSkills = () => { setSkillsOpen(false); reloadSkills(); };
  const countText = (n: number, atLeast: boolean) => (atLeast ? fill(m.atLeast, { n }) : String(n));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Who I am */}
      <section data-testid="me-identity" style={{ ...card, background: identityA(0.06), borderColor: identityA(0.25) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div aria-hidden="true" style={{ width: 52, height: 52, borderRadius: '50%', flex: 'none', display: 'grid', placeItems: 'center',
            background: identityA(0.16), color: C.identityInk, fontSize: 22, fontWeight: 800 }}>
            {(username ?? '·').charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>
              {username ? <bdi dir="ltr">@{username}</bdi> : signedIn ? s.member : me.loading ? '…' : s.notSignedIn}
            </div>
            <div style={{ fontSize: 13, color: C.subtext }}>{isPro ? s.planPro : s.planFree}{signedIn ? ` · ${s.connectedPi}` : ''}</div>
          </div>
        </div>
        <div data-reused="becoming"><Becoming key={becomingKey} /></div>
      </section>

      {/* My skills */}
      <section data-testid="me-skills" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <h2 style={h2}>{t.life.skills.title}</h2>
          <button type="button" onClick={() => setSkillsOpen(true)} style={quiet}>{m.manage}</button>
        </div>
        <div style={{ ...card, padding: '2px 16px', gap: 0 }}>
          {skillsLoading && skills.length === 0 ? <div aria-busy="true" style={{ height: 52 }} />
            : skillsError ? (
              <div role="alert" data-testid="skills-failed" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 0' }}>
                <span style={{ fontSize: 14, color: C.text }}>{m.skillsFailed}</span>
                <button type="button" onClick={reloadSkills} style={quiet}>{m.retry}</button>
              </div>
            )
            : skills.length === 0 ? <p style={{ margin: '14px 0', fontSize: 14, color: C.subtext }}>{m.noSkills}</p>
            : skills.map((k, i) => {
              const step = ['LEARNING', 'PRACTISING', 'PROFICIENT', 'EXPERT'].indexOf(k.level) + 1;
              return (
                <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 48, borderTop: i ? `1px solid ${C.border}` : 'none' }}>
                  <span translate="no" style={{ flex: 1, minWidth: 0, fontSize: 15, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><bdi>{k.name}</bdi></span>
                  <span style={{ fontSize: 12.5, color: C.subtext }}>{t.life.skills.levels[SKILL_LEVEL_KEYS[k.level]]}</span>
                  <span aria-hidden="true" style={{ display: 'inline-flex', gap: 3 }}>
                    {[1, 2, 3, 4].map((n) => <i key={n} style={{ width: 8, height: 8, borderRadius: 2, background: n <= step ? C.gold : C.surface2 }} />)}
                  </span>
                </div>
              );
            })}
        </div>
      </section>

      {/* My journey */}
      <section data-testid="me-journey" style={{ ...card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ minWidth: 0 }}>
          <h2 style={h2}>{m.journey}</h2>
          {counts.state === 'failed' ? (
            <div role="alert" data-testid="journey-counts-failed" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              <span style={{ fontSize: 13, color: C.text }}>{m.countsFailed}</span>
              <button type="button" onClick={loadCounts} style={quiet}>{m.retry}</button>
            </div>
          ) : (
            <div data-testid="journey-counts" aria-busy={counts.state === 'loading'} style={{ fontSize: 13, color: C.subtext, marginTop: 2 }}>
              {counts.state === 'ok' ? fill(m.counts, { s: countText(counts.s, counts.sAtLeast), c: countText(counts.c, counts.cAtLeast) }) : '…'}
            </div>
          )}
        </div>
        <button type="button" onClick={onOpenJourney} style={{ ...quiet, borderColor: goldA(0.5), color: C.gold }}>{m.openJourney}</button>
      </section>

      <MePrivacy onDeleted={afterDeletion} />

      {/* Subscription */}
      <div data-reused="life-pro"><LifePro isPro={isPro} daysRemaining={daysRemaining} /></div>

      {/* Settings — the same controls and stores as today's Settings */}
      <section data-testid="me-settings" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2 style={h2}>{m.settings}</h2>
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, color: C.text }}>{s.theme}</span>
            <div role="group" aria-label={s.theme} style={{ display: 'flex', gap: 6 }}>
              {THEME_ORDER.map((v) => (
                <button key={v} type="button" aria-pressed={theme === v} onClick={() => { setTheme(v); saveTheme(v); }}
                  style={{ ...quiet, borderColor: theme === v ? C.gold : C.border, color: theme === v ? C.text : C.subtext }}>
                  {v === 'system' ? s.themeSystem : v === 'light' ? s.themeLight : s.themeDark}
                </button>
              ))}
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ fontSize: 15, color: C.text }}>{t.life.prefs.language}</span>
            <select value={locale} style={field}
              onChange={(e) => { const v = e.target.value as typeof locale; setLocale(v); void save({ language: v }); }}>
              {LOCALES.map((l) => <option key={l.code} value={l.code} lang={l.code}>{l.native}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ fontSize: 15, color: C.text }}>{t.life.prefs.primaryFocus}</span>
            <select value={prefs.focus ?? ''} disabled={prefsLoading || saving} style={field} onChange={(e) => void save({ focus: e.target.value })}>
              <option value="">—</option>
              {FOCUS_OPTIONS.map((f) => <option key={f} value={f}>{uiCopy(locale).focus[f as keyof ReturnType<typeof uiCopy>['focus']] ?? f}</option>)}
            </select>
          </label>
        </div>
      </section>

      {/* Admin-only readings: each renders nothing for anyone else. */}
      <div data-reused="admin-readings"><SessionReading /><OutcomesReading /></div>

      {/* Help, links, about, invite — folded, as reference material */}
      <details data-testid="me-more">
        <summary style={{ minHeight: 44, display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: 15, fontWeight: 700, color: C.text }}>{m.more}</summary>
        <div data-reused="more" style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
          <div style={card}>
            <div style={{ fontSize: 13, color: C.subtext }}>{t.life.feedback.hint}</div>
            <FeedbackCard page="/app/me" />
          </div>
          <div style={card}><SocialLinks /></div>
          <div style={{ ...card, gap: 6, fontSize: 14, color: C.subtext }}>
            <div>{s.version}: 1.0.0</div><div>{s.domain}: life.pi</div><div>{s.builtOn}: {s.builtOnPi}</div>
          </div>
          <InviteCard />
        </div>
      </details>

      {signedIn && (
        <button type="button" onClick={() => { void logout(); }} style={{ ...quiet, minHeight: 48, color: C.error, borderColor: C.error, fontWeight: 800 }}>{s.logout}</button>
      )}

      {skillsOpen && (
        <Sheet title={t.life.skills.title} testId="skills-sheet" onClose={closeSkills}>
          <div data-reused="skills"><Skills /></div>
        </Sheet>
      )}
    </div>
  );
}
