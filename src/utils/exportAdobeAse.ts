import chroma from 'chroma-js';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { encodeAseData } from './encodeAseData';

export interface AdobeColor {
  name: string;
  model: string; // Color model (e.g., "RGB", "CMYK")
  color: number[]; // Normalized color values
  type: string; // Color type ("global" or "spot")
}

export interface AdobeSwatch {
  version: string; // Version of the ASE format
  groups: any[]; // Array of color groups (empty for now)
  colors: AdobeColor[]; // Array of colors in the swatch
}

/**
 * Exports an array of hex colors as an Adobe Swatch Exchange (ASE) file.
 * The output is an ASE file where aseData is an ArrayBuffer.
 *
 * @param hexColors - Array of hex color strings.
 */
export async function exportAdobeAse(hexColors: string[]): Promise<void> {
  const colors: AdobeColor[] = hexColors.map((hex) => {
    const [r, g, b] = chroma(hex).rgb();
    return {
      name: hex,
      model: 'RGB',
      color: [r / 255, g / 255, b / 255],
      type: 'global',
    };
  });

  // encodeAseData now returns an ArrayBuffer.
  const aseData: ArrayBuffer = encodeAseData(createAseData(colors));
  const exportFileName = 'Exported Swatch.ase';

  if (Platform.OS !== 'web') {
    try {
      const fileUri = FileSystem.documentDirectory + exportFileName;
      // Convert ArrayBuffer to base64 string for writing.
      const base64Data = arrayBufferToBase64(aseData);
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        console.warn('Sharing is not available on this device.');
      }
    } catch (error) {
      console.error('Error exporting swatch on mobile:', error);
    }
  } else {
    try {
      // On web, we create a Blob from the ArrayBuffer
      const blob = new Blob([aseData], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting swatch on web:', error);
    }
  }
}

function createAseData(colors: AdobeColor[]): AdobeSwatch {
  return {
    version: '1.0',
    groups: [],
    colors: colors,
  };
}

// Helper function to convert an ArrayBuffer to a Base64-encoded string.
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
