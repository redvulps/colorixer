import {
  HARMONIES,
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
import { hueToRyb, rybToHue } from '../ryb';

describe('harmonyColors', () => {
  it.each<[ColorHarmonyType, string[]]>([
    ['analogous', ['#ff0000', '#ff002d', '#ff2600', '#ff006d', '#ff4d00']],
    ['complementary', ['#ff0000', '#00ff4d', '#bf3030', '#39aa5b', '#804040']],
    ['splitComplementary', ['#ff0000', '#00ff84', '#42ff00', '#804040', '#408061']],
    ['triadic', ['#ff0000', '#007bff', '#ffff00', '#aa3939', '#405e80']],
    ['square', ['#ff0000', '#6600ff', '#00ff4d', '#ffbf00', '#aa3939']],
    ['compound', ['#ff0000', '#ff0055', '#00ffbb', '#00ff4d', '#aa3939']],
    ['shades', ['#ff0000', '#db0000', '#b30000', '#8a0000', '#610000']],
    ['monochromatic', ['#ff0000', '#cc2929', '#993d3d', '#663d3d', '#332929']],
  ])('builds the %s palette of red', (harmony, expected) => {
    expect(harmonyColors(harmony, '#ff0000')).toEqual(expected);
  });

  it('gives every harmony five colors, base first', () => {
    for (const { key } of HARMONIES) {
      const colors = harmonyColors(key, '#2f8fd8');
      expect(colors).toHaveLength(5);
      expect(colors[0]).toBe('#2f8fd8');
    }
  });

  it('turns dark colors lighter instead of into black', () => {
    expect(harmonyColors('square', '#800000')).toEqual([
      '#800000',
      '#330080',
      '#008027',
      '#806000',
      '#d54747',
    ]);
    expect(harmonyColors('shades', '#800000')).toEqual([
      '#800000',
      '#5c0000',
      '#340000',
      '#d70000',
      '#ae0000',
    ]);
  });

  it('keeps greys grey', () => {
    for (const { key } of HARMONIES) {
      for (const color of harmonyColors(key, '#808080')) {
        const [r, g, b] = [1, 3, 5].map((i) => color.slice(i, i + 2));
        expect(r).toBe(g);
        expect(g).toBe(b);
      }
    }
  });
});

describe('RYB wheel', () => {
  it("puts the painter's primaries and complements in place", () => {
    expect(rybToHue(0)).toBe(0);
    expect(rybToHue(120)).toBeCloseTo(60, 5);
    expect(rybToHue(300)).toBeCloseTo(300, 5);
    // Red's complement is green, not cyan
    expect(rybToHue(180)).toBeCloseTo(138.2, 1);
  });

  it('turns hues into angles and back', () => {
    for (const hue of [0, 15, 59.5, 137, 200, 271, 359.9]) {
      expect(rybToHue(hueToRyb(hue))).toBeCloseTo(hue, 6);
    }
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
