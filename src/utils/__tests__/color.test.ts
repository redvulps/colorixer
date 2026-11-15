import {
  harmonyColors,
  hexToHsv,
  hslString,
  hsvString,
  hsvToHex,
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

  it('picks text that stays readable on a swatch', () => {
    expect(inkOn('#ffff00')).toBe('#111318');
    expect(inkOn('#0000ff')).toBe('#FFFFFF');
  });
});
