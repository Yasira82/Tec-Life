'use client';

// «مستقبلي» — my future (owner, 2026-10-31): the vision and the chosen life areas, read and written
// through Life's BFF with the session. Never stored in the browser. A failed read or write is null.
import { parseFuture, type Future } from '@/lib/life/future';
export type { Future } from '@/lib/life/future';

const json = { 'Content-Type': 'application/json' };
const put = (body: unknown): RequestInit => ({ method: 'PUT', credentials: 'include', headers: json, body: JSON.stringify(body) });

async function dataOf(request: Promise<Response>): Promise<Future | null> {
  try {
    const res = await request;
    if (!res.ok) return null;
    return parseFuture((await res.json() as { data?: unknown })?.data);
  } catch {
    return null;
  }
}

export const readFuture = () => dataOf(fetch('/api/bff/life/future', { credentials: 'include', cache: 'no-store' }));
export const saveVision = (statement: string) => dataOf(fetch('/api/bff/life/future/vision', put({ statement })));
export const saveAreas = (areas: Future['areas']) => dataOf(fetch('/api/bff/life/future/areas', put({ areas })));
