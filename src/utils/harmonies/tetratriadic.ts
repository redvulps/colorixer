import chroma from 'chroma-js';
import type { HSL } from '../colorUtils';

export function getTetratriadic(baseColor: HSL): string[] {
  // Tetratriadic colors are evenly spaced around the color wheel (90 degrees apart)
  const color1 = chroma.hsl(baseColor.h, baseColor.s, baseColor.l);
  const color2 = chroma.hsl(
    (baseColor.h + 90) % 360,
    baseColor.s,
    baseColor.l
  );
  const color3 = chroma.hsl(
    (baseColor.h + 180) % 360,
    baseColor.s,
    baseColor.l
  );
  const color4 = chroma.hsl(
    (baseColor.h + 270) % 360,
    baseColor.s,
    baseColor.l
  );

  return [
    color1.hex(),
    color2.hex(),
    color3.hex(),
    color4.hex()
  ];
}
