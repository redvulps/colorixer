import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, screen, waitFor, within } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import React from 'react';

import { exportPalette } from '../../hooks/usePaletteActions';
import { renderWithProviders, setChannel, touchWheel } from '../../testing/renderWithProviders';
import { ColorScreen } from '../ColorScreen';

jest.mock('../../hooks/usePaletteActions', () => ({
  ...jest.requireActual('../../hooks/usePaletteActions'),
  exportPalette: jest.fn(() => Promise.resolve()),
}));

const ANALOGOUS_RED = ['#ff0000', '#ff002d', '#ff2600', '#ff006d', '#ff4d00'];

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
    expect(screen.getByText('#007bff')).toBeOnTheScreen();
    expect(screen.getByText('#ffff00')).toBeOnTheScreen();
    expect(screen.queryByText('#ff2600')).toBeNull();
  });

  it('offers the split complementary, compound and shades harmonies', async () => {
    await renderWithProviders(<ColorScreen />);
    await fireEvent.press(screen.getByTestId('harmony-splitComplementary'));
    expect(screen.getByText('Split complementary')).toBeOnTheScreen();
    expect(screen.getByText('#00ff84')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('harmony-compound'));
    expect(screen.getByText('#00ffbb')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('harmony-shades'));
    expect(screen.getByText('#610000')).toBeOnTheScreen();
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
    await fireEvent.press(screen.getByTestId('swatch-#ff2600'));
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('#ff2600');
    expect(screen.getByText('Copied #ff2600')).toBeOnTheScreen();
  });

  it('shows the palette in full screen from its button, and closes on a tap', async () => {
    await renderWithProviders(<ColorScreen />);
    await fireEvent.press(screen.getByTestId('fullscreen-button'));
    const full = await screen.findByTestId('palette-fullscreen');
    for (const hex of ANALOGOUS_RED) {
      expect(within(full).getByText(hex)).toBeOnTheScreen();
    }
    expect(screen.getByText('Analogous · 5 colors')).toBeOnTheScreen();
    expect(Clipboard.setStringAsync).not.toHaveBeenCalled();

    await fireEvent.press(full);
    await waitFor(() => expect(screen.queryByTestId('palette-fullscreen')).toBeNull());
  });

  it('copies HEX from the long-press sheet', async () => {
    await renderWithProviders(<ColorScreen />);
    await fireEvent(screen.getByTestId('swatch-#ff2600'), 'longPress');
    await fireEvent.press(screen.getByText('Copy as HEX'));
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('#ff2600');
    expect(screen.getByText('Copied #ff2600')).toBeOnTheScreen();
  });

  it('copies other formats from the long-press sheet', async () => {
    await renderWithProviders(<ColorScreen />);
    await fireEvent(screen.getByTestId('swatch-#ff2600'), 'longPress');
    await fireEvent.press(screen.getByText('Copy as RGB'));
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('rgb(255 38 0)');

    await fireEvent(screen.getByTestId('swatch-#ff0000'), 'longPress');
    await fireEvent.press(screen.getByText('Copy as HSL'));
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('hsl(0deg 100% 50%)');

    await fireEvent(screen.getByTestId('swatch-#ff2600'), 'longPress');
    await fireEvent.press(screen.getByText('Copy as HSV'));
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('hsv(9, 100%, 100%)');
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

describe('Color tab controls', () => {
  it('picks the base color on the wheel', async () => {
    await renderWithProviders(<ColorScreen />);
    await touchWheel(screen.getByTestId('color-wheel'), 0, 0);
    expect(screen.getByText('#00daff')).toBeOnTheScreen();
    expect(screen.queryByText('#ff0000')).toBeNull();
  });

  it('sets saturation and value from their fields', async () => {
    await renderWithProviders(<ColorScreen />);
    await setChannel(screen.getByTestId('value-s'), '50');
    expect(screen.getByText('#ff8080')).toBeOnTheScreen();
    await setChannel(screen.getByTestId('value-v'), '50');
    expect(screen.getByText('#804040')).toBeOnTheScreen();
  });

  it('switches the sliders to HSL and sets saturation and lightness', async () => {
    await renderWithProviders(<ColorScreen />);
    expect(screen.getByText('Hue, saturation, value')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('slider-mode-hsl'));
    expect(screen.getByText('Hue, saturation, lightness')).toBeOnTheScreen();
    expect(screen.queryByTestId('value-v')).toBeNull();
    expect(screen.getByTestId('value-l').props.value).toBe('50%');

    await setChannel(screen.getByTestId('value-l'), '25');
    expect(screen.getByText('#800000')).toBeOnTheScreen();
    await setChannel(screen.getByTestId('value-s'), '50');
    expect(screen.getByText('#602020')).toBeOnTheScreen();

    // Back in HSV, the sliders show the same color
    await fireEvent.press(screen.getByTestId('slider-mode-hsv'));
    expect(screen.getByTestId('value-s').props.value).toBe('67%');
    expect(screen.getByTestId('value-v').props.value).toBe('38%');
  });

  it('brings the saturation back after lightness goes to white', async () => {
    await renderWithProviders(<ColorScreen />);
    await fireEvent.press(screen.getByTestId('slider-mode-hsl'));
    await setChannel(screen.getByTestId('value-s'), '60');
    await setChannel(screen.getByTestId('value-l'), '100');
    expect(screen.getAllByText('#ffffff').length).toBeGreaterThan(0);
    expect(screen.getByTestId('value-s').props.value).toBe('60%');
    await setChannel(screen.getByTestId('value-l'), '50');
    expect(screen.getByText('#cc3333')).toBeOnTheScreen();
  });

  it('closes the export sheet with Cancel, without exporting', async () => {
    await renderWithProviders(<ColorScreen />);
    await fireEvent.press(screen.getByTestId('share-button'));
    await fireEvent.press(within(screen.getByTestId('export-sheet')).getByText('Cancel'));
    await waitFor(() => expect(screen.queryByText('Export to Adobe')).toBeNull());
    expect(exportPalette).not.toHaveBeenCalled();
  });

  it('closes the copy sheet with Cancel, without copying', async () => {
    await renderWithProviders(<ColorScreen />);
    await fireEvent(screen.getByTestId('swatch-#ff0000'), 'longPress');
    await fireEvent.press(within(screen.getByTestId('copy-sheet')).getByText('Cancel'));
    await waitFor(() => expect(screen.queryByText('Copy as HEX')).toBeNull());
    expect(Clipboard.setStringAsync).not.toHaveBeenCalled();
  });
});
