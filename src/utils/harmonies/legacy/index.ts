import chroma from 'chroma-js';

import { getAnalogousColors } from './analogous';
import { getComplementaryColors } from './complementary';
import { getMonochromaticColors } from './monochromatic';
import { getTetratriadic } from './tetratriadic';
import { getTriadicColors } from './triadic';

/** Harmonies of the first versions, which turned hues on the RGB wheel */
export type LegacyHarmony =
  'analogous' | 'triadic' | 'tetratriadic' | 'complementary' | 'monochromatic';

/**
 * Colors the first versions gave a saved palette. Palettes saved back then stored only the base
 * and the harmony, so these colors are worked out once when they are read, and kept from then on.
 */
export function legacyHarmonyColors(harmony: LegacyHarmony, base: string): string[] {
  const [h, s, l] = chroma(base).hsl();
  const hsl = { h: Number.isNaN(h) ? 0 : h, s, l };
  switch (harmony) {
    case 'analogous':
      return getAnalogousColors(hsl);
    case 'triadic':
      return getTriadicColors(hsl);
    case 'tetratriadic':
      return getTetratriadic(hsl);
    case 'complementary':
      return getComplementaryColors(hsl);
    case 'monochromatic':
      return getMonochromaticColors(hsl);
  }
}
