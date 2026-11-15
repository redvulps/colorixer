import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, screen, within } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import React from 'react';

import { exportPalette } from '../../hooks/usePaletteActions';
import { type SavedPalette, STORAGE_KEY } from '../../state/palettes';
import { pressAt, renderWithProviders } from '../../testing/renderWithProviders';
import { TabletWorkspace } from '../TabletWorkspace';

jest.mock('../../hooks/usePaletteActions', () => ({
  ...jest.requireActual('../../hooks/usePaletteActions'),
  exportPalette: jest.fn(() => Promise.resolve()),
}));

const ANALOGOUS_RED = ['#ff0000', '#ff8000', '#ff0080', '#ffff00', '#ff00ff'];

const OCEANO: SavedPalette = {
  id: 'p2',
  name: 'Oceano',
  harmony: 'complementary',
  base: '#0077b6',
  createdAt: '2026-11-09T10:00:00.000Z',
};

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe('Tablet workspace', () => {
  it('shows the palette along the bottom, with each hex inside its color', async () => {
    await renderWithProviders(<TabletWorkspace />);
    const band = screen.getByTestId('generated-colors');
    for (const hex of ANALOGOUS_RED) {
      expect(within(band).getByText(hex)).toBeOnTheScreen();
    }
    expect(screen.getByText('Analogous · 5 colors')).toBeOnTheScreen();
  });

  it('copies a color when it is tapped in the band', async () => {
    await renderWithProviders(<TabletWorkspace />);
    await fireEvent.press(screen.getByTestId('swatch-#ff8000'));
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('#ff8000');
  });

  it('switches the harmony from the controls column', async () => {
    await renderWithProviders(<TabletWorkspace />);
    await fireEvent.press(screen.getByText('Triadic'));
    expect(screen.getByText('Triadic · 3 colors')).toBeOnTheScreen();
  });

  it('opens a saved palette from Palettes and goes back to Color', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([OCEANO]));
    await renderWithProviders(<TabletWorkspace />);
    await fireEvent.press(screen.getByTestId('view-palettes'));
    expect(screen.queryByTestId('generated-colors')).toBeNull();
    await fireEvent.press(screen.getByTestId('palette-Oceano'));
    expect(screen.getByText('Oceano · Complementary · 2 colors')).toBeOnTheScreen();
  });

  it('shows the palette in full screen from its button', async () => {
    await renderWithProviders(<TabletWorkspace />);
    await fireEvent.press(screen.getByTestId('fullscreen-button'));
    expect(await screen.findByTestId('palette-fullscreen')).toBeOnTheScreen();
  });

  it('exports the current palette from the top bar menu', async () => {
    await renderWithProviders(<TabletWorkspace />);
    await fireEvent.press(screen.getByTestId('share-button'), pressAt);
    await fireEvent.press(within(screen.getByTestId('export-menu')).getByText('Adobe ASE'));
    expect(exportPalette).toHaveBeenCalledWith('ase', ANALOGOUS_RED, 'Colorixer palette');
  });
});
