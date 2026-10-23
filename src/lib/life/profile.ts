// The whole record Life coaches from (owner, 2026-10-23: «الذاكرة … لازم تكون احترافية») —
// built here, server-side, from the person's own kept summaries and their "who I am becoming"
// sentence, and sent to the AI service with the conversation. Every kept summary counts, not only
// the last three: something tried ten conversations ago must still never be offered again.
// Newest first; the AI service bounds and de-duplicates it again (tec-ai-service memory.ts).
import { isFeeling } from '@/lib-client/life/journey';

type Entry = Record<string, unknown>;
const LISTS = ['tried', 'helped', 'triggers', 'practice', 'reason', 'words'] as const;
/** Generous on purpose for "tried" (a rule); the AI service keeps fewer of the rest. */
const CAP = { tried: 30, helped: 12, triggers: 12, practice: 12, reason: 6, words: 6, feelings: 6 } as const;

export interface Profile {
  statement: string | null;
  tried: string[]; helped: string[]; triggers: string[]; practice: string[]; reason: string[]; words: string[];
  feelings: { start: string | null; end: string | null }[];
}

export function buildProfile(entries: Entry[], statement: unknown): Profile | null {
  const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
  const lists = Object.fromEntries(LISTS.map((k) => [k, entries.map((e) => text(e[k])).filter((v): v is string => !!v).slice(0, CAP[k])])) as Record<typeof LISTS[number], string[]>;
  const feelings = entries
    .map((e) => ({ start: isFeeling(e.feeling_start) ? e.feeling_start : null, end: isFeeling(e.feeling_end) ? e.feeling_end : null }))
    .filter((f) => f.start || f.end)
    .slice(0, CAP.feelings);
  const p: Profile = { statement: text(statement), ...lists, feelings };
  return p.statement || feelings.length || LISTS.some((k) => p[k].length) ? p : null;
}
