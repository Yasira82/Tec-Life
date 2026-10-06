'use client';

import { C } from '@/lib-client/palette';
import { type Goal } from '@/lib-client/life/useLife';
import { useTranslation } from '@/lib/i18n';
import { card, fmtPi } from './shared';
import { Goals } from './Goals';

// Three-at-a-glance stats derived from the caller's own goals (summary before detail).
export function Overview({ goals }: { goals: Goal[] }) {
  const { t } = useTranslation();
  const active = goals.filter((g) => g.status === 'ACTIVE').length;
  const done   = goals.filter((g) => g.status === 'DONE').length;
  const tracked = goals.reduce((sum, g) => sum + (g.target_amount ? (g.progress ?? 0) : 0), 0);

  const stat = (label: string, value: string, accent: string = C.text) => (
    <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
      <div style={{ fontSize: 23, fontWeight: 900, color: accent, fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1.1, letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: 10.5, color: C.faint, marginTop: 3, letterSpacing: 0.2,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
    </div>
  );

  // Bare, on the page ground — the same strip Home uses. In a card it was the
  // third identical grey panel in a row, and the Goals tab opened looking like
  // the Home tab.
  return (
    <div style={{ display: 'flex', gap: 4, margin: '16px 2px 2px' }}>
      {stat(t.life.goals.active, String(active), C.gold)}
      <div style={{ width: 1, background: C.border, margin: '4px 0' }} />
      {stat(t.life.goals.completed, String(done), C.text)}
      <div style={{ width: 1, background: C.border, margin: '4px 0' }} />
      {stat(t.life.goals.tracked, `π ${fmtPi(tracked)}`)}
    </div>
  );
}
