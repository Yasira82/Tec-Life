'use client';

import { useEffect } from 'react';
import { readGoalPrefill, withoutGoalPrefill, type GoalPrefill } from '@/lib/life/prefill';

/**
 * Reads `?goal=&target=` once and hands it to the page (C-104 §10.1 · A3).
 *
 * It is rendered INSIDE the sign-in door, on purpose: a visit with no session
 * sees the door first and this never mounts, so the query survives the sign-in
 * (the door returns to the exact page) and is read only once there is someone
 * to add the goal for. After reading, the two keys leave the URL, so a reload
 * or Back does not propose the goal a second time.
 */
export function GoalPrefillReader({ onPrefill }: { onPrefill: (p: GoalPrefill) => void }) {
  useEffect(() => {
    const { pathname, search, hash } = window.location;
    const p = readGoalPrefill(search);
    if (!p) return;
    window.history.replaceState(window.history.state, '', `${pathname}${withoutGoalPrefill(search)}${hash}`);
    onPrefill(p);
    // Once per mount, by design — the query is consumed, not watched.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
