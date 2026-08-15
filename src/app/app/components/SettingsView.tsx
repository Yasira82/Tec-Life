'use client';

// A proper app Settings page for Life (modeled on tec-assets' settings): sectioned,
// with a Profile card, an EN/AR language toggle that drives i18n, preferences, an
// About block, invite, and logout. Fully translated (RTL-aware via the provider).
import { usePiAuth } from '@yasser172/tec-auth';
import { TEC_COLORS } from '@yasser172/tec-ui';
import { usePreferences } from '@/lib-client/life/useLife';
import { useTranslation } from '@/lib/i18n';
import { InviteCard } from '@/components/referral/InviteCard';

const FOCUS_OPTIONS = ['Saving', 'Earning', 'Learning', 'Building', 'Trading'];

const cardStyle = {
  background: TEC_COLORS.surface, border: `1px solid ${TEC_COLORS.border}`, borderRadius: 16,
} as const;

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 4px 8px', color: TEC_COLORS.subtext }}>
        <span style={{ fontSize: 15 }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>{title}</span>
      </div>
      <div style={{ ...cardStyle, overflow: 'hidden' }}>{children}</div>
    </section>
  );
}

function Row({ label, desc, children, first }: { label: string; desc?: string; children?: React.ReactNode; first?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      padding: '14px 16px', borderTop: first ? 'none' : `1px solid ${TEC_COLORS.border}`,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: TEC_COLORS.text }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: TEC_COLORS.subtext, marginTop: 2 }}>{desc}</div>}
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
              border: `1px solid ${active ? TEC_COLORS.gold : TEC_COLORS.border}`,
              background: active ? 'rgba(251,191,36,0.12)' : 'transparent',
              color: active ? TEC_COLORS.gold : TEC_COLORS.subtext,
            }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function SettingsView({ isPro }: { isPro: boolean }) {
  const { t, locale, setLocale } = useTranslation();
  const { user, logout } = usePiAuth();
  const { prefs, loading, saving, save } = usePreferences();
  const s = t.life.settings;
  const username = user?.piUsername ?? null;

  const selectStyle = {
    background: TEC_COLORS.bg, color: TEC_COLORS.text, border: `1px solid ${TEC_COLORS.border}`,
    borderRadius: 10, padding: '8px 12px', fontSize: 14, minWidth: 140,
  } as const;

  return (
    <div>
      {/* Profile */}
      <Section title={s.profile} icon="👤">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${TEC_COLORS.gold}, ${TEC_COLORS.goldDark})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 900, color: '#0a0800',
          }}>{(username ?? 'Y').charAt(0).toUpperCase()}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: TEC_COLORS.text }}>
              {username ? `@${username}` : s.notSignedIn}
            </div>
            <div style={{ fontSize: 13, color: TEC_COLORS.subtext, marginTop: 2 }}>{isPro ? s.planPro : s.planFree}</div>
            {username && (
              <span style={{
                display: 'inline-block', marginTop: 8, fontSize: 12, fontWeight: 700,
                color: TEC_COLORS.success, background: 'rgba(34,197,94,0.10)',
                border: '1px solid rgba(34,197,94,0.25)', borderRadius: 999, padding: '3px 10px',
              }}>● {s.connectedPi}</span>
            )}
          </div>
        </div>
      </Section>

      {/* Appearance — language toggle drives the whole app (i18n + RTL) */}
      <Section title={s.appearance} icon="🎨">
        <Row label={t.life.prefs.language} desc={s.languageDesc} first>
          <Pills
            value={locale}
            options={[{ value: 'en', label: '🇺🇸 EN' }, { value: 'ar', label: '🇸🇦 AR' }]}
            onChange={(v) => { setLocale(v); save({ language: v }); }}
          />
        </Row>
      </Section>

      {/* Preferences */}
      <Section title={t.life.prefs.title} icon="⚙️">
        <Row label={t.life.prefs.primaryFocus} first>
          <select style={selectStyle} value={prefs.focus ?? ''} disabled={loading || saving}
            onChange={(e) => save({ focus: e.target.value })}>
            <option value="">—</option>
            {FOCUS_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </Row>
      </Section>

      {/* About */}
      <Section title={s.about} icon="ℹ️">
        <Row label={s.version} first><span style={{ color: TEC_COLORS.subtext, fontSize: 14 }}>1.0.0</span></Row>
        <Row label={s.domain}><span style={{ color: TEC_COLORS.subtext, fontSize: 14 }}>life.pi</span></Row>
        <Row label={s.ecosystem}><span style={{ color: TEC_COLORS.gold, fontSize: 14, fontWeight: 700 }}>TEC · 24</span></Row>
        <Row label={s.builtOn}><span style={{ color: TEC_COLORS.subtext, fontSize: 14 }}>{s.builtOnPi}</span></Row>
      </Section>

      <div style={{ marginTop: 20 }}><InviteCard /></div>

      {username && (
        <button
          onClick={() => { void logout(); }}
          style={{
            width: '100%', marginTop: 16, padding: '14px', cursor: 'pointer',
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.28)',
            borderRadius: 14, color: '#ef4444', fontSize: 15, fontWeight: 800,
          }}>
          {s.logout}
        </button>
      )}
    </div>
  );
}
