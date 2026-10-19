// Life memory v1 — the browser side of "My journey" (owner, 2026-10-17).
//
// A journey entry is a summary the person read, edited and confirmed at the end of
// a conversation — never the conversation. Every call goes to Life's own BFF with
// the session cookie; the owner is the session, never a field sent from here.
export type JourneyOutcome = 'DONE' | 'PARTLY' | 'NOT_YET';

export type MeasureKind = 'NUMBER' | 'RATING_1_5';
export type MeasurePeriod = 'DAY' | 'WEEK' | 'MONTH';
export type FollowupStatus = 'MEASURED' | 'UNKNOWN' | 'NOT_MEASURED';

export interface JourneyEntry {
  id: string;
  problem: string;
  understanding: string;
  step: string | null;
  step_outcome: JourneyOutcome | null;
  created_at: string;
  // "Before and after" v1 (owner, 2026-10-18) — all absent/null unless the person recorded one.
  measure_kind?: MeasureKind | null;
  measure_label?: string | null;
  measure_period?: MeasurePeriod | null;
  baseline_value?: number | null;
  baseline_at?: string | null;
  followup_value?: number | null;
  followup_at?: string | null;
  followup_status?: FollowupStatus | null;
}

/** The value BEFORE the step — typed by the person; there is no default and no guess. */
export interface MeasureDraft { kind: MeasureKind; label: string; period: MeasurePeriod; value: number }
export type FollowupDraft = { status: 'MEASURED'; value: number } | { status: 'UNKNOWN' | 'NOT_MEASURED' };

export interface Journey { keeping: boolean; entries: JourneyEntry[] }

export interface JourneyDraft { problem: string; understanding: string; step: string | null }

const json = { 'Content-Type': 'application/json' };

/** The person's journey, or null when it could not be read (never a guessed empty one). */
export async function readJourney(): Promise<Journey | null> {
  try {
    const res = await fetch('/api/bff/life/journey', { credentials: 'include', cache: 'no-store' });
    if (!res.ok) return null;
    const body = await res.json() as { data?: Partial<Journey> };
    const d = body?.data;
    if (!d || !Array.isArray(d.entries)) return null;
    return { keeping: d.keeping === true, entries: d.entries };
  } catch {
    return null;
  }
}

/** Turn keeping on, by the person's own tap on "Turn on and keep". */
export async function turnKeepingOn(): Promise<boolean> {
  try {
    const res = await fetch('/api/bff/life/consent', {
      method: 'PUT', credentials: 'include', headers: json,
      body: JSON.stringify({ consent: { JOURNEY: true } }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function keepEntry(draft: JourneyDraft): Promise<JourneyEntry | null> {
  try {
    const res = await fetch('/api/bff/life/journey', {
      method: 'POST', credentials: 'include', headers: json,
      body: JSON.stringify(draft),
    });
    if (!res.ok) return null;
    const body = await res.json() as { data?: { entry?: JourneyEntry } };
    return body?.data?.entry ?? null;
  } catch {
    return null;
  }
}

export async function setOutcome(id: string, step_outcome: JourneyOutcome): Promise<boolean> {
  try {
    const res = await fetch(`/api/bff/life/journey/${encodeURIComponent(id)}`, {
      method: 'PATCH', credentials: 'include', headers: json,
      body: JSON.stringify({ step_outcome }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteEntry(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/bff/life/journey/${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' });
    return res.ok;
  } catch {
    return false;
  }
}

const put = (body: unknown): RequestInit => ({ method: 'PUT', credentials: 'include', headers: json, body: JSON.stringify(body) });

async function entryOf(request: () => Promise<Response>): Promise<JourneyEntry | null> {
  try {
    const res = await request();
    if (!res.ok) return null;
    const out = await res.json() as { data?: { entry?: JourneyEntry } };
    return out?.data?.entry ?? null;
  } catch {
    return null;
  }
}

/** Record the value before the step. Recording it again starts the measure over. */
export function setMeasure(id: string, m: MeasureDraft): Promise<JourneyEntry | null> {
  return entryOf(() => fetch(`/api/bff/life/journey/${encodeURIComponent(id)}/measure`, put(m)));
}

/** Record the value later — or "I don't know" / "I didn't count", which carry no number. */
export function setFollowup(id: string, f: FollowupDraft): Promise<JourneyEntry | null> {
  return entryOf(() => fetch(`/api/bff/life/journey/${encodeURIComponent(id)}/followup`, put(f)));
}

/** Remove the measure (both values); the summary stays. */
export async function clearMeasure(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/bff/life/journey/${encodeURIComponent(id)}/measure`, { method: 'DELETE', credentials: 'include' });
    return res.ok;
  } catch {
    return false;
  }
}
