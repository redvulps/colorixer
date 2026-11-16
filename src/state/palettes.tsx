import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';

import { harmonyColors, hexToHsv, type Hsv, hsvToHex } from '@/src/utils/color';
import type { ColorHarmonyType } from '@/src/utils/colorUtils';
import { type LegacyHarmony, legacyHarmonyColors } from '@/src/utils/harmonies/legacy';

export const STORAGE_KEY = 'colorixer:palettes:v1';
export const SLIDER_MODE_KEY = 'colorixer:slider-mode:v1';

/** Channels the sliders edit: hue, saturation and value, or hue, saturation and lightness */
export type SliderMode = 'hsv' | 'hsl';

export interface SavedPalette {
  id: string;
  name: string;
  harmony: ColorHarmonyType;
  /** Base color as hex */
  base: string;
  /** Colors as saved, base first; the rules that made them may have changed since */
  colors: string[];
  /** ISO date */
  createdAt: string;
}

interface State {
  hsv: Hsv;
  harmony: ColorHarmonyType;
  sliderMode: SliderMode;
  /** Saved palette open in the editor, until the color or harmony changes */
  currentId: string | null;
  saved: SavedPalette[];
  hydrated: boolean;
}

type Action =
  | { type: 'setHsv'; hsv: Hsv }
  | { type: 'setHarmony'; harmony: ColorHarmonyType }
  | { type: 'setSliderMode'; mode: SliderMode }
  | { type: 'save'; palette: SavedPalette }
  | { type: 'load'; id: string }
  | { type: 'remove'; id: string }
  | { type: 'hydrate'; saved: SavedPalette[] };

const initialState: State = {
  hsv: [0, 1, 1],
  harmony: 'analogous',
  sliderMode: 'hsv',
  currentId: null,
  saved: [],
  hydrated: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'setHsv':
      return { ...state, hsv: action.hsv, currentId: null };
    case 'setHarmony':
      return action.harmony === state.harmony
        ? state
        : { ...state, harmony: action.harmony, currentId: null };
    case 'setSliderMode':
      return { ...state, sliderMode: action.mode };
    case 'save':
      return { ...state, saved: [action.palette, ...state.saved], currentId: action.palette.id };
    case 'load': {
      const palette = state.saved.find((p) => p.id === action.id);
      if (!palette) return state;
      return {
        ...state,
        hsv: hexToHsv(palette.base),
        harmony: palette.harmony,
        currentId: palette.id,
      };
    }
    case 'remove':
      return {
        ...state,
        saved: state.saved.filter((p) => p.id !== action.id),
        currentId: state.currentId === action.id ? null : state.currentId,
      };
    case 'hydrate':
      // Keep palettes saved before storage answered
      return { ...state, saved: [...state.saved, ...action.saved], hydrated: true };
  }
}

/** A palette as stored by the first versions: no colors, and Square was called tetratriadic */
type StoredPalette = Omit<SavedPalette, 'colors' | 'harmony'> & {
  harmony: ColorHarmonyType | 'tetratriadic';
  colors?: string[];
};

/** Brings a stored palette up to date, keeping the colors it was saved with */
export function migratePalette(stored: StoredPalette): SavedPalette {
  if (stored.colors) return stored as SavedPalette;
  return {
    ...stored,
    harmony: stored.harmony === 'tetratriadic' ? 'square' : stored.harmony,
    colors: legacyHarmonyColors(stored.harmony as LegacyHarmony, stored.base),
  };
}

/** Next free "Palette N" name */
function nextName(saved: SavedPalette[]): string {
  const used = saved
    .map((p) => /^Palette (\d+)$/.exec(p.name)?.[1])
    .filter((n): n is string => !!n)
    .map(Number);
  return `Palette ${Math.max(saved.length, ...used) + 1}`;
}

function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

interface PaletteContextValue {
  hsv: Hsv;
  harmony: ColorHarmonyType;
  sliderMode: SliderMode;
  /** Base color as hex */
  base: string;
  /** Harmony colors, base first */
  colors: string[];
  /** Saved palette open in the editor, if unchanged */
  current: SavedPalette | null;
  saved: SavedPalette[];
  setHsv: (hsv: Hsv) => void;
  setHarmony: (harmony: ColorHarmonyType) => void;
  setSliderMode: (mode: SliderMode) => void;
  save: () => SavedPalette;
  load: (id: string) => SavedPalette | null;
  remove: (id: string) => void;
}

const PaletteContext = createContext<PaletteContextValue | null>(null);

export function PaletteProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) =>
        dispatch({
          type: 'hydrate',
          saved: raw ? (JSON.parse(raw) as StoredPalette[]).map(migratePalette) : [],
        }),
      )
      .catch((error) => {
        console.warn('Could not read saved palettes:', error);
        dispatch({ type: 'hydrate', saved: [] });
      });
  }, []);

  // A mode picked before storage answers wins over the stored one
  const modePicked = useRef(false);
  useEffect(() => {
    AsyncStorage.getItem(SLIDER_MODE_KEY)
      .then((mode) => {
        if (!modePicked.current && (mode === 'hsv' || mode === 'hsl')) {
          dispatch({ type: 'setSliderMode', mode });
        }
      })
      .catch((error) => console.warn('Could not read the slider mode:', error));
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.saved)).catch((error) =>
      console.warn('Could not store saved palettes:', error),
    );
  }, [state.saved, state.hydrated]);

  const base = hsvToHex(state.hsv);
  const current = state.saved.find((p) => p.id === state.currentId) ?? null;
  // An open saved palette shows the colors it was saved with
  const computed = useMemo(() => harmonyColors(state.harmony, base), [state.harmony, base]);
  const colors = current?.colors ?? computed;

  const setHsv = useCallback((hsv: Hsv) => dispatch({ type: 'setHsv', hsv }), []);
  const setHarmony = useCallback(
    (harmony: ColorHarmonyType) => dispatch({ type: 'setHarmony', harmony }),
    [],
  );
  const setSliderMode = useCallback((mode: SliderMode) => {
    modePicked.current = true;
    dispatch({ type: 'setSliderMode', mode });
    AsyncStorage.setItem(SLIDER_MODE_KEY, mode).catch((error) =>
      console.warn('Could not store the slider mode:', error),
    );
  }, []);
  const save = useCallback(() => {
    const palette: SavedPalette = {
      id: newId(),
      name: nextName(state.saved),
      harmony: state.harmony,
      base,
      colors,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'save', palette });
    return palette;
  }, [state.saved, state.harmony, base, colors]);
  const load = useCallback(
    (id: string) => {
      dispatch({ type: 'load', id });
      return state.saved.find((p) => p.id === id) ?? null;
    },
    [state.saved],
  );
  const remove = useCallback((id: string) => dispatch({ type: 'remove', id }), []);

  const value = useMemo<PaletteContextValue>(
    () => ({
      hsv: state.hsv,
      harmony: state.harmony,
      sliderMode: state.sliderMode,
      base,
      colors,
      current,
      saved: state.saved,
      setHsv,
      setHarmony,
      setSliderMode,
      save,
      load,
      remove,
    }),
    [
      state.hsv,
      state.harmony,
      state.sliderMode,
      state.saved,
      base,
      colors,
      current,
      setHsv,
      setHarmony,
      setSliderMode,
      save,
      load,
      remove,
    ],
  );

  return <PaletteContext.Provider value={value}>{children}</PaletteContext.Provider>;
}

export function usePalette(): PaletteContextValue {
  const value = useContext(PaletteContext);
  if (!value) throw new Error('usePalette must be used inside <PaletteProvider>');
  return value;
}

/** Colors of a saved palette */
export function paletteColors(palette: SavedPalette): string[] {
  return palette.colors;
}

/** e.g. Nov 12 */
export function formatPaletteDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
