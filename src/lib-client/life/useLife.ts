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

// ── Subscription (Pro entitlement — read from commerce, the Subscription owner) ──
export function useSubscription() {
  const [plan,    setPlan]    = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch('/api/bff/subscription', { credentials: 'include', cache: 'no-store' })
      .then((r) => r.json().catch(() => ({})))
      .then((j: Record<string, unknown>) => {
        const data = (j?.data ?? j) as Record<string, unknown>;
        const sub  = (data?.subscription ?? data) as Record<string, unknown>;
        const p    = typeof sub?.plan === 'string' ? sub.plan : null;
        if (alive) setPlan(p);
      })
      .catch(() => { if (alive) setPlan(null); })   // fail closed → treat as FREE
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return { plan, loading };
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
