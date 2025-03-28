import type { HSL } from '../colorUtils';
import { hslToRgb, rgbToHex } from '../colorUtils';

export function getTriadicColors(baseColor: HSL): string[] {
  // Triadic colors are evenly spaced around the color wheel (120 degrees apart)
  const color1 = baseColor;
  const color2: HSL = {
    h: (baseColor.h + 120) % 360,
    s: baseColor.s,
    l: baseColor.l
  };
  const color3: HSL = {
    h: (baseColor.h + 240) % 360,
    s: baseColor.s,
    l: baseColor.l
  };

  return [
    rgbToHex(hslToRgb(color1)),
    rgbToHex(hslToRgb(color2)),
    rgbToHex(hslToRgb(color3))
  ];
}
