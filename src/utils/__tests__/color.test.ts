import {
  harmonyColors,
  hexToHsv,
  hslString,
  hslToHex,
  hslToHsv,
  hsvString,
  hsvToHex,
  hsvToHsl,
  inkOn,
  rgbString,
} from '../color';
import type { ColorHarmonyType } from '../colorUtils';

describe('harmonyColors', () => {
  it.each<[ColorHarmonyType, string[]]>([
    ['analogous', ['#ff0000', '#ff8000', '#ff0080', '#ffff00', '#ff00ff']],
    ['triadic', ['#ff0000', '#00ff00', '#0000ff']],
    ['tetratriadic', ['#ff0000', '#80ff00', '#00ffff', '#7f00ff']],
    ['complementary', ['#ff0000', '#00ffff']],
    ['monochromatic', ['#ff0000', '#ff3721', '#ff6842', '#ff9264']],
  ])('builds the %s palette of red', (harmony, expected) => {
    expect(harmonyColors(harmony, '#ff0000')).toEqual(expected);
  });

  it('builds palettes from a darker base', () => {
    expect(harmonyColors('tetratriadic', '#800000')).toEqual([
      '#800000',
      '#408000',
      '#008080',
      '#400080',
    ]);
  });

  it('keeps greys grey', () => {
    expect(harmonyColors('complementary', '#808080')).toEqual(['#808080', '#808080']);
  });
});

describe('color formats', () => {
  it('formats RGB', () => {
    expect(rgbString('#ff8000')).toBe('rgb(255 128 0)');
    expect(rgbString('#008000')).toBe('rgb(0 128 0)');
    expect(rgbString('#ffffff')).toBe('rgb(255 255 255)');
  });

  it('rounds HSL to whole units', () => {
    expect(hslString('#ff0000')).toBe('hsl(0deg 100% 50%)');
    expect(hslString('#ff8000')).toBe('hsl(30deg 100% 50%)');
    expect(hslString('#80ff00')).toBe('hsl(90deg 100% 50%)');
    expect(hslString('#808080')).toBe('hsl(0deg 0% 50%)');
  });

  it('formats HSV', () => {
    expect(hsvString('#ff8000')).toBe('hsv(30, 100%, 100%)');
    expect(hsvString('#008000')).toBe('hsv(120, 100%, 50%)');
  });

  it('converts between hex and HSV', () => {
    expect(hsvToHex([120, 1, 0.5])).toBe('#008000');
    expect(hsvToHex([0, 0, 1])).toBe('#ffffff');
    const [h, s, v] = hexToHsv('#808080');
    expect(h).toBe(0);
    expect(s).toBe(0);
    expect(v).toBeCloseTo(0.502, 3);
  });

  it('converts between HSV and HSL without losing the hue', () => {
    expect(hsvToHsl([0, 1, 1])).toEqual([0, 1, 0.5]);
    expect(hslToHsv([0, 1, 0.5])).toEqual([0, 1, 1]);
    expect(hslToHex([0, 1, 0.25])).toBe('#800000');
    const [h, s, l] = hsvToHsl(hslToHsv([210, 0.4, 0.7]));
    expect(h).toBe(210);
    expect(s).toBeCloseTo(0.4, 10);
    expect(l).toBeCloseTo(0.7, 10);
    // Greys keep the hue they had
    expect(hsvToHsl([200, 0, 0.5])).toEqual([200, 0, 0.5]);
  });

  it('keeps the HSL saturation of black, so it comes back from black', () => {
    const black = hslToHsv([120, 0.6, 0]);
    expect(black[2]).toBe(0);
    expect(hsvToHsl(black)[1]).toBeCloseTo(0.6, 10);
    // White has no saturation
    expect(hsvToHsl(hslToHsv([120, 0.6, 1]))).toEqual([120, 0, 1]);
  });

  it('picks text that stays readable on a swatch', () => {
    expect(inkOn('#ffff00')).toBe('#111318');
    expect(inkOn('#0000ff')).toBe('#FFFFFF');
  });
});
