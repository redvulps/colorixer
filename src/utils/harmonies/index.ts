import chroma from 'chroma-js';

import type { ColorHarmonyType } from '../colorUtils';
import { hueToRyb, rybToHue } from '../ryb';

/** Turn on the RYB wheel, in degrees, and how far saturation and brightness move (none: keep them) */
type Slot = [turn: number, depth: number | null];

const ANALOGOUS_STEP = 18;
const LIGHT = 0.25;
const MEDIUM = 1 / 3;
const STRONG = 0.5;
const MONOCHROMATIC_STEP = 0.2;

const SLOTS: Record<Exclude<ColorHarmonyType, 'monochromatic'>, Slot[]> = {
  analogous: [
    [0, null],
    [-ANALOGOUS_STEP, null],
    [ANALOGOUS_STEP, null],
    [-2 * ANALOGOUS_STEP, null],
    [2 * ANALOGOUS_STEP, null],
  ],
  complementary: [
    [0, null],
    [180, null],
    [0, LIGHT],
    [180, MEDIUM],
    [0, STRONG],
  ],
  triadic: [
    [0, null],
    [-120, null],
    [120, null],
    [0, MEDIUM],
    [-120, STRONG],
  ],
  square: [
    [0, null],
    [-90, null],
    [180, null],
    [90, null],
    [0, MEDIUM],
  ],
};

/**
 * Moves saturation and brightness by `depth`. Saturation that would drop under 0.1 bounces back
 * up from it; brightness that would drop under 0.2 goes up instead on a dark base, so the color
 * stays visible, and stops at 0.2 on a light one.
 */
function varySV(s: number, v: number, depth: number): [number, number] {
  let s2 = s - depth;
  if (s2 < 0.1) s2 = 0.2 - s2;
  let v2 = v - depth;
  if (v2 < 0.2) v2 = v <= 0.6 ? v + depth : 0.2;
  return [Math.min(1, s2), Math.min(1, v2)];
}

/**
 * Five colors of a harmony, base first. Hues turn on the painter's RYB wheel; some harmonies also
 * add lighter or darker versions of the base and its partners.
 */
export function getHarmonyColors(harmony: ColorHarmonyType, base: string): string[] {
  const [hue, s, v] = chroma(base).hsv();
  // Greys have no hue: chroma returns NaN
  const h = Number.isNaN(hue) ? 0 : hue;
  const angle = hueToRyb(h);
  // Greys have no hue to lend their variations, so those stay grey
  const vary = (depth: number) => {
    const [s2, v2] = varySV(s, v, depth);
    return [s ? s2 : 0, v2];
  };

  return [0, 1, 2, 3, 4].map((k) => {
    if (k === 0) return chroma(base).hex();
    if (harmony === 'monochromatic') {
      const [s2, v2] = vary(MONOCHROMATIC_STEP * k);
      return chroma.hsv(h, s2, v2).hex();
    }
    const [turn, depth] = SLOTS[harmony][k];
    const h2 = turn ? rybToHue(angle + turn) : h;
    const [s2, v2] = depth === null ? [s, v] : vary(depth);
    return chroma.hsv(h2, s2, v2).hex();
  });
}
