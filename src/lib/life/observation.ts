// The Observation Contract (C0 — owner, 2026-11-28; KB audits/LIFE_INTELLIGENCE_IMPLEMENTATION_PLAN_2026-11-28.md §3).
//
// Everything Life Intelligence says about a person's records — a Pattern, a Friction point, a Memory item —
// is one Observation, built here and nowhere else, so every screen shows the same seven things:
//   source_records   the records it was read from (the screen can open them);
//   period           the days it covers;
//   method           how it was counted (a key; the words live in the screen's copy);
//   evidence_count   the number of INDEPENDENT DAYS behind it — computed here from the records, never passed
//                    in, so a count can never disagree with what the person sees when they open the records;
//   evidence_status  'insufficient' | 'preliminary' — never a stable pattern, never a percentage of confidence;
//   generated_at     when it was computed;
//   review_at        when it stops being current (Patterns and Friction: 7 days); Memory has none — it is a
//                    record of the past, not a reading of it.
//
// Pure: no clock of its own, no storage. Nothing here keeps a copy of the person's words.
// It does not draw anything and no screen uses it yet: the screens come in their own PRs.

export type ObservationKind = 'pattern' | 'friction' | 'memory';
export type EvidenceStatus = 'insufficient' | 'preliminary';

/** One record behind an observation: what it is, its id, and the calendar day it belongs to (YYYY-MM-DD). */
export interface SourceRecord {
  kind: 'step_day' | 'summary' | 'goal' | 'measure' | 'self';
  id: string;
  day: string;
}

export interface Period { from: string; to: string }

export interface Observation<T = unknown> {
  kind: ObservationKind;
  source_records: SourceRecord[];
  period: Period;
  method: string;
  evidence_count: number;
  evidence_status: EvidenceStatus;
  generated_at: string;
  review_at: string | null;
  /** What the observation says, in data — the screen turns it into words. */
  value: T;
}

/** The owner's minimum for a comparison: 5 valid, independent days in EVERY group (not 4). */
export const PATTERN_MIN_DAYS_PER_GROUP = 5;
/** Patterns and Friction stop being current after this many days; a change re-computes them sooner. */
export const REVIEW_AFTER_DAYS = 7;

const DAY_MS = 86_400_000;
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

const isDayKey = (s: string) => DAY_KEY.test(s) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;

/** Days, not answers: three answers on one day are one day of evidence. */
export function independentDays(records: readonly SourceRecord[]): number {
  return new Set(records.map((r) => r.day)).size;
}

/**
 * A comparison is 'preliminary' only when EVERY group has at least `min` independent days; one group short
 * and the whole comparison is 'insufficient'. No groups at all is insufficient too.
 */
export function evidenceStatus(groupDays: readonly number[], min = PATTERN_MIN_DAYS_PER_GROUP): EvidenceStatus {
  return groupDays.length > 0 && groupDays.every((n) => n >= min) ? 'preliminary' : 'insufficient';
}

/** When an observation of this kind stops being current; null for Memory. */
export function reviewAt(kind: ObservationKind, generatedAt: Date): string | null {
  return kind === 'memory' ? null : new Date(generatedAt.getTime() + REVIEW_AFTER_DAYS * DAY_MS).toISOString();
}

/** Past its review time: it may not be shown as current. Memory never goes stale. */
export function isStale(o: Pick<Observation, 'review_at'>, now: Date): boolean {
  return o.review_at !== null && now.getTime() >= Date.parse(o.review_at);
}

/**
 * Whether a screen may show it at all: never when stale; a Pattern only with preliminary evidence.
 * Friction and Memory are about one person's own records and need no minimum, but Friction still expires.
 */
export function canShow(o: Pick<Observation, 'kind' | 'review_at' | 'evidence_status'>, now: Date): boolean {
  if (isStale(o, now)) return false;
  return o.kind !== 'pattern' || o.evidence_status === 'preliminary';
}

export interface ObservationInput<T> {
  kind: ObservationKind;
  source_records: readonly SourceRecord[];
  period: Period;
  method: string;
  /** For a Pattern: the independent days in each compared group. Ignored for Friction and Memory. */
  groupDays?: readonly number[];
  value: T;
  now: Date;
}

/**
 * The only way to make an Observation. Refuses (throws) what would let a screen say more than the records:
 * no records · a day or period that is not a real date · a record outside the period · a Pattern without
 * its groups. A programming error, not a user state — the screens never catch it to show something else.
 */
export function makeObservation<T>(input: ObservationInput<T>): Observation<T> {
  const { kind, period, method, value, now } = input;
  if (!method) throw new Error('observation: method is required');
  if (!isDayKey(period.from) || !isDayKey(period.to) || period.from > period.to) {
    throw new Error('observation: period must be two real days, from ≤ to');
  }
  if (input.source_records.length === 0) throw new Error('observation: no source records');
  for (const r of input.source_records) {
    if (!isDayKey(r.day)) throw new Error(`observation: record ${r.id} has no real day`);
    if (r.day < period.from || r.day > period.to) throw new Error(`observation: record ${r.id} is outside the period`);
  }
  if (kind === 'pattern' && (!input.groupDays || input.groupDays.length < 2)) {
    throw new Error('observation: a pattern compares at least two groups');
  }

  // Newest first, a copy — the caller's array is never reordered.
  const source_records = [...input.source_records].sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0));
  return {
    kind,
    source_records,
    period: { ...period },
    method,
    evidence_count: independentDays(source_records),
    // Friction and Memory describe the person's own records as they are: there is nothing to be "sufficient"
    // for, so they are 'preliminary' by definition; only a Pattern is measured against the minimum.
    evidence_status: kind === 'pattern' ? evidenceStatus(input.groupDays ?? []) : 'preliminary',
    generated_at: now.toISOString(),
    review_at: reviewAt(kind, now),
    value,
  };
}
