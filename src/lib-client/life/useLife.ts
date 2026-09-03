'use client';

import { useCallback, useEffect, useState } from 'react';

// TEC Life (C-106) client hooks. Self-declared personal context — the caller's own
// goals + preferences only (server scopes by session; the client never sends identity).

export type GoalStatus = 'ACTIVE' | 'DONE' | 'ARCHIVED';

export interface Goal {
  id:            string;
  title:         string;
  description:   string | null;
  status:        GoalStatus;
  target_date:   string | null;
  target_amount: number | null; // optional π target — enables progress tracking
  progress:      number;        // π logged toward the target
  created_at:    string;
  updated_at:    string;
}

// Activity timeline item (C-106 §4) — the caller's own economic event, presented
// from Analytics (eventual consistency). Life never re-derives transaction truth.
export interface ActivityEvent {
  id:         string;
  type:       string;
  payload:    Record<string, unknown> | null;
  created_at: string;
}

// The service wraps payloads as { success, data: {...} }.
async function readJson(res: Response): Promise<Record<string, unknown>> {
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const err = (json?.error as string) ?? `Request failed (${res.status})`;
    throw new Error(err);
  }
  return (json?.data as Record<string, unknown>) ?? json;
}

// ── Goals ────────────────────────────────────────────────────
export function useGoals() {
  const [goals,   setGoals]   = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [busy,    setBusy]    = useState(false);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch('/api/bff/life/goals', { credentials: 'include', cache: 'no-store' })
      .then(readJson)
      .then((d) => setGoals((d.goals as Goal[]) ?? []))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load goals'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => reload(), [reload]);

  const mutate = useCallback(async (fn: () => Promise<Response>) => {
    setBusy(true);
    setError(null);
    try {
      await readJson(await fn());
      reload();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  }, [reload]);

  const addGoal = useCallback((title: string, targetAmount?: number) =>
    mutate(() => fetch('/api/bff/life/goals', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, ...(targetAmount && targetAmount > 0 ? { target_amount: targetAmount } : {}) }),
    })), [mutate]);

  const addProgress = useCallback((id: string, delta: number) =>
    mutate(() => fetch(`/api/bff/life/goals/${id}/progress`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta }),
    })), [mutate]);

  const setStatus = useCallback((id: string, status: GoalStatus) =>
    mutate(() => fetch(`/api/bff/life/goals/${id}`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })), [mutate]);

  const removeGoal = useCallback((id: string) =>
    mutate(() => fetch(`/api/bff/life/goals/${id}`, { method: 'DELETE', credentials: 'include' })),
    [mutate]);

  return { goals, loading, error, busy, reload, addGoal, addProgress, setStatus, removeGoal };
}

// ── Skills (C-106 §4) ────────────────────────────────────────
//
// A LADDER, not a score. `SOURCE` is on every row from day one so an
// activity-inferred skill has an honest place to land — it is not populated
// yet, because inferring one means reading activity Analytics owns.

export const SKILL_LEVELS = ['LEARNING', 'PRACTISING', 'PROFICIENT', 'EXPERT'] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export interface Skill {
  id:         string;
  name:       string;
  level:      SkillLevel;
  source:     'SELF_DECLARED' | 'ACTIVITY_INFERRED';
  note:       string | null;
  created_at: string;
  updated_at: string;
}

export function useSkills() {
  const [skills,  setSkills]  = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [busy,    setBusy]    = useState(false);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch('/api/bff/life/skills', { credentials: 'include', cache: 'no-store' })
      .then(readJson)
      .then((d) => setSkills((d.skills as Skill[]) ?? []))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load skills'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => reload(), [reload]);

  const mutate = useCallback(async (fn: () => Promise<Response>) => {
    setBusy(true);
    setError(null);
    try {
      await readJson(await fn());
      reload();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  }, [reload]);

  const addSkill = useCallback((name: string, level?: SkillLevel) =>
    mutate(() => fetch('/api/bff/life/skills', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, ...(level ? { level } : {}) }),
    })), [mutate]);

  const setLevel = useCallback((id: string, level: SkillLevel) =>
    mutate(() => fetch(`/api/bff/life/skills/${id}`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level }),
    })), [mutate]);

  const removeSkill = useCallback((id: string) =>
    mutate(() => fetch(`/api/bff/life/skills/${id}`, { method: 'DELETE', credentials: 'include' })),
    [mutate]);

  return { skills, loading, error, busy, reload, addSkill, setLevel, removeSkill };
}

// ── Trajectory (C-106 §4 — "where the user is headed") ───────
//
// A pace computed from the user's OWN logged steps, and what that pace
// reaches. `projectable` is false far more often than it is true — one entry,
// or several on a single day, is not a pace — and the screen must respect that
// rather than filling the gap with a number.

export interface TrajectoryGoal {
  id:        string;
  title:     string;
  remaining: number;
  eta_days:  number;
  eta_date:  string;
}

export interface Trajectory {
  window_days:         number;
  entries:             number;
  active_days:         number;
  pi_logged:           number;
  pi_per_week:         number;
  first_entry_at:      string | null;
  completed_in_window: number;
  projectable:         boolean;
  goals:               TrajectoryGoal[];
}

export function useTrajectory(windowDays = 30) {
  const [trajectory, setTrajectory] = useState<Trajectory | null>(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    let alive = true;
    fetch(`/api/bff/life/trajectory?window_days=${windowDays}`, { credentials: 'include', cache: 'no-store' })
      .then(readJson)
      .then((d) => { if (alive) setTrajectory((d.trajectory as Trajectory) ?? null); })
      // Fail closed to null: no trajectory panel at all is honest, a zeroed one
      // would read as "you have logged nothing" when the truth is "we could not
      // ask".
      .catch(() => { if (alive) setTrajectory(null); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [windowDays]);

  return { trajectory, loading };
}

// ── Preferences ──────────────────────────────────────────────
export function usePreferences() {
  const [prefs,   setPrefs]   = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch('/api/bff/life/preferences', { credentials: 'include', cache: 'no-store' })
      .then(readJson)
      .then((d) => setPrefs((d.preferences as Record<string, string>) ?? {}))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load preferences'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => reload(), [reload]);

  const save = useCallback(async (next: Record<string, string>) => {
    setSaving(true);
    setError(null);
    // optimistic
    setPrefs((p) => ({ ...p, ...next }));
    try {
      const res  = await fetch('/api/bff/life/preferences', {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: next }),
      });
      const data = await readJson(res);
      setPrefs((data.preferences as Record<string, string>) ?? {});
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save');
      reload(); // roll back to server truth
    } finally {
      setSaving(false);
    }
  }, [reload]);

  return { prefs, loading, saving, error, save };
}

// ── Consent + right to delete (C-106 §5 · §11 P0-1) ──────────
//
// The two halves of the sentence on Life's own home screen: "your data is
// yours — private, and never used without your consent."

export const LIFE_DATA_CATEGORIES = ['GOALS', 'SKILLS', 'PREFERENCES', 'ACTIVITY', 'TRAJECTORY'] as const;
export type LifeDataCategory = (typeof LIFE_DATA_CATEGORIES)[number];

export interface ConsentEntry {
  category:   LifeDataCategory;
  granted:    boolean;
  updated_at: string | null; // null = never answered, which is a NO
}

export function useConsent() {
  const [consent, setConsent] = useState<ConsentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    fetch('/api/bff/life/consent', { credentials: 'include', cache: 'no-store' })
      .then(readJson)
      .then((d) => setConsent((d.consent as ConsentEntry[]) ?? []))
      // Fail closed to an empty list: the screen then shows nothing to toggle
      // rather than a row of switches whose state it could not read. A switch
      // drawn OFF because a fetch failed is a lie about a permission.
      .catch((e: unknown) => { setConsent([]); setError(e instanceof Error ? e.message : 'Failed to load'); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => reload(), [reload]);

  const grant = useCallback(async (category: LifeDataCategory, granted: boolean) => {
    setSaving(true);
    setError(null);
    // Optimistic, then reconciled with the server's answer — the toggle must
    // move under a thumb, but what it settles on is what was actually stored.
    setConsent((prev) => prev.map((c) => (c.category === category ? { ...c, granted } : c)));
    try {
      const res = await fetch('/api/bff/life/consent', {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consent: { [category]: granted } }),
      });
      const data = await readJson(res);
      setConsent((data.consent as ConsentEntry[]) ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save');
      reload(); // roll back to server truth
    } finally {
      setSaving(false);
    }
  }, [reload]);

  return { consent, loading, saving, error, grant, reload };
}

export interface PurgeResult {
  goals: number; skills: number; preferences: number; consents: number;
}

/** Purge the caller's Life data. Irreversible; the caller confirms first. */
export async function purgeLifeData(): Promise<PurgeResult> {
  const res  = await fetch('/api/bff/life/data', { method: 'DELETE', credentials: 'include' });
  const data = await readJson(res);
  return (data.deleted as PurgeResult) ?? { goals: 0, skills: 0, preferences: 0, consents: 0 };
}

// ── Subscription (Pro entitlement — read from commerce, the Subscription owner) ──
export function useSubscription() {
  const [plan,          setPlan]          = useState<string | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [isExpired,     setIsExpired]     = useState(false);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    let alive = true;
    fetch('/api/bff/subscription', { credentials: 'include', cache: 'no-store' })
      .then((r) => r.json().catch(() => ({})))
      .then((j: Record<string, unknown>) => {
        const data = (j?.data ?? j) as Record<string, unknown>;
        const sub  = (data?.subscription ?? data) as Record<string, unknown>;
        const raw  = typeof sub?.plan === 'string' ? sub.plan : null;

        // A paid plan is an entitlement ONLY while the period is live. There is no
        // auto-renewal (Pi U2A is one-time), so surface daysRemaining/isExpired to
        // prompt a re-subscribe before the month lapses. Gate on isActive + expiry
        // (with a date fallback) so the badge/benefit end when the month lapses.
        const end       = typeof sub?.current_period_end === 'string' ? new Date(sub.current_period_end) : null;
        const expired   = sub?.isExpired === true || (end !== null && end.getTime() < Date.now());
        const inactive  = sub?.isActive === false;
        const effective = raw && (expired || inactive) ? 'FREE' : raw;

        // daysRemaining from commerce when present; else derive from the period end.
        const days = typeof sub?.daysRemaining === 'number'
          ? sub.daysRemaining
          : end
            ? Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86_400_000))
            : null;

        if (alive) {
          setPlan(effective);
          setDaysRemaining(days);
          setIsExpired(Boolean(expired));
        }
      })
      .catch(() => { if (alive) { setPlan(null); setDaysRemaining(null); setIsExpired(false); } })   // fail closed → FREE
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return { plan, daysRemaining, isExpired, loading };
}

export function useActivity(limit = 25) {
  const [events,  setEvents]  = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/bff/life/activity?limit=${limit}`, { credentials: 'include', cache: 'no-store' })
      .then(readJson)
      .then((d) => setEvents((Array.isArray(d) ? d : (d as { data?: ActivityEvent[] }).data) as ActivityEvent[] ?? []))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load activity'))
      .finally(() => setLoading(false));
  }, [limit]);

  useEffect(() => reload(), [reload]);

  return { events, loading, error, reload };
}
