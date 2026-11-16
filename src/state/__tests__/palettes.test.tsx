import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

import {
  PaletteProvider,
  type SavedPalette,
  SLIDER_MODE_KEY,
  STORAGE_KEY,
  usePalette,
} from '../palettes';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <PaletteProvider>{children}</PaletteProvider>
);

async function renderStore() {
  const hook = await renderHook(() => usePalette(), { wrapper });
  // Let the provider read the (empty) storage first
  await act(async () => {});
  return hook;
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('palette store', () => {
  it('starts with the analogous palette of red', async () => {
    const { result } = await renderStore();
    expect(result.current.base).toBe('#ff0000');
    expect(result.current.harmony).toBe('analogous');
    expect(result.current.colors).toEqual(['#ff0000', '#ff002d', '#ff2600', '#ff006d', '#ff4d00']);
    expect(result.current.current).toBeNull();
  });

  it('names saved palettes in order and opens the newest', async () => {
    const { result } = await renderStore();

    await act(async () => result.current.setHarmony('square'));
    let first!: SavedPalette;
    await act(async () => {
      first = result.current.save();
    });
    expect(first).toMatchObject({ name: 'Palette 1', harmony: 'square', base: '#ff0000' });
    expect(result.current.current?.id).toBe(first.id);

    // Any change leaves the saved palette
    await act(async () => result.current.setHarmony('triadic'));
    expect(result.current.current).toBeNull();

    await act(async () => {
      result.current.save();
    });
    expect(result.current.saved.map((p) => p.name)).toEqual(['Palette 2', 'Palette 1']);
  });

  it('opens a saved palette back in the editor', async () => {
    const { result } = await renderStore();

    await act(async () => result.current.setHsv([120, 1, 0.5]));
    await act(async () => result.current.setHarmony('complementary'));
    let saved!: SavedPalette;
    await act(async () => {
      saved = result.current.save();
    });

    await act(async () => result.current.setHsv([0, 1, 1]));
    await act(async () => result.current.setHarmony('analogous'));
    await act(async () => {
      result.current.load(saved.id);
    });

    expect(result.current.base).toBe('#008000');
    expect(result.current.harmony).toBe('complementary');
    expect(result.current.colors).toEqual(['#008000', '#80000c', '#104010', '#d54754', '#80ff80']);
    expect(result.current.current?.name).toBe('Palette 1');
  });

  it('deletes a palette and closes it in the editor', async () => {
    const { result } = await renderStore();
    let saved!: SavedPalette;
    await act(async () => {
      saved = result.current.save();
    });

    await act(async () => result.current.remove(saved.id));

    expect(result.current.saved).toEqual([]);
    expect(result.current.current).toBeNull();
  });

  it('stores the slider mode and reads it on the next start', async () => {
    const first = await renderStore();
    expect(first.result.current.sliderMode).toBe('hsv');
    await act(async () => first.result.current.setSliderMode('hsl'));
    expect(first.result.current.sliderMode).toBe('hsl');
    await waitFor(async () => expect(await AsyncStorage.getItem(SLIDER_MODE_KEY)).toBe('hsl'));
    await first.unmount();

    const second = await renderStore();
    await waitFor(() => expect(second.result.current.sliderMode).toBe('hsl'));
  });

  it('keeps the colors of palettes saved by the first versions', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: 'old',
          name: 'Antiga',
          harmony: 'tetratriadic',
          base: '#ff0000',
          createdAt: '2026-10-01T10:00:00.000Z',
        },
      ]),
    );
    const { result } = await renderStore();
    await waitFor(() => expect(result.current.saved).toHaveLength(1));
    const [old] = result.current.saved;
    expect(old.harmony).toBe('square');
    expect(old.colors).toEqual(['#ff0000', '#80ff00', '#00ffff', '#7f00ff']);

    // Open, it shows the colors it was saved with; any change goes back to the rules
    await act(async () => {
      result.current.load('old');
    });
    expect(result.current.colors).toEqual(['#ff0000', '#80ff00', '#00ffff', '#7f00ff']);
    await act(async () => result.current.setHsv([0, 1, 0.9]));
    expect(result.current.colors).toHaveLength(5);
  });

  it('stores saved palettes and reads them on the next start', async () => {
    const first = await renderStore();
    await act(async () => {
      first.result.current.save();
    });
    await waitFor(async () => {
      const stored = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) ?? '[]');
      expect(stored).toHaveLength(1);
    });
    await first.unmount();

    const second = await renderStore();
    await waitFor(() =>
      expect(second.result.current.saved.map((p) => p.name)).toEqual(['Palette 1']),
    );
  });
});
