import chroma from 'chroma-js';

import type { HSL } from '../colorUtils';

export function getAnalogousColors(baseColor: HSL, count: number = 5): string[] {
  const colors: string[] = [];
  const step = 30; // Degrees to step for analogous colors

  // Include base color
  colors.push(chroma.hsl(baseColor.h, baseColor.s, baseColor.l).hex());

  // Calculate analogous colors
  for (let i = 1; i <= Math.floor((count - 1) / 2); i++) {
    // Colors clockwise
    const color1 = chroma.hsl((baseColor.h + step * i) % 360, baseColor.s, baseColor.l);

    // Colors counter-clockwise
    const color2 = chroma.hsl((baseColor.h - step * i + 360) % 360, baseColor.s, baseColor.l);

    colors.push(color1.hex());

    if (colors.length < count) {
      colors.push(color2.hex());
    }
  }

  return colors;
}
