/**
 * The weekly check-in switch (owner, 2026-10-09 — TEC AI as a mentor, step 2). The
 * reminder itself is identity-service's (checkin.sweeper.ts); Life holds the switch.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LIFE_DATA_CATEGORIES } from '@/lib-client/life/useLife';
import { DICTIONARIES } from '@/lib/i18n/dictionaries';
import { LOCALES } from '@/lib/i18n/locales';

const view = readFileSync(join(process.cwd(), 'src/app/app/components/SettingsView.tsx'), 'utf8');

describe('the CHECKIN switch', () => {
  it('is a category like the others — absence is a NO, so it starts off for everyone', () => {
    expect(LIFE_DATA_CATEGORIES).toContain('CHECKIN');
  });

  it('is named and explained, in every language', () => {
    expect(view).toMatch(/CHECKIN: p\.checkin/);
    expect(view).toMatch(/desc=\{DESC\[c\.category\]\}/);
    for (const { code } of LOCALES) {
      const p = DICTIONARIES[code].life.privacy;
      expect(p.checkin && p.checkinDesc, code).toBeTruthy();
      expect(p.checkinDesc, code).toMatch(/TEC Alert/);
    }
  });
});

describe('the note above the switches tells the truth', () => {
  it('names TEC AI as the reader — "nothing reads this yet" stopped being true', () => {
    for (const { code } of LOCALES) expect(DICTIONARIES[code].life.privacy.shareNote, code).toMatch(/TEC AI/);
    expect(DICTIONARIES.en.life.privacy.shareNote).not.toMatch(/Nothing reads/);
  });
});
