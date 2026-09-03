// Every dictionary, keyed by locale, in ONE place.
//
// Eagerly imported rather than dynamically loaded: each is a few kilobytes of
// strings, and a dynamic import would buy nothing while introducing a way for a
// locale to fail to load at request time — which, in someone's own language,
// means a blank screen.
import { en } from './en';
import { ar } from './ar';
import { es } from './es';
import { fr } from './fr';
import { pt } from './pt';
import { tr } from './tr';
import { ru } from './ru';
import { hi } from './hi';
import { id } from './id';
import { vi } from './vi';
import { ko } from './ko';
import { zh } from './zh';

import type { Locale } from '../locales';

export type Dictionary = typeof en;

export const DICTIONARIES: Record<Locale, Dictionary> = {
  en, ar, es, fr, pt, tr, ru, hi, id, vi, ko, zh,
};
