'use client';

// TEC Life — System of Record (Personal). C-106.
// Home shell for the user's personal economic context. Feature slices
// (Goals & Preferences, Activity timeline) mount into the cards below.
import { usePiAuth } from '@yasser172/tec-auth';
import { TEC_COLORS } from '@yasser172/tec-ui';

type Section = { emoji: string; title: string; blurb: string; status: string };

// C-106 §4 Owns: goals, preferences, activity timeline. Self-declared data is
// strong-consistency (the user controls it); activity is eventual (event stream).
const SECTIONS: Section[] = [
  { emoji: '🎯', title: 'Goals',       blurb: 'What you’re working toward — self-declared aspirations and targets.', status: 'coming soon' },
  { emoji: '⚙️', title: 'Preferences', blurb: 'How TEC should tailor your experience across the ecosystem.',        status: 'coming soon' },
  { emoji: '📈', title: 'Activity',     blurb: 'Your economic timeline — spending, trading and creating over time.',  status: 'coming soon' },
];

const card = {
  background:   TEC_COLORS.surface,
  border:       `1px solid ${TEC_COLORS.border}`,
  borderRadius: 16,
  padding:      '20px 22px',
} as const;

export default function LifeHome() {
  const { user, isLoading } = usePiAuth();
  const name = user?.piUsername ? `@${user.piUsername}` : 'there';

  return (
    <main style={{ minHeight: '100vh', background: TEC_COLORS.bg, color: TEC_COLORS.text, padding: '32px 22px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <header style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, letterSpacing: 1, color: TEC_COLORS.subtext, textTransform: 'uppercase' }}>TEC Life · System of Record</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: TEC_COLORS.gold, margin: '6px 0 0' }}>
            {isLoading ? 'Welcome' : `Welcome, ${name}`}
          </h1>
          <p style={{ fontSize: 14, color: TEC_COLORS.subtext, margin: '6px 0 0', lineHeight: 1.6 }}>
            Life is your personal context in the TEC ecosystem — the goals, preferences and
            activity that make everything else relevant to you. Your data is yours (C-106):
            self-declared, private, and never used without your consent.
          </p>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginTop: 24 }}>
          {SECTIONS.map((s) => (
            <div key={s.title} style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>{s.emoji}</span>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: TEC_COLORS.text, margin: 0 }}>{s.title}</h2>
                </div>
                <span style={{ fontSize: 11, color: TEC_COLORS.gold, border: `1px solid ${TEC_COLORS.gold}55`, borderRadius: 999, padding: '2px 10px', whiteSpace: 'nowrap' }}>
                  {s.status}
                </span>
              </div>
              <p style={{ fontSize: 13, color: TEC_COLORS.subtext, margin: '10px 0 0', lineHeight: 1.6 }}>{s.blurb}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
