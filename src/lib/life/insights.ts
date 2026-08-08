// Server-only Life Goal Insights access (C-106) via the API Gateway with the session
// token + inter-service key. The aggregate is the caller's OWN goal data (own-scope,
// P6 — the backend resolves identity from the token). NEW-A: the gateway URL is
// server-only (API_GATEWAY_URL) — never shipped to the client.
const GW = process.env.API_GATEWAY_URL ?? '';

const gwHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  'x-request-id': crypto.randomUUID(),
  Authorization:  `Bearer ${token}`,
  ...(process.env.INTERNAL_SECRET && { 'x-internal-key': process.env.INTERNAL_SECRET }),
});

export interface GoalInsights {
  total: number;
  byStatus: Record<string, number>;
  completionRate: number;
  trackers: number;
  reached: number;
  funding: { targetSum: number; progressSum: number; pct: number };
}

/** The caller's LIVE Life-Pro entitlement — from commerce (Subscription owner, C-47).
 *  Life never STORES billing (P5); it reflects it to gate insights. Any failure → false. */
export async function resolveProStatus(token: string | null): Promise<boolean> {
  if (!GW || !token) return false;
  try {
    const res = await fetch(`${GW}/api/commerce/subscriptions/status`, { headers: gwHeaders(token), cache: 'no-store' });
    if (!res.ok) return false;
    const d = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const s = (d.data ?? d) as Record<string, unknown>;
    const plan = String(s.plan ?? s.tier ?? '').toUpperCase();
    const active  = s.isActive === true || s.active === true || (plan !== '' && plan !== 'FREE');
    const expired = s.isExpired === true;
    const end     = s.current_period_end ?? s.currentPeriodEnd ?? s.expires_at;
    const notExpired = !expired && (!end || new Date(String(end)).getTime() > Date.now());
    return active && notExpired && plan !== '' && plan !== 'FREE';
  } catch { return false; }
}

/** The caller's goal-insights aggregate. null on unreachable / no session. */
export async function resolveGoalInsights(token: string | null): Promise<GoalInsights | null> {
  if (!GW || !token) return null;
  try {
    const res = await fetch(`${GW}/api/identity/life/goals/insights`, { headers: gwHeaders(token), cache: 'no-store' });
    if (!res.ok) return null;
    const insights = (await res.json().catch(() => ({})))?.data?.insights;
    return insights ?? null;
  } catch { return null; }
}
