// Full conversations, kept only when the person turned it on (owner, 2026-10-18).
// Every call goes to Life's own BFF with the session cookie; the owner is the session.
// tec-life-service encrypts the words before they reach its database.
import type { Turn } from './lifeTalk';

export interface ConversationListing {
  id: string; message_count: number; created_at: string; updated_at: string;
  preview: string | null; readable: boolean;
}
export interface Conversations { keeping: boolean; configured: boolean; conversations: ConversationListing[] }

const json = { 'Content-Type': 'application/json' };
const path = (id: string) => `/api/bff/life/conversations/${encodeURIComponent(id)}`;

/** A fresh id for a new conversation. */
export function newConversationId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = new Uint8Array(16); crypto.getRandomValues(b);
  b[6] = (b[6]! & 0x0f) | 0x40; b[8] = (b[8]! & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export async function listConversations(): Promise<Conversations | null> {
  try {
    const res = await fetch('/api/bff/life/conversations', { credentials: 'include', cache: 'no-store' });
    if (!res.ok) return null;
    const d = (await res.json() as { data?: Partial<Conversations> })?.data;
    if (!d || !Array.isArray(d.conversations)) return null;
    return { keeping: d.keeping === true, configured: d.configured === true, conversations: d.conversations };
  } catch {
    return null;
  }
}

export async function readConversation(id: string): Promise<Turn[] | null> {
  try {
    const res = await fetch(path(id), { credentials: 'include', cache: 'no-store' });
    if (!res.ok) return null;
    const m = (await res.json() as { data?: { messages?: unknown } })?.data?.messages;
    return Array.isArray(m) ? (m as Turn[]) : null;
  } catch {
    return null;
  }
}

// A conversation deleted in this tab stays deleted: the chat that still holds it must not
// write it back on its next reply (owner, 2026-10-18: "I delete it and it isn't deleted").
const deleted = new Set<string>();
const onDelete = new Set<(id: string) => void>();

/** Called with the id of every conversation deleted here, so an open chat can close it. */
export function onConversationDeleted(cb: (id: string) => void): () => void {
  onDelete.add(cb);
  return () => { onDelete.delete(cb); };
}

export async function saveConversation(id: string, messages: Turn[]): Promise<boolean> {
  if (deleted.has(id)) return false;
  try {
    const res = await fetch(path(id), { method: 'PUT', credentials: 'include', headers: json, body: JSON.stringify({ messages }) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteConversation(id: string): Promise<boolean> {
  try {
    deleted.add(id);
    const res = await fetch(path(id), { method: 'DELETE', credentials: 'include' });
    // Not there is gone too — the same thing for the person.
    if (!res.ok && res.status !== 404) { deleted.delete(id); return false; }
    onDelete.forEach((cb) => cb(id));
    return true;
  } catch {
    deleted.delete(id);
    return false;
  }
}

/** Turn keeping full conversations on, by the person's own tap — named beside it. */
export async function turnConversationsOn(): Promise<boolean> {
  try {
    const res = await fetch('/api/bff/life/consent', {
      method: 'PUT', credentials: 'include', headers: json, body: JSON.stringify({ consent: { CONVERSATIONS: true } }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
