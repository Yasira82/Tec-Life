'use client';

import { C } from '@/lib-client/palette';
import { useActivity } from '@/lib-client/life/useLife';
import { formatDay, formatTime, groupByDay } from '@/lib-client/format';
import { useTranslation } from '@/lib/i18n';
import { card } from './shared';

export const EVENT_LABEL: Record<string, string> = {
  'payment.completed': 'Payment completed',
  'order.created':     'Order placed',
  'user.created':      'Joined TEC',
  'kyc.verified':      'Identity verified',
};

export const prettyType = (t: string) => EVENT_LABEL[t] ?? t.replace(/\./g, ' · ');

export const piAmount = (payload: Record<string, unknown> | null): string | null => {
  const a = payload?.amount;
  return (typeof a === 'number' || typeof a === 'string') ? `π ${a}` : null;
};


// C-106 §4: the caller's own activity, presented from Analytics (eventual).
// Life never stores or re-derives transaction truth.
export function Activity() {
  const { t, locale } = useTranslation();
  const { events, loading, error } = useActivity(25);
  const dayLabels = { today: t.common.today, yesterday: t.common.yesterday };

  // Grouped by day. Nine rows reading "Payment completed · 8/28/2026,
  // 11:02:27 PM" is a wall — the same nine under two date headers is a
  // history, and the reader sees the shape of a week without parsing a single
  // timestamp.
  const days = groupByDay(events, (e) => e.created_at);

  return (
    <section style={{ marginTop: 4 }}>
      {loading ? (
        <div style={{ ...card }}>
          <p style={{ fontSize: 13, color: C.subtext, margin: 0 }}>{t.common.loading}</p>
        </div>
      ) : error || events.length === 0 ? (
        <div style={{ ...card }}>
          <p style={{ fontSize: 13, color: C.subtext, margin: 0, lineHeight: 1.6 }}>{t.life.activity.empty}</p>
        </div>
      ) : (
        <>
          {days.map((day) => (
            <div key={day.key} style={{ marginBottom: 14 }}>
              <div style={{
                fontSize: 11, fontWeight: 800, letterSpacing: 0.7, textTransform: 'uppercase',
                color: C.faint, margin: '0 4px 8px',
              }}>
                {formatDay(day.iso, locale, dayLabels)}
              </div>
              <div style={{ ...card, padding: '6px 18px' }}>
                {day.rows.map((ev, i) => {
                  const amt = piAmount(ev.payload);
                  return (
                    <div key={ev.id ?? i}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                               borderTop: i === 0 ? 'none' : `1px solid ${C.border}` }}>
                      {/* A time column, not a caption under the title: aligned
                          and tabular, so the eye reads DOWN the column instead
                          of hunting for it on each row. */}
                      <span style={{ fontSize: 11.5, color: C.faint, fontVariantNumeric: 'tabular-nums',
                                     minWidth: 52, flexShrink: 0 }}>
                        {formatTime(ev.created_at, locale)}
                      </span>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: C.text,
                                     overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {prettyType(ev.type)}
                      </span>
                      {amt && (
                        <span style={{ fontSize: 14, fontWeight: 800, color: C.gold,
                                       whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                          {amt}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}
    </section>
  );
}
