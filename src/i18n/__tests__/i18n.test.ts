import en from '../en';
import es from '../es';
import {
  deviceLocale,
  formatShortDate,
  isLanguageChoice,
  LOCALE_NAMES,
  LOCALES,
  pickLocale,
  resolveLocale,
  setLocale,
  t,
} from '../index';
import ptBR from '../pt-BR';

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const texts = (entry: unknown): string[] =>
  typeof entry === 'string' ? [entry] : Object.values(entry as Record<string, string>);

afterEach(() => setLocale('en'));

describe('pickLocale', () => {
  it.each([
    [['pt-BR'], 'pt-BR'],
    [['pt-PT'], 'pt-BR'],
    [['es-MX'], 'es'],
    [['es_ES'], 'es'],
    [['fr-FR', 'es-ES'], 'es'],
    [['en-GB', 'pt-BR'], 'en'],
    [['de-DE', 'ja-JP'], 'en'],
    [[], 'en'],
    [[null, undefined], 'en'],
  ])('picks %j as %s', (tags, expected) => {
    expect(pickLocale(tags as string[])).toBe(expected);
  });
});

describe('language choice', () => {
  it('stands for the device language when automatic, and for itself otherwise', () => {
    expect(resolveLocale('auto')).toBe(deviceLocale());
    expect(resolveLocale('es')).toBe('es');
    expect(resolveLocale('pt-BR')).toBe('pt-BR');
  });

  it('accepts only automatic and the app languages', () => {
    expect(['auto', ...LOCALES].every(isLanguageChoice)).toBe(true);
    expect(isLanguageChoice('fr')).toBe(false);
    expect(isLanguageChoice(null)).toBe(false);
  });

  it('names each language in itself', () => {
    expect(LOCALES.map((l) => LOCALE_NAMES[l])).toEqual([
      'Português (Brasil)',
      'English',
      'Español',
    ]);
  });
});

describe('dictionaries', () => {
  it.each([
    ['pt-BR', ptBR],
    ['es', es],
  ])('%s has every key, with the same placeholders as English', (_, dictionary) => {
    expect(Object.keys(dictionary).sort()).toEqual(Object.keys(en).sort());
    for (const [key, entry] of Object.entries(en)) {
      const own = (dictionary as Record<string, unknown>)[key];
      expect(typeof own).toBe(typeof entry);
      for (const text of texts(own)) {
        expect([key, placeholders(text)]).toEqual([key, placeholders(texts(entry)[0])]);
      }
    }
  });
});

describe('t', () => {
  it('fills placeholders and picks the plural', () => {
    expect(t('toast.saved', { name: 'Palette 1' })).toBe('Saved “Palette 1”');
    expect(t('common.colors', { count: 1 })).toBe('1 color');
    expect(t('common.colors', { count: 5 })).toBe('5 colors');
  });

  it('speaks Brazilian Portuguese and Spanish', () => {
    setLocale('pt-BR');
    expect(t('common.colors', { count: 5 })).toBe('5 cores');
    expect(t('palette.savedCount', { count: 1 })).toBe('1 salva');
    expect(t('harmony.splitComplementary')).toBe('Complementar dividida');
    setLocale('es');
    expect(t('common.colors', { count: 1 })).toBe('1 color');
    expect(t('export.to', { app: 'Procreate' })).toBe('Exportar a Procreate');
  });

  it('writes dates in the current language', () => {
    expect(formatShortDate('2026-11-12T12:00:00.000Z')).toBe('Nov 12');
    setLocale('pt-BR');
    expect(formatShortDate('2026-11-12T12:00:00.000Z')).toMatch(/12.*nov/);
  });
});
