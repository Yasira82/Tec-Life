/**
 * Where TEC can be reached.
 *
 * ── One file, on purpose ────────────────────────────────────────────────────
 * These links go on the login screen and in Settings, in every app. Copying
 * them per app is how the fleet ends up with twelve apps pointing at a Telegram
 * channel that moved — the exact drift that has now cost this platform four
 * separate sweeps (the palette, the Dependabot policy, the band radius, the CI
 * cache). When this is proven on a device it moves to `@yasser172/tec-ui` so
 * there is one copy for all 24 apps, not 24.
 *
 * ── An empty string means "do not render" ───────────────────────────────────
 * NOT "render a dead link". A social icon that opens nothing is worse than an
 * absent one: the user concludes the product is abandoned, and they are making
 * a reasonable inference. Fill a handle in and it appears; leave it out and it
 * simply is not there.
 */

export interface SocialLink {
  key:   string;
  label: string;
  href:  string;
}

/** Every link is https and opens in a new tab — see `SocialLinks`. */
export const SOCIAL: SocialLink[] = [
  // TEC Connection — ours, and the only one that is not a third party. It leads
  // INTO the ecosystem rather than out of it, which is why it is first.
  { key: 'connection', label: 'TEC Connection', href: 'https://connection.tecosystem.app' },

  // TODO(owner): the handles below are the CEO's to provide — inventing a URL
  // here would ship a broken link to 24 apps. Each stays hidden until filled.
  { key: 'telegram', label: 'Telegram', href: '' },
  { key: 'whatsapp', label: 'WhatsApp', href: '' },
  { key: 'facebook', label: 'Facebook', href: '' },
  { key: 'x',        label: 'X',        href: '' },
];

/**
 * Only the ones actually configured, and only if they are real https URLs.
 *
 * The `startsWith` check is not paranoia about our own constants — it is the
 * `C_HUB_URL` lesson (July 2026): a placeholder that looked like a value became
 * a live redirect target and 404'd for every user. A non-URL here is treated as
 * absent rather than rendered as a link to nowhere.
 */
export const activeSocial = (): SocialLink[] =>
  SOCIAL.filter((s) => s.href.startsWith('https://'));
