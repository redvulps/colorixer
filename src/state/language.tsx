import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  deviceLocale,
  getLocale,
  isLanguageChoice,
  type LanguageChoice,
  type Locale,
  resolveLocale,
  setLocale,
} from '@/src/i18n';

export const LANGUAGE_KEY = 'colorixer:language:v1';

interface LanguageContextValue {
  /** What the person picked in Settings */
  choice: LanguageChoice;
  /** The language in use */
  locale: Locale;
  /** The language "auto" stands for */
  device: Locale;
  setChoice: (choice: LanguageChoice) => void;
}

// Without a provider (in tests), the device's language and no way to change it
const LanguageContext = createContext<LanguageContextValue>({
  choice: 'auto',
  locale: getLocale(),
  device: deviceLocale(),
  setChoice: () => {},
});

/**
 * The language picked in Settings, kept on the device. Screens read their texts through t(), so
 * everything under this provider renders again when the language changes. It shows nothing
 * until the stored choice is read, so the first frame is already in the right language.
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [choice, setChoiceState] = useState<LanguageChoice>('auto');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY)
      .then((stored) => {
        if (isLanguageChoice(stored)) {
          setLocale(resolveLocale(stored));
          setChoiceState(stored);
        }
      })
      .catch((error) => console.warn('Could not read the language:', error))
      .finally(() => setReady(true));
  }, []);

  const setChoice = useCallback((next: LanguageChoice) => {
    setLocale(resolveLocale(next));
    setChoiceState(next);
    AsyncStorage.setItem(LANGUAGE_KEY, next).catch((error) =>
      console.warn('Could not store the language:', error),
    );
  }, []);

  const locale = resolveLocale(choice);
  const value = useMemo(
    () => ({ choice, locale, device: deviceLocale(), setChoice }),
    [choice, locale, setChoice],
  );

  if (!ready) return null;
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/** The language in use and the person's choice; a component that calls it renders again on a change */
export function useLanguage() {
  return useContext(LanguageContext);
}
