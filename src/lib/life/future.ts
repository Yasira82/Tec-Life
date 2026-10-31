// «مستقبلي» — the shape of the person's future as Life reads it (owner, 2026-10-31). Pure, so the
// page and the talk BFF (server) read it the same way: only what is well-formed, an unknown area
// dropped, never shown.
import { LIFE_AREAS, type LifeArea } from './future-copy';

export interface Future {
  vision: string | null;
  areas: { area: LifeArea; note: string | null }[];
}

/** Only what is well-formed: an unknown area is dropped, never shown. */
export function parseFuture(d: unknown): Future | null {
  if (!d || typeof d !== 'object') return null;
  const o = d as { vision?: unknown; areas?: unknown };
  const areas = (Array.isArray(o.areas) ? o.areas : [])
    .map((a) => (a ?? {}) as { area?: unknown; note?: unknown })
    .filter((a): a is { area: LifeArea; note?: unknown } => (LIFE_AREAS as readonly unknown[]).includes(a.area))
    .map((a) => ({ area: a.area, note: typeof a.note === 'string' && a.note.trim() ? a.note : null }));
  return { vision: typeof o.vision === 'string' && o.vision.trim() ? o.vision : null, areas };
}

