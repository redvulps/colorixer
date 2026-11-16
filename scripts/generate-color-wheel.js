#!/usr/bin/env node
/**
 * Generates assets/images/color-wheel.png: the hue/saturation disc at full value, on the painter's
 * RYB circle.
 *
 * The angle from the center is the RYB angle (0° = red to the right, increasing clockwise on
 * screen); rybToHue turns it into the HSV hue drawn there, as src/utils/ryb.ts does. Saturation
 * grows with the distance and reaches 1 at INSET short of the edge, so the outer ring
 * shows fully saturated colors. ColorWheel uses the same INSET to map touches and place markers.
 *
 * Usage: node scripts/generate-color-wheel.js [size]
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZE = Number(process.argv[2] ?? 960);
const INSET = 0.035;
const OUT = path.join(__dirname, '..', 'assets', 'images', 'color-wheel.png');

function hsvToRgb(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  const k = Math.floor(h / 60) % 6;
  const [r, g, b] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ][k];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

// Gossett and Chen (IEEE InfoVis 2004): RYB cube corners as pigment colors. Must match src/utils/ryb.ts
// prettier-ignore
const CORNERS = [
  [[0, 0, 0], [1, 1, 1]],
  [[1, 0, 0], [1, 0, 0]],
  [[0, 1, 0], [1, 1, 0]],
  [[0, 0, 1], [0.163, 0.373, 0.6]],
  [[1, 1, 0], [1, 0.5, 0]],
  [[1, 0, 1], [0.5, 0, 0.5]],
  [[0, 1, 1], [0, 0.66, 0.2]],
  [[1, 1, 1], [0.2, 0.094, 0]],
];

function rybToRgb([r, y, b]) {
  const out = [0, 0, 0];
  for (const [[cr, cy, cb], rgb] of CORNERS) {
    const w = (cr ? r : 1 - r) * (cy ? y : 1 - y) * (cb ? b : 1 - b);
    for (let i = 0; i < 3; i++) out[i] += w * rgb[i];
  }
  return out;
}

function hueOf([r, g, b]) {
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (!d) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

function pureRyb(angle) {
  const x = angle / 60;
  const f = 1 - Math.abs((x % 2) - 1);
  return [
    [1, f, 0],
    [f, 1, 0],
    [0, 1, f],
    [0, f, 1],
    [f, 0, 1],
    [1, 0, f],
  ][Math.floor(x) % 6];
}

const HUES = Array.from({ length: 361 }, (_, a) => hueOf(rybToRgb(pureRyb(a))));
HUES[0] = 0;
HUES[360] = 360;

function rybToHue(angle) {
  const a = ((angle % 360) + 360) % 360;
  const i = Math.floor(a);
  return HUES[i] + (a - i) * (HUES[i + 1] - HUES[i]);
}

// Raw RGBA rows
const radius = SIZE / 2;
const saturationRadius = radius * (1 - INSET);
const raw = Buffer.alloc(SIZE * SIZE * 4);
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const dx = x + 0.5 - radius;
    const dy = y + 0.5 - radius;
    const dist = Math.hypot(dx, dy);
    const angle = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
    const [r, g, b] = hsvToRgb(rybToHue(angle) % 360, Math.min(dist / saturationRadius, 1), 1);
    const alpha = Math.min(Math.max(radius - dist + 0.5, 0), 1); // antialiased edge
    const i = (y * SIZE + x) * 4;
    raw[i] = Math.round(r);
    raw[i + 1] = Math.round(g);
    raw[i + 2] = Math.round(b);
    raw[i + 3] = Math.round(alpha * 255);
  }
}

// PNG rows with the Paeth filter, which compresses smooth gradients well
const stride = SIZE * 4;
const filtered = Buffer.alloc((stride + 1) * SIZE);
for (let y = 0; y < SIZE; y++) {
  filtered[y * (stride + 1)] = 4;
  for (let i = 0; i < stride; i++) {
    const a = i >= 4 ? raw[y * stride + i - 4] : 0;
    const b = y > 0 ? raw[(y - 1) * stride + i] : 0;
    const c = i >= 4 && y > 0 ? raw[(y - 1) * stride + i - 4] : 0;
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    const pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
    filtered[y * (stride + 1) + 1 + i] = (raw[y * stride + i] - pred) & 0xff;
  }
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // RGBA
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(filtered, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

fs.writeFileSync(OUT, png);
console.log(`Wrote ${path.relative(process.cwd(), OUT)} (${SIZE}×${SIZE}, ${png.length} bytes)`);
