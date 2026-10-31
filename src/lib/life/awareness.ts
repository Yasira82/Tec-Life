// Awareness for Life's coach (owner, 2026-10-30: «وعي مدرّب Life»). Built server-side in the talk
// BFF, with the person's own session, ONLY while they keep their journey — the same switch as the
// memory, and the intro says so. It tells the coach where their life is now so it can begin from it:
// their part of the day, days since the last kept conversation, the step's last seven days, and up to
// three active goals. The page sends only its clock; everything else is read here.
//
// Pure: the route hands it what it read and `now`. tec-ai-service re-checks every field
// (modules/life-talk/awareness.ts) and drops what is malformed.
import { followedStep, weekReview, lastDays, type StepDay } from './step-week';
import type { JourneyEntry } from '@/lib-client/life/journey';

export interface Clock { hour: number; weekday: number; today: string }

const DAY = 86_400_000;

/** The page's clock, or null — an hour, a weekday and its calendar day within a day of ours. */
export function parseClock(raw: unknown, now: Date = new Date()): Clock | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const hour = o.hour, weekday = o.weekday, today = o.today;
  if (!Number.isInteger(hour) || (hour as number) < 0 || (hour as number) > 23) return null;
  if (!Number.isInteger(weekday) || (weekday as number) < 0 || (weekday as number) > 6) return null;
  if (typeof today !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(today)) return null;
  const t = Date.parse(`${today}T00:00:00Z`);
  const utc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (!Number.isFinite(t) || Math.abs(t - utc) > DAY) return null;
  return { hour: hour as number, weekday: weekday as number, today };
}

/** What the browser sends: its own local hour, weekday and day — nothing about the person. */
export function clockNow(d: Date = new Date()): Clock {
  const p = (n: number) => String(n).padStart(2, '0');
  return { hour: d.getHours(), weekday: d.getDay(), today: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` };
}

interface GoalRow { title?: unknown; description?: unknown; status?: unknown; progress?: unknown; target_amount?: unknown; updated_at?: unknown }

const nextStep = (description: unknown): string | null => {
  for (const line of String(description ?? '').split('\n')) {
    const m = /^- \[ \] (.+)$/.exec(line.trim());
    if (m) return m[1]!.trim();
  }
  return null;
};

export function buildAwareness(input: {
  entries: (JourneyEntry & { days?: StepDay[] })[];
  goals: GoalRow[];
  /** «مستقبلي»: their vision and the areas they chose (owner, 2026-10-31). */
  future?: { vision: string | null; areas: { area: string; note: string | null }[] } | null;
  clock: Clock | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const today = input.clock?.today ?? now.toISOString().slice(0, 10);
  const newest = input.entries[0];
  const since = newest ? Math.max(0, Math.floor((now.getTime() - new Date(newest.created_at).getTime()) / DAY)) : null;

  const followed = followedStep(input.entries, now);
  let step = null;
  if (followed?.step) {
    const days = followed.days ?? [];
    const week = lastDays(days, today, 7);
    const r = weekReview(days, today);
    step = {
      text: followed.step,
      done: r.done, partly: r.partly, notYet: week.filter((d) => d.answer === 'NOT_YET').length,
      today: week[week.length - 1]?.answer ?? null,
      finished: false,
    };
  }

  const goals = input.goals
    .filter((g) => g.status === 'ACTIVE' && typeof g.title === 'string' && g.title.trim())
    .sort((a, b) => String(b.updated_at ?? '').localeCompare(String(a.updated_at ?? '')))
    .slice(0, 3)
    .map((g) => ({
      title: String(g.title).trim(),
      progress: typeof g.progress === 'number' ? g.progress : null,
      target: typeof g.target_amount === 'number' ? g.target_amount : null,
      next: nextStep(g.description),
    }));

  const out = {
    ...(input.clock ? { hour: input.clock.hour, weekday: input.clock.weekday } : {}),
    ...(since !== null ? { since } : {}),
    ...(step ? { step } : {}),
    ...(goals.length ? { goals } : {}),
    ...(input.future?.vision ? { vision: input.future.vision } : {}),
    ...(input.future?.areas.length ? { areas: input.future.areas } : {}),
  };
  return Object.keys(out).length ? out : null;
}
