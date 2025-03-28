import chroma from 'chroma-js';

export type RGB = {
  r: number;
  g: number;
  b: number;
};

export type HSL = {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
};

export type HSV = {
  h: number; // 0-360
  s: number; // 0-100
  v: number; // 0-100
};

export type ColorHarmonyType =
  | 'analogous'
  | 'triadic'
  | 'tetratriadic'
  | 'complementary'
  | 'monochromatic';
