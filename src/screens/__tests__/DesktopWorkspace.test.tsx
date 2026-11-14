import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, screen, within } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import React from 'react';

import { exportPalette } from '../../hooks/usePaletteActions';
import { pressAt, renderWithProviders } from '../../testing/renderWithProviders';
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
  });

  it('copies the base color from the inspector fields', async () => {
    await renderWithProviders(<DesktopWorkspace />);
    await fireEvent.press(screen.getByTestId('copy-hsl'));
    expect(Clipboard.setStringAsync).toHaveBeenLastCalledWith('hsl(0deg 100% 50%)');
  });
});
