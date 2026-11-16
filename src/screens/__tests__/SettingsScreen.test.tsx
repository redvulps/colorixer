import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, screen } from '@testing-library/react-native';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';

import { setLocale } from '../../i18n';
import { LANGUAGE_KEY } from '../../state/language';
import { renderWithProviders } from '../../testing/renderWithProviders';
import { DesktopWorkspace } from '../DesktopWorkspace';
import { PRIVACY_URL, SettingsScreen, SOURCE_URL } from '../SettingsScreen';
import { TabletWorkspace } from '../TabletWorkspace';

jest.mock('expo-application', () => ({
  nativeApplicationVersion: '1.1.0',
  nativeBuildVersion: '6',
}));
jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(() => Promise.resolve({ type: 'opened' })),
}));

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});
afterEach(() => setLocale('en'));

const checked = (testID: string) =>
  screen.getByTestId(testID).props.accessibilityState?.checked ?? false;

describe('Settings', () => {
  it('shows the app name and its version with the build', async () => {
    await renderWithProviders(<SettingsScreen />);

    expect(screen.getByText('Colorixer')).toBeTruthy();
    expect(screen.getByTestId('app-version')).toHaveTextContent('Version 1.1.0 (6)');
  });

  it('follows the device until a language is picked, and keeps the pick', async () => {
    await renderWithProviders(<SettingsScreen />);
    expect(checked('language-auto')).toBe(true);
    expect(screen.getByText('Language')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('language-es'));

    expect(checked('language-es')).toBe(true);
    expect(checked('language-auto')).toBe(false);
    expect(screen.getByText('Idioma')).toBeTruthy();
    expect(screen.getByText('Acerca de')).toBeTruthy();
    expect(await AsyncStorage.getItem(LANGUAGE_KEY)).toBe('es');

    await fireEvent.press(screen.getByTestId('language-auto'));

    expect(screen.getByText('Language')).toBeTruthy();
    expect(await AsyncStorage.getItem(LANGUAGE_KEY)).toBe('auto');
  });

  it('starts in the language picked before', async () => {
    await AsyncStorage.setItem(LANGUAGE_KEY, 'pt-BR');
    await renderWithProviders(<SettingsScreen />);

    expect(checked('language-pt-BR')).toBe(true);
    expect(screen.getByText('Idioma')).toBeTruthy();
    expect(screen.getByText('Política de privacidade')).toBeTruthy();
  });

  it('opens the privacy policy and the source code in the browser', async () => {
    await renderWithProviders(<SettingsScreen />);

    await fireEvent.press(screen.getByTestId('privacy-link'));
    await fireEvent.press(screen.getByTestId('source-link'));

    expect(WebBrowser.openBrowserAsync).toHaveBeenNthCalledWith(1, PRIVACY_URL);
    expect(WebBrowser.openBrowserAsync).toHaveBeenNthCalledWith(2, SOURCE_URL);
  });

  it('is the third view of the tablet, and a new language reaches the whole screen', async () => {
    await renderWithProviders(<TabletWorkspace />);

    await fireEvent.press(screen.getByTestId('view-settings'));
    expect(screen.getByTestId('settings-screen')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('language-pt-BR'));

    expect(screen.getByTestId('view-palettes')).toHaveTextContent('Paletas', { exact: false });
    expect(screen.getByTestId('view-settings')).toHaveTextContent('Ajustes');
  });

  it('opens in a dialog from the gear of the wide workspace', async () => {
    await renderWithProviders(<DesktopWorkspace />);
    expect(screen.queryByTestId('settings-dialog')).toBeNull();

    await fireEvent.press(screen.getByTestId('settings-button'));
    expect(screen.getByTestId('settings-dialog')).toBeTruthy();
    expect(screen.getByTestId('app-version')).toBeTruthy();

    await fireEvent.press(screen.getAllByLabelText('Close')[0]);
    expect(screen.queryByTestId('settings-dialog')).toBeNull();
  });
});
