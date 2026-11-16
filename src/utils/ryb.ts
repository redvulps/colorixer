/**
 * The painter's color wheel, with red, yellow and blue as primaries, after Gossett and Chen,
 * "Paint Inspired Color Mixing and Compositing for Visualization" (IEEE InfoVis 2004). Each corner
 * of the RYB cube is a pigment color and the colors in between mix trilinearly. An RYB angle runs
 * like an HSV hue on that cube: red 0°, orange 60°, yellow 120°, green 180°, blue 240°, violet 300°.
 *
 * The wheel image, the markers and the harmonies use these angles, so complements are the ones
 * painters expect: red and green, blue and orange, yellow and violet.
 */

type Triple = [number, number, number];

/** RYB cube corners and the pigment color each one stands for, in RGB */
// prettier-ignore
const CORNERS: [Triple, Triple][] = [
  [[0, 0, 0], [1, 1, 1]],
  [[1, 0, 0], [1, 0, 0]],
  [[0, 1, 0], [1, 1, 0]],
  [[0, 0, 1], [0.163, 0.373, 0.6]],
  [[1, 1, 0], [1, 0.5, 0]],
  [[1, 0, 1], [0.5, 0, 0.5]],
  [[0, 1, 1], [0, 0.66, 0.2]],
  [[1, 1, 1], [0.2, 0.094, 0]],
];

function rybToRgb([r, y, b]: Triple): Triple {
  const out: Triple = [0, 0, 0];
  for (const [[cr, cy, cb], rgb] of CORNERS) {
    const w = (cr ? r : 1 - r) * (cy ? y : 1 - y) * (cb ? b : 1 - b);
    for (let i = 0; i < 3; i++) out[i] += w * rgb[i];
  }
  return out;
}

function hueOf([r, g, b]: Triple): number {
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (!d) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

/** The fully saturated RYB color at an angle, like an HSV hue on the RYB cube */
function pureRyb(angle: number): Triple {
  const x = angle / 60;
  const f = 1 - Math.abs((x % 2) - 1);
  const sector: Triple[] = [
    [1, f, 0],
    [f, 1, 0],
    [0, 1, f],
    [0, f, 1],
    [f, 0, 1],
    [1, 0, f],
  ];
  return sector[Math.floor(x) % 6];
}

/** RGB hue at each whole RYB degree, 0 to 360; it only ever grows */
const HUES = Array.from({ length: 361 }, (_, a) => hueOf(rybToRgb(pureRyb(a))));
HUES[0] = 0;
HUES[360] = 360;

const wrap = (deg: number) => ((deg % 360) + 360) % 360;

/** RGB hue (0-360) of an angle on the RYB wheel */
export function rybToHue(angle: number): number {
  const a = wrap(angle);
  const i = Math.floor(a);
  return HUES[i] + (a - i) * (HUES[i + 1] - HUES[i]);
}

/** Angle on the RYB wheel (0-360) of an RGB hue */
export function hueToRyb(hue: number): number {
  const h = wrap(hue);
  let lo = 0;
  let hi = 360;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (HUES[mid] <= h) lo = mid;
    else hi = mid;
  }
  const span = HUES[lo + 1] - HUES[lo];
  return lo + (span ? (h - HUES[lo]) / span : 0);
}
