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
