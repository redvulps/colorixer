import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, screen } from '@testing-library/react-native';
import React from 'react';

import { exportPalette } from '../../hooks/usePaletteActions';
import { type SavedPalette, STORAGE_KEY } from '../../state/palettes';
import { renderWithProviders } from '../../testing/renderWithProviders';
import { PalettesScreen } from '../PalettesScreen';

const mockNavigate = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ navigate: mockNavigate }) }));
jest.mock('../../hooks/usePaletteActions', () => ({
  ...jest.requireActual('../../hooks/usePaletteActions'),
  exportPalette: jest.fn(() => Promise.resolve()),
}));

const SAVED: SavedPalette[] = [
  {
    id: 'p2',
    name: 'Oceano',
    harmony: 'complementary',
    base: '#0077b6',
    createdAt: '2026-11-09T10:00:00.000Z',
  },
  {
    id: 'p1',
    name: 'Pôr do sol',
    harmony: 'analogous',
    base: '#ff6a00',
    createdAt: '2026-11-12T10:00:00.000Z',
  },
];

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe('Palettes tab', () => {
  it('explains how to save when there are no palettes', async () => {
    await renderWithProviders(<PalettesScreen />);
    expect(screen.getByText('No saved palettes')).toBeOnTheScreen();
    expect(screen.getByText('0 saved')).toBeOnTheScreen();
  });

  describe('with saved palettes', () => {
    beforeEach(async () => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(SAVED));
    });

    it('lists them with their harmony and size', async () => {
      await renderWithProviders(<PalettesScreen />);
      expect(screen.getByText('2 saved')).toBeOnTheScreen();
      expect(screen.getByText('Oceano')).toBeOnTheScreen();
      expect(screen.getByText(/Complementary · 2 colors/)).toBeOnTheScreen();
      expect(screen.getByText(/Analogous · 5 colors/)).toBeOnTheScreen();
    });

    it('opens a palette in the Color tab', async () => {
      await renderWithProviders(<PalettesScreen />);
      await fireEvent.press(screen.getByTestId('palette-Oceano'));
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('exports a palette from its sheet', async () => {
      await renderWithProviders(<PalettesScreen />);
      await fireEvent.press(screen.getByTestId('palette-more-Oceano'));
      await fireEvent.press(screen.getByText('Export to Procreate'));
      expect(exportPalette).toHaveBeenCalledWith('swatches', ['#0077b6', '#b63f00'], 'Oceano');
    });

    it('deletes a palette from its sheet', async () => {
      await renderWithProviders(<PalettesScreen />);
      await fireEvent.press(screen.getByTestId('palette-more-Oceano'));
      await fireEvent.press(screen.getByText('Delete palette'));
      expect(screen.getByText('Deleted “Oceano”')).toBeOnTheScreen();
      expect(screen.queryByTestId('palette-Oceano')).toBeNull();
      expect(screen.getByText('1 saved')).toBeOnTheScreen();
    });
  });
});
