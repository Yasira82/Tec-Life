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
    // It names the monthly review too, not only the weekly reminder.
    expect(DICTIONARIES.en.life.privacy.checkinDesc).toMatch(/week.*month/);
    expect(DICTIONARIES.ar.life.privacy.checkinDesc).toMatch(/أسبوع.*شهر/);
    for (const { code } of LOCALES) {
    }
  });
});

describe('the note above the switches tells the truth', () => {
  it('names TEC AI as the reader — "nothing reads this yet" stopped being true', () => {
    for (const { code } of LOCALES) expect(DICTIONARIES[code].life.privacy.shareNote, code).toMatch(/TEC AI/);
    expect(DICTIONARIES.en.life.privacy.shareNote).not.toMatch(/Nothing reads/);
  });
});

describe('the sharing switch names who answers (owner, 2026-10-30)', () => {
  it('every language names Google Gemini, says it may be kept, and that Life\'s own conversations do not go there', () => {
    for (const { code } of LOCALES) {
      const t = DICTIONARIES[code].life.privacy.shareProvider;
      expect(t, code).toMatch(/Gemini/);
      expect(t, code).toMatch(/Google/);
      expect(t, code).toMatch(/Life/);
      if (code !== 'en') expect(t, code).not.toBe(DICTIONARIES.en.life.privacy.shareProvider);
    }
  });
});
