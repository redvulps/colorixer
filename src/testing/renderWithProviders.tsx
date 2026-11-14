import { act, render } from '@testing-library/react-native';
import React from 'react';

import { ToastProvider } from '@/src/components/ui';
import { PaletteProvider } from '@/src/state/palettes';

/** Renders a screen inside the app providers and waits for saved palettes to load */
export async function renderWithProviders(ui: React.ReactElement) {
  const result = await render(
    <PaletteProvider>
      <ToastProvider bottom={24}>{ui}</ToastProvider>
    </PaletteProvider>,
  );
  await act(async () => {});
  return result;
}

/** Press event with a position, for buttons that open a menu next to the pointer */
export const pressAt = { nativeEvent: { pageX: 200, pageY: 300 } };
