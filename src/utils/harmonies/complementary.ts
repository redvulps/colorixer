import chroma from 'chroma-js';

import type { HSL } from '../colorUtils';

export function getComplementaryColors(baseColor: HSL): string[] {
  // Complementary color is opposite on the color wheel (180 degrees)
  const baseChroma = chroma.hsl(baseColor.h, baseColor.s, baseColor.l);
  const complementary = chroma.hsl((baseColor.h + 180) % 360, baseColor.s, baseColor.l);

  return [baseChroma.hex(), complementary.hex()];
}
