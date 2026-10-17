// Stage 1's only trace: +1 on an aggregate counter (First Session Spec §7–§8).
//
// The body is ONE word from a closed set — never the person's text, never an id.
// The page's text stays in React state and nowhere else; this file is the only
// network call the session makes, and the e2e test checks that it stays that way.
export const SESSION_METRICS = ['s2_started', 's7_reached', 'm6_yes', 'm6_somewhat', 'm6_no'] as const;
export type SessionMetric = (typeof SESSION_METRICS)[number];

/** Fire and forget: a lost count must never block or break the session. */
export function countSession(metric: SessionMetric): void {
  try {
    void fetch('/api/bff/life/session/count', {
      method: 'POST', credentials: 'include', keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metric }),
    }).catch(() => { /* a count is not worth an error the person sees */ });
  } catch { /* same */ }
}
