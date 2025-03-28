import type { HSL } from '../colorUtils';
import { hslToRgb, rgbToHex } from '../colorUtils';

export function getComplementaryColors(baseColor: HSL): string[] {
  // Complementary color is opposite on the color wheel (180 degrees)
  const complementary: HSL = {
    h: (baseColor.h + 180) % 360,
    s: baseColor.s,
    l: baseColor.l
  };

  return [
    rgbToHex(hslToRgb(baseColor)),
    rgbToHex(hslToRgb(complementary))
  ];
}
