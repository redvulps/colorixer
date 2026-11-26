import { unzlibSync } from 'fflate';

import type { Pixels } from './extract';

const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

/**
 * RGB pixels of an 8-bit, non-interlaced RGB or RGBA PNG, the kind the image manipulator
 * writes. Transparent pixels are read as if laid over white.
 */
export function decodePng(bytes: Uint8Array): Pixels {
  if (!SIGNATURE.every((b, i) => bytes[i] === b)) throw new Error('Not a PNG file');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let width = 0;
  let height = 0;
  let channels = 0;
  const idat: Uint8Array[] = [];
  for (let at = 8; at < bytes.length;) {
    const length = view.getUint32(at);
    const type = String.fromCharCode(...bytes.subarray(at + 4, at + 8));
    const body = bytes.subarray(at + 8, at + 8 + length);
    if (type === 'IHDR') {
      const bodyView = new DataView(body.buffer, body.byteOffset, body.byteLength);
      width = bodyView.getUint32(0);
      height = bodyView.getUint32(4);
      const depth = body[8];
      const colorType = body[9];
      const interlace = body[12];
      if (depth !== 8 || interlace !== 0 || (colorType !== 2 && colorType !== 6)) {
        throw new Error(`Unsupported PNG (depth ${depth}, color type ${colorType})`);
      }
      channels = colorType === 6 ? 4 : 3;
    } else if (type === 'IDAT') {
      idat.push(body);
    } else if (type === 'IEND') {
      break;
    }
    at += 12 + length;
  }

  const joined = new Uint8Array(idat.reduce((n, c) => n + c.length, 0));
  let offset = 0;
  for (const chunk of idat) {
    joined.set(chunk, offset);
    offset += chunk.length;
  }
  const raw = unzlibSync(joined);

  const stride = width * channels;
  const rows = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    const out = y * stride;
    for (let x = 0; x < stride; x++) {
      const left = x >= channels ? rows[out + x - channels] : 0;
      const up = y > 0 ? rows[out - stride + x] : 0;
      const upLeft = y > 0 && x >= channels ? rows[out - stride + x - channels] : 0;
      const v = raw[src + x];
      rows[out + x] =
        filter === 0
          ? v
          : filter === 1
            ? v + left
            : filter === 2
              ? v + up
              : filter === 3
                ? v + ((left + up) >> 1)
                : v + paeth(left, up, upLeft);
    }
  }

  const data = new Uint8Array(width * height * 3);
  for (let i = 0, o = 0; i < rows.length; i += channels, o += 3) {
    const alpha = channels === 4 ? rows[i + 3] / 255 : 1;
    for (let c = 0; c < 3; c++) data[o + c] = Math.round(rows[i + c] * alpha + 255 * (1 - alpha));
  }
  return { data, width, height };
}

export function base64ToBytes(base64: string): Uint8Array {
  const text = atob(base64);
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i);
  return bytes;
}
