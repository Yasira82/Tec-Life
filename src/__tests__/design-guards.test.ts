import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Three things that made the app look assembled rather than designed. Each one
// was invisible in review and obvious on a phone, which is exactly the kind of
// regression a guard is for.
const src = (p: string) => readFileSync(join(process.cwd(), 'src', p), 'utf8');
const strip = (s: string) => s
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/^[ \t]*\/\/.*$/gm, '');

describe('timestamps are written, not dumped', () => {
  const page = strip(src('app/app/page.tsx'));

  it('no raw toLocaleString on a date', () => {
    // `new Date(iso).toLocaleString()` is `8/28/2026, 11:02:27 PM` — seconds
    // nobody needs, a year repeated on every row, and no answer to "was that
    // today?". The helpers in lib-client/format answer it.
    expect(page).not.toMatch(/toLocaleString\(\)/);
  });

  it('the list is grouped by day', () => {
    expect(page).toContain('groupByDay');
    expect(page).toContain('formatDay');
  });
});

describe('section headers use the icon set, not emoji', () => {
  const settings = strip(src('app/app/components/SettingsView.tsx'));

  it('passes a glyph NAME to Section', () => {
    // The same emoji renders as a glossy 3D object on one phone and flat grey
    // line art on the next, and it never takes the section's colour.
    expect(settings).toMatch(/icon="(user|palette|settings|info|lock)"/);
  });

  it('carries no emoji in an icon prop', () => {
    expect(settings).not.toMatch(/icon="[^a-z"]/);
  });
});

describe('a control never refuses in silence', () => {
  const page = strip(src('app/app/page.tsx'));

  it('Skills accepts a one-character name', () => {
    // R, C, Go and AI are real skills. The old rule demanded two characters and
    // enforced it by DISABLING the button — so typing "R" and tapping Add did
    // nothing at all, with no message and no cursor change to explain it. A
    // control that refuses without saying so reads as a broken app.
    expect(page).not.toMatch(/name\.trim\(\)\.length < 2/);
    expect(page).toMatch(/name\.trim\(\)\.length === 0/);
  });
});

describe('the footer earns less space than the user’s own data', () => {
  const invite = strip(src('components/referral/InviteCard.tsx'));

  it('does not print the raw referral URL', () => {
    // It rendered truncated — unreadable, uncopyable by hand, unverifiable —
    // and took a whole row to show a string whose only use is the button next
    // to it.
    expect(invite).not.toContain('{link}');
  });
});

describe('a screen is not a stack of identical grey panels', () => {
  const page = strip(src('app/app/page.tsx'));

  it('the stat strip sits on the page, not in a card', () => {
    // Home and Goals both opened with the same grey card holding the same
    // three numbers, so the two tabs were indistinguishable at a glance.
    expect(page).not.toMatch(/\{\s*\.\.\.card,\s*display: 'flex', gap: 8, marginBottom: 12\s*\}/);
  });

  it('open and completed goals are separated', () => {
    // The list ran them together, so three finished goals pushed the one being
    // worked on off the screen — a to-do list showing mostly done.
    expect(page).toContain("g.status !== 'DONE'");
    expect(page).toContain('showDone');
  });

  it('the paid teaser sits BELOW the user’s own content', () => {
    // A locked promo between the summary and the list put the upsell ahead of
    // the person's own goals on their own screen.
    expect(page.indexOf('<Pace />')).toBeLessThan(page.indexOf('<LifeInsights />'));
  });
});

describe('the ring is painted through the theme, not around it', () => {
  const page = strip(src('app/app/page.tsx'));

  it('sets stroke through style so the CSS variable resolves', () => {
    // `stroke={C.gold}` as an ATTRIBUTE is `stroke="var(--tec-gold)"`, which
    // most engines do resolve — but `style` is the form the rest of this app
    // uses and the one the theme guard understands. One way to paint, not two.
    expect(page).toMatch(/style=\{\{\s*stroke:/);
  });

  it('the track is ink at low alpha, never a hardcoded grey', () => {
    expect(page).toContain('inkA(0.09)');
  });
});

describe('the band is chrome, and chrome does not grow', () => {
  // The CEO's report was "the strip at the top of the first page is too wide"
  // — the band's HEIGHT, not its curve. The cause was one string: Home's line
  // was 125 characters (two sentences, one of them a privacy manifesto) while
  // every sibling tab's was 29–39. At 12.5px on a phone that is four wrapped
  // lines against one, so the first screen a person ever sees carried a band
  // three times taller than every screen after it.
  //
  // The fix is a shorter string; the guard is what stops the next one. A band
  // line is a HINT — it names the tab, it does not explain the product. The
  // privacy sentence lives on the Privacy screen, where it can be acted on.
  const LIMIT = 60;
  const locales = ['en', 'ar', 'es', 'fr', 'hi', 'id', 'ko', 'pt', 'ru', 'tr', 'vi', 'zh'];

  for (const loc of locales) {
    it(`${loc}: every band line fits on one or two lines`, () => {
      const dict = src(`lib/i18n/dictionaries/${loc}.ts`);
      const lines = [...dict.matchAll(/(?:subtitle|hint):\s*'([^']*)'/g)].map((m) => m[1] ?? '');
      expect(lines.length).toBeGreaterThan(0);
      const tooLong = lines.filter((l) => l.length > LIMIT);
      expect(tooLong).toEqual([]);
    });
  }

  it('the band renders ONE line of hint, not a paragraph block', () => {
    // A second <p> would reintroduce the height the string limit just removed.
    const page = strip(src('app/app/page.tsx'));
    const band = page.slice(page.indexOf('className="tec-on-band"'), page.indexOf('</header>'));
    expect((band.match(/<p /g) ?? []).length).toBe(1);
  });
});
