import chroma from 'chroma-js';

import type { HSL } from '../colorUtils';

export function getMonochromaticColors(baseColor: HSL, count: number = 4): string[] {
  const baseColorChroma = chroma.hsl(baseColor.h, baseColor.s, baseColor.l);

  // Use chroma.js's scale functionality for better monochromatic variations
  // This creates a scale from darker, more saturated to lighter, less saturated versions
  const scale = chroma
    .scale([baseColorChroma, baseColorChroma.brighten(2)])
    .mode('hsl')
    .colors(count);

  return scale;
}
