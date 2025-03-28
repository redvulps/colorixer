import type { HSL } from '../colorUtils';
import { hslToRgb, rgbToHex } from '../colorUtils';

export function getMonochromaticColors(baseColor: HSL, count: number = 5): string[] {
  const colors: string[] = [];

  // Create variations with different lightness levels
  const step = 70 / (count - 1); // Range from 15% to 85% lightness

  for (let i = 0; i < count; i++) {
    const lightness = 15 + step * i;

    const color: HSL = {
      h: baseColor.h,
      s: baseColor.s,
      l: lightness
    };

    colors.push(rgbToHex(hslToRgb(color)));
  }

  return colors;
}
