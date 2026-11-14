import chroma from 'chroma-js';

import type { ColorHarmonyType } from './colorUtils';
import { getHarmonyColors } from './harmonies';

/** HSV with hue in degrees (0-360) and saturation/value as fractions (0-1) */
export type Hsv = [h: number, s: number, v: number];

export const HARMONIES: { key: ColorHarmonyType; label: string }[] = [
  { key: 'analogous', label: 'Analogous' },
  { key: 'triadic', label: 'Triadic' },
  { key: 'tetratriadic', label: 'Tetratriadic' },
  { key: 'complementary', label: 'Complementary' },
  { key: 'monochromatic', label: 'Monochromatic' },
];

export function harmonyLabel(harmony: ColorHarmonyType): string {
  return HARMONIES.find((h) => h.key === harmony)?.label ?? harmony;
}

export function hsvToHex([h, s, v]: Hsv): string {
  return chroma.hsv(h, s, v).hex();
}

export function hexToHsv(hex: string): Hsv {
  const [h, s, v] = chroma(hex).hsv();
  // Greys have no hue: chroma returns NaN
  return [Number.isNaN(h) ? 0 : h, s, v];
}

/** Colors of a harmony built from a base color; the base comes first */
export function harmonyColors(harmony: ColorHarmonyType, base: string): string[] {
  const [h, s, l] = chroma(base).hsl();
  return getHarmonyColors(harmony, { h: Number.isNaN(h) ? 0 : h, s, l });
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
