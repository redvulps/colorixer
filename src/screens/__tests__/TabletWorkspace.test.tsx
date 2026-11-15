import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, screen, waitFor, within } from '@testing-library/react-native';
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
import { TabletWorkspace, tabletToastBottom } from '../TabletWorkspace';

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

describe('Tablet workspace controls', () => {
  it('keeps toasts above the palette band and the gesture bar', () => {
    expect(tabletToastBottom(24)).toBe(52 + 132 + 24 + 16);
    // Without a bottom inset it still keeps 16 dp under the band
    expect(tabletToastBottom(0)).toBe(52 + 132 + 16 + 16);
  });

  it('saves the palette and counts it in the switch', async () => {
    await renderWithProviders(<TabletWorkspace />);
    await fireEvent.press(screen.getByTestId('save-button'));
    expect(screen.getByText('Saved “Palette 1”')).toBeOnTheScreen();
    expect(screen.getByText('Palette 1 · Analogous · 5 colors')).toBeOnTheScreen();
    expect(within(screen.getByTestId('view-palettes')).getByText('1')).toBeOnTheScreen();
  });

  it('picks the base color on the wheel and its sliders', async () => {
    await renderWithProviders(<TabletWorkspace />);
    await touchWheel(screen.getByTestId('color-wheel'), 0, 0);
    expect(within(screen.getByTestId('generated-colors')).getByText('#0040ff')).toBeOnTheScreen();
    await setChannel(screen.getByTestId('value-h'), '120');
    await setChannel(screen.getByTestId('value-s'), '50');
    await setChannel(screen.getByTestId('value-v'), '50');
    expect(screen.getByText('hsv(120, 50%, 50%)')).toBeOnTheScreen();
    expect(screen.getAllByText('#408040').length).toBeGreaterThan(0);
  });

  it('copies the base color from its fields', async () => {
    await renderWithProviders(<TabletWorkspace />);
    await fireEvent.press(screen.getByTestId('copy-hex'));
    expect(Clipboard.setStringAsync).toHaveBeenLastCalledWith('#ff0000');
    await fireEvent.press(screen.getByTestId('copy-rgb'));
    expect(Clipboard.setStringAsync).toHaveBeenLastCalledWith('rgb(255 0 0)');
    await fireEvent.press(screen.getByTestId('copy-hsl'));
    expect(Clipboard.setStringAsync).toHaveBeenLastCalledWith('hsl(0deg 100% 50%)');
    await fireEvent.press(screen.getByTestId('copy-hsv'));
    expect(Clipboard.setStringAsync).toHaveBeenLastCalledWith('hsv(0, 100%, 100%)');
  });

  it('copies other formats from the long-press sheet, and closes it with Cancel', async () => {
    await renderWithProviders(<TabletWorkspace />);
    await fireEvent(screen.getByTestId('swatch-#ff8000'), 'longPress');
    await fireEvent.press(screen.getByText('Copy as HSV'));
    expect(Clipboard.setStringAsync).toHaveBeenLastCalledWith('hsv(30, 100%, 100%)');

    await fireEvent(screen.getByTestId('swatch-#ff8000'), 'longPress');
    await fireEvent.press(screen.getByText('Copy as HEX'));
    expect(Clipboard.setStringAsync).toHaveBeenLastCalledWith('#ff8000');

    await fireEvent(screen.getByTestId('swatch-#ff8000'), 'longPress');
    await fireEvent.press(screen.getByText('Copy as HSL'));
    expect(Clipboard.setStringAsync).toHaveBeenLastCalledWith('hsl(30deg 100% 50%)');

    await fireEvent(screen.getByTestId('swatch-#ff8000'), 'longPress');
    await fireEvent.press(screen.getByText('Copy as RGB'));
    expect(Clipboard.setStringAsync).toHaveBeenLastCalledWith('rgb(255 128 0)');

    jest.mocked(Clipboard.setStringAsync).mockClear();
    await fireEvent(screen.getByTestId('swatch-#ff8000'), 'longPress');
    await fireEvent.press(within(screen.getByTestId('copy-sheet')).getByText('Cancel'));
    await waitFor(() => expect(screen.queryByText('Copy as HEX')).toBeNull());
    expect(Clipboard.setStringAsync).not.toHaveBeenCalled();
  });

  it('explains how to save when Palettes is empty, and goes back to Color', async () => {
    await renderWithProviders(<TabletWorkspace />);
    await fireEvent.press(screen.getByTestId('view-palettes'));
    expect(screen.getByText('No saved palettes')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('view-color'));
    expect(screen.getByTestId('generated-colors')).toBeOnTheScreen();
  });

  describe('with a saved palette', () => {
    beforeEach(async () => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([OCEANO]));
    });

    it('exports it from its sheet', async () => {
      await renderWithProviders(<TabletWorkspace />);
      await fireEvent.press(screen.getByTestId('view-palettes'));
      await fireEvent.press(screen.getByTestId('palette-more-Oceano'));
      await fireEvent.press(screen.getByText('Export to Procreate'));
      expect(exportPalette).toHaveBeenCalledWith('swatches', ['#0077b6', '#b63f00'], 'Oceano');
    });

    it('deletes it from its sheet', async () => {
      await renderWithProviders(<TabletWorkspace />);
      await fireEvent.press(screen.getByTestId('view-palettes'));
      await fireEvent.press(screen.getByTestId('palette-more-Oceano'));
      await fireEvent.press(screen.getByText('Delete palette'));
      expect(screen.getByText('Deleted “Oceano”')).toBeOnTheScreen();
      expect(screen.queryByTestId('palette-Oceano')).toBeNull();
      expect(screen.getByText('No saved palettes')).toBeOnTheScreen();
    });

    it('closes the sheet with Cancel and keeps it', async () => {
      await renderWithProviders(<TabletWorkspace />);
      await fireEvent.press(screen.getByTestId('view-palettes'));
      await fireEvent.press(screen.getByTestId('palette-more-Oceano'));
      await fireEvent.press(within(screen.getByTestId('palette-sheet')).getByText('Cancel'));
      await waitFor(() => expect(screen.queryByText('Delete palette')).toBeNull());
      expect(screen.getByTestId('palette-Oceano')).toBeOnTheScreen();
    });
  });
});
