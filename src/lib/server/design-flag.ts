// Which design a person sees on /app: the current one ('legacy') or the redesign ('new').
//
// The server decides, never the browser (Life redesign, Phase 1 spec, owner 2026-11-28):
//   • 'new' only when ALL of these hold: the switch is on, the session token verifies
//     (HS256, JWT_SECRET — the same check createHandler does), and the token's
//     pi_username is on the list.
//   • ANY doubt is 'legacy' (P6): no token, a token that does not verify or has expired,
//     no JWT_SECRET, no config, a config that cannot be read or parsed, the switch off.
//     The current design is the safe answer because it is what everyone has today.
//   • No URL parameter, no cookie of our own, nothing in localStorage can choose the
//     design — a tester is chosen by the list, and the list lives on the server.
//
// Where the switch and the list live:
//   1. Vercel Edge Config, when the project has an EDGE_CONFIG connection string.
//      One item, `life_redesign` = { "enabled": true, "users": ["name", ...] }.
//      It is read on every /app request, so turning it off (or removing a name)
//      takes effect on the next page load — the instant rollback, with no deploy.
//   2. Otherwise the env vars LIFE_REDESIGN_ENABLED ("true") and LIFE_REDESIGN_USERS
//      ("name1,name2"). Env changes need a redeploy, so this path is for tests and
//      for before Edge Config exists; it is not the rollback path.
// When EDGE_CONFIG is set it is the ONLY source: an unreadable Edge Config is 'legacy',
// never a silent fall back to the env list (a rollback must not be undone by a stale env).
import { jwtVerify } from 'jose';

export type Design = 'legacy' | 'new';

export interface RedesignConfig {
  enabled: boolean;
  users: ReadonlySet<string>;
}

/** Why the answer is what it is — logged, never shown, and never carrying a name or a token. */
export type DesignReason =
  | 'on_list' | 'not_on_list' | 'switch_off' | 'no_config'
  | 'no_token' | 'bad_token' | 'no_secret';

const EDGE_ITEM = 'life_redesign';
const EDGE_TIMEOUT_MS = 1500;

const norm = (name: string) => name.trim().replace(/^@/, '').toLowerCase();

/** A config from any JSON-ish value, or null if it is not exactly the expected shape. */
export function parseConfig(raw: unknown): RedesignConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  const { enabled, users } = raw as { enabled?: unknown; users?: unknown };
  if (typeof enabled !== 'boolean' || !Array.isArray(users)) return null;
  if (!users.every((u) => typeof u === 'string')) return null;
  return { enabled, users: new Set((users as string[]).map(norm).filter(Boolean)) };
}

function fromEnv(env: NodeJS.ProcessEnv): RedesignConfig | null {
  const enabled = env.LIFE_REDESIGN_ENABLED;
  const users = env.LIFE_REDESIGN_USERS;
  if (enabled == null && users == null) return null;
  return {
    enabled: enabled === 'true',
    users: new Set((users ?? '').split(',').map(norm).filter(Boolean)),
  };
}

/**
 * The Edge Config REST read: the connection string is
 * `https://edge-config.vercel.com/<id>?token=<token>`, and one item is
 * `https://edge-config.vercel.com/<id>/item/<key>?token=<token>`.
 */
export function edgeItemUrl(connection: string, key = EDGE_ITEM): string | null {
  try {
    const u = new URL(connection);
    const token = u.searchParams.get('token');
    if (u.protocol !== 'https:' || u.hostname !== 'edge-config.vercel.com' || !token
      || !u.pathname.match(/^\/ecfg_[A-Za-z0-9_]+\/?$/)) return null;
    return `${u.origin}${u.pathname.replace(/\/$/, '')}/item/${encodeURIComponent(key)}?token=${encodeURIComponent(token)}`;
  } catch {
    return null;
  }
}

async function fromEdgeConfig(connection: string, fetchImpl: typeof fetch): Promise<RedesignConfig | null> {
  const url = edgeItemUrl(connection);
  if (!url) return null;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), EDGE_TIMEOUT_MS);
  try {
    const res = await fetchImpl(url, { cache: 'no-store', signal: ctl.signal });
    if (!res.ok) return null; // 404 = the item does not exist yet = no config
    return parseConfig(await res.json());
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** The switch and the list, from Edge Config when the project has one, else from env. */
export async function readRedesignConfig(
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<RedesignConfig | null> {
  if (env.EDGE_CONFIG) return fromEdgeConfig(env.EDGE_CONFIG, fetchImpl);
  return fromEnv(env);
}

/** The verified Pi username in a session token, or a reason it cannot be had. */
async function verifiedName(token: string | undefined, secret: string | undefined):
  Promise<{ name: string } | { reason: DesignReason }> {
  if (!token) return { reason: 'no_token' };
  if (!secret) return { reason: 'no_secret' };
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ['HS256'] });
    const name = payload.pi_username;
    if (typeof name !== 'string' || !norm(name)) return { reason: 'bad_token' };
    return { name: norm(name) };
  } catch {
    return { reason: 'bad_token' };
  }
}

/** The decision itself, from a token and a config — pure apart from verifying the token. */
export async function decideDesign(
  token: string | undefined,
  config: RedesignConfig | null,
  secret: string | undefined,
): Promise<{ design: Design; reason: DesignReason }> {
  // The switch first: with it off, nobody's token is even opened.
  if (!config) return { design: 'legacy', reason: 'no_config' };
  if (!config.enabled) return { design: 'legacy', reason: 'switch_off' };
  const who = await verifiedName(token, secret);
  if ('reason' in who) return { design: 'legacy', reason: who.reason };
  return config.users.has(who.name)
    ? { design: 'new', reason: 'on_list' }
    : { design: 'legacy', reason: 'not_on_list' };
}

/** Everything together, for the /app layout. Never throws: any failure is 'legacy'. */
export async function resolveDesign(
  token: string | undefined,
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<{ design: Design; reason: DesignReason }> {
  try {
    const config = await readRedesignConfig(env, fetchImpl);
    return await decideDesign(token, config, env.JWT_SECRET);
  } catch {
    return { design: 'legacy', reason: 'no_config' };
  }
}
