import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import {
  SourceCodePro_400Regular,
  SourceCodePro_600SemiBold,
} from '@expo-google-fonts/source-code-pro';
import { Stack } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

import { LanguageProvider } from '@/src/state/language';
import { PaletteProvider } from '@/src/state/palettes';
import { colors, TABLET_MIN_SIDE } from '@/src/theme/tokens';

// Keep the splash screen up until the fonts are ready
SplashScreen.preventAutoHideAsync();

/**
 * Phones stay upright. Tablets turn freely, and in landscape they are wide enough for the
 * three-column workspace.
 */
function lockPhonesToPortrait() {
  if (Platform.OS === 'web') return;
  const { width, height } = Dimensions.get('screen');
  if (Math.min(width, height) >= TABLET_MIN_SIDE) return;
  ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
}
lockPhonesToPortrait();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    SourceCodePro_400Regular,
    SourceCodePro_600SemiBold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // A font error falls back to system fonts instead of blocking the app
  if (!loaded && !error) {
    return null;
  }

  return (
    <LanguageProvider>
      <PaletteProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bgApp } }}
        />
      </PaletteProvider>
    </LanguageProvider>
  );
}
