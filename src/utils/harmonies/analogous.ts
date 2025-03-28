import type { HSL } from '../colorUtils';
import { hslToRgb, rgbToHex } from '../colorUtils';

export function getAnalogousColors(baseColor: HSL, count: number = 5): string[] {
  const colors: string[] = [];
  const step = 30; // Degrees to step for analogous colors

  // Include base color
  colors.push(rgbToHex(hslToRgb(baseColor)));

  // Calculate analogous colors
  for (let i = 1; i <= Math.floor((count - 1) / 2); i++) {
    // Colors clockwise
    const color1: HSL = {
      h: (baseColor.h + step * i) % 360,
      s: baseColor.s,
      l: baseColor.l
    };

    // Colors counter-clockwise
    const color2: HSL = {
      h: (baseColor.h - step * i + 360) % 360,
      s: baseColor.s,
      l: baseColor.l
    };

    colors.push(rgbToHex(hslToRgb(color1)));

    if (colors.length < count) {
      colors.push(rgbToHex(hslToRgb(color2)));
    }
  }

  return colors;
}
