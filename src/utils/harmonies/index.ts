import type { HSL, ColorHarmonyType } from '../colorUtils';

import { getAnalogousColors } from './analogous';
import { getComplementaryColors } from './complementary';
import { getMonochromaticColors } from './monochromatic';
import { getTetratriadic } from './tetratriadic';
import { getTriadicColors } from './triadic';

export {
  getAnalogousColors,
  getTriadicColors,
  getTetratriadic,
  getComplementaryColors,
  getMonochromaticColors,
};

export function getHarmonyColors(harmonyType: ColorHarmonyType, baseColor: HSL): string[] {
  switch (harmonyType) {
    case 'analogous':
      return getAnalogousColors(baseColor);
    case 'triadic':
      return getTriadicColors(baseColor);
    case 'tetratriadic':
      return getTetratriadic(baseColor);
    case 'complementary':
      return getComplementaryColors(baseColor);
    case 'monochromatic':
      return getMonochromaticColors(baseColor);
    default:
      return [];
  }
}
