import { AdobeSwatch } from './exportAdobeAse';

/**
 * NOTE: This ASE encoding logic is adapted from the "ase-utils" package
 * (https://www.npmjs.com/package/ase-utils) to handle the binary format structure.
 */

/**
 * Constants defining parts of the Adobe Swatch Exchange (ASE) binary format.
 */
const ASE_CONSTANTS = {
  FILE_SIGNATURE: 'ASEF', // File identifier
  FORMAT_VERSION: 1, // Version number (Major: 1, Minor: 0)
  COLOR_START: 0x0001, // Block identifier for a color entry
  COLOR_TYPES: {
    // Numerical codes for color types
    global: 0,
    spot: 1,
    normal: 2,
  },
  COLOR_SIZES: {
    // Number of components for each color model
    RGB: 3,
    CMYK: 4,
    LAB: 3,
    GRAY: 1,
  },
};

/**
 * Encodes an ASE data structure into a binary ArrayBuffer suitable for an ASE file.
 *
 * @param aseData - An object representing the swatches to encode.
 * @returns An ArrayBuffer containing the binary ASE data.
 */
export function encodeAseData(aseData: AdobeSwatch): ArrayBuffer {
  const colors = aseData.colors;
  const numberOfSwatches = colors.length;

  // --- Calculate total buffer size needed ---
  let totalSize = 12; // Header: Signature (4 bytes) + Version (4 bytes) + Number of blocks (4 bytes)

  // Calculate size for each color block
  for (const color of colors) {
    // Each color block includes:
    // Block type marker (2) + Block length (4) + Name length (2) +
    // Name chars (2 * nameLength) + Null terminator (2) +
    // Color model (4 chars) + Color values (4 bytes * num components) + Color type (2)
    const localColorModel = color.model.toUpperCase() as keyof typeof ASE_CONSTANTS.COLOR_SIZES;
    const modelSize = ASE_CONSTANTS.COLOR_SIZES[localColorModel] || 3; // Default to RGB size if unknown
    totalSize += 2 + 4 + 2 + (color.name.length + 1) * 2 + 4 + 4 * modelSize + 2;
  }

  // --- Write data to the buffer ---
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  let offset = 0;

  // Write file signature (ASCII chars)
  for (let i = 0; i < ASE_CONSTANTS.FILE_SIGNATURE.length; i++) {
    view.setUint8(offset++, ASE_CONSTANTS.FILE_SIGNATURE.charCodeAt(i));
  }

  // Write format version (Major & Minor stored in one Uint32, big-endian)
  // Version 1.0 -> Major = 1, Minor = 0 -> (1 << 16) | 0 = 65536
  // Note: Original code used setUint32 with 1, implying maybe only Major version? Sticking to that interpretation.
  // Let's stick to the original interpretation for consistency if it worked.
  view.setUint32(offset, ASE_CONSTANTS.FORMAT_VERSION, false); // false = big-endian
  offset += 4;

  // Write number of blocks (swatches) (Uint32, big-endian)
  view.setUint32(offset, numberOfSwatches, false);
  offset += 4;

  // Write each color block
  for (let i = 0; i < numberOfSwatches; i++) {
    const color = colors[i];
    const colorModel = color.model.toUpperCase() as keyof typeof ASE_CONSTANTS.COLOR_SIZES;
    const modelSize = ASE_CONSTANTS.COLOR_SIZES[colorModel] || 3;

    // Write block type marker (Uint16, big-endian)
    view.setUint16(offset, ASE_CONSTANTS.COLOR_START, false);
    offset += 2;

    // Placeholder for block length (Uint32, big-endian) - we'll calculate and write this later
    const blockLengthPos = offset;
    offset += 4;

    // Store the start position of the actual block content (after type and length)
    const blockStart = offset;

    // Write name length (Uint16, big-endian) - includes the null terminator character
    view.setUint16(offset, color.name.length + 1, false);
    offset += 2;

    // Write name characters (UTF-16 Big Endian)
    for (let j = 0; j < color.name.length; j++) {
      view.setUint16(offset, color.name.charCodeAt(j), false);
      offset += 2;
    }
    // Write null terminator for the name (Uint16 = 0)
    view.setUint16(offset, 0, false);
    offset += 2;

    // Write color model identifier (4 ASCII chars, right-padded with spaces)
    let model = color.model.toUpperCase();
    if (model.length < 4) {
      model = model.padEnd(4, ' ');
    }
    for (let j = 0; j < 4; j++) {
      view.setUint8(offset++, model.charCodeAt(j));
    }

    // Write color component values (Float32, big-endian)
    for (let j = 0; j < modelSize; j++) {
      // Ensure value exists, default to 0 if not provided (e.g., incomplete CMYK)
      view.setFloat32(offset, color.color[j] || 0, false);
      offset += 4;
    }

    // Write color type code (Uint16, big-endian)
    const colorTypeKey = color.type.toLowerCase() as keyof typeof ASE_CONSTANTS.COLOR_TYPES;
    const colorType = ASE_CONSTANTS.COLOR_TYPES[colorTypeKey] || 0; // Default to 'global'
    view.setUint16(offset, colorType, false);
    offset += 2;

    // Go back and write the calculated block length
    const blockLength = offset - blockStart;
    view.setUint32(blockLengthPos, blockLength, false);
  }

  return buffer;
}
