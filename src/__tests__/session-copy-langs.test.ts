/**
 * Life speaks all twelve languages (owner, 2026-10-20). Pinned: every language has every
 * key a person reads; the placeholders survive translation; nothing a person reads names the
 * AI vendor ("users don't need to know how we work"); and no screen falls back to English.
 */
import { describe, it, expect } from 'vitest';
import { sessionCopy, ADMIN_KEYS, type SessionCopy } from '@/lib/life/session-copy';
import { LOCALES } from '@/lib/i18n/locales';

const en = sessionCopy('en');
const personKeys = (Object.keys(en) as (keyof SessionCopy)[]).filter((k) => !(ADMIN_KEYS as readonly string[]).includes(k));
const holes = (v: string) => (v.match(/\{[a-z0-9]+\}/g) ?? []).sort();
// Words that are the same in every language: the app's name, and the file format.
const SAME = new Set(['life', 'you']);
/** Real words that happen to be spelled as in English. */
const ALSO_SAME: Partial<Record<string, string[]>> = { fr: ['cMessages'] }; // « {n} messages »

describe('Life in every language', () => {
  for (const { code } of LOCALES) {
    const c = sessionCopy(code);
    it(`${code}: every key, every placeholder, no vendor`, () => {
      for (const k of personKeys) {
        // A closed list of labels (the feelings) is checked label by label.
        if (typeof en[k] === 'object') {
          const want = en[k] as Record<string, string>; const got = (c[k] ?? {}) as Record<string, string>;
          expect(Object.keys(got).sort(), `${code}.${k}`).toEqual(Object.keys(want).sort());
          for (const id of Object.keys(want)) expect(typeof got[id] === 'string' && got[id]!.trim().length > 0, `${code}.${k}.${id}`).toBe(true);
          if (code !== 'en') expect(Object.keys(want).filter((id) => got[id] === want[id]), `${code}.${k}`).toEqual([]);
          continue;
        }
        const v = c[k] as unknown;
        expect(typeof v === 'string' && v.trim().length > 0, `${code}.${k}`).toBe(true);
        expect(holes(v as string), `${code}.${k}`).toEqual(holes(en[k] as string));
        expect(v as string, `${code}.${k}`).not.toMatch(/groq|gpt|openai|qwen|llama/i);
      }
    });
    if (code !== 'en') {
      it(`${code}: nothing a person reads is left in English`, () => {
        const same = personKeys.filter((k) => typeof en[k] === 'string' && !SAME.has(k) && !(ALSO_SAME[code] ?? []).includes(k) && c[k] === en[k] && /[a-z]{3}/i.test(en[k] as string));
        // "Life" stays "Life"; a value equal to the English otherwise is an untranslated string.
        expect(same.filter((k) => en[k] !== 'Life'), code).toEqual([]);
      });
    }
  }
});

describe('Life presents itself as a personal life coach (owner, 2026-10-20: «احنا مشروع بناء الإنسان»)', () => {
  it('every language names the coach, and says it is no doctor, lawyer or financial adviser', async () => {
    const { sessionCopy } = await import('@/lib/life/session-copy');
    const coach: Record<string, RegExp> = {
      en: /life coach/, ar: /مدرّبك الشخصي/, es: /coach personal/, fr: /coach de vie/, pt: /coach pessoal/,
      tr: /yaşam koç/, ru: /лайф-коуч/, id: /life coach/, vi: /huấn luyện viên/, hi: /लाइफ़ कोच/, ko: /라이프 코치/, zh: /生活教练/,
    };
    for (const [lang, re] of Object.entries(coach)) {
      const s = sessionCopy(lang as Parameters<typeof sessionCopy>[0]);
      expect(s.entryTitle).toMatch(re);
      expect(s.introIs).toMatch(re);
      expect(s.introIsNot.length).toBeGreaterThan(20);
    }
    expect(sessionCopy('ar').introIsNot).toMatch(/ليس طبيبًا ولا محاميًا ولا مستشارًا ماليًا/);
    expect(sessionCopy('en').introIsNot).toMatch(/not a doctor, a lawyer or a financial adviser/);
  });
});
