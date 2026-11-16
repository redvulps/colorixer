/**
 * Palettes from an image.
 *
 * 1. Wu's color quantizer (Xiaolin Wu, Graphics Gems II, 1991) splits the colors into groups.
 * 2. A weighted k-means in OKLab (Björn Ottosson, 2020) refines them, the way Material Color
 *    Utilities finds a wallpaper's colors. Each group's color is the average of its pixels.
 * 3. A mood scores the groups by lightness and chroma targets in OKLCH, in the spirit of the
 *    profiles in Android's Palette library, plus a little for area.
 * 4. Five colors are picked at least some distance apart, so the palette stays varied.
 */

/** RGB pixels, 3 bytes each, row by row */
export interface Pixels {
  data: Uint8Array;
  width: number;
  height: number;
}

export type ImageMood = 'natural' | 'vibrant' | 'light' | 'muted' | 'deep' | 'dark';

export const IMAGE_MOODS: { key: ImageMood; label: string }[] = [
  { key: 'natural', label: 'Natural' },
  { key: 'vibrant', label: 'Vibrant' },
  { key: 'light', label: 'Light' },
  { key: 'muted', label: 'Muted' },
  { key: 'deep', label: 'Deep' },
  { key: 'dark', label: 'Dark' },
];

export function moodLabel(mood: ImageMood): string {
  return IMAGE_MOODS.find((m) => m.key === mood)?.label ?? mood;
}

/** Five colors of a mood and where each one sits in the image, as fractions of its size */
export interface MoodPalette {
  colors: string[];
  spots: { x: number; y: number }[];
}

type Lab = [number, number, number];

// ---------- OKLab ----------

function linear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function gamma(x: number): number {
  const v = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(1, v)) * 255);
}

export function rgbToOklab(r: number, g: number, b: number): Lab {
  const lr = linear(r);
  const lg = linear(g);
  const lb = linear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function oklabToHex([L, a, b]: Lab): string {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [
    gamma(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    gamma(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    gamma(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
  return `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function distance2(p: Lab, q: Lab): number {
  const x = p[0] - q[0];
  const y = p[1] - q[1];
  const z = p[2] - q[2];
  return x * x + y * y + z * z;
}

// ---------- Wu's quantizer ----------

const SIDE = 33;
const TOTAL = SIDE * SIDE * SIDE;
const index = (r: number, g: number, b: number) => r * SIDE * SIDE + g * SIDE + b;

interface Box {
  r0: number;
  r1: number;
  g0: number;
  g1: number;
  b0: number;
  b1: number;
}
type Axis = 'r' | 'g' | 'b';

/** Up to `maxColors` average colors of the boxes Wu's method cuts the RGB cube into */
export function wuQuantize(pixels: Uint8Array, maxColors: number): [number, number, number][] {
  const w = new Float64Array(TOTAL);
  const mr = new Float64Array(TOTAL);
  const mg = new Float64Array(TOTAL);
  const mb = new Float64Array(TOTAL);
  const m2 = new Float64Array(TOTAL);
  for (let p = 0; p < pixels.length; p += 3) {
    const r = pixels[p];
    const g = pixels[p + 1];
    const b = pixels[p + 2];
    const k = index((r >> 3) + 1, (g >> 3) + 1, (b >> 3) + 1);
    w[k]++;
    mr[k] += r;
    mg[k] += g;
    mb[k] += b;
    m2[k] += r * r + g * g + b * b;
  }

  // Cumulative moments, so any box's sums come from eight lookups
  for (let r = 1; r < SIDE; r++) {
    const area = [w, mr, mg, mb, m2].map(() => new Float64Array(SIDE));
    for (let g = 1; g < SIDE; g++) {
      const line = [0, 0, 0, 0, 0];
      for (let b = 1; b < SIDE; b++) {
        const i = index(r, g, b);
        const j = index(r - 1, g, b);
        [w, mr, mg, mb, m2].forEach((m, n) => {
          line[n] += m[i];
          area[n][b] += line[n];
          m[i] = m[j] + area[n][b];
        });
      }
    }
  }

  const volume = (c: Box, m: Float64Array) =>
    m[index(c.r1, c.g1, c.b1)] -
    m[index(c.r1, c.g1, c.b0)] -
    m[index(c.r1, c.g0, c.b1)] +
    m[index(c.r1, c.g0, c.b0)] -
    m[index(c.r0, c.g1, c.b1)] +
    m[index(c.r0, c.g1, c.b0)] +
    m[index(c.r0, c.g0, c.b1)] -
    m[index(c.r0, c.g0, c.b0)];

  const bottom = (c: Box, axis: Axis, m: Float64Array) => {
    if (axis === 'r')
      return (
        -m[index(c.r0, c.g1, c.b1)] +
        m[index(c.r0, c.g1, c.b0)] +
        m[index(c.r0, c.g0, c.b1)] -
        m[index(c.r0, c.g0, c.b0)]
      );
    if (axis === 'g')
      return (
        -m[index(c.r1, c.g0, c.b1)] +
        m[index(c.r1, c.g0, c.b0)] +
        m[index(c.r0, c.g0, c.b1)] -
        m[index(c.r0, c.g0, c.b0)]
      );
    return (
      -m[index(c.r1, c.g1, c.b0)] +
      m[index(c.r1, c.g0, c.b0)] +
      m[index(c.r0, c.g1, c.b0)] -
      m[index(c.r0, c.g0, c.b0)]
    );
  };

  const top = (c: Box, axis: Axis, pos: number, m: Float64Array) => {
    if (axis === 'r')
      return (
        m[index(pos, c.g1, c.b1)] -
        m[index(pos, c.g1, c.b0)] -
        m[index(pos, c.g0, c.b1)] +
        m[index(pos, c.g0, c.b0)]
      );
    if (axis === 'g')
      return (
        m[index(c.r1, pos, c.b1)] -
        m[index(c.r1, pos, c.b0)] -
        m[index(c.r0, pos, c.b1)] +
        m[index(c.r0, pos, c.b0)]
      );
    return (
      m[index(c.r1, c.g1, pos)] -
      m[index(c.r1, c.g0, pos)] -
      m[index(c.r0, c.g1, pos)] +
      m[index(c.r0, c.g0, pos)]
    );
  };

  const variance = (c: Box) => {
    const dr = volume(c, mr);
    const dg = volume(c, mg);
    const db = volume(c, mb);
    const dw = volume(c, w);
    return dw ? volume(c, m2) - (dr * dr + dg * dg + db * db) / dw : 0;
  };

  const maximize = (c: Box, axis: Axis, first: number, last: number, whole: number[]) => {
    const base = [mr, mg, mb, w].map((m) => bottom(c, axis, m));
    let max = 0;
    let at = -1;
    for (let i = first; i < last; i++) {
      const half = [mr, mg, mb, w].map((m, n) => base[n] + top(c, axis, i, m));
      if (!half[3]) continue;
      const other = half.map((h, n) => whole[n] - h);
      if (!other[3]) continue;
      const score =
        (half[0] ** 2 + half[1] ** 2 + half[2] ** 2) / half[3] +
        (other[0] ** 2 + other[1] ** 2 + other[2] ** 2) / other[3];
      if (score > max) {
        max = score;
        at = i;
      }
    }
    return [max, at];
  };

  const cut = (one: Box, two: Box) => {
    const whole = [volume(one, mr), volume(one, mg), volume(one, mb), volume(one, w)];
    const [maxR, atR] = maximize(one, 'r', one.r0 + 1, one.r1, whole);
    const [maxG, atG] = maximize(one, 'g', one.g0 + 1, one.g1, whole);
    const [maxB, atB] = maximize(one, 'b', one.b0 + 1, one.b1, whole);
    two.r1 = one.r1;
    two.g1 = one.g1;
    two.b1 = one.b1;
    if (maxR >= maxG && maxR >= maxB) {
      if (atR < 0) return false;
      one.r1 = atR;
      Object.assign(two, { r0: one.r1, g0: one.g0, b0: one.b0 });
    } else if (maxG >= maxR && maxG >= maxB) {
      one.g1 = atG;
      Object.assign(two, { r0: one.r0, g0: one.g1, b0: one.b0 });
    } else {
      one.b1 = atB;
      Object.assign(two, { r0: one.r0, g0: one.g0, b0: one.b1 });
    }
    return true;
  };

  const size = (c: Box) => (c.r1 - c.r0) * (c.g1 - c.g0) * (c.b1 - c.b0);
  const boxes: (Box | null)[] = [{ r0: 0, r1: 32, g0: 0, g1: 32, b0: 0, b1: 32 }];
  const spread = [0];
  let next = 0;
  for (let k = 1; k < maxColors; k++) {
    const two: Box = { r0: 0, r1: 0, g0: 0, g1: 0, b0: 0, b1: 0 };
    const one = boxes[next] as Box;
    if (cut(one, two)) {
      boxes.push(two);
      spread[next] = size(one) > 1 ? variance(one) : 0;
      spread[k] = size(two) > 1 ? variance(two) : 0;
    } else {
      spread[next] = 0;
      boxes.push(null);
      spread[k] = 0;
    }
    next = spread.indexOf(Math.max(...spread));
    if (spread[next] <= 0) break;
  }

  const colors: [number, number, number][] = [];
  for (const box of boxes) {
    if (!box) continue;
    const weight = volume(box, w);
    if (weight > 0) {
      colors.push([volume(box, mr) / weight, volume(box, mg) / weight, volume(box, mb) / weight]);
    }
  }
  return colors;
}

// ---------- Groups: Wu, refined by k-means in OKLab ----------

export interface ColorGroup {
  lab: Lab;
  /** OKLCH lightness and chroma */
  L: number;
  C: number;
  /** Fraction of the pixels in the group */
  share: number;
  hex: string;
}

export function colorGroups(pixels: Uint8Array, count = 24): ColorGroup[] {
  const seen = new Map<number, number>();
  for (let p = 0; p < pixels.length; p += 3) {
    const key = (pixels[p] << 16) | (pixels[p + 1] << 8) | pixels[p + 2];
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  const points: Lab[] = [];
  const weights: number[] = [];
  let total = 0;
  seen.forEach((n, key) => {
    points.push(rgbToOklab(key >> 16, (key >> 8) & 255, key & 255));
    weights.push(n);
    total += n;
  });

  let centers: Lab[] = wuQuantize(pixels, count).map(([r, g, b]) => rgbToOklab(r, g, b));
  let sizes: number[] = [];
  const assigned = new Int32Array(points.length).fill(-1);
  for (let round = 0; round < 12; round++) {
    const sums = centers.map(() => [0, 0, 0, 0]);
    let moved = 0;
    points.forEach((point, i) => {
      let best = 0;
      let bestDistance = Infinity;
      centers.forEach((center, c) => {
        const d = distance2(point, center);
        if (d < bestDistance) {
          bestDistance = d;
          best = c;
        }
      });
      if (assigned[i] !== best) moved++;
      assigned[i] = best;
      const sum = sums[best];
      sum[0] += point[0] * weights[i];
      sum[1] += point[1] * weights[i];
      sum[2] += point[2] * weights[i];
      sum[3] += weights[i];
    });
    const kept = sums.filter((s) => s[3] > 0);
    centers = kept.map((s) => [s[0] / s[3], s[1] / s[3], s[2] / s[3]] as Lab);
    sizes = kept.map((s) => s[3]);
    if (!moved) break;
    // Groups were dropped: the assignments point at old indices
    if (kept.length !== sums.length) assigned.fill(-1);
  }

  return centers.map((lab, i) => ({
    lab,
    L: lab[0],
    C: Math.hypot(lab[1], lab[2]),
    share: sizes[i] / total,
    hex: oklabToHex(lab),
  }));
}

// ---------- Moods ----------

/** OKLCH [min, target, max] ranges; natural ranks by area only */
const TARGETS: Record<
  Exclude<ImageMood, 'natural'>,
  { L: [number, number, number]; C: [number, number, number] }
> = {
  vibrant: { L: [0.5, 0.68, 0.88], C: [0.11, 0.26, 1] },
  light: { L: [0.74, 0.88, 1], C: [0, 0.08, 1] },
  muted: { L: [0.42, 0.68, 0.9], C: [0.015, 0.05, 0.095] },
  deep: { L: [0.3, 0.46, 0.62], C: [0.08, 0.2, 1] },
  dark: { L: [0, 0.27, 0.42], C: [0, 0.1, 1] },
};
const WEIGHT_LIGHTNESS = 0.52;
const WEIGHT_CHROMA = 0.24;
const WEIGHT_AREA = 0.24;
/** Groups smaller than this share of the image are noise */
const MIN_SHARE = 0.0005;
/** Least OKLab distance between picked colors, relaxed when an image has too few */
const MIN_DISTANCES = [0.1, 0.06, 0];

function score(group: ColorGroup, mood: ImageMood, maxShare: number): number {
  const area = Math.sqrt(group.share / maxShare);
  if (mood === 'natural') return area;
  const { L, C } = TARGETS[mood];
  const inRange = group.L >= L[0] && group.L <= L[2] && group.C >= C[0] && group.C <= C[2];
  return (
    (inRange ? 1 : 0) +
    WEIGHT_CHROMA * (1 - Math.min(1, Math.abs(group.C - C[1]) / 0.3)) +
    WEIGHT_LIGHTNESS * (1 - Math.abs(group.L - L[1])) +
    WEIGHT_AREA * area
  );
}

export function pickGroups(groups: ColorGroup[], mood: ImageMood, count = 5): ColorGroup[] {
  const maxShare = Math.max(...groups.map((g) => g.share));
  const ranked = groups
    .filter((g) => g.share > MIN_SHARE)
    .map((g) => ({ g, s: score(g, mood, maxShare) }))
    .sort((a, b) => b.s - a.s)
    .map(({ g }) => g);
  const picked: ColorGroup[] = [];
  for (const minDistance of MIN_DISTANCES) {
    for (const group of ranked) {
      if (picked.length >= count) break;
      if (picked.includes(group)) continue;
      if (picked.every((p) => Math.sqrt(distance2(p.lab, group.lab)) >= minDistance)) {
        picked.push(group);
      }
    }
  }
  return picked;
}

/** Palettes for every mood, with the spot in the image each color comes from */
export function extractPalettes(pixels: Pixels): Record<ImageMood, MoodPalette> {
  const groups = colorGroups(pixels.data);
  const labs: Lab[] = [];
  for (let p = 0; p < pixels.data.length; p += 3) {
    labs.push(rgbToOklab(pixels.data[p], pixels.data[p + 1], pixels.data[p + 2]));
  }
  const spotOf = (group: ColorGroup) => {
    let best = 0;
    let bestDistance = Infinity;
    labs.forEach((lab, i) => {
      const d = distance2(lab, group.lab);
      if (d < bestDistance) {
        bestDistance = d;
        best = i;
      }
    });
    return {
      x: ((best % pixels.width) + 0.5) / pixels.width,
      y: (Math.floor(best / pixels.width) + 0.5) / pixels.height,
    };
  };
  const out = {} as Record<ImageMood, MoodPalette>;
  for (const { key } of IMAGE_MOODS) {
    const picked = pickGroups(groups, key);
    out[key] = { colors: picked.map((g) => g.hex), spots: picked.map(spotOf) };
  }
  return out;
}
