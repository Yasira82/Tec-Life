import { describe, it, expect } from 'vitest';
import { uiCopy } from '@/lib/life/ui-copy';
import { LOCALES } from '@/lib/i18n/locales';

// The cards that were English inside every language (Pro, Invite, the event names, the
// focus choices). Every language has every word, and none of them is the English one
// left in place — that was the bug.
const flat = (o: unknown, pre = ''): [string, unknown][] =>
  o && typeof o === 'object'
    ? Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => flat(v, pre ? `${pre}.${k}` : k))
    : [[pre, o]];
const render = (v: unknown) => (typeof v === 'function' ? (v as (n: number) => string)(3) : v);

describe('ui-copy', () => {
  const en = Object.fromEntries(flat(uiCopy('en')).map(([k, v]) => [k, render(v)]));

  it.each(LOCALES.map((l) => l.code))('%s has every key, each a non-empty string', (code) => {
    const got = Object.fromEntries(flat(uiCopy(code)).map(([k, v]) => [k, render(v)]));
    expect(Object.keys(got).sort()).toEqual(Object.keys(en).sort());
    for (const v of Object.values(got)) expect(typeof v === 'string' && v.trim().length > 0).toBe(true);
  });

  it('Arabic is Arabic, not the English left in place', () => {
    const ar = uiCopy('ar');
    expect(ar.ev['payment.completed']).not.toBe(uiCopy('en').ev['payment.completed']);
    expect(ar.cancel).toMatch(/[؀-ۿ]/);
    expect(ar.inviteCopy).toMatch(/[؀-ۿ]/);
    expect(ar.focus.Building).toMatch(/[؀-ۿ]/);
  });

  it('the π tile label does not repeat the π the number already shows', () => {
    for (const l of LOCALES) expect(uiCopy(l.code).tracked).not.toContain('π');
  });
});
