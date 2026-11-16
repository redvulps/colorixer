import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';

import { imageFlowTiming } from '../../components/ui/ImagePaletteView';
import { renderWithProviders } from '../../testing/renderWithProviders';
import type { Pixels } from '../../utils/extract';
import { readPixels } from '../../utils/imagePixels';
import { ColorScreen } from '../ColorScreen';

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
}));
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

/** Lets the source sheet close and the picker answer */
const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

const PHOTO = {
  canceled: false,
  assets: [{ uri: 'file:///photo.jpg', width: 800, height: 500, fileName: 'photo.jpg' }],
} as ImagePicker.ImagePickerResult;

beforeEach(async () => {
  imageFlowTiming.sheetCloseMs = 0;
  await AsyncStorage.clear();
  jest.clearAllMocks();
  jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue(PHOTO);
  jest.mocked(ImagePicker.launchCameraAsync).mockResolvedValue({
    ...PHOTO,
    assets: [{ ...PHOTO.assets![0], uri: 'file:///camera.jpg', fileName: 'camera.jpg' }],
  } as ImagePicker.ImagePickerResult);
  jest
    .mocked(ImagePicker.requestCameraPermissionsAsync)
    .mockResolvedValue({ granted: true } as ImagePicker.CameraPermissionResponse);
  jest.mocked(readPixels).mockResolvedValue(stripes());
});

describe('Palette from an image', () => {
  it('asks for the gallery or the camera, then shows the colors of the photo', async () => {
    await renderWithProviders(<ColorScreen />);
    await fireEvent.press(screen.getByTestId('image-button'));
    expect(screen.getByText('Take colors from a photo')).toBeOnTheScreen();
    expect(screen.queryByTestId('image-palette')).toBeNull();

    await fireEvent.press(screen.getByText('From gallery'));
    await settle();
    await waitFor(() => expect(screen.getByText('photo.jpg · 5 colors')).toBeOnTheScreen());
    expect(readPixels).toHaveBeenCalledWith('file:///photo.jpg', 800, 500);
    const view = within(screen.getByTestId('image-palette'));
    expect(view.getByText('#e63946')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('mood-dark'));
    expect(view.getByText('#1d3557')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('use-palette'));
    await waitFor(() => expect(screen.getByText('Image · Dark')).toBeOnTheScreen());
    expect(screen.queryByTestId('image-palette')).toBeNull();
    expect(screen.getByText('Palette from photo.jpg')).toBeOnTheScreen();
    expect(
      within(screen.getByTestId('generated-colors')).getByTestId('swatch-#1d3557'),
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('save-button'));
    expect(screen.getByText('Palette 1 · Image · Dark')).toBeOnTheScreen();
  });

  it('takes a new photo with the camera from the open view', async () => {
    await renderWithProviders(<ColorScreen />);
    await fireEvent.press(screen.getByTestId('image-button'));
    await fireEvent.press(screen.getByText('From gallery'));
    await settle();
    await waitFor(() => expect(screen.getByText('photo.jpg · 5 colors')).toBeOnTheScreen());

    await fireEvent.press(screen.getByTestId('choose-image'));
    await fireEvent.press(screen.getByText('From camera'));
    await settle();
    await waitFor(() => expect(screen.getByText('Camera photo · 5 colors')).toBeOnTheScreen());
    expect(ImagePicker.requestCameraPermissionsAsync).toHaveBeenCalled();
    expect(readPixels).toHaveBeenLastCalledWith('file:///camera.jpg', 800, 500);
  });

  it('says so when the camera is not allowed', async () => {
    jest
      .mocked(ImagePicker.requestCameraPermissionsAsync)
      .mockResolvedValue({ granted: false } as ImagePicker.CameraPermissionResponse);
    await renderWithProviders(<ColorScreen />);
    await fireEvent.press(screen.getByTestId('image-button'));
    await fireEvent.press(screen.getByText('From camera'));
    await settle();
    await waitFor(() => expect(screen.getByText(/no access to the camera/)).toBeOnTheScreen());
    expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled();
    expect(screen.queryByTestId('image-palette')).toBeNull();
  });

  it('opens nothing when the picker is cancelled', async () => {
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({
      canceled: true,
      assets: null,
    } as ImagePicker.ImagePickerResult);
    await renderWithProviders(<ColorScreen />);
    await fireEvent.press(screen.getByTestId('image-button'));
    await fireEvent.press(screen.getByText('From gallery'));
    await settle();
    await waitFor(() => expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled());
    expect(readPixels).not.toHaveBeenCalled();
    expect(screen.queryByTestId('image-palette')).toBeNull();
  });
});
