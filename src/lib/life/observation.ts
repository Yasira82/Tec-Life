// The Observation Contract (C0 — owner, 2026-11-28; KB audits/LIFE_INTELLIGENCE_IMPLEMENTATION_PLAN_2026-11-28.md §3).
//
// Everything Life Intelligence says about a person's records — a Pattern, a Friction point, a Memory item —
// is one Observation, built here and nowhere else, so every screen shows the same seven things:
//   source_records   the records it was read from (the screen can open them);
//   period           the days it covers;
//   method           how it was counted: a key from METHODS below, each with its definition in plain words —
//                    the screens show that definition in the person's language, by key;
//   evidence_count   the number of INDEPENDENT DAYS behind it;
//   evidence_status  'insufficient' | 'preliminary' — never a stable pattern, never a percentage;
//   generated_at     when it was computed;
//   review_at        when it stops being current (Patterns and Friction: 7 days); Memory has none.
// A Pattern also carries `group_days`: the independent days in each compared group, for the screen to show.
//
// Every count is COMPUTED HERE FROM THE RECORDS, never passed in (owner review of #135): a caller cannot
// claim 5 days a group without handing over records that show them. A Pattern's records each name their
// group; the days are counted per group from those records.
//
// What the two statuses mean:
//   Pattern            'preliminary' = every group the method defines has at least 5 independent days (the
//                      minimum is fixed, not a parameter); otherwise 'insufficient' and it is never shown.
//   Friction, Memory   always 'preliminary': they describe the person's own records as they are and compare
//                      nothing, so no minimum applies — the word says "a reading of records", not "proven".
//
// Pure: no clock of its own, no storage. Nothing here keeps a copy of the person's words.
// No screen uses it yet: the screens come in their own PRs.

export type ObservationKind = 'pattern' | 'friction' | 'memory';
export type EvidenceStatus = 'insufficient' | 'preliminary';

/**
 * How an observation was counted. The definition is the contract's reference text; each screen shows it in
 * the person's language by key. A method belongs to exactly one kind.
 */
export const METHODS = {
  // Patterns — a small list fixed in advance (plan §4 C2: never search many comparisons for one that differs).
  after_conversation: { kind: 'pattern', groups: ['after', 'other'], definition: 'Days the step was fully done, on the day after a kept summary versus all other answered days; each day counted once; "partly" is not "done"; days with no answer are not counted.' },
  // Friction — the four rules the current data supports (plan §4 C1).
  no_steps:                 { kind: 'friction', definition: 'An active goal whose description has no step lines.' },
  steps_none_ticked:        { kind: 'friction', definition: 'An active goal with step lines, none of them ticked.' },
  not_yet_3_in_a_row:       { kind: 'friction', definition: 'The same step answered "not yet" on three consecutive days.' },
  measure_without_followup: { kind: 'friction', definition: 'A "before" value recorded with no "after" value.' },
  // Memory — the person's own words and results, as they recorded them (plan §4 B1).
  goal_started: { kind: 'memory', definition: 'The day a goal was created.' },
  helped:       { kind: 'memory', definition: 'What the person said helped, from a kept summary.' },
  tried:        { kind: 'memory', definition: 'What the person tried that did not help, from a kept summary.' },
  obstacle:     { kind: 'memory', definition: 'What the person said brings it back, from a kept summary.' },
  reason:       { kind: 'memory', definition: 'The person\'s own reason for the change, from a kept summary.' },
  practice:     { kind: 'memory', definition: 'What the person now does regularly, from a kept summary.' },
  words:        { kind: 'memory', definition: 'One sentence the person said, from a kept summary.' },
  measure:      { kind: 'memory', definition: 'A value the person recorded before a step and after it.' },
  becoming:     { kind: 'memory', definition: 'The person\'s own "I\'m becoming…" statement.' },
} as const satisfies Record<string, { kind: ObservationKind; definition: string; groups?: readonly string[] }>;

export type MethodKey = keyof typeof METHODS;

/** One record behind an observation. `group` is required for a Pattern's records and refused elsewhere. */
export interface SourceRecord {
  kind: 'step_day' | 'summary' | 'goal' | 'measure' | 'self';
  id: string;
  /** The calendar day it belongs to, YYYY-MM-DD. */
  day: string;
  /** For a Pattern: which compared group this record is evidence for. */
  group?: string;
}

export interface Period { from: string; to: string }

export interface Observation<T = unknown> {
  kind: ObservationKind;
  source_records: SourceRecord[];
  period: Period;
  method: MethodKey;
  evidence_count: number;
  evidence_status: EvidenceStatus;
  generated_at: string;
  review_at: string | null;
  /** Pattern only: independent days per group, computed from the records. null for Friction and Memory. */
  group_days: Record<string, number> | null;
  /** What the observation says, in data — the screen turns it into words. */
  value: T;
}

/** The owner's minimum for a comparison: 5 valid, independent days in EVERY group (not 4). */
export const PATTERN_MIN_DAYS_PER_GROUP = 5;
/** Patterns and Friction stop being current after this many days; a change re-computes them sooner. */
export const REVIEW_AFTER_DAYS = 7;

const DAY_MS = 86_400_000;
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

const isDayKey = (s: unknown): s is string =>
  typeof s === 'string' && DAY_KEY.test(s) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;

const isValidDate = (d: unknown): d is Date => d instanceof Date && Number.isFinite(d.getTime());

/** Days, not answers: three answers on one day are one day of evidence. */
export function independentDays(records: readonly SourceRecord[]): number {
  return new Set(records.map((r) => r.day)).size;
}

/** Independent days per group, from the records themselves. */
export function daysPerGroup(records: readonly SourceRecord[]): Record<string, number> {
  const byGroup = new Map<string, Set<string>>();
  for (const r of records) {
    if (r.group === undefined) continue;
    const days = byGroup.get(r.group) ?? new Set<string>();
    days.add(r.day);
    byGroup.set(r.group, days);
  }
  return Object.fromEntries([...byGroup].map(([g, days]) => [g, days.size]));
}

/**
 * 'preliminary' only when there are at least two groups and EVERY group has at least
 * PATTERN_MIN_DAYS_PER_GROUP independent days. The minimum is fixed here and cannot be passed in
 * (owner review of #135). Refuses (throws) a count that is not a whole number ≥ 0.
 */
export function evidenceStatus(groupDays: readonly number[]): EvidenceStatus {
  for (const n of groupDays) {
    if (!Number.isSafeInteger(n) || n < 0) throw new Error(`observation: ${String(n)} is not a day count`);
  }
  return groupDays.length >= 2 && groupDays.every((n) => n >= PATTERN_MIN_DAYS_PER_GROUP) ? 'preliminary' : 'insufficient';
}

/** When an observation of this kind stops being current; null for Memory. */
export function reviewAt(kind: ObservationKind, generatedAt: Date): string | null {
  if (!isValidDate(generatedAt)) throw new Error('observation: generated_at is not a real time');
  return kind === 'memory' ? null : new Date(generatedAt.getTime() + REVIEW_AFTER_DAYS * DAY_MS).toISOString();
}

/** Past its review time: it may not be shown as current. Memory never goes stale. */
export function isStale(o: Pick<Observation, 'review_at'>, now: Date): boolean {
  if (o.review_at === null) return false;
  // An unreadable clock or review time is stale: when in doubt, not current (P6).
  if (!isValidDate(now)) return true;
  const at = Date.parse(o.review_at);
  return !Number.isFinite(at) || now.getTime() >= at;
}

/** Whether a screen may show it at all: never when stale; a Pattern only with preliminary evidence. */
export function canShow(o: Pick<Observation, 'kind' | 'review_at' | 'evidence_status'>, now: Date): boolean {
  if (isStale(o, now)) return false;
  return o.kind !== 'pattern' || o.evidence_status === 'preliminary';
}

export interface ObservationInput<T> {
  kind: ObservationKind;
  source_records: readonly SourceRecord[];
  period: Period;
  method: MethodKey;
  value: T;
  now: Date;
}

/**
 * The only way to make an Observation. Refuses (throws) what would let a screen say more than the records:
 * no records · an unknown method, or one of another kind · a day or period that is not a real date · a record
 * outside the period · a clock that is not a real time · a Pattern record without a group, or fewer than two
 * groups · a group on a record that is not a Pattern's. A programming error, not a user state.
 */
export function makeObservation<T>(input: ObservationInput<T>): Observation<T> {
  const { kind, period, method, value, now } = input;
  if (!isValidDate(now)) throw new Error('observation: now is not a real time');
  const m = (METHODS as Record<string, { kind: ObservationKind; groups?: readonly string[] } | undefined>)[method];
  if (!m) throw new Error(`observation: unknown method ${String(method)}`);
  if (m.kind !== kind) throw new Error(`observation: method ${method} is not a ${kind} method`);
  if (!isDayKey(period?.from) || !isDayKey(period?.to) || period.from > period.to) {
    throw new Error('observation: period must be two real days, from ≤ to');
  }
  if (input.source_records.length === 0) throw new Error('observation: no source records');
  for (const r of input.source_records) {
    if (!isDayKey(r.day)) throw new Error(`observation: record ${r.id} has no real day`);
    if (r.day < period.from || r.day > period.to) throw new Error(`observation: record ${r.id} is outside the period`);
    if (kind === 'pattern' && (typeof r.group !== 'string' || r.group === '')) {
      throw new Error(`observation: pattern record ${r.id} has no group`);
    }
    if (kind !== 'pattern' && r.group !== undefined) throw new Error(`observation: record ${r.id} has a group outside a pattern`);
  }

  let group_days: Record<string, number> | null = null;
  let evidence_status: EvidenceStatus = 'preliminary';
  if (kind === 'pattern') {
    // The groups are the method's own, fixed in advance (owner review of #135): a record in any other group
    // is refused, and EVERY defined group is counted — a group with no records is 0 days, so insufficient.
    const allowed = m.groups ?? [];
    for (const r of input.source_records) {
      if (!allowed.includes(r.group as string)) throw new Error(`observation: group ${String(r.group)} is not defined for ${method}`);
    }
    if (allowed.length < 2) throw new Error(`observation: ${method} does not define two groups`);
    const counted = daysPerGroup(input.source_records);
    group_days = Object.fromEntries(allowed.map((g) => [g, counted[g] ?? 0]));
    evidence_status = evidenceStatus(Object.values(group_days));
  }

  // Newest first, a copy — the caller's array and records are never changed.
  const source_records = input.source_records.map((r) => ({ ...r }))
    .sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0));
  return {
    kind,
    source_records,
    period: { from: period.from, to: period.to },
    method,
    evidence_count: independentDays(source_records),
    evidence_status,
    generated_at: now.toISOString(),
    review_at: reviewAt(kind, now),
    group_days,
    value,
  };
}
