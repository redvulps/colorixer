import { act, fireEvent, render, type screen } from '@testing-library/react-native';
import React from 'react';

/** A rendered element, as the queries return it */
type Element = ReturnType<typeof screen.getByTestId>;

import { ToastProvider } from '@/src/components/ui';
import { LanguageProvider } from '@/src/state/language';
import { PaletteProvider } from '@/src/state/palettes';

/** Renders a screen inside the app providers and waits for the language and saved palettes to load */
export async function renderWithProviders(ui: React.ReactElement) {
  const result = await render(
    <LanguageProvider>
      <PaletteProvider>
        <ToastProvider bottom={24}>{ui}</ToastProvider>
      </PaletteProvider>
    </LanguageProvider>,
  );
  await act(async () => {});
  return result;
}

/** Press event with a position, for buttons that open a menu next to the pointer */
export const pressAt = { nativeEvent: { pageX: 200, pageY: 300 } };

/**
 * Touches the color wheel at a point, given in the wheel's own coordinates, through its
 * PanResponder. (0, 0) is the wheel's top-left corner: hue 225°, full saturation, #0040ff.
 */
export async function touchWheel(wheel: Element, x: number, y: number) {
  const touch = { locationX: x, locationY: y, pageX: x, pageY: y, identifier: 0, timestamp: 0 };
  await fireEvent(wheel, 'responderGrant', {
    nativeEvent: { ...touch, touches: [touch], changedTouches: [touch] },
    touchHistory: {
      numberActiveTouches: 1,
      indexOfSingleActiveTouch: 0,
      mostRecentTimeStamp: 0,
      touchBank: [
        {
          touchActive: true,
          startPageX: x,
          startPageY: y,
          startTimeStamp: 0,
          currentPageX: x,
          currentPageY: y,
          currentTimeStamp: 0,
          previousPageX: x,
          previousPageY: y,
          previousTimeStamp: 0,
        },
      ],
    },
  });
}

/** Types a value in an H, S or V field and commits it */
export async function setChannel(field: Element, value: string) {
  await fireEvent.changeText(field, value);
  await fireEvent(field, 'endEditing');
}
