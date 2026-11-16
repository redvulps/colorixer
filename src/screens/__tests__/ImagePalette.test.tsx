import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, screen, waitFor, within } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';

import { renderWithProviders } from '../../testing/renderWithProviders';
import type { Pixels } from '../../utils/extract';
import { readPixels } from '../../utils/imagePixels';
import { ColorScreen } from '../ColorScreen';

jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('../../utils/imagePixels', () => ({ readPixels: jest.fn() }));

const STRIPES = [
  '#e63946',
  '#f1faee',
  '#a8dadc',
  '#457b9d',
  '#1d3557',
  '#ffb703',
  '#2a9d8f',
  '#6d6875',
];

function stripes(width = 10, height = 20): Pixels {
  const w = STRIPES.length * width;
  const data = new Uint8Array(w * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < w; x++) {
      const hex = STRIPES[Math.floor(x / width)];
      data.set(
        [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)),
        (y * w + x) * 3,
      );
    }
  }
  return { data, width: w, height };
}

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file:///photo.jpg', width: 800, height: 500, fileName: 'photo.jpg' }],
  } as ImagePicker.ImagePickerResult);
  jest.mocked(readPixels).mockResolvedValue(stripes());
});

describe('Palette from an image', () => {
  it('takes the colors of a photo in a mood and brings them to the Color tab', async () => {
    await renderWithProviders(<ColorScreen />);
    await fireEvent.press(screen.getByTestId('image-button'));
    expect(screen.getByText('Choose a photo to take its colors')).toBeOnTheScreen();
    expect(screen.getByTestId('use-palette')).toBeDisabled();

    await fireEvent.press(screen.getByTestId('choose-image'));
    await waitFor(() => expect(screen.getByText('photo.jpg · 5 colors')).toBeOnTheScreen());
    expect(readPixels).toHaveBeenCalledWith('file:///photo.jpg', 800, 500);
    const sheet = within(screen.getByTestId('image-palette'));
    expect(sheet.getByText('#e63946')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('mood-dark'));
    expect(sheet.getByText('#1d3557')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('use-palette'));
    await waitFor(() => expect(screen.getByText('Image · Dark')).toBeOnTheScreen());
    expect(screen.getByText('Palette from photo.jpg')).toBeOnTheScreen();
    expect(
      within(screen.getByTestId('generated-colors')).getByTestId('swatch-#1d3557'),
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('save-button'));
    expect(screen.getByText('Palette 1 · Image · Dark')).toBeOnTheScreen();
  });

  it('keeps the view as it was when the picker is cancelled', async () => {
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({
      canceled: true,
      assets: null,
    } as ImagePicker.ImagePickerResult);
    await renderWithProviders(<ColorScreen />);
    await fireEvent.press(screen.getByTestId('image-button'));
    await fireEvent.press(screen.getByTestId('choose-image'));
    expect(readPixels).not.toHaveBeenCalled();
    expect(screen.getByText('No photo yet')).toBeOnTheScreen();
  });
});
