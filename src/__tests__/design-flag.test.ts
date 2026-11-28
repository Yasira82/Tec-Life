/**
 * The redesign switch (Phase 1 Foundation, owner 2026-11-28): the server decides, the current
 * design is the default, and ANY doubt is the current design (P6). Turning the switch off —
 * or taking a name off the list — is the rollback, and it must win over everything else.
 */
import { describe, it, expect, vi } from 'vitest';
import { SignJWT } from 'jose';
import { decideDesign, parseConfig, readRedesignConfig, resolveDesign, edgeItemUrl } from '@/lib/server/design-flag';

const SECRET = 'test-secret-for-the-design-switch-only';
const enc = new TextEncoder().encode(SECRET);
const token = (claims: Record<string, unknown>, exp = '1h', secret = enc) =>
  new SignJWT(claims).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime(exp).sign(secret);
const on = (users: string[]) => ({ enabled: true, users: new Set(users) });

describe('decideDesign', () => {
  it('gives the redesign to a verified name on the list', async () => {
    expect(await decideDesign(await token({ sub: 'u1', pi_username: 'sara' }), on(['sara']), SECRET))
      .toEqual({ design: 'new', reason: 'on_list' });
  });

  it('matches names without case or a leading @', async () => {
    const cfg = parseConfig({ enabled: true, users: ['@Sara'] });
    expect((await decideDesign(await token({ pi_username: 'SARA' }), cfg, SECRET)).design).toBe('new');
  });

  it('keeps everyone else on the current design', async () => {
    expect(await decideDesign(await token({ pi_username: 'omar' }), on(['sara']), SECRET))
      .toEqual({ design: 'legacy', reason: 'not_on_list' });
  });

  it('rollback: switch off sends even a listed name back to the current design', async () => {
    const t = await token({ pi_username: 'sara' });
    expect(await decideDesign(t, { enabled: false, users: new Set(['sara']) }, SECRET))
      .toEqual({ design: 'legacy', reason: 'switch_off' });
  });

  it.each([
    ['no config', null, 'no_config'],
  ] as const)('%s → current design', async (_n, cfg, reason) => {
    expect(await decideDesign(await token({ pi_username: 'sara' }), cfg, SECRET)).toEqual({ design: 'legacy', reason });
  });

  it('no token → current design', async () => {
    expect(await decideDesign(undefined, on(['sara']), SECRET)).toEqual({ design: 'legacy', reason: 'no_token' });
  });

  it('no JWT_SECRET → current design (a token that cannot be checked is not trusted)', async () => {
    expect(await decideDesign(await token({ pi_username: 'sara' }), on(['sara']), undefined))
      .toEqual({ design: 'legacy', reason: 'no_secret' });
  });

  it('a token signed with another key → current design', async () => {
    const forged = await token({ pi_username: 'sara' }, '1h', new TextEncoder().encode('someone-elses-key-entirely'));
    expect(await decideDesign(forged, on(['sara']), SECRET)).toEqual({ design: 'legacy', reason: 'bad_token' });
  });

  it('an expired token → current design', async () => {
    const old = await new SignJWT({ pi_username: 'sara' }).setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 7200).setExpirationTime(Math.floor(Date.now() / 1000) - 3600).sign(enc);
    expect((await decideDesign(old, on(['sara']), SECRET)).reason).toBe('bad_token');
  });

  it('a token with no pi_username → current design', async () => {
    expect((await decideDesign(await token({ sub: 'u1' }), on(['sara']), SECRET)).reason).toBe('bad_token');
  });

  it('a name in a cookie means nothing: only the verified token is read', async () => {
    // The decision takes a token and nothing else — there is no parameter a cookie,
    // a URL or a body could fill in.
    expect(decideDesign.length).toBe(3);
    expect(await decideDesign('not-a-jwt', on(['sara']), SECRET)).toEqual({ design: 'legacy', reason: 'bad_token' });
  });
});

describe('parseConfig', () => {
  it.each([
    [null], [undefined], ['yes'], [{}], [{ enabled: 'true', users: [] }], [{ enabled: true }],
    [{ enabled: true, users: 'sara' }], [{ enabled: true, users: ['sara', 3] }],
  ])('rejects %j', (raw) => { expect(parseConfig(raw)).toBeNull(); });

  it('accepts the documented shape', () => {
    expect(parseConfig({ enabled: true, users: ['a', ' B '] })).toEqual({ enabled: true, users: new Set(['a', 'b']) });
  });
});

describe('readRedesignConfig', () => {
  const EDGE = 'https://edge-config.vercel.com/ecfg_abc123?token=tok-1';

  it('env path: unset is no config at all', async () => {
    expect(await readRedesignConfig({} as NodeJS.ProcessEnv)).toBeNull();
  });

  it('env path: only "true" turns it on', async () => {
    const env = { LIFE_REDESIGN_ENABLED: 'TRUE', LIFE_REDESIGN_USERS: 'sara' } as unknown as NodeJS.ProcessEnv;
    expect((await readRedesignConfig(env))?.enabled).toBe(false);
  });

  it('Edge Config path reads the one item, without caching', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ enabled: true, users: ['sara'] }), { status: 200 }));
    const cfg = await readRedesignConfig({ EDGE_CONFIG: EDGE } as unknown as NodeJS.ProcessEnv, fetchImpl as unknown as typeof fetch);
    expect(cfg).toEqual({ enabled: true, users: new Set(['sara']) });
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://edge-config.vercel.com/ecfg_abc123/item/life_redesign?token=tok-1',
      expect.objectContaining({ cache: 'no-store' }),
    );
  });

  it('Edge Config set but unreadable → no config, NEVER the env list (a rollback is not undone by a stale env)', async () => {
    const env = { EDGE_CONFIG: EDGE, LIFE_REDESIGN_ENABLED: 'true', LIFE_REDESIGN_USERS: 'sara' } as unknown as NodeJS.ProcessEnv;
    for (const fetchImpl of [
      async () => new Response('nope', { status: 500 }),
      async () => new Response('', { status: 404 }),
      async () => { throw new Error('network'); },
      async () => new Response('not json', { status: 200 }),
    ]) {
      expect(await readRedesignConfig(env, fetchImpl as unknown as typeof fetch)).toBeNull();
    }
  });

  it('a malformed connection string is no config', () => {
    expect(edgeItemUrl('http://edge-config.vercel.com/ecfg_a?token=t')).toBeNull();
    expect(edgeItemUrl('https://edge-config.vercel.com/ecfg_a')).toBeNull();
    expect(edgeItemUrl('https://evil.example/../x?token=t')).toBeNull();
    expect(edgeItemUrl('https://evil.example/ecfg_a?token=t')).toBeNull(); // only Vercel's host
    expect(edgeItemUrl('garbage')).toBeNull();
  });
});

describe('resolveDesign', () => {
  it('end to end on the env path', async () => {
    const env = { JWT_SECRET: SECRET, LIFE_REDESIGN_ENABLED: 'true', LIFE_REDESIGN_USERS: 'sara,omar' } as unknown as NodeJS.ProcessEnv;
    expect((await resolveDesign(await token({ pi_username: 'omar' }), env)).design).toBe('new');
    expect((await resolveDesign(await token({ pi_username: 'mona' }), env)).design).toBe('legacy');
  });

  it('rollback on the Edge Config path takes effect on the very next request', async () => {
    let enabled = true;
    const fetchImpl = (async () => new Response(JSON.stringify({ enabled, users: ['sara'] }))) as unknown as typeof fetch;
    const env = { JWT_SECRET: SECRET, EDGE_CONFIG: 'https://edge-config.vercel.com/ecfg_x?token=t' } as unknown as NodeJS.ProcessEnv;
    const t = await token({ pi_username: 'sara' });
    expect((await resolveDesign(t, env, fetchImpl)).design).toBe('new');
    enabled = false; // the operator flips the switch — no deploy
    expect((await resolveDesign(t, env, fetchImpl)).design).toBe('legacy');
  });

  it('never throws', async () => {
    const fetchImpl = (() => { throw new Error('boom'); }) as unknown as typeof fetch;
    const env = { JWT_SECRET: SECRET, EDGE_CONFIG: 'https://edge-config.vercel.com/ecfg_x?token=t' } as unknown as NodeJS.ProcessEnv;
    await expect(resolveDesign('x', env, fetchImpl)).resolves.toEqual({ design: 'legacy', reason: 'no_config' });
  });
});
