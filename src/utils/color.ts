import chroma from 'chroma-js';

import type { ColorHarmonyType } from './colorUtils';
import { getHarmonyColors } from './harmonies';

import { t } from '@/src/i18n';

/** HSV with hue in degrees (0-360) and saturation/value as fractions (0-1) */
export type Hsv = [h: number, s: number, v: number];

const HARMONY_KEYS: ColorHarmonyType[] = [
  'analogous',
  'complementary',
  'splitComplementary',
  'triadic',
  'square',
  'compound',
  'shades',
  'monochromatic',
];

/** Harmonies in the order they are offered, with their names in the current language */
export const HARMONIES: { key: ColorHarmonyType; readonly label: string }[] = HARMONY_KEYS.map(
  (key) => ({
    key,
    get label() {
      return t(`harmony.${key}`);
    },
  }),
);

export function harmonyLabel(harmony: ColorHarmonyType): string {
  return t(`harmony.${harmony}`);
}

export function hsvToHex([h, s, v]: Hsv): string {
  return chroma.hsv(h, s, v).hex();
}

export function hexToHsv(hex: string): Hsv {
  const [h, s, v] = chroma(hex).hsv();
  // Greys have no hue: chroma returns NaN
  return [Number.isNaN(h) ? 0 : h, s, v];
}

/** HSL with hue in degrees (0-360) and saturation/lightness as fractions (0-1) */
export type Hsl = [h: number, s: number, l: number];

const unit = (n: number) => Math.min(Math.max(n, 0), 1);

/**
 * HSV to HSL by formula, so the hue never goes through RGB and survives greys. Black keeps the
 * saturation its HSV saturation tends to; white has none (0), so callers that need one keep it.
 */
export function hsvToHsl([h, s, v]: Hsv): Hsl {
  const l = v * (1 - s / 2);
  const m = Math.min(l, 1 - l);
  return [h, m > 0 ? unit((v - l) / m) : l === 0 ? s / (2 - s) : 0, l];
}

/** HSL to HSV by formula; black keeps its saturation, so it comes back from black */
export function hslToHsv([h, s, l]: Hsl): Hsv {
  const v = l + s * Math.min(l, 1 - l);
  return [h, v > 0 ? unit(2 * (1 - l / v)) : (2 * s) / (1 + s), v];
}

export function hslToHex([h, s, l]: Hsl): string {
  return chroma.hsl(h, s, l).hex();
}

/** Five colors of a harmony built from a base color, on the RYB wheel; the base comes first */
export function harmonyColors(harmony: ColorHarmonyType, base: string): string[] {
  return getHarmonyColors(harmony, base);
}

/** e.g. rgb(255 128 0) */
export function rgbString(hex: string): string {
  const [r, g, b] = chroma(hex).rgb();
  return `rgb(${r} ${g} ${b})`;
}

/** e.g. hsl(30deg 100% 50%), rounded to whole units */
export function hslString(hex: string): string {
  const [h, s, l] = chroma(hex).hsl();
  return `hsl(${Math.round(Number.isNaN(h) ? 0 : h)}deg ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;
}

/** e.g. hsv(0, 100%, 100%) */
export function hsvString(hex: string): string {
  const [h, s, v] = hexToHsv(hex);
  return `hsv(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(v * 100)}%)`;
}

/** Text color that stays readable on top of a swatch */
export function inkOn(hex: string): string {
  return chroma(hex).luminance() > 0.3 ? '#111318' : '#FFFFFF';
}
