// Life memory v1 — the browser side of "My journey" (owner, 2026-10-17).
//
// A journey entry is a summary the person read, edited and confirmed at the end of
// a conversation — never the conversation. Every call goes to Life's own BFF with
// the session cookie; the owner is the session, never a field sent from here.
export type JourneyOutcome = 'DONE' | 'PARTLY' | 'NOT_YET';

export interface JourneyEntry {
  id: string;
  problem: string;
  understanding: string;
  step: string | null;
  step_outcome: JourneyOutcome | null;
  created_at: string;
}

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
