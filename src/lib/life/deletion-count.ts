// How much turning a keep switch off would delete — said only when it is known, and never as more
// precise than it is (owner review of #132, 28 Nov 2026).
//
// What tec-life-service deletes (life.service.ts setConsent):
//   JOURNEY off       → every LifeJourneyEntry of the person (their step days by cascade) + LifeSelf
//   CONVERSATIONS off → every LifeConversation of the person
// What the reads return: the journey list is capped at JOURNEY_LIMITS.entries (500), the conversation
// list at CONVERSATION_LIMITS.perUser (200). Writes are refused at the same caps, so normally the list
// IS the total — but the write's count-then-create is not atomic, so a list that comes back AT the
// cap is said as «at least». A cap mirrored here that falls behind the service only makes «at least»
// appear more often, never less: the safe direction.
import type { Journey, Self } from '@/lib-client/life/journey';
import type { Conversations } from '@/lib-client/life/conversations';

export const JOURNEY_READ_CAP = 500;
export const CONVERSATIONS_READ_CAP = 200;

export interface DeletionCount {
  n: number;
  /** The list came back at its cap: the true total may be higher. */
  atLeast: boolean;
  /** JOURNEY only: «I'm becoming…» is deleted too. */
  self: boolean;
}

/** Null when any read failed: the count is then unknown, and the deletion must not be offered. */
export function journeyDeletion(journey: Journey | null, self: Self | null): DeletionCount | null {
  if (!journey || !self) return null;
  const n = journey.entries.length;
  return { n, atLeast: n >= JOURNEY_READ_CAP, self: !!self.statement?.trim() };
}

export function conversationsDeletion(list: Conversations | null): DeletionCount | null {
  if (!list) return null;
  const n = list.conversations.length;
  return { n, atLeast: n >= CONVERSATIONS_READ_CAP, self: false };
}
