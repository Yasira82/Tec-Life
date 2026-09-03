'use client';

// A proper app Settings page for Life (modeled on tec-assets' settings): sectioned,
// with a Profile card, an EN/AR language toggle that drives i18n, preferences, an
// About block, invite, and logout. Fully translated (RTL-aware via the provider).
import { usePiAuth } from '@yasser172/tec-auth';
import { Icon, type IconName } from '@yasser172/tec-ui';
import { useEffect, useState } from 'react';
import { C, errorA, goldA, inkA, successA } from '@/lib-client/palette';
import { THEME_ORDER, readTheme, saveTheme, type ThemeChoice } from '@/lib-client/theme';
import {
  usePreferences, useConsent, useIntent, purgeLifeData,
} from '@/lib-client/life/useLife';
import { useMe } from '@/lib-client/hooks/useMe';
import { useTranslation } from '@/lib/i18n';
import { LOCALES } from '@/lib/i18n/locales';
import { InviteCard } from '@/components/referral/InviteCard';

const FOCUS_OPTIONS = ['Saving', 'Earning', 'Learning', 'Building', 'Trading'];

const cardStyle = {
  background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16,
} as const;

function Section({ title, icon, children }: { title: string; icon: IconName; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 20 }}>
      {/* A glyph NAME, not an emoji character. The same emoji is a glossy 3D
          object on one phone and flat grey line art on the next, and it never
          takes the section's colour — one line-icon set at one weight is what
          a settings screen looks like when someone designed it. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 4px 10px', color: C.faint }}>
        <Icon name={icon} size={14} color={C.faint} strokeWidth={2} />
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase' }}>{title}</span>
      </div>
      <div style={{ ...cardStyle, overflow: 'hidden' }}>{children}</div>
    </section>
  );
}

function Row({ label, desc, children, first }: { label: string; desc?: string; children?: React.ReactNode; first?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      padding: '14px 16px', borderTop: first ? 'none' : `1px solid ${C.border}`,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: C.subtext, marginTop: 2 }}>{desc}</div>}
      </div>
      {children != null && <div style={{ flexShrink: 0 }}>{children}</div>}
    </div>
  );
}

function Pills<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)}
            style={{
              padding: '7px 14px', borderRadius: 999, cursor: 'pointer', fontSize: 13, fontWeight: 700,
              border: `1px solid ${active ? C.gold : C.border}`,
              background: active ? goldA(0.12) : 'transparent',
              color: active ? C.gold : C.subtext,
            }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// A switch, not a checkbox. It carries the state in its shape as well as its
// colour, so a person who cannot separate the amber from the grey still sees
// which way it is thrown.
function Toggle({ on, disabled, label, onChange }: {
  on: boolean; disabled?: boolean; label: string; onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch" aria-checked={on} aria-label={label} disabled={disabled}
      onClick={() => onChange(!on)}
      style={{
        width: 44, height: 26, borderRadius: 999, position: 'relative', flexShrink: 0,
        cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1,
        background: on ? C.gold : inkA(0.1),
        border: `1px solid ${on ? 'transparent' : C.border}`,
        transition: 'background .18s',
      }}>
      <span style={{
        position: 'absolute', top: 3, insetInlineStart: on ? 21 : 3,
        width: 18, height: 18, borderRadius: '50%',
        background: on ? C.onGold : C.faint,
        transition: 'inset-inline-start .18s, background .18s',
      }} />
    </button>
  );
}

// ── Privacy (C-106 §5 · §11 P0-1) ────────────────────────────────────────────
//
// Life's home screen promises "private, and never used without your consent".
// This is where that promise becomes something a person can operate: one
// grant per data category, and a way to remove everything.
//
// The note above the switches is deliberately literal. Nothing reads Life data
// across the boundary today, and a screen implying an active protection would
// be claiming more than the system does. Saying "nothing reads this yet, and
// these decide what will be allowed when something does" is both true now and
// still true afterwards.
function Privacy() {
  const { t } = useTranslation();
  const p = t.life.privacy;
  const { consent, loading, saving, grant } = useConsent();
  const intent = useIntent();
  const [armed,   setArmed]   = useState(false);
  const [state,   setState]   = useState<'idle' | 'busy' | 'done' | 'failed'>('idle');

  const LABEL: Record<string, string> = {
    GOALS: p.goals, SKILLS: p.skills, PREFERENCES: p.preferences,
    ACTIVITY: p.activity, TRAJECTORY: p.trajectory, INTENT: p.intentTitle,
  };

  // A signal kind reads as a verb, not a constant: "Logging progress", never
  // PROGRESS_LOGGED. An unknown kind falls through to its raw name rather than
  // being hidden — a category the screen cannot name is exactly the one a
  // person should still be told about.
  const INTENT_LABEL: Record<string, string> = {
    GOAL_CREATED: p.kGoal, PROGRESS_LOGGED: p.kProgress, GOAL_COMPLETED: p.kDone,
    SKILL_ADDED: p.kSkill, SKILL_LEVELED: p.kLevel, PREFERENCE_SET: p.kPref,
  };

  // Two taps, not a modal. The second tap is the confirmation, and it disarms
  // itself after a few seconds so a stray thumb cannot land on an armed button
  // minutes later.
  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(false), 6000);
    return () => clearTimeout(id);
  }, [armed]);

  const remove = async () => {
    if (!armed) { setArmed(true); return; }
    setArmed(false);
    setState('busy');
    try {
      await purgeLifeData();
      setState('done');
      // A purge changes what every other screen holds. Reloading is blunt and
      // correct: showing a stale goal list after "Deleted." would be the app
      // contradicting itself about the one thing it just promised.
      setTimeout(() => window.location.reload(), 900);
    } catch {
      setState('failed');
    }
  };

  return (
    <Section title={p.title} icon="lock">
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{p.shareTitle}</div>
        <p style={{ fontSize: 12, color: C.subtext, margin: '6px 0 0', lineHeight: 1.6 }}>{p.shareNote}</p>
      </div>

      {/* The live window, directly under the sentence about it and directly
          above the switch that governs it. Showing someone what they just did
          is not news; showing them WHAT LIFE WOULD SAY ABOUT THEM, next to the
          control that decides whether it may, is the whole point. */}
      {intent && (
        <div style={{ padding: '0 16px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: C.gold }}>
            {p.intentTitle}
          </div>
          <div style={{ fontSize: 13.5, color: C.text, marginTop: 6 }}>
            {intent.intent ? (INTENT_LABEL[intent.intent] ?? intent.intent) : p.intentNone}
          </div>
          {intent.intent && intent.expires_in != null && (
            <div style={{ fontSize: 11, color: C.faint, marginTop: 4 }}>
              {p.intentExpires.replace('{n}', String(Math.max(1, Math.round(intent.expires_in / 60))))}
            </div>
          )}
          <p style={{ fontSize: 11.5, color: C.subtext, margin: '8px 0 0', lineHeight: 1.6 }}>{p.intentNote}</p>
        </div>
      )}

      {(loading ? [] : consent).map((c) => (
        <Row key={c.category} label={LABEL[c.category] ?? c.category}>
          <Toggle
            on={c.granted}
            disabled={saving}
            label={LABEL[c.category] ?? c.category}
            onChange={(v) => void grant(c.category, v)}
          />
        </Row>
      ))}

      <div style={{ padding: '14px 16px', borderTop: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.error }}>{p.deleteTitle}</div>
        <p style={{ fontSize: 12, color: C.subtext, margin: '6px 0 12px', lineHeight: 1.6 }}>{p.deleteDesc}</p>
        <button
          onClick={() => void remove()}
          disabled={state === 'busy' || state === 'done'}
          style={{
            width: '100%', padding: '12px', borderRadius: 12, cursor: 'pointer',
            fontSize: 14, fontWeight: 800, color: C.error,
            background: armed ? errorA(0.16) : errorA(0.06),
            border: `1px solid ${errorA(armed ? 0.55 : 0.28)}`,
          }}>
          {state === 'busy' ? p.deleting
            : state === 'done' ? p.deleted
            : armed ? p.confirm
            : p.delete}
        </button>
        {state === 'failed' && (
          <p style={{ fontSize: 12, color: C.error, margin: '10px 0 0' }}>{p.failed}</p>
        )}
      </div>
    </Section>
  );
}

export function SettingsView({ isPro }: { isPro: boolean }) {
  const { t, locale, setLocale } = useTranslation();
  // Read AFTER mount, never during render: the server has no localStorage, so
  // reading it in the initial state makes the markup depend on a value only the
  // browser has. The boot script already stamped the document, so the only thing
  // this catches up is the control's own highlight.
  const [theme, setTheme] = useState<ThemeChoice>('system');
  useEffect(() => { setTheme(readTheme()); }, []);
  const { user, isAuthenticated, logout } = usePiAuth();
  const me = useMe();
  const { prefs, loading, saving, save } = usePreferences();
  const s = t.life.settings;
  // Prefer the server-resolved Pi username (/api/auth/me) — in Pi Browser the client
  // can't read the tec_user cookie, so usePiAuth alone shows no name. Show the real
  // Pi login name, not a generic fallback.
  const username = me.username ?? user?.piUsername ?? null;
  // A resolved session, a live Pro subscription, or an authenticated hook state all
  // mean the user IS signed in — never show "Not signed in" to a member.
  const signedIn = me.authenticated || isAuthenticated || isPro || !!username;

  const selectStyle = {
    background: C.bg, color: C.text, border: `1px solid ${C.border}`,
    borderRadius: 10, padding: '8px 12px', fontSize: 14, minWidth: 140,
  } as const;

  return (
    <div>
      {/* Profile */}
      <Section title={s.profile} icon="user">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 900, color: C.onGold,
          }}>{(username ?? 'Y').charAt(0).toUpperCase()}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>
              {username ? `@${username}` : signedIn ? s.member : s.notSignedIn}
            </div>
            <div style={{ fontSize: 13, color: C.subtext, marginTop: 2 }}>{isPro ? s.planPro : s.planFree}</div>
            {signedIn && (
              <span style={{
                display: 'inline-block', marginTop: 8, fontSize: 12, fontWeight: 700,
                color: C.success, background: successA(0.1),
                border: `1px solid ${successA(0.25)}`, borderRadius: 999, padding: '3px 10px',
              }}>● {s.connectedPi}</span>
            )}
          </div>
        </div>
      </Section>

      {/* Appearance — theme and language, both driving the whole app.
          The theme row is new: this section was called "Appearance" and offered
          only a language, because nothing here could change a colour. Every
          component painted from hex literals baked into inline styles, so the
          `[data-theme]` blocks in the stylesheet had no reader. */}
      <Section title={s.appearance} icon="palette">
        <Row label={s.theme} desc={s.themeDesc} first>
          <Pills
            value={theme}
            options={THEME_ORDER.map((v) => ({
              value: v,
              label: v === 'system' ? s.themeSystem : v === 'light' ? s.themeLight : s.themeDark,
            }))}
            onChange={(v) => { setTheme(v); saveTheme(v); }}
          />
        </Row>
        <Row label={t.life.prefs.language} desc={s.languageDesc}>
          {/* A select, not pills: twelve options do not fit in a row, and a
              horizontally-scrolling strip hides the ones that happen to sit
              off-screen — including, for some readers, their own.

              Each is written in ITS OWN SCRIPT. Someone who cannot read the
              current interface language cannot read "Vietnamese" either, but
              they can always read "Tiếng Việt". */}
          <select
            value={locale}
            onChange={(e) => { const v = e.target.value as typeof locale; setLocale(v); save({ language: v }); }}
            aria-label={t.life.prefs.language}
            style={{
              background: C.bg, color: C.text, fontSize: 14,
              border: `1px solid ${goldA(0.2)}`, borderRadius: 8,
              padding: '8px 10px', outline: 'none', maxWidth: 200,
            }}
          >
            {LOCALES.map((l) => (
              <option key={l.code} value={l.code} lang={l.code}>{l.native}</option>
            ))}
          </select>
        </Row>
      </Section>

      {/* Preferences */}
      <Section title={t.life.prefs.title} icon="settings">
        <Row label={t.life.prefs.primaryFocus} first>
          <select style={selectStyle} value={prefs.focus ?? ''} disabled={loading || saving}
            onChange={(e) => save({ focus: e.target.value })}>
            <option value="">—</option>
            {FOCUS_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </Row>
      </Section>

      {/* Privacy — the promise on the home screen, made operable. */}
      <Privacy />

      {/* About */}
      <Section title={s.about} icon="info">
        <Row label={s.version} first><span style={{ color: C.subtext, fontSize: 14 }}>1.0.0</span></Row>
        <Row label={s.domain}><span style={{ color: C.subtext, fontSize: 14 }}>life.pi</span></Row>
        <Row label={s.ecosystem}><span style={{ color: C.gold, fontSize: 14, fontWeight: 700 }}>TEC · 24</span></Row>
        <Row label={s.builtOn}><span style={{ color: C.subtext, fontSize: 14 }}>{s.builtOnPi}</span></Row>
      </Section>

      <div style={{ marginTop: 20 }}><InviteCard /></div>

      {signedIn && (
        <button
          onClick={() => { void logout(); }}
          style={{
            width: '100%', marginTop: 16, padding: '14px', cursor: 'pointer',
            background: errorA(0.06), border: `1px solid ${errorA(0.28)}`,
            borderRadius: 14, color: C.error, fontSize: 15, fontWeight: 800,
          }}>
          {s.logout}
        </button>
      )}
    </div>
  );
}
