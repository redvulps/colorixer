import chroma from 'chroma-js';
import type { HSL } from '../colorUtils';

export function getTriadicColors(baseColor: HSL): string[] {
  // Triadic colors are evenly spaced around the color wheel (120 degrees apart)
  const color1 = chroma.hsl(baseColor.h, baseColor.s, baseColor.l);
  const color2 = chroma.hsl(
    (baseColor.h + 120) % 360,
    baseColor.s,
    baseColor.l
  );
  const color3 = chroma.hsl(
    (baseColor.h + 240) % 360,
    baseColor.s,
    baseColor.l
  );

  return [
    color1.hex(),
    color2.hex(),
    color3.hex()
  ];
}
