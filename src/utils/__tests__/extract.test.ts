import { extractPalettes, IMAGE_MOODS, oklabToHex, type Pixels, rgbToOklab } from '../extract';

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/** An image of vertical stripes, each `width` pixels wide */
function stripes(colors: string[], width = 10, height = 20): Pixels {
  const w = colors.length * width;
  const data = new Uint8Array(w * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < w; x++) data.set(hex(colors[Math.floor(x / width)]), (y * w + x) * 3);
  }
  return { data, width: w, height };
}

const STRIPES = [
  '#e63946',
  '#f1faee',
  '#a8dadc',
  '#457b9d',
  '#1d3557',
  '#ffb703',
  '#2a9d8f',
  '#6d6875',
];

describe('extractPalettes', () => {
  it('converts to OKLab and back', () => {
    for (const color of ['#000000', '#ffffff', '#e63946', '#2a9d8f']) {
      const [r, g, b] = hex(color);
      expect(oklabToHex(rgbToOklab(r, g, b))).toBe(color);
    }
  });

  it('gives five colors that are in the image for every mood', () => {
    const palettes = extractPalettes(stripes(STRIPES));
    for (const { key } of IMAGE_MOODS) {
      expect(palettes[key].colors).toHaveLength(5);
      expect(new Set(palettes[key].colors).size).toBe(5);
      for (const color of palettes[key].colors) expect(STRIPES).toContain(color);
    }
  });

  it('leans each mood toward its colors', () => {
    const palettes = extractPalettes(stripes(STRIPES));
    expect(palettes.vibrant.colors.slice(0, 2)).toEqual(['#e63946', '#ffb703']);
    expect(palettes.light.colors.slice(0, 2)).toEqual(['#a8dadc', '#f1faee']);
    expect(palettes.dark.colors[0]).toBe('#1d3557');
  });

  it('points each color to where it is in the image', () => {
    const palettes = extractPalettes(stripes(STRIPES));
    const { colors, spots } = palettes.natural;
    colors.forEach((color, i) => {
      const stripe = STRIPES.indexOf(color);
      expect(spots[i].x).toBeGreaterThanOrEqual(stripe / STRIPES.length);
      expect(spots[i].x).toBeLessThan((stripe + 1) / STRIPES.length);
    });
  });

  it('copes with an image of one color', () => {
    const palettes = extractPalettes(stripes(['#336699']));
    expect(palettes.vibrant.colors).toEqual(['#336699']);
  });
});
