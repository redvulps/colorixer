import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, screen } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import React from 'react';

import { exportPalette } from '../../hooks/usePaletteActions';
import { renderWithProviders } from '../../testing/renderWithProviders';
import { ColorScreen } from '../ColorScreen';

jest.mock('../../hooks/usePaletteActions', () => ({
  ...jest.requireActual('../../hooks/usePaletteActions'),
  exportPalette: jest.fn(() => Promise.resolve()),
}));

const ANALOGOUS_RED = ['#ff0000', '#ff8000', '#ff0080', '#ffff00', '#ff00ff'];

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe('Color tab', () => {
  it('opens with the analogous palette of red', async () => {
    await renderWithProviders(<ColorScreen />);
    for (const hex of ANALOGOUS_RED) {
      expect(screen.getByText(hex)).toBeOnTheScreen();
    }
  });

  it('switches the harmony', async () => {
    await renderWithProviders(<ColorScreen />);
    await fireEvent.press(screen.getByTestId('harmony-triadic'));
    expect(screen.getByText('#00ff00')).toBeOnTheScreen();
    expect(screen.getByText('#0000ff')).toBeOnTheScreen();
    expect(screen.queryByText('#ff8000')).toBeNull();
  });

  it('sets the hue from its field', async () => {
    await renderWithProviders(<ColorScreen />);
    const field = screen.getByTestId('value-h');
    await fireEvent.changeText(field, '120');
    await fireEvent(field, 'endEditing');
    expect(screen.getByText('#00ff00')).toBeOnTheScreen();
    expect(screen.queryByText('#ff0000')).toBeNull();
  });

  it('copies HEX when a swatch is tapped', async () => {
    await renderWithProviders(<ColorScreen />);
    await fireEvent.press(screen.getByTestId('swatch-#ff8000'));
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('#ff8000');
    expect(screen.getByText('Copied #ff8000')).toBeOnTheScreen();
  });

  it('copies other formats from the long-press sheet', async () => {
    await renderWithProviders(<ColorScreen />);
    await fireEvent(screen.getByTestId('swatch-#ff0000'), 'longPress');
    await fireEvent.press(screen.getByText('Copy as HSL'));
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('hsl(0deg 100% 50%)');

    await fireEvent(screen.getByTestId('swatch-#ff8000'), 'longPress');
    await fireEvent.press(screen.getByText('Copy as HSV'));
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('hsv(30, 100%, 100%)');
  });

  it('saves the palette', async () => {
    await renderWithProviders(<ColorScreen />);
    await fireEvent.press(screen.getByTestId('save-button'));
    expect(screen.getByText('Saved “Palette 1”')).toBeOnTheScreen();
    expect(screen.getByText('Saved')).toBeOnTheScreen();
    expect(screen.getByText('Palette 1 · Analogous')).toBeOnTheScreen();
  });

  it('exports the current palette from the palette header', async () => {
    await renderWithProviders(<ColorScreen />);
    await fireEvent.press(screen.getByTestId('share-button'));
    expect(screen.getByText('Current palette')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Export to Adobe'));
    expect(exportPalette).toHaveBeenCalledWith('ase', ANALOGOUS_RED, 'Colorixer palette');
  });
});
