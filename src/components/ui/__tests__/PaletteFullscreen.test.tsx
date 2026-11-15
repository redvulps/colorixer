import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import { PaletteFullscreen } from '../PaletteFullscreen';

const COLORS = ['#0077b6', '#b63f00'];
const ORIGIN = { x: 16, y: 520, width: 379, height: 52 };

function fullscreen(visible: boolean, onClose = jest.fn()) {
  return (
    <PaletteFullscreen
      testID="full"
      visible={visible}
      origin={ORIGIN}
      colors={COLORS}
      label="Oceano · Complementary · 2 colors"
      onClose={onClose}
    />
  );
}

describe('PaletteFullscreen', () => {
  it('renders nothing while closed', async () => {
    await render(fullscreen(false));
    expect(screen.queryByTestId('full')).toBeNull();
  });

  it('shows every color with its hex, and the palette label', async () => {
    await render(fullscreen(true));
    expect(await screen.findByText('#0077b6')).toBeOnTheScreen();
    expect(screen.getByText('#b63f00')).toBeOnTheScreen();
    expect(screen.getByText('Oceano · Complementary · 2 colors')).toBeOnTheScreen();
  });

  it('asks to close when tapped', async () => {
    const onClose = jest.fn();
    await render(fullscreen(true, onClose));
    await fireEvent.press(await screen.findByTestId('full'));
    expect(onClose).toHaveBeenCalled();
  });

  it('stays mounted while it shrinks back, then goes away', async () => {
    const { rerender } = await render(fullscreen(true));
    await screen.findByText('#0077b6');
    await rerender(fullscreen(false));
    expect(screen.getByText('#0077b6')).toBeOnTheScreen();
    await waitFor(() => expect(screen.queryByText('#0077b6')).toBeNull());
  });
});
