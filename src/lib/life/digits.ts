// Digits that match the language of the screen (owner, 28 Nov 2026): Arabic screens show Arabic-Indic
// digits (٠-٩, decimal point «٫»), every other language keeps the digits it had.
//
// Only ever applied to numbers and to fixed copy — NEVER to what a person wrote (a goal's title, a
// step, a summary): their words stay exactly as typed.
import type { Locale } from '@/lib/i18n/locales';

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** A number, or fixed copy holding numbers, in the screen's digits. */
export function localDigits(locale: Locale, v: string | number): string {
  const s = String(v);
  if (locale !== 'ar') return s;
  return s.replace(/(\d)\.(?=\d)/g, '$1٫').replace(/\d/g, (d) => AR_DIGITS[Number(d)]!);
}
