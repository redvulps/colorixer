import { zlibSync } from 'fflate';

import { decodePng } from '../png';

/** Builds a PNG whose rows cycle through the five filter types */
function encodePng(width: number, height: number, rgba: number[], channels = 4): Uint8Array {
  const stride = width * channels;
  const raw: number[] = [];
  for (let y = 0; y < height; y++) {
    const filter = y % 5;
    raw.push(filter);
    for (let x = 0; x < stride; x++) {
      const v = rgba[y * stride + x];
      const left = x >= channels ? rgba[y * stride + x - channels] : 0;
      const up = y > 0 ? rgba[(y - 1) * stride + x] : 0;
      const upLeft = y > 0 && x >= channels ? rgba[(y - 1) * stride + x - channels] : 0;
      const p = left + up - upLeft;
      const paeth =
        Math.abs(p - left) <= Math.abs(p - up) && Math.abs(p - left) <= Math.abs(p - upLeft)
          ? left
          : Math.abs(p - up) <= Math.abs(p - upLeft)
            ? up
            : upLeft;
      const predicted = [0, left, up, (left + up) >> 1, paeth][filter];
      raw.push((v - predicted + 256) % 256);
    }
  }
  const chunk = (type: string, body: Uint8Array) => {
    const out = new Uint8Array(12 + body.length);
    new DataView(out.buffer).setUint32(0, body.length);
    out.set(
      [...type].map((c) => c.charCodeAt(0)),
      4,
    );
    out.set(body, 8);
    return out; // CRC left at zero: the decoder does not check it
  };
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  ihdr.set([8, channels === 4 ? 6 : 2, 0, 0, 0], 8);
  const parts = [
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlibSync(new Uint8Array(raw))),
    chunk('IEND', new Uint8Array()),
  ];
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  parts.reduce((at, p) => (out.set(p, at), at + p.length), 0);
  return out;
}

describe('decodePng', () => {
  it('reads RGBA rows through every filter type', () => {
    const width = 4;
    const height = 6;
    const rgba: number[] = [];
    for (let i = 0; i < width * height; i++)
      rgba.push((i * 37) % 256, (i * 91) % 256, (i * 13) % 256, 255);
    const { data, width: w, height: h } = decodePng(encodePng(width, height, rgba));
    expect([w, h]).toEqual([width, height]);
    expect(Array.from(data)).toEqual(rgba.filter((_, i) => i % 4 !== 3));
  });

  it('lays transparent pixels over white', () => {
    const { data } = decodePng(encodePng(2, 1, [255, 0, 0, 255, 0, 0, 0, 0]));
    expect(Array.from(data)).toEqual([255, 0, 0, 255, 255, 255]);
  });

  it('reads RGB files', () => {
    const { data } = decodePng(encodePng(2, 1, [10, 20, 30, 40, 50, 60], 3));
    expect(Array.from(data)).toEqual([10, 20, 30, 40, 50, 60]);
  });

  it('refuses what is not a PNG', () => {
    expect(() => decodePng(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]))).toThrow('Not a PNG file');
  });
});
