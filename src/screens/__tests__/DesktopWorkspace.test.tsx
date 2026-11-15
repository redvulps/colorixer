import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, screen, within } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import React from 'react';

import { exportPalette } from '../../hooks/usePaletteActions';
import { type SavedPalette, STORAGE_KEY } from '../../state/palettes';
import {
  pressAt,
  renderWithProviders,
  setChannel,
  touchWheel,
} from '../../testing/renderWithProviders';
import { DesktopWorkspace } from '../DesktopWorkspace';

jest.mock('../../hooks/usePaletteActions', () => ({
  ...jest.requireActual('../../hooks/usePaletteActions'),
  exportPalette: jest.fn(() => Promise.resolve()),
}));

const ANALOGOUS_RED = ['#ff0000', '#ff8000', '#ff0080', '#ffff00', '#ff00ff'];

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

async function savePalette() {
  await fireEvent.press(screen.getByTestId('save-button'));
}

describe('Desktop workspace', () => {
  it('starts without saved palettes', async () => {
    await renderWithProviders(<DesktopWorkspace />);
    expect(screen.getByText('Saved palettes show up here.')).toBeOnTheScreen();
    expect(screen.getByText('Untitled')).toBeOnTheScreen();
  });

  it('saves the palette into the sidebar', async () => {
    await renderWithProviders(<DesktopWorkspace />);
    await savePalette();
    expect(screen.getByText('Saved “Palette 1”')).toBeOnTheScreen();
    expect(screen.getByTestId('palette-Palette 1')).toBeOnTheScreen();
    expect(screen.getByText('Saved')).toBeOnTheScreen();
    expect(screen.queryByText('Saved palettes show up here.')).toBeNull();
  });

  it('exports the current palette from the top bar menu', async () => {
    await renderWithProviders(<DesktopWorkspace />);
    await fireEvent.press(screen.getByTestId('share-button'), pressAt);
    await fireEvent.press(within(screen.getByTestId('export-menu')).getByText('Adobe ASE'));
    expect(exportPalette).toHaveBeenCalledWith('ase', ANALOGOUS_RED, 'Colorixer palette');
  });

  it('exports a saved palette from its menu', async () => {
    await renderWithProviders(<DesktopWorkspace />);
    await savePalette();
    await fireEvent.press(screen.getByTestId('palette-more-Palette 1'), pressAt);
    await fireEvent.press(screen.getByText('Export to Procreate'));
    expect(exportPalette).toHaveBeenCalledWith('swatches', ANALOGOUS_RED, 'Palette 1');
  });

  it('deletes a saved palette from its menu', async () => {
    await renderWithProviders(<DesktopWorkspace />);
    await savePalette();
    await fireEvent.press(screen.getByTestId('palette-more-Palette 1'), pressAt);
    await fireEvent.press(screen.getByText('Delete palette'));
    expect(screen.getByText('Deleted “Palette 1”')).toBeOnTheScreen();
    expect(screen.queryByTestId('palette-Palette 1')).toBeNull();
    expect(screen.getByText('Saved palettes show up here.')).toBeOnTheScreen();
  });

  it('copies a palette color in any format', async () => {
    await renderWithProviders(<DesktopWorkspace />);

    await fireEvent.press(screen.getByTestId('swatch-#ff8000'));
    expect(Clipboard.setStringAsync).toHaveBeenLastCalledWith('#ff8000');

    await fireEvent.press(screen.getByTestId('swatch-more-#ff8000'), pressAt);
    await fireEvent.press(screen.getByText('Copy as HSL'));
    expect(Clipboard.setStringAsync).toHaveBeenLastCalledWith('hsl(30deg 100% 50%)');
    expect(screen.getByText('Copied hsl(30deg 100% 50%)')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('swatch-more-#ff8000'), pressAt);
    await fireEvent.press(screen.getByText('Copy as HSV'));
    expect(Clipboard.setStringAsync).toHaveBeenLastCalledWith('hsv(30, 100%, 100%)');

    await fireEvent.press(screen.getByTestId('swatch-more-#ff8000'), pressAt);
    await fireEvent.press(screen.getByText('Copy as RGB'));
    expect(Clipboard.setStringAsync).toHaveBeenLastCalledWith('rgb(255 128 0)');
  });

  it('copies the base color from the inspector fields', async () => {
    await renderWithProviders(<DesktopWorkspace />);
    await fireEvent.press(screen.getByTestId('copy-hsl'));
    expect(Clipboard.setStringAsync).toHaveBeenLastCalledWith('hsl(0deg 100% 50%)');
    await fireEvent.press(screen.getByTestId('copy-rgb'));
    expect(Clipboard.setStringAsync).toHaveBeenLastCalledWith('rgb(255 0 0)');
  });
});

const OCEANO: SavedPalette = {
  id: 'p2',
  name: 'Oceano',
  harmony: 'complementary',
  base: '#0077b6',
  createdAt: '2026-11-09T10:00:00.000Z',
};

describe('Desktop workspace controls', () => {
  it('switches the harmony from the sidebar', async () => {
    await renderWithProviders(<DesktopWorkspace />);
    await fireEvent.press(screen.getByTestId('harmony-triadic'));
    expect(screen.getByText('Palette · Triadic')).toBeOnTheScreen();
    expect(screen.getByTestId('swatch-#00ff00')).toBeOnTheScreen();
  });

  it('opens a saved palette from the sidebar', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([OCEANO]));
    await renderWithProviders(<DesktopWorkspace />);
    await fireEvent.press(screen.getByTestId('palette-Oceano'));
    expect(screen.getByText('Palette · Complementary')).toBeOnTheScreen();
    expect(screen.getByTestId('swatch-#b63f00')).toBeOnTheScreen();
    expect(screen.getByText('Saved')).toBeOnTheScreen();
  });

  it('picks the base color on the wheel and its sliders', async () => {
    await renderWithProviders(<DesktopWorkspace />);
    await touchWheel(screen.getByTestId('color-wheel'), 0, 0);
    expect(screen.getByTestId('swatch-#0040ff')).toBeOnTheScreen();
    await setChannel(screen.getByTestId('value-s'), '50');
    await setChannel(screen.getByTestId('value-v'), '50');
    expect(screen.getByText('hsv(225, 50%, 50%)')).toBeOnTheScreen();
    expect(screen.getAllByText('#405080').length).toBeGreaterThan(0);
  });

  it('exports from the inspector', async () => {
    await renderWithProviders(<DesktopWorkspace />);
    await fireEvent.press(screen.getByText('Procreate'));
    expect(exportPalette).toHaveBeenCalledWith('swatches', ANALOGOUS_RED, 'Colorixer palette');
  });

  it('copies a palette color as HEX from its menu', async () => {
    await renderWithProviders(<DesktopWorkspace />);
    await fireEvent.press(screen.getByTestId('swatch-more-#ff8000'), pressAt);
    await fireEvent.press(screen.getByText('Copy as HEX'));
    expect(Clipboard.setStringAsync).toHaveBeenLastCalledWith('#ff8000');
  });
});
