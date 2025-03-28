import type { HSL } from '../colorUtils';
import { hslToRgb, rgbToHex } from '../colorUtils';

export function getTetratriadic(baseColor: HSL): string[] {
  // Tetratriadic colors are evenly spaced around the color wheel (90 degrees apart)
  const color1 = baseColor;
  const color2: HSL = {
    h: (baseColor.h + 90) % 360,
    s: baseColor.s,
    l: baseColor.l
  };
  const color3: HSL = {
    h: (baseColor.h + 180) % 360,
    s: baseColor.s,
    l: baseColor.l
  };
  const color4: HSL = {
    h: (baseColor.h + 270) % 360,
    s: baseColor.s,
    l: baseColor.l
  };

  return [
    rgbToHex(hslToRgb(color1)),
    rgbToHex(hslToRgb(color2)),
    rgbToHex(hslToRgb(color3)),
    rgbToHex(hslToRgb(color4))
  ];
}
