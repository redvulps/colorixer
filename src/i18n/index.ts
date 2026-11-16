import { getLocales } from 'expo-localization';

import en from './en';
import es from './es';
import ptBR from './pt-BR';
import type { Dictionary, MessageKey, Plural } from './types';

export type { MessageKey } from './types';

export type Locale = 'en' | 'pt-BR' | 'es';

/** The language the person picked: one of the app's, or the device's */
export type LanguageChoice = 'auto' | Locale;

/** The app's languages, in the order the language picker lists them */
export const LOCALES: readonly Locale[] = ['pt-BR', 'en', 'es'];

/** Each language by its own name, as language pickers show them */
export const LOCALE_NAMES: Record<Locale, string> = {
  'pt-BR': 'Português (Brasil)',
  en: 'English',
  es: 'Español',
};

const DICTIONARIES: Record<Locale, Dictionary> = { en: en as Dictionary, 'pt-BR': ptBR, es };

/**
 * The first of the person's preferred languages that the app speaks: any Portuguese gets
 * Brazilian Portuguese, any Spanish gets Spanish, and anything else falls back to English.
 */
export function pickLocale(tags: (string | null | undefined)[]): Locale {
  for (const tag of tags) {
    const language = tag?.toLowerCase().split(/[-_]/)[0];
    if (language === 'pt') return 'pt-BR';
    if (language === 'es') return 'es';
    if (language === 'en') return 'en';
  }
  return 'en';
}

/** The language the device asks for, among the app's */
export function deviceLocale(): Locale {
  try {
    return pickLocale(getLocales().map((l) => l.languageTag));
  } catch {
    return 'en';
  }
}

let current: Locale = deviceLocale();

/** Language in use */
export function getLocale(): Locale {
  return current;
}

/** Speak another language from now on; screens show it when they render again */
export function setLocale(locale: Locale) {
  current = locale;
}

/** The language a choice stands for: the device's for "auto" */
export function resolveLocale(choice: LanguageChoice): Locale {
  return choice === 'auto' ? deviceLocale() : choice;
}

export function isLanguageChoice(value: unknown): value is LanguageChoice {
  return value === 'auto' || LOCALES.includes(value as Locale);
}

/**
 * Text for a key in the current language, with `{name}` placeholders filled from `params`.
 * Plural texts pick "one" or "other" from `params.count`.
 */
export function t(key: MessageKey, params: Record<string, string | number> = {}): string {
  const entry = DICTIONARIES[current][key] ?? DICTIONARIES.en[key];
  const text =
    typeof entry === 'string' ? entry : (entry as Plural)[params.count === 1 ? 'one' : 'other'];
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

/** Short date in the current language, e.g. Nov 12 or 12 de nov. */
export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(current, { month: 'short', day: 'numeric' });
}
