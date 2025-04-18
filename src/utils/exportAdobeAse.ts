import chroma from 'chroma-js';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { encodeAseData } from './encodeAseData'; // Imports the binary encoding function

// Type definition for a single color entry in an ASE structure
export interface AdobeColor {
  name: string; // Name of the swatch (using hex code here)
  model: string; // Color model identifier (e.g., "RGB", "CMYK")
  color: number[]; // Array of color components, normalized (0-1 for RGB)
  type: string; // Swatch type: "global", "spot", or "normal"
}

// Type definition for the overall ASE file structure
export interface AdobeSwatch {
  version: string; // ASE format version (typically "1.0")
  groups: any[]; // Array for color groups (not used in this implementation)
  colors: AdobeColor[]; // Array of the actual color swatches
}

/**
 * Exports an array of hex colors as an Adobe Swatch Exchange (ASE) file.
 * Creates the binary data and triggers a download (web) or share sheet (mobile).
 *
 * @param hexColors - Array of hex color strings (e.g., "#FF0000").
 * @param filename - Optional desired filename (defaults to 'Exported Swatch.ase').
 */
export async function exportAdobeAse(
  hexColors: string[],
  filename: string = 'Exported Swatch.ase',
): Promise<void> {
  // Ensure filename ends with .ase
  const exportFileName = filename.endsWith('.ase') ? filename : `${filename}.ase`;

  // 1. Convert hex colors to the AdobeColor structure required by the encoder
  const colors: AdobeColor[] = hexColors.map((hex) => {
    const [r, g, b] = chroma(hex).rgb(); // Get RGB values (0-255)
    return {
      name: hex.toUpperCase(), // Use the hex code as the swatch name
      model: 'RGB ', // ASE requires a 4-char model string, padded with space
      color: [r / 255, g / 255, b / 255], // Normalize RGB values to 0-1 range
      type: 'global', // Use 'global' type for standard swatches
    };
  });

  // 2. Create the top-level ASE data structure
  const aseStructure: AdobeSwatch = {
    version: '1.0', // Standard ASE version
    groups: [], // Groups are not implemented here
    colors: colors, // Assign the converted colors
  };

  // 3. Encode the structure into binary ASE format (ArrayBuffer)
  const aseData: ArrayBuffer = encodeAseData(aseStructure);

  // 4. Handle file saving/sharing based on platform
  if (Platform.OS !== 'web') {
    // Mobile (iOS/Android) using Expo FileSystem and Sharing
    try {
      const fileUri = FileSystem.documentDirectory + exportFileName;
      // Convert ArrayBuffer to base64 for Expo FileSystem's writeAsStringAsync
      const base64Data = arrayBufferToBase64(aseData);
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log(`ASE file saved to: ${fileUri}`);

      // Check if sharing is available and share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/octet-stream',
          dialogTitle: 'Share ASE Swatch',
        });
      } else {
        alert('Sharing is not available on this device.'); // Provide user feedback
      }
    } catch (error) {
      console.error('Error exporting ASE swatch on mobile:', error);
      alert(`Error exporting swatch: ${error instanceof Error ? error.message : String(error)}`); // Show error to user
    }
  } else {
    // Web - Create a Blob and trigger download
    try {
      const blob = new Blob([aseData], { type: 'application/octet-stream' }); // Standard binary file type
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); // Create temporary link element
      a.href = url;
      a.download = exportFileName; // Set the download filename
      document.body.appendChild(a); // Append to body (required for Firefox)
      a.click(); // Simulate click to trigger download
      document.body.removeChild(a); // Clean up the temporary link
      URL.revokeObjectURL(url); // Release the object URL
    } catch (error) {
      console.error('Error exporting ASE swatch on web:', error);
      alert(`Error exporting swatch: ${error instanceof Error ? error.message : String(error)}`); // Show error to user
    }
  }
}

// Helper function to convert ArrayBuffer to a Base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // btoa is a built-in browser function for base64 encoding
  return btoa(binary);
}
