import { AdobeSwatch } from './exportAdobeAse';

/**
 * Original code from "ase-utils" package (https://www.npmjs.com/package/ase-utils)
 */

/**
 * ASE file format constants
 */
const ASE_CONSTANTS = {
  FILE_SIGNATURE: 'ASEF',
  FORMAT_VERSION: 1,
  COLOR_START: 0x0001,
  COLOR_TYPES: {
    global: 0,
    spot: 1,
    normal: 2,
  },
  COLOR_SIZES: {
    RGB: 3,
    CMYK: 4,
    LAB: 3,
    GRAY: 1,
  },
};

/**
 * Encodes an ASE data structure into a binary ASE file format.
 * The Adobe Swatch Exchange (ASE) format is a binary format used by Adobe applications
 * to exchange color swatches.
 *
 * @param aseData - JSON string representation of the ASE data structure
 * @returns A binary string representation suitable for file writing
 */
export function encodeAseData(aseData: AdobeSwatch): ArrayBuffer {
  const colors = aseData.colors;
  const numberOfSwatches = colors.length;

  // First pass to calculate buffer size
  let totalSize = 12; // Signature (4) + Version (4) + Number of blocks (4)

  // Calculate size needed for each color entry
  for (const color of colors) {
    // Block type (2) + Block length (4) + name length (2) +
    // name chars (2 * nameLength) + null terminator (2) +
    // color model (4) + color values (4 * values) + color type (2)
    const localColorModel = color.model.toUpperCase() as keyof typeof ASE_CONSTANTS.COLOR_SIZES;
    const modelSize = ASE_CONSTANTS.COLOR_SIZES[localColorModel] || 3;
    totalSize += 2 + 4 + 2 + (color.name.length + 1) * 2 + 4 + 4 * modelSize + 2;
  }

  // Create our buffer
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  let offset = 0;

  // Write file signature
  for (let i = 0; i < ASE_CONSTANTS.FILE_SIGNATURE.length; i++) {
    view.setUint8(offset++, ASE_CONSTANTS.FILE_SIGNATURE.charCodeAt(i));
  }

  // Write format version
  view.setUint32(offset, ASE_CONSTANTS.FORMAT_VERSION, false); // big-endian
  offset += 4;

  // Write number of blocks
  view.setUint32(offset, numberOfSwatches, false); // big-endian
  offset += 4;

  // Write each color block
  for (let i = 0; i < numberOfSwatches; i++) {
    const color = colors[i];
    const colorModel = color.model.toUpperCase() as keyof typeof ASE_CONSTANTS.COLOR_SIZES;
    const modelSize = ASE_CONSTANTS.COLOR_SIZES[colorModel] || 3;

    // Mark the position to write block length later
    const blockLengthPos = offset + 2;

    // Write block type
    view.setUint16(offset, ASE_CONSTANTS.COLOR_START, false); // big-endian
    offset += 2;

    // Skip block length for now (will write it at the end of this block)
    offset += 4;

    // Calculate block start position
    const blockStart = offset;

    // Write name length (including null terminator)
    view.setUint16(offset, color.name.length + 1, false);
    offset += 2;

    // Write name as wide chars
    for (let j = 0; j < color.name.length; j++) {
      view.setUint16(offset, color.name.charCodeAt(j), false);
      offset += 2;
    }

    // Write null terminator
    view.setUint16(offset, 0, false);
    offset += 2;

    // Write color model (4 chars, padded with spaces if needed)
    let model = color.model.toUpperCase();
    if (model.length < 4) {
      model = model.padEnd(4, ' ');
    }

    for (let j = 0; j < 4; j++) {
      view.setUint8(offset++, model.charCodeAt(j));
    }

    // Write color values
    for (let j = 0; j < modelSize; j++) {
      view.setFloat32(offset, color.color[j] || 0, false);
      offset += 4;
    }

    // Write color type
    const colorTypeKey = color.type.toLowerCase() as keyof typeof ASE_CONSTANTS.COLOR_TYPES;
    const colorType = ASE_CONSTANTS.COLOR_TYPES[colorTypeKey] || 0;
    view.setUint16(offset, colorType, false);
    offset += 2;

    // Now write the block length
    const blockLength = offset - blockStart;
    view.setUint32(blockLengthPos, blockLength, false);
  }

  return buffer;
}
